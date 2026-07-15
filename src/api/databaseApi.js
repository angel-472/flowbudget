console.log(`⚡️ Database Sync API initialized`);
import { supabase, handleSupabaseError, getCurrentUserId } from './supabaseClient.js';

class DatabaseApi {
  constructor() {
    this.supabase = supabase;
  }

  // GENERALIZED DB METHODS (requires rows to have a .id field)

    async getAll(table) {
    let startTime = performance.now();
    try {
      const { data, error } = await this.supabase
        .from(`flowbudget_${table}`)
        .select('*');
      if (error) throw error;
      console.log(`Fetched ${data.length} from '${table}' in ${(performance.now() - startTime).toFixed(2)} ms`);
      return data;
    } catch (error) {
      handleSupabaseError(error);
    }
  }
  // update or insert transaction
  async upsert(table, rowData){
    if(rowData.id == undefined){
      console.error('databaseApi: data rows upserted into a table must be properly identified with an id field. Skipping.');
      return;
    }
    try {
      rowData.user_id = await getCurrentUserId();
      const { data, error } = await this.supabase
        .from(`flowbudget_${table}`)
        .upsert(rowData)
        .select();
      if (error) throw error;
      console.log(`⚡️ '${rowData.id}' from '${table}' updated in database.`);
      return data;
    } catch (error) {
      handleSupabaseError(error);
    }
  }
  async delete(table, rowId){
    try {
      const { data, error } = await this.supabase
        .from(`flowbudget_${table}`)
        .delete()
        .eq('id', rowId);
      if (error) throw error;
      console.log(`⚡️ '${rowId}' from '${table}' deleted 🗑️ from database.`);
      return data;
    } catch (error) {
      handleSupabaseError(error);
    }
  }
}

export const databaseApi = new DatabaseApi();

if(import.meta.env.DEV) {
  window.databaseApiRef = databaseApi; // Expose for debugging in dev mode
}