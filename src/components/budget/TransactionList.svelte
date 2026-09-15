<script>
  import { Check, Square, Trash, Pencil, AlertTriangle } from 'lucide-svelte';
  import { formatDate, formatCurrency } from '/src/api/utils';
  import { dateUtils } from '/src/api/dateUtils';
  import { budgetApi } from '/src/api/budgetApi.svelte.js';
  import { signal } from '/src/api/signal.js';
  
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
    budgetApi.toggleTransactionStatus(id);
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
      budgetApi.deleteTransaction(transactionToDelete.id);
      transactions = transactions.filter(t => t.id !== transactionToDelete.id);
      signal.emit("UPDATE_TRANSACTION", { transaction: transactionToDelete });
    }
    closeDeleteModal();
  }

  function closeDeleteModal() {
    showDeleteModal = false;
    transactionToDelete = null;
  }
</script>

{#if transactions.length === 0}
  <div class="flex flex-1 items-center justify-center py-4 w-full">
    <p class="text-xs text-zinc-400 dark:text-zinc-500">No {isIncome ? 'income' : 'expenses'} yet</p>
  </div>
{:else}
  <div class="w-full">
    <div class="flex items-baseline justify-between mb-2">
      <h4 class="text-xs font-semibold uppercase tracking-wider {isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}">
        {isIncome ? 'Income' : 'Expenses'}
      </h4>
      <span class="text-xs text-zinc-400 dark:text-zinc-500">
        {formatCurrency(transactions.reduce((sum, t) => sum + t.amount, 0))}
      </span>
    </div>
    <div class="flex flex-col overflow-y-auto">
      {#each transactions.toSorted((a, b) => new Date(a.date) - new Date(b.date)) as t (t.id)}
        <div class="group flex items-center gap-3 py-2 px-1 border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded transition-colors">
          <!-- Status toggle -->
          <button
            class="shrink-0 p-0.5 rounded {t.status === 'done' ? 'text-zinc-400 dark:text-zinc-500' : 'text-zinc-300 dark:text-zinc-600 hover:text-zinc-500 dark:hover:text-zinc-400'} transition-colors cursor-pointer"
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
            <p class="text-xs text-zinc-400 dark:text-zinc-500">
              {t.category || 'Uncategorized'} · {dateUtils.createLocalDate(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
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
{#if showDeleteModal && transactionToDelete}

  <!-- Backdrop -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
    onclick={(e) => e.target === e.currentTarget && close()}
    onkeydown={(e) => e.key === 'Escape' && close()}
  >
    <!-- Modal -->
    <div class="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <div class="flex items-start gap-3">
        <div class="shrink-0 p-2 rounded-lg bg-red-500/10">
          <AlertTriangle size={20} class="text-red-400" />
        </div>
        <div class="min-w-0">
          <h3 class="text-base font-bold text-zinc-100">Delete Transaction?</h3>
          <p class="mt-1 text-sm text-zinc-400">
            Are you sure you want to delete
            <span class="font-medium text-zinc-200">{transactionToDelete.description}</span>? This action can't be
            undone.
          </p>
        </div>
      </div>

      <div class="flex justify-end gap-2 pt-5">
        <button
          type="button"
          onclick={closeDeleteModal}
          class="px-3 py-1.5 text-sm font-medium text-zinc-300 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onclick={confirmDelete}
          class="px-4 py-1.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg active:scale-[0.98] transition-all cursor-pointer"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
{/if}