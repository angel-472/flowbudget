<script>
  import { dateUtils } from '/src/api/dateUtils.js';
  import { budgetApi } from '/src/api/budgetApi.js';
  import { Plus } from 'lucide-svelte';
  import { formatCurrency } from '/src/api/utils.js';
  import TransactionList from './TransactionList.svelte';
  import { signal } from '/src/api/signal.js';
  
  let props = $props();
  let weekNumber = props.weekNumber ?? 1;
  let currentMonth = props.currentMonth ?? 1;
  let currentYear = props.currentYear ?? 2023;

  let cardStyles = "bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md dark:shadow-lg dark:shadow-black/20 border border-gray-100 dark:border-gray-700/50";
  let dateRange = dateUtils.getWeekDateRange(currentYear, weekNumber);

  function openAddItemModal() {
    // Placeholder function for opening a modal to add a new item
    console.log(`Open modal to add new item for Week ${weekNumber}`);
  }

  let incomes = $state(budgetApi.getTransactionsForWeek(currentYear, weekNumber, 'incomes'));
  let expenses = $state(budgetApi.getTransactionsForWeek(currentYear, weekNumber, 'expenses'));
  let weeklyNet = $derived(incomes.reduce((sum, t) => sum + t.amount, 0) - expenses.reduce((sum, t) => sum + t.amount, 0));

  signal.sub("TRANSACTIONS_FETCH_ALL", `W${weekNumber}_${currentMonth}_${currentYear}`, (data) => {
    incomes = budgetApi.getTransactionsForWeek(currentYear, weekNumber, 'incomes');
    expenses = budgetApi.getTransactionsForWeek(currentYear, weekNumber, 'expenses');
  });
</script>

<article class="flex flex-1 flex-col {cardStyles}">
  <header class="flex items-center justify-between w-full pb-3 mb-4 border-b border-gray-200 dark:border-gray-700">
    <div>
      <h2 class="font-extrabold">{dateRange[0].toLocaleString('default', { month: 'short' })} {dateRange[0].getDate()} – {dateRange[6].toLocaleString('default', { month: 'short' })} {dateRange[6].getDate()}</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400">W{weekNumber}</p>
    </div>
    <button
      class="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-white rounded-xl shadow-md transition-all duration-300
      bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 hover:brightness-110 cursor-pointer"
      aria-label="Add new item for this week"
      style="background-clip: padding-box;"
      title="Add Transaction"
      onclick={openAddItemModal}
    >
      <Plus size={18}/>
      <span class="hidden sm:inline">Add</span>
    </button>
  </header>
  <div class="flex flex-col lg:flex-row gap-6 pb-4 mb-4 border-b border-gray-200 dark:border-gray-700">
    <TransactionList type="incomes" transactions={incomes} />
    <TransactionList type="expenses" transactions={expenses} />
  </div>
  <footer class="flex gap-2 text-sm justify-between">
    <h3 class="font-semibold">Weekly Total:</h3>
    <p class="font-bold {weeklyNet < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}">{formatCurrency(weeklyNet)}</p>
  </footer>
</article>