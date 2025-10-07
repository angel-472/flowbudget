// Data migration utility for moving from localStorage to Supabase
// Run this in your browser console after setting up Supabase and authenticating

import { migrateLocalStorageData } from './budgetApi.js';
import { getCurrentUser } from './auth.js';

/**
 * Migration utility to move localStorage data to Supabase
 * Call this function in your browser console after authentication
 */
export async function runMigration() {
  try {
    console.log('🔄 Starting migration from localStorage to Supabase...');
    
    // Check if user is authenticated
    const user = await getCurrentUser();
    if (!user) {
      console.error('❌ Migration failed: User must be authenticated');
      return;
    }
    
    console.log(`✅ User authenticated: ${user.email}`);
    
    // Check localStorage data
    const STORAGE_KEY = 'flowbudget_transactions';
    const localData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    
    if (localData.length === 0) {
      console.log('ℹ️ No local data found to migrate');
      return;
    }
    
    console.log(`📊 Found ${localData.length} transactions in localStorage`);
    
    // Perform migration
    const result = await migrateLocalStorageData();
    
    console.log(`🎉 Migration completed successfully!`);
    console.log(`📈 Migrated: ${result.migrated} transactions`);
    console.log(`💾 Message: ${result.message}`);
    
    // Ask user if they want to clear localStorage
    const clearLocal = confirm(
      `Migration successful! ${result.migrated} transactions moved to Supabase.\n\n` +
      'Do you want to clear the localStorage data? This is recommended to avoid conflicts.\n\n' +
      'Click OK to clear localStorage, or Cancel to keep it as backup.'
    );
    
    if (clearLocal) {
      localStorage.removeItem(STORAGE_KEY);
      console.log('🧹 localStorage cleared');
    } else {
      console.log('💾 localStorage kept as backup');
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Auto-run migration if this file is imported and user is in development
if (import.meta.env.DEV) {
  console.log('🚀 FlowBudget Migration Tool loaded');
  console.log('💡 To migrate your data, run: runMigration()');
  
  // Make function available globally for console access
  window.runMigration = runMigration;
}