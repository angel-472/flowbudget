import { getCurrentUser } from "./auth.js";
import { databaseApi } from "./databaseApi.js";
import { dateUtils } from "./dateUtils.js";
import { signal } from "./signal.js";
import { getCurrentUserId } from "./supabaseClient.js";

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
    this.transactions = [];
  }
  getAllTransactions() {
    return this.transactions;
  }
  async addTransaction(data) {
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
    console.log('pushed');
    await databaseApi.upsertTransaction(newTransaction);
    console.log('upserted');
  }
  async deleteTransaction(id) {
    let transaction = this.getTransactionById(id);
    if(!transaction) {
      console.warn(`Transaction with id '${id}' not found for deletion.`);
      return;
    }
    this.transactions = this.transactions.filter(t => t.id !== id);
    signal.emit("UPDATE_TRANSACTION", {transaction});
    await databaseApi.deleteTransaction(id);
  }
  async toggleTransactionStatus(id) {
    const transaction = this.getTransactionById(id);
    if (transaction) {
      transaction.status = transaction.status === 'done' ? 'pending' : 'done';
      signal.emit("UPDATE_TRANSACTION", {transaction});
      await databaseApi.upsertTransaction(transaction);
    }
  }
  async updateTransaction(id) {
    const transaction = this.getTransactionById(id);
    if (transaction) {
      await databaseApi.upsertTransaction(transaction);
    }
  }
  getTransactionsForWeek(year, weekNumber, type) {
    // Calculate start and end dates of the week
    const weekRange = dateUtils.getWeekDateRange(year, weekNumber);
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
  async fetchAllTransactions() {
    const data = await databaseApi.getAllTransactions();
    budgetApi.transactions = data || [];
    console.log(`💾 Loaded ${budgetApi.transactions.length} transactions into Budget API`);
    signal.emit('TRANSACTIONS_FETCH_ALL', data);
  }
}

export const budgetApi = new BudgetApi();
console.log('🧳 Budget Data API initialized');


if (import.meta.env.DEV) {
 window.budgetApiRef = budgetApi; // Expose for debugging in dev mode
}