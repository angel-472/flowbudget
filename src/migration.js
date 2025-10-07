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
    
    // Show preview of what will be sanitized
    console.log('🔍 Analyzing data for migration...');
    let nullFields = 0;
    let invalidAmounts = 0;
    let invalidDates = 0;
    let invalidTypes = 0;
    
    localData.forEach((t) => {
      if (!t.description) nullFields++;
      if (!t.category) nullFields++;
      if (!t.amount || isNaN(parseFloat(t.amount)) || parseFloat(t.amount) <= 0) invalidAmounts++;
      if (!t.date || isNaN(new Date(t.date).getTime())) invalidDates++;
      if (t.type !== 'incomes' && t.type !== 'expenses') invalidTypes++;
    });
    
    if (nullFields > 0 || invalidAmounts > 0 || invalidDates > 0 || invalidTypes > 0) {
      console.log('⚠️ Data issues detected that will be automatically fixed:');
      if (nullFields > 0) console.log(`   • ${nullFields} null/empty fields will be given default values`);
      if (invalidAmounts > 0) console.log(`   • ${invalidAmounts} invalid amounts will be set to $0.01`);
      if (invalidDates > 0) console.log(`   • ${invalidDates} invalid dates will be set to today`);
      if (invalidTypes > 0) console.log(`   • ${invalidTypes} invalid types will be set to 'expenses'`);
    } else {
      console.log('✅ All data looks valid!');
    }
    
    // Perform migration
    const result = await migrateLocalStorageData();
    
    console.log(`🎉 Migration completed successfully!`);
    console.log(`📈 Migrated: ${result.migrated} transactions`);
    if (result.skipped > 0) {
      console.log(`⚠️ Skipped: ${result.skipped} invalid transactions`);
    }
    console.log(`💾 Message: ${result.message}`);
    
    // Ask user if they want to clear localStorage
    const clearLocal = confirm(
      `Migration successful! ${result.migrated} transactions moved to Supabase.${
        result.skipped > 0 ? `\n${result.skipped} invalid transactions were skipped.` : ''
      }\n\nDo you want to clear the localStorage data? This is recommended to avoid conflicts.\n\nClick OK to clear localStorage, or Cancel to keep it as backup.`
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