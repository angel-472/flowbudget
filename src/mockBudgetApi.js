// Mock budget API for demo purposes (localStorage-based)
// Date-based transaction storage - no grouping by month/week in storage
import { getWeekNumber, getWeekDateRange, createLocalDate } from './utils.js';

// Polyfill for crypto.randomUUID() for iOS devices and older browsers
if (!crypto.randomUUID) {
  crypto.randomUUID = function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };
}

const STORAGE_KEY = 'flowbudget_transactions';

function getTransactions() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

function saveTransactions(transactions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

/**
 * Add a new transaction with date-based storage
 * @param {Object} transaction - Transaction object with date, description, amount, etc.
 * @param {string} userId - User identifier
 */
export function addTransaction(transaction, userId) {
  const transactions = getTransactions();
  const newTransaction = {
    ...transaction,
    id: crypto.randomUUID(),
    userId: userId,
    createdAt: new Date().toISOString(),
    status: transaction.status || 'pending'
  };
  transactions.push(newTransaction);
  saveTransactions(transactions);
  return newTransaction;
}

/**
 * Delete a transaction by ID
 * @param {string} transactionId - Transaction ID to delete
 * @param {string} userId - User identifier
 */
export function deleteTransaction(transactionId, userId) {
  const transactions = getTransactions();
  const filtered = transactions.filter(t => !(t.id === transactionId && t.userId === userId));
  saveTransactions(filtered);
}

/**
 * Toggle transaction status between 'pending' and 'done'
 * @param {string} transactionId - Transaction ID to toggle
 * @param {string} userId - User identifier
 */
export function toggleTransactionStatus(transactionId, userId) {
  const transactions = getTransactions();
  const transaction = transactions.find(t => t.id === transactionId && t.userId === userId);
  if (transaction) {
    transaction.status = transaction.status === 'done' ? 'pending' : 'done';
    saveTransactions(transactions);
  }
}

/**
 * Get all transactions for a specific week number in a year
 * @param {number} year - Year
 * @param {number} weekNumber - Week number (Apple Calendar compatible)
 * @param {string} userId - User identifier
 * @returns {Object} Object with incomes and expenses arrays
 */
export function getTransactionsByWeek(year, weekNumber, userId) {
  const transactions = getTransactions().filter(t => t.userId === userId);
  const { start, end } = getWeekDateRange(year, weekNumber);
  
  const weekTransactions = transactions.filter(t => {
    const transactionDate = createLocalDate(t.date); // Use createLocalDate to avoid timezone issues
    return transactionDate >= start && transactionDate <= end;
  });
  
  return {
    incomes: weekTransactions.filter(t => t.type === 'incomes'),
    expenses: weekTransactions.filter(t => t.type === 'expenses')
  };
}

/**
 * Get all transactions for a specific month, including overlapping weeks
 * @param {number} year - Year
 * @param {number} month - Month (0-based, January = 0)
 * @param {string} userId - User identifier
 * @returns {Array} Array of week objects with transactions
 */
export function getTransactionsByMonth(year, month, userId) {
  
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
    const weekTransactions = getTransactionsByWeek(year, weekNumber, userId);
    
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
}

/**
 * Legacy function for backward compatibility
 */
export function fetchOrCreateMonthBudget(year, month, userId) {
  return getTransactionsByMonth(year, month, userId);
}
