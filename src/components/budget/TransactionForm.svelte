<script module>
  import { signal as moduleSignal } from "src/api/signal";
  import { router as moduleRouter } from "/src/api/router.svelte.js";

  /**
   * Opens the form for a new transaction. On the month view it defaults to the
   * month on screen (today if that's the current month, else the 1st), so the
   * transaction lands where the user is looking; elsewhere it's today.
   */
  export function openNewTransaction() {
    const today = new Date();
    const viewingOtherMonth = moduleRouter.view === 'month'
      && (moduleRouter.month !== today.getMonth() || moduleRouter.year !== today.getFullYear());
    const date = viewingOtherMonth ? new Date(moduleRouter.year, moduleRouter.month, 1) : today;

    moduleSignal.emit("OPEN_TRANSACTION_FORM", {
      transaction: {
        id: null,
        type: 'expenses',
        date: date.toLocaleDateString('en-CA'),
        description: '',
        amount: '',
        category: '',
        status: 'pending'
      }
    });
  }
</script>

<script>
  import { dateUtils } from 'src/api/dateUtils';
  import { signal } from "src/api/signal";
  import { budgetApi } from "src/api/budgetApi.svelte.js";
  import { onMount, onDestroy } from 'svelte';
  import { recurringApi } from '/src/api/recurringApi.svelte';
  import Modal from '/src/components/ui/Modal.svelte';

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


  let currentTransaction;

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
      currentTransaction = transaction;
    });
  })
  onDestroy(() => {
    signal.unsubAll(signalSubId);
  });
  
  function resetFields() {
    type = 'expenses';
    date = '';
    description = '';
    amount = '';
    category = '';
  }

  function handleClose() {
    isOpen = false;
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
    } 
    else {
      console.log(transaction.id)
      if(transaction.id && transaction.id.startsWith("_recurring_")){
        const expenseId = transaction.id.substring("_recurring_".length)
        const recurringExpense = recurringApi.getById(expenseId);
        recurringExpense.excludedDates.push(currentTransaction.date); //excludes the date of the mock transaction, not the one from the form (could be edited by user)
        recurringApi.update(expenseId);

        transaction.id = crypto.randomUUID();
        transaction.category = "Recurring Expenses";
      }

      budgetApi.addTransaction(transaction);
      signal.emit("UPDATE_TRANSACTION", { transaction });
    }
    handleClose();
  }
</script>

<Modal
  bind:open={isOpen}
  name="transaction-form"
  title="{isNewTransaction ? 'New' : 'Edit'} Transaction"
  onClosed={resetFields}
>
      <form onsubmit={handleSubmit} class="space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <label class="flex flex-col gap-1">
            <span class="text-xs font-medium text-zinc-400 dark:text-zinc-400">Type</span>
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
            <span class="text-xs font-medium text-zinc-400 dark:text-zinc-400">Date</span>
            <input
              type="date"
              bind:value={date}
              class="px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
            />
          </label>
        </div>
        
        <label class="flex flex-col gap-1">
          <span class="text-xs font-medium text-zinc-400 dark:text-zinc-400">Description</span>
          <input
            type="text"
            bind:value={description}
            placeholder="e.g. Groceries, Salary"
            class="px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
            required
          />
        </label>
        
        <div class="grid grid-cols-2 gap-3">
          <label class="flex flex-col gap-1">
            <span class="text-xs font-medium text-zinc-400 dark:text-zinc-400">Amount ($)</span>
            <input
              type="number"
              bind:value={amount}
              placeholder="0.00"
              step="0.01"
              min="0.01"
              class="px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
              required
            />
          </label>
          
          <label class="flex flex-col gap-1">
            <span class="text-xs font-medium text-zinc-400 dark:text-zinc-400">Category</span>
            <input
              type="text"
              bind:value={category}
              placeholder="Optional"
              class="px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
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
</Modal>
