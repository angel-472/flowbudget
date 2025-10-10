import { useMemo } from 'react';
import WeekCard from './WeekCard';
import { calculateWeeklyTotals, formatCurrency } from '../utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MonthView = ({ transactions, loading, error, currentMonth, currentYear, setDate, onAddTransaction, onRemoveTransaction, onToggleStatus, setError }) => {
  const monthName = new Date(currentYear, currentMonth, 1).toLocaleString('en-US', { month: 'long' });
  const monthlyTotals = useMemo(() => {
    const income = transactions.reduce((sum, week) => sum + calculateWeeklyTotals(week).income, 0);
    const expense = transactions.reduce((sum, week) => sum + calculateWeeklyTotals(week).expense, 0);
    return { income, expense, net: income - expense };
  }, [transactions]);
  const handleMonthChange = (direction) => {
    let newMonth = currentMonth + direction;
    let newYear = currentYear;
    if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    }
    setDate(newYear, newMonth);
  };
  const netColor = monthlyTotals.net >= 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400';
  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8">
      <header className="flex justify-between items-center mb-8 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md sticky top-0 z-10 border border-gray-100 dark:border-gray-700/50">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => handleMonthChange(-1)}
            className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            title="Previous Month"
          >
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white transition duration-200">
            {monthName} {currentYear}
          </h2>
          <button
            onClick={() => handleMonthChange(1)}
            className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            title="Next Month"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </header>
      {loading && <p className="text-center text-gray-600 dark:text-gray-400 text-lg py-12">Loading month data...</p>}
      {error && <p className="text-center text-red-600 dark:text-red-400 text-lg py-12">Error: {error}</p>}
      {!loading && !error && (
        <div className="space-y-8">
          {transactions.map((week) => (
            <WeekCard
              key={week.weekNumber}
              week={week}
              onAddTransaction={onAddTransaction}
              onRemoveTransaction={onRemoveTransaction}
              onToggleStatus={onToggleStatus}
              setError={setError}
            />
          ))}
          <footer className="mt-10 p-6 bg-indigo-50 dark:bg-gray-900/50 rounded-xl shadow-xl border-t-4 border-indigo-500 bottom-0 z-10">
            <h3 className="text-2xl font-extrabold text-indigo-700 dark:text-indigo-400 mb-4">Monthly Summary</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-inner">
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Income</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">{formatCurrency(monthlyTotals.income)}</p>
              </div>
              <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-inner">
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Expenses</p>
                <p className="text-xl font-bold text-red-600 dark:text-red-400">{formatCurrency(monthlyTotals.expense)}</p>
              </div>
              <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-inner">
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Net Flow</p>
                <p className={`text-2xl font-extrabold ${netColor}`}>{formatCurrency(monthlyTotals.net)}</p>
              </div>
            </div>
          </footer>
        </div>
      )}
    </div>
  );
};

export default MonthView;
