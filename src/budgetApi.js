// Supabase budget API - Secure cloud-based transaction storage
// Date-based transaction storage with Row Level Security (RLS)
import { supabase, handleSupabaseError } from './supabaseClient.js';
import { getWeekNumber, getWeekDateRange, createLocalDate } from './utils.js';

/**
 * Add a new transaction with Supabase storage
 * @param {Object} transaction - Transaction object with date, description, amount, etc.
 * @param {string} userId - User identifier (optional, will use authenticated user)
 * @returns {Promise<Object>} The created transaction
 */
export async function addTransaction(transaction, userId = null) {
  try {
    // If no userId provided, get from current session
    const finalUserId = userId || (await supabase.auth.getUser()).data.user?.id;
    
    if (!finalUserId) {
      throw new Error('User must be authenticated to add transactions');
    }

    const newTransaction = {
      user_id: finalUserId,
      type: transaction.type,
      category: transaction.category,
      description: transaction.description,
      amount: parseFloat(transaction.amount),
      date: transaction.date,
      status: transaction.status || 'pending'
    };

    const { data, error } = await supabase
      .from('flowbudget_transactions')
      .insert([newTransaction])
      .select()
      .single();

    handleSupabaseError(error);
    return data;
  } catch (error) {
    console.error('Error adding transaction:', error);
    throw error;
  }
}

/**
 * Delete a transaction by ID
 * @param {string} transactionId - Transaction ID to delete
 * @param {string} userId - User identifier (optional, RLS will enforce)
 * @returns {Promise<void>}
 */
export async function deleteTransaction(transactionId) {
  try {
    const { error } = await supabase
      .from('flowbudget_transactions')
      .delete()
      .eq('id', transactionId);

    handleSupabaseError(error);
  } catch (error) {
    console.error('Error deleting transaction:', error);
    throw error;
  }
}

/**
 * Toggle transaction status between 'pending' and 'done'
 * @param {string} transactionId - Transaction ID to toggle
 * @param {string} userId - User identifier (optional, RLS will enforce)
 * @returns {Promise<Object>} Updated transaction
 */
export async function toggleTransactionStatus(transactionId) {
  try {
    // First get the current transaction
    const { data: currentTransaction, error: fetchError } = await supabase
      .from('flowbudget_transactions')
      .select('status')
      .eq('id', transactionId)
      .single();

    handleSupabaseError(fetchError);

    if (!currentTransaction) {
      throw new Error('Transaction not found');
    }

    // Toggle the status
    const newStatus = currentTransaction.status === 'done' ? 'pending' : 'done';

    const { data, error } = await supabase
      .from('flowbudget_transactions')
      .update({ status: newStatus })
      .eq('id', transactionId)
      .select()
      .single();

    handleSupabaseError(error);
    return data;
  } catch (error) {
    console.error('Error toggling transaction status:', error);
    throw error;
  }
}

/**
 * Get all transactions for a specific week number in a year
 * @param {number} year - Year
 * @param {number} weekNumber - Week number (Apple Calendar compatible)
 * @param {string} userId - User identifier (optional, RLS will enforce)
 * @returns {Promise<Object>} Object with incomes and expenses arrays
 */
export async function getTransactionsByWeek(year, weekNumber) {
  try {
    const { start, end } = getWeekDateRange(year, weekNumber);
    
    // Format dates for PostgreSQL (YYYY-MM-DD)
    const startDate = start.toISOString().split('T')[0];
    const endDate = end.toISOString().split('T')[0];

    const { data: transactions, error } = await supabase
      .from('flowbudget_transactions')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })
      .order('created_at', { ascending: true });

    handleSupabaseError(error);

    // Filter by date range using createLocalDate for timezone consistency
    const weekTransactions = transactions.filter(t => {
      const transactionDate = createLocalDate(t.date);
      return transactionDate >= start && transactionDate <= end;
    });

    return {
      incomes: weekTransactions.filter(t => t.type === 'incomes'),
      expenses: weekTransactions.filter(t => t.type === 'expenses')
    };
  } catch (error) {
    console.error('Error fetching transactions by week:', error);
    throw error;
  }
}

/**
 * Get all transactions for a specific month, including overlapping weeks
 * @param {number} year - Year
 * @param {number} month - Month (0-based, January = 0)
 * @param {string} userId - User identifier (optional, RLS will enforce)
 * @returns {Promise<Array>} Array of week objects with transactions
 */
export async function getTransactionsByMonth(year, month, userId = null) {
  try {
    // Get month boundaries
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    
    // Find all weeks that overlap with this month
    const weeksInMonth = new Set();
    const currentDate = new Date(monthStart);
    
    // Go back to find the Sunday that starts the first week of the month
    while (currentDate.getDay() !== 0) {
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    // Find all weeks until we pass the end of the month
    while (currentDate <= monthEnd) {
      const weekNumber = getWeekNumber(currentDate);
      weeksInMonth.add(weekNumber);
      currentDate.setDate(currentDate.getDate() + 7); // Move to next week
    }
    
    // Build week structure with transactions
    const weeks = [];
    for (const weekNumber of Array.from(weeksInMonth).sort((a, b) => a - b)) {
      const { start, end } = getWeekDateRange(year, weekNumber);
      const weekTransactions = await getTransactionsByWeek(year, weekNumber, userId);
      
      // Format date range
      const dateRange = `${start.getDate()} ${start.toLocaleString('en-US', { month: 'short' })} – ${end.getDate()} ${end.toLocaleString('en-US', { month: 'short' })}`;
      
      weeks.push({
        weekNumber: weekNumber,
        dateRange: dateRange,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        incomes: weekTransactions.incomes,
        expenses: weekTransactions.expenses
      });
    }
    
    return weeks;
  } catch (error) {
    console.error('Error fetching transactions by month:', error);
    throw error;
  }
}

/**
 * Get all transactions for the current user (for admin/debugging purposes)
 * @returns {Promise<Array>} Array of all user transactions
 */
export async function getAllUserTransactions() {
  try {
    const { data: transactions, error } = await supabase
      .from('flowbudget_transactions')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    handleSupabaseError(error);
    return transactions || [];
  } catch (error) {
    console.error('Error fetching all user transactions:', error);
    throw error;
  }
}

/**
 * Migrate localStorage data to Supabase (one-time migration helper)
 * @returns {Promise<Object>} Migration results
 */
export async function migrateLocalStorageData() {
  try {
    const STORAGE_KEY = 'flowbudget_transactions';
    const localData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    
    if (localData.length === 0) {
      return { migrated: 0, message: 'No local data to migrate' };
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    handleSupabaseError(userError);

    if (!user) {
      throw new Error('User must be authenticated to migrate data');
    }

    // Helper function to sanitize and provide default values
    const sanitizeTransaction = (transaction, index) => {
      const sanitized = {
        user_id: user.id,
        // Type: default to 'expenses' if null/undefined/invalid
        type: (transaction.type === 'incomes' || transaction.type === 'expenses') 
          ? transaction.type 
          : 'expenses',
        // Category: default to empty string if null/undefined
        category: transaction.category || '',
        // Description: default to generic description if null/undefined/empty
        description: transaction.description || `Transaction ${index + 1}`,
        // Amount: convert to number, default to 0 if invalid
        amount: (() => {
          const parsedAmount = parseFloat(transaction.amount);
          return !isNaN(parsedAmount) && parsedAmount > 0 ? parsedAmount : 0.01; // Minimum 1 cent
        })(),
        // Date: validate and default to today if invalid
        date: (() => {
          if (!transaction.date) return new Date().toISOString().split('T')[0];
          
          // Check if date is valid
          const testDate = new Date(transaction.date);
          if (isNaN(testDate.getTime())) {
            return new Date().toISOString().split('T')[0];
          }
          
          // Ensure proper YYYY-MM-DD format
          if (typeof transaction.date === 'string' && transaction.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return transaction.date;
          }
          
          // Convert other date formats to YYYY-MM-DD
          return testDate.toISOString().split('T')[0];
        })(),
        // Status: default to 'pending' if null/undefined/invalid
        status: (transaction.status === 'pending' || transaction.status === 'done') 
          ? transaction.status 
          : 'pending'
      };

      return sanitized;
    };

    // Prepare transactions for Supabase format with validation and defaults
    console.log('🔄 Sanitizing transaction data...');
    const transactionsToMigrate = localData
      .map((transaction, index) => {
        try {
          return sanitizeTransaction(transaction, index);
        } catch (error) {
          console.warn(`⚠️ Skipping invalid transaction at index ${index}:`, error);
          return null;
        }
      })
      .filter(Boolean); // Remove any null transactions

    if (transactionsToMigrate.length === 0) {
      return { migrated: 0, message: 'No valid transactions to migrate after sanitization' };
    }

    console.log(`📊 Prepared ${transactionsToMigrate.length} transactions for migration`);
    
    // Show a summary of what will be migrated
    const summary = transactionsToMigrate.reduce((acc, t) => {
      acc[t.type] = (acc[t.type] || 0) + 1;
      acc.totalAmount += t.amount;
      return acc;
    }, { incomes: 0, expenses: 0, totalAmount: 0 });

    console.log('Migration Summary:', {
      incomes: summary.incomes || 0,
      expenses: summary.expenses || 0,
      totalAmount: summary.totalAmount.toFixed(2)
    });

    // Insert all transactions
    const { data, error } = await supabase
      .from('flowbudget_transactions')
      .insert(transactionsToMigrate)
      .select();

    handleSupabaseError(error);

    return {
      migrated: data.length,
      skipped: localData.length - transactionsToMigrate.length,
      message: `Successfully migrated ${data.length} transactions to Supabase${
        localData.length - transactionsToMigrate.length > 0 
          ? ` (${localData.length - transactionsToMigrate.length} invalid transactions were skipped)` 
          : ''
      }`
    };
  } catch (error) {
    console.error('Error migrating localStorage data:', error);
    throw error;
  }
}

/**
 * Legacy function for backward compatibility
 */
export async function fetchOrCreateMonthBudget(year, month, userId) {
  return await getTransactionsByMonth(year, month, userId);
}