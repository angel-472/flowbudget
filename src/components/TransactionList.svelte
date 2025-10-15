<script>
  import { Check, Square, Trash2 } from 'lucide-svelte';
  import { formatDate, formatCurrency } from '/src/api/utils';
  import { dateUtils } from '/src/api/dateUtils';
  
  let { type, transactions } = $props();
  const isIncome = type === 'incomes';
  const colorClass = isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  const bgColorClass = isIncome ? 'bg-green-50 dark:bg-green-900/30' : 'bg-red-50 dark:bg-red-900/30';
</script>

{#if transactions.length === 0}
  <div class="flex flex-1 text-sm items-center justify-center p-6 py-3 {bgColorClass} rounded-xl border border-gray-200 dark:border-gray-700/50 gap-2">
    <!-- <span>{isIncome ? '💸' : '🛒'}</span> -->
    <p class="{colorClass} text-center">No {isIncome ? 'incomes' : 'expenses'} recorded yet.</p>
  </div>
{:else}
  <div class="w-full overflow-x-clip">
    <!-- Todo: Open edit / delete modal when you tap a transaction -->
    <h4 class="text-lg font-semibold mb-2 {colorClass}">{isIncome ? 'Incomes' : 'Expenses'}</h4>
    <div class="flex flex-col max-h-94 overflow-y-auto cursor-pointer">
      {#each transactions as t (t.id)}
        
        <div class="flex flex-col rounded-md p-2 border-b-1 border-gray-100 dark:border-gray-700/50 dark:hover:bg-gray-700/50 hover:bg-gray-200/50 transition-all duration-150 ease-in-out">
          <div class="flex justify-between">
            <div class="flex gap-2 items-start">
                <p class="font-bold wrap-break-word max-w-53 sm:max-w-none">{t.description}</p>
                <button
                class="p-1 rounded-md {t.status === 'done' ? 'text-gray-800 bg-gray-200 dark:text-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600' : 'text-gray-400 hover:text-gray-800 hover:bg-white dark:hover:text-gray-200 dark:hover:bg-gray-800'} transition"
                title={t.status === 'done' ? 'Mark as Pending' : 'Mark as Done'}
                >
                {#if t.status === 'done'}
                  <Check size={14} />
                {:else}
                  <Square size={14} />
                {/if}
              </button>
            </div>
            <p class="text-sm font-semibold text-right {colorClass}">
                {formatCurrency(t.amount)}
            </p>
          </div>
          <div class="flex justify-between text-gray-500 dark:text-gray-400 text-sm">
            <p>{t.category !== undefined && t.category !== "" ? t.category : "No Category"}</p>
            <p>{dateUtils.createLocalDate(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
          </div>
        </div>
      {/each}
    </div>
  </div>
{/if}