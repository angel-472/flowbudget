<script>
  import { ChevronLeft, ChevronRight } from 'lucide-svelte';
  import { budgetApi } from '/src/api/budgetApi.svelte.js';
  import { dateUtils } from '/src/api/dateUtils.js';
  import { formatCurrency } from '/src/api/utils.js';
  import { signal } from '/src/api/signal.js';
  import WeekCard from './WeekCard.svelte';
  import { onMount, tick } from 'svelte';
  
  let currentMonth = $state(new Date().getMonth());
  let currentYear = $state(new Date().getFullYear());
  
  let monthName = $derived(new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' }));
  let isCurrentMonth = $derived(currentMonth === new Date().getMonth() && currentYear === new Date().getFullYear());
  
  function selectPrevMonth() {  
    if (currentMonth === 0) { currentMonth = 11; currentYear--; }
    else currentMonth--;
  }
  
  function selectNextMonth() {
    if (currentMonth === 11) { currentMonth = 0; currentYear++; }
    else currentMonth++;
  }

  let weeksInMonth = $derived(dateUtils.getWeeksInMonth(currentYear, currentMonth + 1));
  
  let monthlySummary = $derived.by(() => {
    let allTransactions = budgetApi.getAllTransactions();
    let monthTransactions = allTransactions.filter(t => {
      let transactionDate = dateUtils.createLocalDate(t.date);
      return transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear;
    });
    
    let totalIncome = monthTransactions
      .filter(t => t.type === 'incomes')
      .reduce((sum, t) => sum + t.amount, 0);
    let totalExpenses = monthTransactions
      .filter(t => t.type === 'expenses')
      .reduce((sum, t) => sum + t.amount, 0);
      
    return {
      income: totalIncome,
      expenses: totalExpenses,
      net: totalIncome - totalExpenses,
      transactionCount: monthTransactions.length
    };
  });

  function scrollTo(id, offset = 100, smooth = true) {
    const element = document.getElementById(id);
    var elementPosition = element.getBoundingClientRect().top;
    var offsetPosition = elementPosition + window.pageYOffset - offset;
    window.scrollTo({ top: offsetPosition, behavior: smooth ? "smooth" : "auto" });
  }

  onMount(() => {
    let weekNumber = dateUtils.getWeekNumber(dateUtils.createLocalDate(new Date().toISOString().split('T')[0]));
    scrollTo(`week-view-${weekNumber}`, 80, false);

    signal.sub('NAVIGATE_TO_DATE', 'month-view', async ({ date }) => {
      const target = dateUtils.createLocalDate(date);
      currentMonth = target.getMonth();
      currentYear = target.getFullYear();
      await tick();
      scrollTo(`week-view-${dateUtils.getWeekNumber(target)}`, 80, true);
    });

    return () => signal.unsub('NAVIGATE_TO_DATE', 'month-view');
  });
</script>

<div class="px-4 sm:px-6 py-6">
  <!-- Month navigation -->
  <div class="flex items-center justify-between mb-6">
    <button
      onclick={selectPrevMonth}
      class="p-2 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
      title="Previous Month"
    >
      <ChevronLeft size={20} />
    </button>
    <div class="text-center">
      <h2 class="text-xl font-semibold tracking-tight {isCurrentMonth ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-gray-100'}">
        {monthName} {currentYear}
      </h2>
      <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
        {monthlySummary.transactionCount} transaction{monthlySummary.transactionCount !== 1 ? 's' : ''}
      </p>
    </div>
    <button
      onclick={selectNextMonth}
      class="p-2 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
      title="Next Month"
    >
      <ChevronRight size={20} />
    </button>
  </div>

  <!-- Monthly summary bar -->
  <div class="grid grid-cols-3 gap-px bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden mb-8 border border-gray-200 dark:border-gray-800">
    <div class="bg-white dark:bg-gray-900 px-4 py-3 text-center">
      <p class="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Income</p>
      <p class="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(monthlySummary.income)}</p>
    </div>
    <div class="bg-white dark:bg-gray-900 px-4 py-3 text-center">
      <p class="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Expenses</p>
      <p class="text-sm font-semibold text-red-600 dark:text-red-400">{formatCurrency(monthlySummary.expenses)}</p>
    </div>
    <div class="bg-white dark:bg-gray-900 px-4 py-3 text-center">
      <p class="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Net</p>
      <p class="text-sm font-semibold {monthlySummary.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}">
        {formatCurrency(monthlySummary.net)}
      </p>
    </div>
  </div>
  
  <!-- Week cards -->
  <div class="flex flex-col gap-4">
    {#each weeksInMonth as weekNumber (weekNumber)}
      <WeekCard {weekNumber} {currentMonth} {currentYear}/>
    {/each}
  </div>
</div>