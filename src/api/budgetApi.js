import { supabase, handleSupabaseError} from './supabaseClient.js';

console.log('🧳 Budget API initialized');

class BudgetApi {
  constructor(){
    this.transactions = [];
  }
  getAllTransactions() {
    return this.transactions;
  }
}

export const budgetApi = new BudgetApi();

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