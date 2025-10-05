import { useState, useEffect } from 'react';
import { getWeekNumber, getWeekDateRange } from '../utils';

const TransactionForm = ({ currentMonth, currentYear, currentWeekNumber, onAdd, onClose, setError }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('incomes');
  const [date, setDate] = useState(() => {
    const { start } = getWeekDateRange(currentYear, currentWeekNumber);
    return start.toISOString().substring(0, 10);
  });
  const [targetWeek, setTargetWeek] = useState(currentWeekNumber);

  // Update target week when date changes
  useEffect(() => {
    const selectedDate = new Date(date);
    const newWeekNumber = getWeekNumber(selectedDate);
    setTargetWeek(newWeekNumber);
  }, [date]);
  const [category, setCategory] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!description || parsedAmount <= 0 || !date || isNaN(parsedAmount)) {
      setError('Please fill in a description, a valid date, and a positive amount.');
      return;
    }
    setError(null);
    const newTransaction = {
      date,
      description,
      amount: parsedAmount,
      category: category || null,
      status: 'pending',
    };
    onAdd(currentYear, currentMonth, targetWeek, type, newTransaction);
    onClose();
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-2xl space-y-4">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
        Add Transaction to W{targetWeek}
        {targetWeek !== currentWeekNumber && (
          <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
            Note: Transaction will be added to week {targetWeek} based on selected date
          </p>
        )}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</span>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className={`p-2 border rounded-lg focus:ring-2 transition ${type === 'incomes' ? 'bg-green-50 text-green-800 border-green-300 focus:ring-green-500 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700' : 'bg-red-50 text-red-800 border-red-300 focus:ring-red-500 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700'} dark:bg-gray-700 dark:text-white dark:border-gray-600`}
            >
              <option value="incomes">Income</option>
              <option value="expenses">Expense</option>
            </select>
          </label>
          <label className="flex flex-col">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</span>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition"
            />
          </label>
        </div>
        <label className="flex flex-col">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</span>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="e.g., Groceries, Salary, Rent"
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition"
            required
          />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount ($)</span>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0.01"
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition"
              required
            />
          </label>
          <label className="flex flex-col">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category (Optional)</span>
            <input
              type="text"
              value={category}
              onChange={e => setCategory(e.target.value)}
              placeholder="e.g., Food, Travel"
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition"
            />
          </label>
        </div>
        <div className="flex justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl shadow-lg hover:bg-indigo-700 transition"
          >
            Add Transaction
          </button>
        </div>
      </form>
    </div>
  );
};

export default TransactionForm;
