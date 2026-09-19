<script>
  import { Check, Square, Trash, Pencil } from 'lucide-svelte';
  import { formatDate, formatCurrency } from '/src/api/utils';
  import { dateUtils } from '/src/api/dateUtils';
  import { budgetApi } from '/src/api/budgetApi.svelte.js';
  import { signal } from '/src/api/signal.js';
  import { recurringApi } from '/src/api/recurringApi.svelte';
  import ConfirmDialog from '/src/components/ui/ConfirmDialog.svelte';
  
  let { type, transactions } = $props();
  let isIncome = $derived(type === 'incomes');

  let showDeleteModal = $state(false);
  let transactionToDelete = $state(null);

  async function handleToggleStatus(id) {
    transactions = transactions.map(t => 
      t.id === id 
        ? { ...t, status: t.status === 'done' ? 'pending' : 'done' }
        : t
    );
    if(id.startsWith("_recurring_")){
      // Give valid id and replace
      const mockTransaction = transactions.find((t) => t.id === id);

      const expenseId = id.substring("_recurring_".length)
      const recurringExpense = recurringApi.getById(expenseId);
      recurringExpense.excludedDates.push(mockTransaction.date);
      recurringApi.update(expenseId);

      mockTransaction.id = crypto.randomUUID();
      mockTransaction.category = "Recurring Expenses";
      budgetApi.addTransaction(mockTransaction);

      signal.emit("UPDATE_TRANSACTION", { transaction: mockTransaction });
    }
    else {
      budgetApi.toggleTransactionStatus(id);
    }
  }
  
  function handleEditTransaction(id) {
    const transaction = transactions.find(t => t.id === id);
    if (transaction) signal.emit("OPEN_TRANSACTION_FORM", { transaction });
  }

  function handleDeleteTransaction(id) {
    const transaction = transactions.find(t => t.id === id);
    if (transaction) {
      transactionToDelete = transaction;
      showDeleteModal = true;
    }
  }

  function confirmDelete() {
    if (transactionToDelete) {

      if(transactionToDelete.id.startsWith("_recurring_")){
        // Handle marking the date in the recurringExpense so new mocks don't get generated (since it was deleted) 
        console.log("deleting a mock transaction of recurring expense")
        const expenseId = transactionToDelete.id.substring("_recurring_".length)
        const recurringExpense = recurringApi.getById(expenseId);
        recurringExpense.excludedDates.push(transactionToDelete.date);
        recurringApi.update(expenseId);
      }
      else {
        budgetApi.deleteTransaction(transactionToDelete.id);
      }
      transactions = transactions.filter(t => t.id !== transactionToDelete.id);
      signal.emit("UPDATE_TRANSACTION", { transaction: transactionToDelete });

    }
  }
</script>

{#if transactions.length === 0}
  <div class="flex flex-1 items-center justify-center py-4 w-full">
    <p class="text-xs text-zinc-400 dark:text-zinc-400">No {isIncome ? 'income' : 'expenses'} yet</p>
  </div>
{:else}
  <div class="w-full">
    <div class="flex items-baseline justify-between mb-2">
      <h4 class="text-xs font-semibold uppercase tracking-wider {isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}">
        {isIncome ? 'Income' : 'Expenses'}
      </h4>
      <span class="text-xs text-zinc-400 dark:text-zinc-400">
        {formatCurrency(transactions.reduce((sum, t) => sum + t.amount, 0))}
      </span>
    </div>
    <div class="flex flex-col overflow-y-auto">
      {#each transactions.toSorted((a, b) => new Date(a.date) - new Date(b.date)) as t (t.id)}
        {@const isRecurring = (t.id.startsWith("_recurring_"))}
        <div class="group flex items-center gap-3 py-2 px-1 border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded transition-colors">
          <!-- Status toggle -->
          <button
            class="shrink-0 p-0.5 rounded {t.status === 'done' ? 'text-zinc-400 dark:text-zinc-400' : 'text-zinc-300 dark:text-zinc-600 hover:text-zinc-400 dark:hover:text-zinc-400'} transition-colors cursor-pointer"
            title={t.status === 'done' ? 'Mark as Pending' : 'Mark as Done'}
            onclick={() => handleToggleStatus(t.id)}
          >
            {#if t.status === 'done'}
              <Check size={14} />
            {:else}
              <Square size={14} />
            {/if}
          </button>

          <!-- Description + category -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
              {t.description}
            </p>
            {#if !isRecurring}
              <p class="text-xs text-zinc-400 dark:text-zinc-400">
                {t.category || 'Uncategorized'} · {dateUtils.createLocalDate(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            {:else}
              <p class="text-xs text-zinc-400 dark:text-zinc-400">
                <span class="text-red-400 underline decoration-dashed underline-offset-1">Recurring Expense</span> · {dateUtils.createLocalDate(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>            
            {/if}
          </div>
          
          <!-- Amount -->
          <span class="text-sm font-medium tabular-nums {isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}">
            {formatCurrency(t.amount)}
          </span>

          <!-- Actions -->
          <div class="flex gap-0.5">
            <button
              class="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
              onclick={() => handleEditTransaction(t.id)}
              title="Edit"
            >
              <Pencil size={14} />
            </button>
            <button
              class="p-1 rounded text-zinc-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
              onclick={() => handleDeleteTransaction(t.id)}
              title="Delete"
            >
              <Trash size={14} />
            </button>
          </div>
        </div>
      {/each}
    </div>
  </div>
{/if}

<!-- Delete confirmation -->
<!-- Always mounted so the exit animation can play; cleared once it's gone -->
<ConfirmDialog
  bind:open={showDeleteModal}
  name="delete-transaction"
  title="Delete Transaction?"
  onconfirm={confirmDelete}
  onclosed={() => transactionToDelete = null}
>
  Are you sure you want to delete
  <span class="font-medium text-zinc-700 dark:text-zinc-200">{transactionToDelete?.description}</span>?
  This action can't be undone.
</ConfirmDialog>
