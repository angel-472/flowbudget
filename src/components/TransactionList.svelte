<script>
  import { Check, Square, Trash, FilePenLine } from 'lucide-svelte';
  import { formatDate, formatCurrency } from '/src/api/utils';
  import { dateUtils } from '/src/api/dateUtils';
  import { budgetApi } from '/src/api/budgetApi';
  import { signal } from '/src/api/signal.js';
  
  let { type, transactions } = $props();
  const isIncome = type === 'incomes';
  const colorClass = isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  const bgColorClass = isIncome ? 'bg-green-50 dark:bg-green-900/30' : 'bg-red-50 dark:bg-red-900/30';

  async function handleToggleStatus(id) {
    // Create a new array with the updated transaction status
    transactions = transactions.map(t => 
      t.id === id 
        ? { ...t, status: t.status === 'done' ? 'pending' : 'done' }
        : t
    );
    budgetApi.toggleTransactionStatus(id);
  }
  function handleEditTransaction(id) {
    const transaction = transactions.find(t => t.id === id);
    if(transaction){
      // Emit signal to open transaction form with the selected transaction data
      signal.emit("OPEN_TRANSACTION_FORM", { transaction });
    }
  }
</script>

{#if transactions.length === 0}
  <div class="flex flex-1 text-sm items-center justify-center p-6 py-3 {bgColorClass} rounded-xl border border-gray-200 dark:border-gray-700/50 gap-2 h-12 w-full md:w-1/2">
    <!-- <span>{isIncome ? '💸' : '🛒'}</span> -->
    <p class="{colorClass} text-center">No {isIncome ? 'incomes' : 'expenses'} recorded yet.</p>
  </div>
{:else}
  <div class="w-full md:w-1/2 overflow-x-clip">
    <!-- Todo: Open edit / delete modal when you tap a transaction -->
    <h4 class="text-lg font-semibold mb-2 {colorClass}">{isIncome ? 'Incomes' : 'Expenses'}</h4>
    <div class="flex flex-col max-h-94 overflow-y-auto">
      {#each transactions.toSorted((a, b) => new Date(a.date) - new Date(b.date)) as t (t.id)}
        <div class="flex flex-row gap-4 justify-between rounded-md p-2 border-b-1 border-gray-100 dark:border-gray-700/50 dark:hover:bg-gray-700/50 hover:bg-gray-200/50 transition-all duration-150 ease-in-out">
          <!-- Left side: Description + Category -->
          <div class="flex flex-col flex-1 justify-between">
            <div class="flex gap-2 items-start">
                <p class="font-bold wrap-break-word max-w-53 sm:max-w-none">{t.description}</p>
                <button
                class="p-1 rounded-md {t.status === 'done' ? 'text-gray-800 bg-gray-200 dark:text-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600' : 'text-gray-400 hover:text-gray-800 hover:bg-white dark:hover:text-gray-200 dark:hover:bg-gray-800'} transition"
                title={t.status === 'done' ? 'Mark as Pending' : 'Mark as Done'}
                onclick={() => handleToggleStatus(t.id)}
                >
                {#if t.status === 'done'}
                  <Check size={14} />
                {:else}
                  <Square size={14} />
                {/if}
              </button>
            </div>
            <p class="text-gray-500 dark:text-gray-400 text-sm">{t.category !== undefined && t.category !== "" ? t.category : "No Category"}</p>
          </div>
          
          <!-- Right side: Amount + Date -->
          <div class="flex flex-col items-end justify-between">
            <p class="text-sm font-semibold {colorClass}">
                {formatCurrency(t.amount)}
            </p>
            <p class="text-gray-500 dark:text-gray-400 text-sm">{dateUtils.createLocalDate(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
          </div>

          <!-- Edit Button -->
          <div class="flex flex-col gap-2 justify-center text-gray-500 dark:text-gray-400 ">
             <button class="hover:text-gray-800 dark:hover:text-gray-200 cursor-pointer"
             onclick={() => { handleEditTransaction(t.id); }}
             >
              <FilePenLine size={18} />
            </button>
            <button class="hover:text-gray-800 dark:hover:text-gray-200 cursor-pointer"
            onclick={() => {/* TODO: Open delete modal */}}
            >
              <Trash size={18} />
            </button>
          </div>
        </div>
      {/each}
    </div>
  </div>
{/if}