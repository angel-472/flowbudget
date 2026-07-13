// Persistent localStorage cache so the app can boot instantly from the last
// known state while Supabase connects in the background.

const SESSION_KEY = 'flowbudget:session';
const TRANSACTIONS_KEY = 'flowbudget:transactions';
const QUEUE_KEY = 'flowbudget:queue';
const GOALS_KEY = 'flowbudget:goals'
 
function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch (error) {
    console.warn(`Cache read failed for '${key}':`, error);
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Cache write failed for '${key}':`, error);
  }
}

function remove(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn(`Cache clear failed for '${key}':`, error);
  }
}

class LocalCache {
  /** @returns {{id: string, email: string} | null} */
  loadSession() {
    const session = read(SESSION_KEY, null);
    return session && session.id ? session : null;
  }
  saveSession(user) {
    if (!user) return this.clear();
    write(SESSION_KEY, { id: user.id, email: user.email });
  }
  loadTransactions() {
    const transactions = read(TRANSACTIONS_KEY, []);
    return Array.isArray(transactions) ? transactions : [];
  }
  saveTransactions(transactions) {
    write(TRANSACTIONS_KEY, transactions);
  }
  loadQueue() {
    const queue = read(QUEUE_KEY, []);
    return Array.isArray(queue) ? queue : [];
  }
  saveQueue(queue) {
    write(QUEUE_KEY, queue);
  }
  loadGoals(){
    const goals = read(GOALS_KEY, []);
    return Array.isArray(goals) ? goals : [];
  }
  saveGoals(goals){
    write(GOALS_KEY, goals);
  }
  clear() {
    remove(SESSION_KEY);
    remove(TRANSACTIONS_KEY);
    remove(QUEUE_KEY);
    remove(GOALS_KEY);
  }
}

export const localCache = new LocalCache();
