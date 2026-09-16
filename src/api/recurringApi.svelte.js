import { localCache } from "./localCache.js";
import { databaseApi } from "./cloud/databaseApi.js";
import { syncQueue } from "./cloud/syncQueue.js";
import { signal } from "./signal.js";
import { dateUtils } from "./dateUtils.js";
import { budgetApi } from "./budgetApi.svelte.js";


const TABLE_NAME = "recurring";

class RecurringApi {
  constructor(){
    this.recurring = $state(localCache.loadRecurring());
  }
  getAllRecurring(){
    return this.recurring;
  }
  addRecurring(data){
    console.log(`Adding recurring expense with data: `, data);
    let newRecurring = {
      id: data.id || crypto.randomUUID(),
      name: data.name,
      amount: parseFloat(data.amount) || 0,
      frequencyDays: parseInt(data.frequencyDays) || 30,
      startDate: data.startDate,
      excludedDates: [],
    }
    this.recurring.push(newRecurring);
    this.#queueUpsert(newRecurring);
  }
  getById(id){
    return this.recurring.find(t => t.id === id);
  }
  getNewRecurring(){
    return {isNew: true, id: crypto.randomUUID(), name: '', amount: 0, frequencyDays: 30, startDate: new Date().toISOString().split('T')[0], excludedDates: []};
  }
  findExpensesInWeek(year, weekNumber){
    const dateRange = dateUtils.getWeekDateRange(year, weekNumber, budgetApi.weekStartDay);
    const results = [];

    for(const expense of this.recurring){
      const startDate = dateUtils.createLocalDate(expense.startDate);

      if(startDate > dateRange[6]){
        continue; //skip, it starts after the week in question
      }

      const daysBetweenCeil = dateUtils.daysBetweenDates(startDate, dateRange[6]); //amount of days between last day of the week and the start of recurring expense
      const daysSinceLastOcurrence = daysBetweenCeil % expense.frequencyDays;

      if(daysSinceLastOcurrence > 6){
        continue; //it's out of range, too many days ago (max = 6 days before last day of week)
      }

      const lastOcurrenceDate = new Date(dateRange[6]);
      lastOcurrenceDate.setDate(lastOcurrenceDate.getDate() - daysSinceLastOcurrence);

      // console.log({lastOcurrenceDate, daysSinceLastOcurrence, daysBetweenCeil, dateRange, expense})
      results.push({expense, date: lastOcurrenceDate});
    }

    return results;
  }
  delete(id) {
    let recurring = this.getById(id);
    if(!recurring) {
      console.warn(`Recurring expense with id '${id}' not found for deletion.`);
      return;
    }
    this.recurring = this.recurring.filter(t => t.id !== id);
    syncQueue.enqueue('recurring', 'delete', id);
    signal.emit("UPDATE_RECURRING", {});
    this.#persist();
  }
  update(id) {
    const recurring = this.getById(id);
    if (recurring) {
      this.#queueUpsert(recurring);
    }
  }
  reset(){
    this.recurring = [];
  }

    // CACHE AND SYNC

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
    const data = await databaseApi.getAll(TABLE_NAME);
    const merged = syncQueue.applyTo(TABLE_NAME, data || []);
    this.recurring = merged;
    this.#persist();
    console.log(`🌩️ Loaded ${merged.length} cloud ${TABLE_NAME}s into ${TABLE_NAME.toUpperCase()} API`);
    signal.emit(TABLE_NAME.toUpperCase() + '_FETCH_ALL', merged);
    signal.emit("UPDATE_RECURRING", {}); //calls the update signal so the view doesn't lose the reference after sync is done
  }
  #queueUpsert(expense) {
    syncQueue.enqueue(TABLE_NAME, 'upsert', expense.id, $state.snapshot(expense));
    this.#persist();
  }
  #persist(){
    localCache.saveRecurring($state.snapshot(this.recurring));
  }
}

export const recurringApi = new RecurringApi();

if(import.meta.env.DEV){
  window.recurringApiRef = recurringApi;
}