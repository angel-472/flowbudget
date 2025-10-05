import { TrendingUp, TrendingDown, BarChart2 } from 'lucide-react';
import { formatCurrency } from '../utils';

const Dashboard = ({ currentMonth, currentYear, monthlyBudget, prevMonthlyBudget, setDate }) => {
  const monthName = new Date(currentYear, currentMonth, 1).toLocaleString('en-US', { month: 'long' });
  const prevMonthName = new Date(currentYear, currentMonth - 1, 1).toLocaleString('en-US', { month: 'long' });
  const totalIncome = monthlyBudget.income;
  const totalExpense = monthlyBudget.expense;
  const netFlow = monthlyBudget.net;
  const prevIncome = prevMonthlyBudget.income;
  const prevExpense = prevMonthlyBudget.expense;
  const getComparisonText = (current, previous, label) => {
    if (previous === 0) return `No data for ${prevMonthName}.`;
    const diff = current - previous;
    const percent = (diff / previous) * 100;
    const icon = diff >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />;
    const color = diff >= 0 ? (label === 'Expense' ? 'text-red-500' : 'text-green-500') : (label === 'Expense' ? 'text-green-500' : 'text-red-500');
    return (
      <span className={`flex items-center space-x-1 font-semibold ${color}`}>
        {icon}
        <span>{percent.toFixed(1)}% {diff >= 0 ? 'More' : 'Less'}</span>
      </span>
    );
  };
  const netColor = netFlow >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  const maxAmount = Math.max(totalIncome, totalExpense) || 1;
  const incomeHeight = (totalIncome / maxAmount) * 100;
  const expenseHeight = (totalExpense / maxAmount) * 100;
  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8">
      <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-8">Dashboard: {monthName} {currentYear}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-l-4 border-green-500 dark:border-green-600 transition hover:shadow-xl">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Income</p>
            <TrendingUp size={24} className="text-green-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(totalIncome)}</p>
          <div className="mt-3 text-sm flex items-center">
            {getComparisonText(totalIncome, prevIncome, 'Income')}
            <span className="text-gray-500 dark:text-gray-400 ml-2">vs {prevMonthName}</span>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-l-4 border-red-500 dark:border-red-600 transition hover:shadow-xl">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Expenses</p>
            <TrendingDown size={24} className="text-red-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(totalExpense)}</p>
          <div className="mt-3 text-sm flex items-center">
            {getComparisonText(totalExpense, prevExpense, 'Expense')}
            <span className="text-gray-500 dark:text-gray-400 ml-2">vs {prevMonthName}</span>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-l-4 border-indigo-500 dark:border-indigo-600 transition hover:shadow-xl">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Net Flow</p>
            <BarChart2 size={24} className="text-indigo-500" />
          </div>
          <p className={`text-3xl font-bold ${netColor} mt-1`}>{formatCurrency(netFlow)}</p>
          <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            {netFlow >= 0 ? 'You are flowing well!' : 'Time to review your spending.'}
          </div>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg transition hover:shadow-xl">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Income vs Expense Overview</h3>
        <div className="h-64 flex items-end justify-around p-4">
          <div className="relative w-1/4 h-full flex flex-col items-center group cursor-pointer" onClick={() => setDate(currentYear, currentMonth)}>
            <div style={{ height: `${incomeHeight}%` }} className="w-full bg-green-500 dark:bg-green-600 rounded-t-lg transition-all duration-500 ease-out shadow-lg"></div>
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-2">Income</span>
            <span className="absolute top-0 transform -translate-y-full text-sm font-semibold text-gray-700 dark:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300">{formatCurrency(totalIncome)}</span>
          </div>
          <div className="relative w-1/4 h-full flex flex-col items-center group cursor-pointer" onClick={() => setDate(currentYear, currentMonth)}>
            <div style={{ height: `${expenseHeight}%` }} className="w-full bg-red-500 dark:bg-red-600 rounded-t-lg transition-all duration-500 ease-out shadow-lg"></div>
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-2">Expense</span>
            <span className="absolute top-0 transform -translate-y-full text-sm font-semibold text-gray-700 dark:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300">{formatCurrency(totalExpense)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
