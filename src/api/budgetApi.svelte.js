import { databaseApi } from "./databaseApi.js";
import { dateUtils } from "./dateUtils.js";
import { localCache } from "./localCache.js";
import { signal } from "./signal.js";
import { syncQueue } from "./syncQueue.js";

// Polyfill to generate a UUID (if crypto.randomUUID is not available)
if (!crypto.randomUUID) {
  // @ts-ignore
  crypto.randomUUID = function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };
}

class BudgetApi {
  constructor(){
    this.transactions = $state(localCache.loadTransactions());
    this.syncing = null;
    this.weekStartDay = 5; // The day the weeks start from, 0 = Sunday <--> 6 = Saturday
  }
  getAllTransactions() {
    return this.transactions;
  }
  addTransaction(data) {
    console.log('Adding transaction with data:', data);
    let newTransaction = {
      id: data.id || crypto.randomUUID(),
      type: data.type,
      category: data.category,
      description: data.description,
      amount: parseFloat(data.amount),
      date: data.date,
      status: data.status || 'pending'
    };
    this.transactions.push(newTransaction);
    this.#queueUpsert(newTransaction); //queues the update in syncQueue but also persists the current transactions to localCache
  }
  deleteTransaction(id) {
    let transaction = this.getTransactionById(id);
    if(!transaction) {
      console.warn(`Transaction with id '${id}' not found for deletion.`);
      return;
    }
    this.transactions = this.transactions.filter(t => t.id !== id);
    signal.emit("UPDATE_TRANSACTION", {transaction});
    syncQueue.enqueue('transaction', 'delete', id);
    this.#persist();
  }
  toggleTransactionStatus(id) {
    const transaction = this.getTransactionById(id);
    if (transaction) {
      transaction.status = transaction.status === 'done' ? 'pending' : 'done';
      signal.emit("UPDATE_TRANSACTION", {transaction});
      this.#queueUpsert(transaction);
    }
  }
  updateTransaction(id) {
    const transaction = this.getTransactionById(id);
    if (transaction) {
      this.#queueUpsert(transaction);
    }
  }
  getTransactionsForWeek(year, weekNumber, type) {
    // Calculate start and end dates of the week
    const weekRange = dateUtils.getWeekDateRange(year, weekNumber, this.weekStartDay);
    const startOfWeek = weekRange[0];
    const endOfWeek = weekRange[6];

    // Filter transactions by type and date range
    return this.transactions.filter(t => {
      const tDate = dateUtils.createLocalDate(t.date);
      return t.type === type && tDate >= startOfWeek && tDate <= endOfWeek;
    });
  }
  getTransactionById(id){
    return this.transactions.find(t => t.id === id);
  }
  /**
   * Pushes queued writes, then pulls the server's copy. Anything still queued is
   * replayed on top of the fetched rows, so an unsynced local edit survives.
   */
  sync() {
    this.syncing ??= this.#sync().finally(() => { this.syncing = null; });
    return this.syncing;
  }
  async #sync() {
    await syncQueue.flush();
    const data = await databaseApi.getAllTransactions();
    const merged = syncQueue.applyTo(data || []);
    this.transactions = merged;
    this.#persist();
    console.log(`💾 Loaded ${merged.length} transactions into Budget API`);
    signal.emit('TRANSACTIONS_FETCH_ALL', merged);
  }
  /** Drops every trace of the signed-out user's data. */
  reset() {
    this.transactions = [];
    syncQueue.clear();
    localCache.clear();
  }
  #queueUpsert(transaction) {
    syncQueue.enqueue('transaction', 'upsert', transaction.id, $state.snapshot(transaction));
    this.#persist();
  }
  #persist() {
    localCache.saveTransactions($state.snapshot(this.transactions));
  }
}

export const budgetApi = new BudgetApi();
console.log('🧳 Budget Data API initialized');


if (import.meta.env.DEV) {
 window.budgetApiRef = budgetApi; // Expose for debugging in dev mode
}
