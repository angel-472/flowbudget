<script>
  import { dateUtils } from '/src/api/dateUtils.js';
  import { budgetApi } from '/src/api/budgetApi.svelte.js';
  import { Plus } from 'lucide-svelte';
  import { formatCurrency } from '/src/api/utils.js';
  import { signal } from '/src/api/signal.js';
  import { onDestroy, onMount } from 'svelte';
  import TransactionList from './TransactionList.svelte'

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  let props = $props();
  let weekNumber = props.weekNumber ?? 1;
  let currentMonth = props.currentMonth ?? 1;
  let currentYear = props.currentYear ?? 2023;

  let dateRange = dateUtils.getWeekDateRange(currentYear, weekNumber, budgetApi.weekStartDay);

  function openAddItemModal() {
    signal.emit("OPEN_TRANSACTION_FORM", {
      transaction: {
        id: null,
        type: 'expenses',
        date: dateRange[0].toISOString().split('T')[0],
        description: '',
        amount: '',
        category: '',
        status: 'pending'
      }
    });
  }

  let incomes = $state(budgetApi.getTransactionsForWeek(currentYear, weekNumber, 'incomes'));
  let expenses = $state(budgetApi.getTransactionsForWeek(currentYear, weekNumber, 'expenses'));
  let weeklyNet = $derived(incomes.reduce((sum, t) => sum + t.amount, 0) - expenses.reduce((sum, t) => sum + t.amount, 0));

  function updateTransactionData() {
    incomes = budgetApi.getTransactionsForWeek(currentYear, weekNumber, 'incomes');
    expenses = budgetApi.getTransactionsForWeek(currentYear, weekNumber, 'expenses');
    weeklyNet = incomes.reduce((sum, t) => sum + t.amount, 0) - expenses.reduce((sum, t) => sum + t.amount, 0);
  }

  let signalSubId = `W${weekNumber}_${currentMonth}_${currentYear}`;
  onMount(() => {
    signal.sub("TRANSACTIONS_FETCH_ALL", signalSubId, (data) => {
      updateTransactionData();
    });
    signal.sub("UPDATE_TRANSACTION", signalSubId, (data) => {
      updateTransactionData();
      // Update all week cards to prevent duplicates
    });
  });

  onDestroy(() => {
    signal.unsubAll(signalSubId);
  });

  let isCurrentWeek = $derived.by(() => {
    let today = dateUtils.createLocalDate(new Date().toISOString().split('T')[0]);
    let currentWeekNum = dateUtils.getWeekNumber(today);
    let currentYearNum = today.getFullYear();
    return weekNumber === currentWeekNum && currentYear === currentYearNum;
  }); 
</script>

<article
  class="border rounded-2xl {isCurrentWeek ? 'border-indigo-300 dark:border-indigo-800 bg-indigo-50/30 dark:bg-indigo-950/20' : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'}"
  id="week-view-{weekNumber}"
>
  <!-- Header -->
  <div class="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
    <div class="flex items-baseline gap-2">
      <h2 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        {dayNames[dateRange[0].getDay()]}, {dateRange[0].toLocaleString('default', { month: 'short' })} {dateRange[0].getDate()} – {dayNames[dateRange[6].getDay()]}, {dateRange[6].toLocaleString('default', { month: 'short' })} {dateRange[6].getDate()}
      </h2>
      <span class="text-xs text-zinc-400 dark:text-zinc-500">W{weekNumber}</span>
      {#if isCurrentWeek}
        <span class="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/50 px-1.5 py-0.5 rounded">now</span>
      {/if}
    </div>
    <button
      class="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-300 rounded-md border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
      aria-label="Add new item for this week"
      title="Add Transaction"
      onclick={openAddItemModal}
    >
      <Plus size={14} />
      <span>Add</span>
    </button>
  </div>

  <!-- Content -->
  <div class="px-4 py-3">
    <div class="flex flex-col gap-4">
      <TransactionList type="incomes" transactions={incomes} />
      <TransactionList type="expenses" transactions={expenses} />
    </div>
  </div>

  <!-- Footer -->
  <div class="flex items-center justify-between px-4 py-2.5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-b-lg">
    <span class="text-xs font-medium text-zinc-500 dark:text-zinc-400">Weekly net</span>
    <span class="text-sm font-semibold {weeklyNet < 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}">
      {formatCurrency(weeklyNet)}
    </span>
  </div>
</article>