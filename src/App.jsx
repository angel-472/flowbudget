import { useState, useEffect, useCallback, useMemo } from 'react';
import './App.css';
import { Home, Sun, Moon } from 'lucide-react';
import {
  fetchOrCreateMonthBudget,
  addTransaction,
  deleteTransaction,
  toggleTransactionStatus
} from './budgetApi';
import { calculateWeeklyTotals } from './utils';
import MonthView from './components/MonthView';
import Dashboard from './components/Dashboard';
import './migration'; // Import migration tool for development
import './dbTest'; // Import database test utilities

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
  const [darkMode, setDarkMode] = useState(() => {
    const storedMode = localStorage.getItem('darkMode');
    if (storedMode !== null) return JSON.parse(storedMode);
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  // Toggle Dark Mode
  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const newMode = !prev;
      localStorage.setItem('darkMode', newMode);
      return newMode;
    });
  };
  // User is authenticated through AuthWrapper
  // Effect to handle month change and fetch/create budget data
  const fetchBudget = useCallback(async (year, month) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      // Fetch Current Month Budget
      const weeks = await fetchOrCreateMonthBudget(year, month, user.id);
      setTransactions(weeks);
      // Fetch Previous Month Budget for Dashboard Comparison
      let prevYear = year;
      let prevMonth = month - 1;
      if (prevMonth < 0) {
        prevMonth = 11;
        prevYear -= 1;
      }
      const prevWeeks = await fetchOrCreateMonthBudget(prevYear, prevMonth, user.id);
      setPrevTransactions(prevWeeks || []);
    } catch (error) {
      console.error('Error fetching budget data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [user]);
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
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);
  // Add transaction handler
  const handleAddTransaction = async (newTransaction) => {
    try {
      await addTransaction(newTransaction, user.id);
      await fetchBudget(currentYear, currentMonth); // Refresh current view
    } catch (e) {
      setError(e.message);
    }
  };
  // Remove transaction handler
  const handleRemoveTransaction = async (transactionId) => {
    try {
      await deleteTransaction(transactionId, user.id);
      await fetchBudget(currentYear, currentMonth); // Refresh current view
    } catch (e) {
      setError(e.message);
    }
  };
  // Toggle transaction status handler
  const handleToggleStatus = async (transactionId) => {
    try {
      await toggleTransactionStatus(transactionId, user.id);
      await fetchBudget(currentYear, currentMonth); // Refresh current view
    } catch (e) {
      setError(e.message);
    }
  };
  // Authentication is handled by AuthWrapper
  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-200 transition-colors duration-300">
        <header className="sticky top-0 z-20 bg-white dark:bg-gray-800 shadow-md">
          <div className="mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
            <h1 className="text-2xl font-black text-indigo-600 dark:text-indigo-400">FlowBudget</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:inline">{user.email}</span>
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                title="Toggle Dark Mode"
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
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
