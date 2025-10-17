<script>
  import { dateUtils } from 'src/api/dateUtils';
  import { signal } from "src/api/signal";
  import { budgetApi } from "src/api/budgetApi";
  import { onMount, onDestroy } from 'svelte';

  const signalSubId = "TransactionFormComponent";

  let isNewTransaction = $state(true);
  
  // Local state using Svelte 5 $state rune
  let id = $state('');
  let type = $state('expenses');
  let date = $state();
  let description = $state('');
  let amount = $state('');
  let category = $state('');
  let status = $state('pending');


  // Handling of signals and status
  let isOpen = $state(false);
  onMount(() => {
    signal.sub("OPEN_TRANSACTION_FORM", signalSubId, (data) => {
      isOpen = true;
      let transaction = data.transaction;
      if(transaction){
        id = transaction.id;
        type = transaction.type;
        date = transaction.date;
        description = transaction.description;
        amount = transaction.amount;
        category = transaction.category;
        status = transaction.status;

        if(transaction.id !== null){
          isNewTransaction = false;
        } else {
          isNewTransaction = true;
        }
      }
    });
  })
  onDestroy(() => {
    signal.unsubAll(signalSubId);
  });
  
  function handleClose() {
    isOpen = false;
    // Reset form fields
    type = 'expenses';
    date = '';
    description = '';
    amount = '';
    category = '';
  }

  // Form submission handler
  async function handleSubmit(e) {
    e.preventDefault();
    let transaction = {
      id,
      type,
      date,
      description,
      amount: parseFloat(amount),
      category,
      status
    }
    let exists = budgetApi.getTransactionById(id) !== undefined;
    if(exists){
      let existingTransaction = budgetApi.getTransactionById(id);
      if (existingTransaction) {
        Object.assign(existingTransaction, transaction);
      }
      budgetApi.updateTransaction(id);
    } else {
      budgetApi.addTransaction(transaction);
    }
    handleClose();
  }
</script>

<div class="fixed inset-0 bg-black/65 flex items-center justify-center z-50 {isOpen ? '' : 'hidden'}">
  <div class="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-2xl space-y-4">
    <h3 class="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
     {isNewTransaction ? 'Add' : 'Edit'} Transaction
    </h3>
    
    <form onsubmit={handleSubmit} class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <label class="flex flex-col">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</span>
          <select
            bind:value={type}
            class="p-2 border rounded-lg focus:ring-2 transition {type === 'incomes' ? 'bg-green-50 text-green-800 border-green-300 focus:ring-green-500 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700' : 'bg-red-50 text-red-800 border-red-300 focus:ring-red-500 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700'} dark:bg-gray-700 dark:text-white dark:border-gray-600"
          >
            <option value="incomes">Income</option>
            <option value="expenses">Expense</option>
          </select>
        </label>
        
        <label class="flex flex-col">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</span>
          <input
            type="date"
            bind:value={date}
            class="p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition"
          />
        </label>
      </div>
      
      <label class="flex flex-col">
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</span>
        <input
          type="text"
          bind:value={description}
          placeholder="e.g., Groceries, Salary, Rent"
          class="p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition"
          required
        />
      </label>
      
      <div class="grid grid-cols-2 gap-4">
        <label class="flex flex-col">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount ($)</span>
          <input
            type="number"
            bind:value={amount}
            placeholder="0.00"
            step="0.01"
            min="0.01"
            class="p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition"
            required
          />
        </label>
        
        <label class="flex flex-col">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category (Optional)</span>
          <input
            type="text"
            bind:value={category}
            placeholder="e.g., Food, Travel"
            class="p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 transition"
          />
        </label>
      </div>
      
      <div class="flex justify-end space-x-3 pt-2">
        <button
          type="button"
          onclick={handleClose}
          class="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl shadow-lg hover:bg-indigo-700 transition"
          onsubmit={handleSubmit}
        >
          Add Transaction
        </button>
      </div>
    </form>
  </div>
</div>
