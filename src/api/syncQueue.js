// Durable write queue. Every mutation is recorded here first, then pushed to
// Supabase as soon as a connection is available. Ops survive reloads via
// localCache, so changes made while offline are never lost.
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
  enqueue(op, id, payload = null) {
    this.ops = this.ops.filter(pending => pending.id !== id);
    this.ops.push({ op, id, payload, attempts: 0 });
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
  applyTo(rows) {
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
