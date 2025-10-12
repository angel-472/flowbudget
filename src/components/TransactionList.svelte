<script>
  import { Check, Circle, Trash2 } from 'lucide-svelte';
  import { formatDate, formatCurrency } from '/src/api/utils';
  import { dateUtils } from '/src/api/dateUtils';
  
  let { type, transactions } = $props();
  const isIncome = type === 'incomes';
  const colorClass = isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  const bgColorClass = isIncome ? 'bg-green-50 dark:bg-green-900/30' : 'bg-red-50 dark:bg-red-900/30';
</script>

{#if transactions.length === 0}
  <div class="flex flex-1 text-sm items-center justify-center p-6 py-3 {bgColorClass} rounded-xl border border-gray-200 dark:border-gray-700/50 gap-2">
    <span>{isIncome ? '💸' : '🛒'}</span>
    <p class="{colorClass} text-center">No {isIncome ? 'incomes' : 'expenses'} recorded yet.</p>
  </div>
{:else}
  <div class="w-full">
    <h4 class="text-lg font-semibold mb-2 {colorClass}">{isIncome ? 'Incomes' : 'Expenses'}</h4>
    <div class="overflow-x-auto shadow-md rounded-xl">
      <table class="min-w-full bg-white dark:bg-gray-800 rounded-xl overflow-x-auto">
        <thead class="bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700">
          <tr>
            <th class="py-2 px-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/5">Date</th>
            <th class="py-2 px-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-2/5">Description</th>
            <th class="py-2 px-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/5">Amount</th>
            <th class="py-2 px-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/5"></th>
          </tr>
        </thead>
        <tbody>
          <!-- TODO: Add sorting functionality - removed .sort((a, b) => createLocalDate(a.date) - createLocalDate(b.date)) -->
          {#each transactions as t (t.id)}
            <tr class="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-150 ease-in-out">
              <td class="py-2 px-3 text-sm text-gray-700 dark:text-gray-300 font-medium">
                <div class="flex items-center gap-2">
                  <!-- TODO: Add date formatting - removed formatDate(t.date) function call -->
                  {dateUtils.createLocalDate(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </td>
              <td class="py-2 px-3 text-sm text-gray-700 dark:text-gray-300 truncate md:max-w-2xs">
                {t.description}
                {#if t.category}
                  <span class="ml-2 inline-block px-2 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">({t.category})</span>
                {/if}
              </td>
              <td class="py-2 px-3 text-sm font-semibold text-right {colorClass}">
                {formatCurrency(t.amount)}
              </td>
              <td class="py-2 px-3 text-center">
                <div class="flex items-center justify-center space-x-2">
                  <!-- TODO: Add toggle status functionality - removed onToggleStatus(t.id) function call -->
                  <button
                    class="p-1 rounded-full {t.status === 'done' ? 'text-indigo-500 bg-indigo-100 dark:bg-indigo-900/50' : 'text-gray-400 hover:text-indigo-500 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/50'} transition"
                    title={t.status === 'done' ? 'Mark as Pending' : 'Mark as Done'}
                  >
                    {#if t.status === 'done'}
                      <Check size={16} />
                    {:else}
                      <Circle size={16} />
                    {/if}
                  </button>
                  <!-- TODO: Add remove functionality - removed onRemove(t.id) function call -->
                  <button
                    class="p-1 rounded-full text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-100/50 dark:hover:bg-red-900/50 transition"
                    title="Delete Transaction"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
{/if}