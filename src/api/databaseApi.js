console.log(`⚡️ Database Sync API initialized`);
import { supabase, handleSupabaseError, getCurrentUserId } from './supabaseClient.js';

class DatabaseApi {
  constructor() {
    this.supabase = supabase;
  }
  async getAllTransactions() {
    let startTime = performance.now();
    try {
      const { data, error } = await this.supabase
        .from('flowbudget_transactions')
        .select('*');
      if (error) throw error;
      console.log(`Fetched ${data.length} transactions in ${(performance.now() - startTime).toFixed(2)} ms`);
      return data;
    } catch (error) {
      handleSupabaseError(error);
    }
  }
  // update or insert transaction
  async upsertTransaction(transaction){
    try {
      transaction.user_id = await getCurrentUserId();
      const { data, error } = await this.supabase
        .from('flowbudget_transactions')
        .upsert(transaction)
        .select();
      if (error) throw error;
      console.log(`⚡️ Transaction '${transaction.id}' updated in database.`);
      return data;
    } catch (error) {
      handleSupabaseError(error);
    }
  }
}

export const databaseApi = new DatabaseApi();

if(import.meta.env.DEV) {
  window.databaseApi = databaseApi; // Expose for debugging in dev mode
}