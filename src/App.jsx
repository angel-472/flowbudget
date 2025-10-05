import { useState, useEffect, useCallback, useMemo } from 'react';
import './App.css';
import { Home, Sun, Moon, LogOut } from 'lucide-react';
import { getMockUser, signOutMock } from './mockAuth';
import {
  fetchOrCreateMonthBudget,
  addTransaction,
  deleteTransaction,
  toggleTransactionStatus
} from './mockBudgetApi';
import { calculateWeeklyTotals } from './utils';
import MonthView from './components/MonthView';
import Dashboard from './components/Dashboard';

function App() {
  // Auth State
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
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
  // Initialize mock auth on mount
  useEffect(() => {
    const user = getMockUser();
    setUserId(user.uid);
    setIsAuthReady(true);
  }, []);
  // Effect to handle month change and fetch/create budget data
  const fetchBudget = useCallback((year, month) => {
    if (!isAuthReady || !userId) return;
    setLoading(true);
    setError(null);
    // Fetch Current Month Budget
    const weeks = fetchOrCreateMonthBudget(year, month, userId);
    setTransactions(weeks);
    setLoading(false);
    // Fetch Previous Month Budget for Dashboard Comparison
    let prevYear = year;
    let prevMonth = month - 1;
    if (prevMonth < 0) {
      prevMonth = 11;
      prevYear -= 1;
    }
    const prevWeeks = fetchOrCreateMonthBudget(prevYear, prevMonth, userId);
    setPrevTransactions(prevWeeks || []);
  }, [isAuthReady, userId]);
  useEffect(() => {
    if (isAuthReady && userId) {
      fetchBudget(currentYear, currentMonth);
    }
  }, [currentYear, currentMonth, isAuthReady, userId, fetchBudget]);
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
  const handleAddTransaction = (year, month, weekNumber, type, newTransaction) => {
    try {
      addTransaction(year, month, weekNumber, type, newTransaction, userId);
      fetchBudget(year, month);
    } catch (e) {
      setError(e.message);
    }
  };
  // Remove transaction handler
  const handleRemoveTransaction = (year, month, weekNumber, type, transactionId) => {
    try {
      deleteTransaction(year, month, weekNumber, type, transactionId, userId);
      fetchBudget(year, month);
    } catch (e) {
      setError(e.message);
    }
  };
  if (!isAuthReady) {
    return (
      <div className={`flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900 transition duration-300 ${darkMode ? 'dark' : ''}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto"></div>
          <p className="mt-4 text-gray-700 dark:text-gray-300">Authenticating and loading FlowBudget...</p>
        </div>
      </div>
    );
  }
  if (!userId) {
    return (
      <div className="flex items-center justify-center h-screen bg-red-50 dark:bg-red-900/50">
        <p className="text-red-800 dark:text-red-300">Authentication failed. Cannot load app.</p>
      </div>
    );
  }
  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-200 transition-colors duration-300">
        <header className="sticky top-0 z-20 bg-white dark:bg-gray-800 shadow-md">
          <div className="mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
            <h1 className="text-2xl font-black text-indigo-600 dark:text-indigo-400">FlowBudget</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:inline">User ID: {userId.substring(0, 8)}...</span>
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                title="Toggle Dark Mode"
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button
                onClick={signOutMock}
                className="p-2 rounded-full text-red-600 dark:text-red-400 hover:bg-red-100/50 dark:hover:bg-red-900/50 transition"
                title="Sign Out"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </header>
        <div className="flex flex-col md:flex-row mx-auto">
          <nav className="md:w-64 bg-white dark:bg-gray-800 md:h-screen md:sticky top-16 p-4 border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-700/50 shadow-lg md:shadow-none overflow-x-auto">
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
                onToggleStatus={toggleTransactionStatus}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
