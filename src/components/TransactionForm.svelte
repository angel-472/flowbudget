<script>
  import { dateUtils } from 'src/api/dateUtils';
  import { signal } from "src/api/signal";
  import { budgetApi } from "src/api/budgetApi.svelte.js";
  import { onMount, onDestroy } from 'svelte';

  const signalSubId = "TransactionFormComponent";

  let isNewTransaction = $state(true);
  
  let id = $state('');
  let type = $state('expenses');
  let date = $state();
  let description = $state('');
  let amount = $state('');
  let category = $state('');
  let status = $state('pending');

  let isOpen = $state(false);
  onMount(() => {
    signal.sub("OPEN_TRANSACTION_FORM", signalSubId, (data) => {
      isOpen = true;
      let transaction = data.transaction;
      if (transaction) {
        id = transaction.id;
        type = transaction.type;
        date = transaction.date;
        description = transaction.description;
        amount = transaction.amount;
        category = transaction.category;
        status = transaction.status;
        isNewTransaction = transaction.id === null;
      }
    });
  })
  onDestroy(() => {
    signal.unsubAll(signalSubId);
  });
  
  function handleClose() {
    isOpen = false;
    type = 'expenses';
    date = '';
    description = '';
    amount = '';
    category = '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    let transaction = { id, type, date, description, amount: parseFloat(amount), category, status };
    let exists = budgetApi.getTransactionById(id) !== undefined;
    if (exists) {
      let existingTransaction = budgetApi.getTransactionById(id);
      if (existingTransaction) Object.assign(existingTransaction, transaction);
      budgetApi.updateTransaction(id);
      signal.emit("UPDATE_TRANSACTION", { transaction: existingTransaction });
    } else {
      budgetApi.addTransaction(transaction);
      signal.emit("UPDATE_TRANSACTION", { transaction });
    }
    handleClose();
  }
</script>

{#if isOpen}
  <!-- Backdrop -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 p-4"
    onkeydown={(e) => e.key === 'Escape' && handleClose()}
    onclick={(e) => e.target === e.currentTarget && handleClose()}
  >
    <!-- Modal -->
    <div class="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
      <h3 class="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-4">
        {isNewTransaction ? 'New' : 'Edit'} Transaction
      </h3>
      
      <form onsubmit={handleSubmit} class="space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <label class="flex flex-col gap-1">
            <span class="text-xs font-medium text-zinc-500 dark:text-zinc-400">Type</span>
            <select
              bind:value={type}
              class="px-3 py-2 text-sm border rounded-lg transition-colors cursor-pointer
                {type === 'incomes'
                  ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                  : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300'
                }"
            >
              <option value="incomes">Income</option>
              <option value="expenses">Expense</option>
            </select>
          </label>
          
          <label class="flex flex-col gap-1">
            <span class="text-xs font-medium text-zinc-500 dark:text-zinc-400">Date</span>
            <input
              type="date"
              bind:value={date}
              class="px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
            />
          </label>
        </div>
        
        <label class="flex flex-col gap-1">
          <span class="text-xs font-medium text-zinc-500 dark:text-zinc-400">Description</span>
          <input
            type="text"
            bind:value={description}
            placeholder="e.g. Groceries, Salary"
            class="px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
            required
          />
        </label>
        
        <div class="grid grid-cols-2 gap-3">
          <label class="flex flex-col gap-1">
            <span class="text-xs font-medium text-zinc-500 dark:text-zinc-400">Amount ($)</span>
            <input
              type="number"
              bind:value={amount}
              placeholder="0.00"
              step="0.01"
              min="0.01"
              class="px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
              required
            />
          </label>
          
          <label class="flex flex-col gap-1">
            <span class="text-xs font-medium text-zinc-500 dark:text-zinc-400">Category</span>
            <input
              type="text"
              bind:value={category}
              placeholder="Optional"
              class="px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
            />
          </label>
        </div>
        
        <div class="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onclick={handleClose}
            class="px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-300 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="px-4 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-lg active:scale-[0.98] transition-all cursor-pointer"
          >
            {isNewTransaction ? 'Add' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
