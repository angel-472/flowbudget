// Mock budget API for demo purposes (localStorage-based)
import { generateMonthStructure } from './utils';

const STORAGE_KEY = 'flowbudget_budgets';

function getBudgets() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
}

function saveBudgets(budgets) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(budgets));
}

export function fetchOrCreateMonthBudget(year, month, userId) {
  const budgets = getBudgets();
  const key = `${userId}_${year}_${month}`;
  if (!budgets[key]) {
    budgets[key] = {
      year,
      month,
      weeks: generateMonthStructure(year, month),
      createdAt: new Date().toISOString(),
    };
    saveBudgets(budgets);
  }
  return budgets[key].weeks;
}

export function saveMonthBudget(year, month, userId, weeks) {
  const budgets = getBudgets();
  const key = `${userId}_${year}_${month}`;
  budgets[key] = budgets[key] || { year, month, weeks: [], createdAt: new Date().toISOString() };
  budgets[key].weeks = weeks;
  saveBudgets(budgets);
}

export function addTransaction(year, month, weekNumber, type, newTransaction, userId) {
  const weeks = fetchOrCreateMonthBudget(year, month, userId);
  const weekIdx = weeks.findIndex(w => w.weekNumber === weekNumber);
  if (weekIdx === -1) throw new Error('Week not found');
  const tx = { ...newTransaction, id: crypto.randomUUID(), status: newTransaction.status || 'pending' };
  weeks[weekIdx][type].push(tx);
  saveMonthBudget(year, month, userId, weeks);
}

export function deleteTransaction(year, month, weekNumber, type, transactionId, userId) {
  const weeks = fetchOrCreateMonthBudget(year, month, userId);
  const weekIdx = weeks.findIndex(w => w.weekNumber === weekNumber);
  if (weekIdx === -1) throw new Error('Week not found');
  weeks[weekIdx][type] = weeks[weekIdx][type].filter(t => t.id !== transactionId);
  saveMonthBudget(year, month, userId, weeks);
}

export function toggleTransactionStatus(year, month, weekNumber, type, transactionId, userId) {
  const weeks = fetchOrCreateMonthBudget(year, month, userId);
  const weekIdx = weeks.findIndex(w => w.weekNumber === weekNumber);
  if (weekIdx === -1) throw new Error('Week not found');
  
  const txIdx = weeks[weekIdx][type].findIndex(t => t.id === transactionId);
  console.log({txIdx, transactionId, transactions: weeks[weekIdx][type]});
  if (txIdx === -1) throw new Error('Transaction not found');
  
  weeks[weekIdx][type][txIdx].status = weeks[weekIdx][type][txIdx].status === 'done' ? 'pending' : 'done';
  saveMonthBudget(year, month, userId, weeks);
}
