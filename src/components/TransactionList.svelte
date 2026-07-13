<script>
  import { Check, Square, Trash2, Pencil } from 'lucide-svelte';
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
  <div class="flex flex-1 items-center justify-center py-4 w-full md:w-1/2">
    <p class="text-xs text-gray-400 dark:text-gray-500">No {isIncome ? 'income' : 'expenses'} yet</p>
  </div>
{:else}
  <div class="w-full">
    <div class="flex items-baseline justify-between mb-2">
      <h4 class="text-xs font-semibold uppercase tracking-wider {isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}">
        {isIncome ? 'Income' : 'Expenses'}
      </h4>
      <span class="text-xs text-gray-400 dark:text-gray-500">
        {formatCurrency(transactions.reduce((sum, t) => sum + t.amount, 0))}
      </span>
    </div>
    <div class="flex flex-col overflow-y-auto">
      {#each transactions.toSorted((a, b) => new Date(a.date) - new Date(b.date)) as t (t.id)}
        <div class="group flex items-center gap-3 py-2 px-1 border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded transition-colors">
          <!-- Status toggle -->
          <button
            class="shrink-0 p-0.5 rounded {t.status === 'done' ? 'text-gray-400 dark:text-gray-500' : 'text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400'} transition-colors cursor-pointer"
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
            <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {t.description}
            </p>
            <p class="text-xs text-gray-400 dark:text-gray-500">
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
              class="p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer"
              onclick={() => handleEditTransaction(t.id)}
              title="Edit"
            >
              <Pencil size={14} />
            </button>
            <button
              class="p-1 rounded text-gray-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
              onclick={() => handleDeleteTransaction(t.id)}
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      {/each}
    </div>
  </div>
{/if}

<!-- Delete confirmation -->
{#if showDeleteModal && transactionToDelete}
  <div class="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 p-4">
    <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 max-w-sm w-full">
      <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">Delete transaction</h3>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-5">
        Delete "<span class="font-medium text-gray-700 dark:text-gray-300">{transactionToDelete.description}</span>"? This can't be undone.
      </p>
      <div class="flex justify-end gap-2">
        <button
          onclick={closeDeleteModal}
          class="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          onclick={confirmDelete}
          class="px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors cursor-pointer"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
{/if}