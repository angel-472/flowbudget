import { useMemo, useState } from 'react';
import TransactionList from './TransactionList';
import TransactionForm from './TransactionForm';
import { calculateWeeklyTotals, formatCurrency, createLocalDate } from '../utils';
import { Plus } from 'lucide-react';

const WeekCard = ({ week, onAddTransaction, onRemoveTransaction, onToggleStatus, setError }) => {
  const totals = useMemo(() => calculateWeeklyTotals(week), [week]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const netColor = totals.net >= 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400';

  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700/50">
      <div className="flex justify-between items-center border-b pb-3 mb-4 border-gray-200 dark:border-gray-700">
        <div>
          <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">W{week.weekNumber}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{week.dateRange}</p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-xl shadow-md hover:bg-indigo-700 transition"
          title="Add Transaction"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Add</span>
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TransactionList
          transactions={week.incomes}
          type="incomes"
          onRemove={onRemoveTransaction}
          onToggleStatus={onToggleStatus}
          setError={setError}
        />
        <TransactionList
          transactions={week.expenses}
          type="expenses"
          onRemove={onRemoveTransaction}
          onToggleStatus={onToggleStatus}
          setError={setError}
        />
      </div>
      <div className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center text-sm font-semibold">
        <span className="text-gray-600 dark:text-gray-300">Weekly Net:</span>
        <span className={`text-lg ${netColor}`}>{formatCurrency(totals.net)}</span>
      </div>
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
          <TransactionForm
            currentMonth={createLocalDate(week.startDate.substring(0, 10)).getMonth()}
            currentYear={createLocalDate(week.startDate.substring(0, 10)).getFullYear()}
            currentWeekNumber={week.weekNumber}
            onAdd={onAddTransaction}
            onClose={() => setIsFormOpen(false)}
            setError={setError}
          />
        </div>
      )}
    </div>
  );
};

export default WeekCard;
