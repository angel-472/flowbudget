import { useState, useEffect, useCallback, useMemo } from 'react';
import './App.css';
import { Home, Sun, Moon, LogOut } from 'lucide-react';
import {
  fetchOrCreateMonthBudget,
  addTransaction,
  deleteTransaction,
  toggleTransactionStatus
} from './budgetApi';
import { calculateWeeklyTotals, getWeekNumber, getWeekDateRange, createLocalDate } from './utils';
import MonthView from './components/MonthView';
import Dashboard from './components/Dashboard';
import CacheStatus from './components/CacheStatus';
import './migration'; // Import migration tool for development
import './dbTest'; // Import database test utilities
import { signOut } from './auth'; // Import sign-out function

function App({ user }) {
  // User is now passed from AuthWrapper
  // Date & UI State
  const today = useMemo(() => new Date(), []);
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [view, setView] = useState('dashboard');
  // Data State
  const [transactions, setTransactions] = useState([]);
  const [prevTransactions, setPrevTransactions] = useState([]);
  // App State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Cache for storing month data to avoid re-fetching
  const [budgetCache, setBudgetCache] = useState(new Map());
  const [darkMode, setDarkMode] = useState(() => {
    const storedMode = localStorage.getItem('darkMode');
    if (storedMode !== null) return JSON.parse(storedMode);
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  // Toggle Dark Mode
  const toggleDarkMode = () => {
    setDarkMode(prevMode => {
      const newMode = !prevMode;
      localStorage.setItem('darkMode', JSON.stringify(newMode));
      return newMode;
    });
  };

  // Cache management functions
  const getCacheKey = useCallback((userId, year, month) => `${userId}-${year}-${month}`, []);
  
  const getCachedData = useCallback((userId, year, month) => {
    const key = getCacheKey(userId, year, month);
    return budgetCache.get(key);
  }, [budgetCache, getCacheKey]);
  
  const setCachedData = useCallback((userId, year, month, data) => {
    setBudgetCache(prev => {
      const newCache = new Map(prev);
      const key = getCacheKey(userId, year, month);
      newCache.set(key, {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + (5 * 60 * 1000) // Cache for 5 minutes
      });
      return newCache;
    });
  }, [getCacheKey]);
  
  const isCacheValid = useCallback((cacheEntry) => {
    return cacheEntry && Date.now() < cacheEntry.expiresAt;
  }, []);
  // User is authenticated through AuthWrapper
  // Effect to handle month change and fetch/create budget data with caching
  const fetchBudget = useCallback(async (year, month) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      // Check cache for current month first
      const currentCacheEntry = getCachedData(user.id, year, month);
      let weeks;
      
      if (isCacheValid(currentCacheEntry)) {
        console.log(`🎯 Cache HIT for ${year}-${month} (age: ${Math.floor((Date.now() - currentCacheEntry.timestamp) / 1000)}s)`);
        weeks = currentCacheEntry.data;
      } else {
        console.log(`📡 Cache MISS for ${year}-${month} - fetching from database`);
        weeks = await fetchOrCreateMonthBudget(year, month, user.id);
        setCachedData(user.id, year, month, weeks);
        console.log(`💾 Cached data for ${year}-${month}`);
      }
      setTransactions(weeks);
      
      // Handle previous month with caching
      let prevYear = year;
      let prevMonth = month - 1;
      if (prevMonth < 0) {
        prevMonth = 11;
        prevYear -= 1;
      }
      
      const prevCacheEntry = getCachedData(user.id, prevYear, prevMonth);
      let prevWeeks;
      
      if (isCacheValid(prevCacheEntry)) {
        console.log(`🎯 Cache HIT for previous month ${prevYear}-${prevMonth} (age: ${Math.floor((Date.now() - prevCacheEntry.timestamp) / 1000)}s)`);
        prevWeeks = prevCacheEntry.data;
      } else {
        console.log(`📡 Cache MISS for previous month ${prevYear}-${prevMonth} - fetching from database`);
        prevWeeks = await fetchOrCreateMonthBudget(prevYear, prevMonth, user.id);
        setCachedData(user.id, prevYear, prevMonth, prevWeeks);
        console.log(`💾 Cached data for previous month ${prevYear}-${prevMonth}`);
      }
      setPrevTransactions(prevWeeks || []);
    } catch (error) {
      console.error('Error fetching budget data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [user, getCachedData, setCachedData, isCacheValid]);
  useEffect(() => {
    if (user) {
      fetchBudget(currentYear, currentMonth);
    }
  }, [currentYear, currentMonth, user, fetchBudget]);
  // Setter for year/month from navigation
  const setDate = (year, month) => {
    setCurrentYear(year);
    setCurrentMonth(month);
    setView('month');
  };
  // Calculate Monthly Totals for current and previous months
  const calculateOverallMonthlyTotals = (tArray) => {
    const income = tArray.reduce((sum, week) => sum + calculateWeeklyTotals(week).income, 0);
    const expense = tArray.reduce((sum, week) => sum + calculateWeeklyTotals(week).expense, 0);
    return { income, expense, net: income - expense };
  };
  const monthlyBudget = useMemo(() => calculateOverallMonthlyTotals(transactions), [transactions]);
  const prevMonthlyBudget = useMemo(() => calculateOverallMonthlyTotals(prevTransactions), [prevTransactions]);
  // Month Navigation for Sidebar (Last 12 months)
  const monthOptions = useMemo(() => {
    const options = [];
    const today = new Date();
    for (let i = 0; i < 12; i++) {
      let year = today.getFullYear();
      let month = today.getMonth() - i;
      if (month < 0) {
        month += 12;
        year -= 1;
      }
      const monthName = new Date(year, month, 1).toLocaleString('en-US', { month: 'short' });
      options.push({ year, month, label: `${monthName} ${year}` });
    }
    return options;
  }, []);
  // Apply dark mode class to body
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [darkMode]);

  // Optimistic update helper functions
  const updateTransactionsOptimistically = (updater) => {
    setTransactions(prevTransactions => {
      // The updater function is now responsible for returning a new array
      return updater(prevTransactions);
    });
  };

  const addTransactionToWeek = (weekTransactions, newTransaction) => {
    console.log(`🔍 addTransactionToWeek called with:`, newTransaction.id, newTransaction.type);
    const targetWeekNumber = getWeekNumber(createLocalDate(newTransaction.date));
    
    let weekExists = false;
    const newWeeks = weekTransactions.map(week => {
      if (week.weekNumber === targetWeekNumber) {
        weekExists = true;
        const newIncomes = newTransaction.type === 'incomes' ? [...week.incomes, newTransaction] : [...week.incomes];
        const newExpenses = newTransaction.type === 'expenses' ? [...week.expenses, newTransaction] : [...week.expenses];
        return { ...week, incomes: newIncomes, expenses: newExpenses };
      }
      return week;
    });

    if (weekExists) {
      return newWeeks;
    } else {
      // Create new week structure if needed
      const { start, end } = getWeekDateRange(new Date(newTransaction.date).getFullYear(), targetWeekNumber);
      const dateRange = `${start.getDate()} ${start.toLocaleString('en-US', { month: 'short' })} – ${end.getDate()} ${end.toLocaleString('en-US', { month: 'short' })}`;
      
      const newWeek = {
        weekNumber: targetWeekNumber,
        dateRange: dateRange,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        incomes: newTransaction.type === 'incomes' ? [newTransaction] : [],
        expenses: newTransaction.type === 'expenses' ? [newTransaction] : []
      };
      
      const allWeeks = [...weekTransactions, newWeek];
      allWeeks.sort((a, b) => a.weekNumber - b.weekNumber);
      return allWeeks;
    }
  };

  const removeTransactionFromWeek = (weekTransactions, transactionId) => {
    return weekTransactions.map(week => {
      const newIncomes = week.incomes.filter(t => t.id !== transactionId);
      const newExpenses = week.expenses.filter(t => t.id !== transactionId);
      
      // If the transaction was in this week, return a new week object
      if (newIncomes.length < week.incomes.length || newExpenses.length < week.expenses.length) {
        return { ...week, incomes: newIncomes, expenses: newExpenses };
      }
      
      return week; // Otherwise, return the original week object
    });
  };

  const updateTransactionInWeek = (weekTransactions, transactionId, updater) => {
    return weekTransactions.map(week => {
      let changed = false;
      const newIncomes = week.incomes.map(t => {
        if (t.id === transactionId) {
          changed = true;
          return updater(t);
        }
        return t;
      });
      const newExpenses = week.expenses.map(t => {
        if (t.id === transactionId) {
          changed = true;
          return updater(t);
        }
        return t;
      });

      if (changed) {
        return { ...week, incomes: newIncomes, expenses: newExpenses };
      }
      return week;
    });
  };
  
  // Add transaction handler - simplified without optimistic updates
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  
  const handleAddTransaction = async (newTransaction) => {
    if (isAddingTransaction) {
      console.warn('⚠️ Transaction already being added, ignoring duplicate call');
      return;
    }
    
    setIsAddingTransaction(true);
    console.log('🚀 Starting to add transaction:', newTransaction);
    
    try {
      // Send to database first
      const savedTransaction = await addTransaction(newTransaction, user.id);
      console.log('💾 Got saved transaction from DB:', savedTransaction.id);
      
      // Check if transaction already exists before adding
      const existingTransaction = transactions.some(week => 
        week.incomes.some(t => t.id === savedTransaction.id) ||
        week.expenses.some(t => t.id === savedTransaction.id)
      );
      
      if (existingTransaction) {
        console.warn('⚠️ Transaction already exists in UI, skipping add:', savedTransaction.id);
        return;
      }
      
      // Add the real transaction directly to UI
      updateTransactionsOptimistically(weekTransactions => {
        console.log('📝 Adding transaction to UI:', savedTransaction.id);
        
        // Final duplicate check at the array level
        const alreadyExists = weekTransactions.some(week => 
          week.incomes.some(t => t.id === savedTransaction.id) ||
          week.expenses.some(t => t.id === savedTransaction.id)
        );
        
        if (alreadyExists) {
          console.warn(`⚠️ Transaction ${savedTransaction.id} already exists in weekTransactions, skipping add`);
          return weekTransactions; // Return original state
        }
        
        return addTransactionToWeek(weekTransactions, savedTransaction);
      });
      
      console.log('✅ Transaction added successfully:', savedTransaction.id);
    } catch (error) {
      setError(error.message);
      console.error('❌ Failed to add transaction:', error);
    } finally {
      setIsAddingTransaction(false);
    }
  };
  // Remove transaction handler with optimistic updates
  const handleRemoveTransaction = async (transactionId) => {
    // Store the transaction for potential rollback
    let removedTransaction = null;
    let removedFromWeek = null;

    // Find and store the transaction being removed
    transactions.forEach(week => {
      const foundIncome = week.incomes.find(t => t.id === transactionId);
      const foundExpense = week.expenses.find(t => t.id === transactionId);
      if (foundIncome) {
        removedTransaction = foundIncome;
        removedFromWeek = week;
      } else if (foundExpense) {
        removedTransaction = foundExpense;
        removedFromWeek = week;
      }
    });

    // Optimistic update - remove immediately from UI
    updateTransactionsOptimistically(weekTransactions => 
      removeTransactionFromWeek(weekTransactions, transactionId)
    );

    try {
      // Send delete request to database
      await deleteTransaction(transactionId);
      
      console.log(`✅ Transaction deleted successfully - using optimistic update only`);
    } catch (error) {
      // Rollback optimistic update on error
      if (removedTransaction && removedFromWeek) {
        updateTransactionsOptimistically(weekTransactions => 
          addTransactionToWeek(weekTransactions, removedTransaction)
        );
      }
      setError(error.message);
    }
  };
  // Toggle transaction status handler - simplified without optimistic updates
  const handleToggleStatus = async (transactionId) => {
    try {
      // Send update to database
      const updatedTransaction = await toggleTransactionStatus(transactionId);
      
      // Update with real data from database
      updateTransactionsOptimistically(weekTransactions => 
        updateTransactionInWeek(weekTransactions, transactionId, (transaction) => ({
          ...transaction,
          ...updatedTransaction
        }))
      );
      
      console.log(`✅ Transaction status updated successfully:`, transactionId);
    } catch (error) {
      setError(error.message);
      console.error('Failed to toggle transaction status:', error);
    }
  };
  // Authentication is handled by AuthWrapper
  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-200 transition-colors duration-300">
        <header className="sticky top-0 z-20 bg-white dark:bg-gray-800 shadow-md">
          <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-4 py-3 transition-colors duration-300">
                  <div className="flex justify-between items-center">
                    <h1 className="text-xl font-black text-indigo-600 dark:text-indigo-400">FlowBudget</h1>
                    <div className="flex items-center space-x-4">
                      <CacheStatus 
                        budgetCache={budgetCache} 
                        user={user} 
                        currentYear={currentYear} 
                        currentMonth={currentMonth} 
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-500 hidden md:block">{user.email}</span>
                      <button
                        onClick={toggleDarkMode}
                        className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                        title="Toggle Dark Mode"
                      >
                        {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                      </button>
                      <button
                        onClick={signOut}
                        className="text-sm text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300 font-semibold px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                      >
                        <LogOut size={18} />
                      </button>
                    </div>
                </div>
            </div>
        </header>
        <div className="flex flex-col md:flex-row mx-auto">
          <nav className="md:w-64 bg-white dark:bg-gray-800 md:h-screen md:sticky top-16 p-4 border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-700/50 shadow-lg md:shadow-none overflow-x-auto overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b pb-2 dark:border-gray-700 hidden md:block">Navigation</h3>
            <div className="flex md:flex-col space-x-2 md:space-x-0 md:space-y-2">
              <button
                onClick={() => setView('dashboard')}
                className={`flex items-center px-4 py-2 rounded-xl text-sm font-medium transition w-full ${view === 'dashboard' ? 'bg-indigo-500 text-white shadow-md' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              >
                <Home size={18} className="mr-2" />
                Dashboard
              </button>
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-4 pt-2 border-t dark:border-gray-700 uppercase hidden md:block">Budget Months</h4>
              {monthOptions.map((m) => (
                <button
                  key={`${m.year}-${m.month}`}
                  onClick={() => setDate(m.year, m.month)}
                  className={`flex items-center px-4 py-2 rounded-xl text-sm font-medium transition w-full ${view === 'month' && currentYear === m.year && currentMonth === m.month ? 'bg-indigo-500 text-white shadow-md' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </nav>
          <main className="flex-1 min-w-0 pb-10">
            {view === 'dashboard' ? (
              <Dashboard
                currentMonth={currentMonth}
                currentYear={currentYear}
                monthlyBudget={monthlyBudget}
                prevMonthlyBudget={prevMonthlyBudget}
                setDate={setDate}
              />
            ) : (
              <MonthView
                transactions={transactions}
                loading={loading}
                error={error}
                currentMonth={currentMonth}
                currentYear={currentYear}
                setDate={setDate}
                onAddTransaction={handleAddTransaction}
                onRemoveTransaction={handleRemoveTransaction}
                setError={setError}
                onToggleStatus={handleToggleStatus}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
