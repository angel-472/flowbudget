// Durable write queue. Every mutation is recorded here first, then pushed to
// Supabase as soon as a connection is available. Ops survive reloads via
// localCache, so changes made while offline are never lost.
//
// TODO: This queue is transaction-only. Before adding goals to it:
//
// 1. Tag ops with an entity: { entity, op, id, payload, attempts }.
//    applyTo() currently replays EVERY pending op into whatever rows it's given
//    and pushes the payload unconditionally, so a queued goal upsert would land
//    in budgetApi.transactions. Make it applyTo(entity, rows) and filter first.
//    #drain() has the same problem: it hardcodes databaseApi.upsertTransaction /
//    deleteTransaction, so a queued goal would be written to the transactions table.
//
// 2. Dispatch by entity instead of calling databaseApi directly — e.g. a
//    register(entity, { upsert, remove }) map. Wants databaseApi generalized to
//    table-generic getAll(table) / upsert(table, row) / remove(table, id).
//
// 3. Migrate the persisted queue. Ops already in localStorage have no `entity`
//    field; loadQueue() must default them to 'transaction' or the first sync
//    after deploy misroutes real user writes.
//
// 4. Keep ONE queue for both entities. Ordering and the single `draining`
//    promise are the point; two parallel queues would race on flush.
//
// Also unrelated but live today: localCache.clear() never removes GOALS_KEY, so
// on sign-out one user's goals survive into the next user's session.
//
// 5. App.svelte calls budgetApi.sync() / .reset() directly. With goals in play
//    those need to fan out to both APIs, or goals never load and sign-out only
//    half-clears.
import { databaseApi } from './databaseApi.js';
import { localCache } from './localCache.js';

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 15000;

function looksOffline(error) {
  if (!navigator.onLine) return true;
  const message = String(error?.message ?? error);
  return /failed to fetch|networkerror|network request failed|load failed|timeout/i.test(message);
}

class SyncQueue {
  constructor() {
    this.ops = localCache.loadQueue();
    this.ready = false;
    this.draining = null;
    this.retryTimer = null;
    window.addEventListener('online', () => this.flush());
  }
  get size() {
    return this.ops.length;
  }
  /** Enabled once a live Supabase session is confirmed. */
  setReady(ready) {
    this.ready = ready;
    if (ready) this.flush();
  }
  /**
   * Queue a write. Ops for the same transaction collapse: an upsert payload is
   * the whole row, and a delete makes everything queued before it moot.
   * @param {'upsert'|'delete'} op
   */
  enqueue(type, op, id, payload = null) {
    this.ops = this.ops.filter(pending => pending.id !== id);
    this.ops.push({ type, op, id, payload, attempts: 0 });
    localCache.saveQueue(this.ops);
    this.flush();
  }
  clear() {
    this.ops = [];
    localCache.saveQueue(this.ops);
  }
  /**
   * Replays still-pending ops on top of a fresh server snapshot, so a fetch that
   * raced with an unsynced local edit doesn't roll it back.
   */
  applyTo(type, rows) {
    let merged = rows;
    for (const { op, id, payload } of this.ops) {
      merged = merged.filter(row => row.id !== id);
      if (op === 'upsert') merged.push(payload);
    }
    return merged;
  }
  /**
   * Drains the queue. Never rejects: anything left behind stays queued and is
   * retried on reconnect, on the next write, or on the retry timer.
   */
  flush() {
    if (!this.ready || this.ops.length === 0) return this.draining ?? Promise.resolve();
    if (this.draining) return this.draining;

    this.draining = this.#drain().finally(() => {
      this.draining = null;
      if (this.ops.length > 0) this.#scheduleRetry();
    });
    return this.draining;
  }
  #scheduleRetry() {
    if (this.retryTimer) return;
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      this.flush();
    }, RETRY_DELAY_MS);
  }
  async #drain() {
    while (this.ops.length > 0) {
      const entry = this.ops[0];
      try {
        if (entry.op === 'upsert') await databaseApi.upsertTransaction({ ...entry.payload });
        else await databaseApi.deleteTransaction(entry.id);
      } catch (error) {
        if (looksOffline(error)) {
          console.warn(`⏸️ Sync paused — ${this.ops.length} change(s) still queued.`);
          return;
        }
        entry.attempts += 1;
        if (entry.attempts < MAX_ATTEMPTS) {
          localCache.saveQueue(this.ops);
          return;
        }
        console.error(`Dropping unsyncable ${entry.op} for '${entry.id}':`, error);
      }
      this.ops.shift();
      localCache.saveQueue(this.ops);
    }
  }
}

export const syncQueue = new SyncQueue();

if (import.meta.env.DEV) {
  window.syncQueueRef = syncQueue; // Expose for debugging in dev mode
}
