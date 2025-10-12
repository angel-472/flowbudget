console.log(`⚡️ Database Sync API initialized`);
import { supabase, handleSupabaseError } from './supabaseClient.js';

class DatabaseApi {
  constructor() {
    this.supabase = supabase;
  }
}

export const databaseApi = new DatabaseApi();