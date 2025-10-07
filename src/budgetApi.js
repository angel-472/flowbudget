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
export async function deleteTransaction(transactionId, userId = null) {
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
export async function toggleTransactionStatus(transactionId, userId = null) {
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
export async function getTransactionsByWeek(year, weekNumber, userId = null) {
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

    // Prepare transactions for Supabase format
    const transactionsToMigrate = localData.map(t => ({
      user_id: user.id,
      type: t.type,
      category: t.category,
      description: t.description,
      amount: parseFloat(t.amount),
      date: t.date,
      status: t.status || 'pending'
    }));

    // Insert all transactions
    const { data, error } = await supabase
      .from('flowbudget_transactions')
      .insert(transactionsToMigrate)
      .select();

    handleSupabaseError(error);

    // Optionally clear localStorage after successful migration
    // localStorage.removeItem(STORAGE_KEY);

    return {
      migrated: data.length,
      message: `Successfully migrated ${data.length} transactions to Supabase`
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