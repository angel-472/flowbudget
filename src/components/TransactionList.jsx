import { formatCurrency, formatDate, createLocalDate } from '../utils';
import { Trash2, Check, Circle } from 'lucide-react';

const TransactionList = ({ transactions, type, onRemove, onToggleStatus }) => {
  const isIncome = type === 'incomes';
  const colorClass = isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  const bgColorClass = isIncome ? 'bg-green-50 dark:bg-green-900/30' : 'bg-red-50 dark:bg-red-900/30';

  if (transactions.length === 0) {
    return (
      <div className={`p-4 text-center text-sm rounded-xl ${bgColorClass} ${colorClass} font-medium`}>
        No {isIncome ? 'Income' : 'Expenses'} yet for this week.
      </div>
    );
  }

  return (
    <div className="w-full">
      <h4 className={`text-lg font-semibold mb-2 ${colorClass}`}>{isIncome ? 'Incomes' : 'Expenses'}</h4>
      <div className="overflow-x-auto shadow-md rounded-xl">
        <table className="min-w-full bg-white dark:bg-gray-800 rounded-xl">
          <thead className="bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700">
            <tr>
              <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/5">Date</th>
              <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-2/5">Description</th>
              <th className="py-2 px-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/5">Amount</th>
              <th className="py-2 px-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/5"></th>
            </tr>
          </thead>
          <tbody>
            {transactions
              .sort((a, b) => createLocalDate(a.date) - createLocalDate(b.date))
              .map((t) => {
                // Debug duplicate keys
                const duplicateCount = transactions.filter(trans => trans.id === t.id).length;
                if (duplicateCount > 1) {
                  console.error(`🔴 Duplicate key detected: ${t.id} appears ${duplicateCount} times`);
                }
                
                return (
                  <tr 
                    key={t.id} 
                    className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-150 ease-in-out"
                  >
                    <td className="py-2 px-3 text-sm text-gray-700 dark:text-gray-300 font-medium">
                      <div className="flex items-center gap-2">
                        {formatDate(t.date)}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-sm text-gray-700 dark:text-gray-300 truncate md:max-w-2xs">
                      {t.description}
                      {t.category && <span className="ml-2 inline-block px-2 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">({t.category})</span>}
                    </td>
                    <td className={`py-2 px-3 text-sm font-semibold text-right ${colorClass}`}>
                      {formatCurrency(t.amount)}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => onToggleStatus(t.id)}
                          className={`p-1 rounded-full ${t.status === 'done' ? 'text-indigo-500 bg-indigo-100 dark:bg-indigo-900/50' : 'text-gray-400 hover:text-indigo-500 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/50'} transition`}
                          title={t.status === 'done' ? 'Mark as Pending' : 'Mark as Done'}
                        >
                          {t.status === 'done' ? <Check size={16} /> : <Circle size={16} />}
                        </button>
                        <button
                          onClick={() => onRemove(t.id)}
                          className="p-1 rounded-full text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-100/50 dark:hover:bg-red-900/50 transition"
                          title="Delete Transaction"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionList;
