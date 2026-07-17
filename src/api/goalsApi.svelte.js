import { localCache } from "./localCache.js";
import { databaseApi } from "./cloud/databaseApi.js";
import { syncQueue } from "./cloud/syncQueue.js";
import { signal } from "./signal.js";

class GoalsApi {
  constructor(){
    this.goals = $state(localCache.loadGoals());
  }
  getAllGoals(){
    return this.goals;
  }
  addGoal(data) {
    console.log('Adding goal with data:', data);
    let newGoal = {
      id: data.id || crypto.randomUUID(),
      name: data.name,
      target: parseFloat(data.target) || 500,
      balance: parseFloat(data.balance) || 0,
    };
    this.goals.push(newGoal);
    this.#queueUpsert(newGoal); //queues the update in syncQueue but also persists the current goals to localCache
  }
  reset(){
    this.goals = [];
  }
  delete(id) {
    let goal = this.getById(id);
    if(!goal) {
      console.warn(`Goal with id '${id}' not found for deletion.`);
      return;
    }
    this.goals = this.goals.filter(t => t.id !== id);
    syncQueue.enqueue('goals', 'delete', id);
    signal.emit("UPDATE_GOALS", {});
    this.#persist();
  }
  updateGoal(id) {
    const goal = this.getById(id);
    if (goal) {
      this.#queueUpsert(goal);
    }
  }
  getById(id){
    return this.goals.find(t => t.id === id);
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
    const data = await databaseApi.getAll('goals');
    const merged = syncQueue.applyTo('goals', data || []);
    this.goals = merged;
    this.#persist();
    console.log(`🌩️ Loaded ${merged.length} cloud goal into Goals API`);
    signal.emit('GOALS_FETCH_ALL', merged);
  }
  #queueUpsert(goal) {
    syncQueue.enqueue('goals', 'upsert', goal.id, $state.snapshot(goal));
    this.#persist();
  }
  #persist(){
    localCache.saveGoals($state.snapshot(this.goals));
  }
}



export const goalsApi = new GoalsApi();
if (import.meta.env.DEV) {
 window.goalsApiRef = goalsApi; // Expose for debugging in dev mode
}
