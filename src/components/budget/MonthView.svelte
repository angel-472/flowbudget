<script module>
  // Survives remounts, so returning to the month tab doesn't yank the page
  // back to the current week.
  let hasScrolledToCurrentWeek = false;
</script>

<script>
  import { ChevronLeft, ChevronRight, Plus } from 'lucide-svelte';
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

  let weeksInMonth = $derived(dateUtils.getWeeksInMonth(currentYear, currentMonth + 1, budgetApi.weekStartDay));
  
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

  function handleAddTransaction() {
    signal.emit("OPEN_TRANSACTION_FORM", {
      transaction: {
        id: null,
        type: 'expenses',
        date: new Date().toLocaleDateString('en-CA'),
        description: '',
        amount: '',
        category: '',
        status: 'pending'
      }
    });
  }

  function scrollTo(id, offset = 100, smooth = true) {
    const element = document.getElementById(id);
    var elementPosition = element.getBoundingClientRect().top;
    var offsetPosition = elementPosition + window.pageYOffset - offset;
    window.scrollTo({ top: offsetPosition, behavior: smooth ? "smooth" : "auto" });
  }

  onMount(() => {
    if (!hasScrolledToCurrentWeek) {
      hasScrolledToCurrentWeek = true;
      let weekNumber = dateUtils.getWeekNumber(dateUtils.createLocalDate(new Date().toISOString().split('T')[0]));
      setTimeout(() => scrollTo(`week-view-${weekNumber}`, 80, false), 10);
      
    }

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
      class="p-2 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
      title="Previous Month"
    >
      <ChevronLeft size={20} />
    </button>
    <div class="text-center">
      <h2 class="text-2xl font-bold tracking-tight {isCurrentMonth ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-900 dark:text-zinc-100'}">
        {monthName} {currentYear}
      </h2>
      <p class="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
        {monthlySummary.transactionCount} transaction{monthlySummary.transactionCount !== 1 ? 's' : ''}
      </p>
    </div>
    <button
      onclick={selectNextMonth}
      class="p-2 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
      title="Next Month"
    >
      <ChevronRight size={20} />
    </button>
  </div>

  <!-- Monthly summary bar -->
  <div class="grid grid-cols-3 gap-px bg-zinc-200 dark:bg-zinc-800 rounded-xl overflow-hidden mb-8 border border-zinc-200 dark:border-zinc-800">
    <div class="bg-white dark:bg-zinc-900 px-4 py-3 text-center">
      <p class="text-xs text-zinc-400 dark:text-zinc-500 mb-0.5">Income</p>
      <p class="text-md font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(monthlySummary.income)}</p>
    </div>
    <div class="bg-white dark:bg-zinc-900 px-4 py-3 text-center">
      <p class="text-xs text-zinc-400 dark:text-zinc-500 mb-0.5">Expenses</p>
      <p class="text-md font-semibold text-red-600 dark:text-red-400">{formatCurrency(monthlySummary.expenses)}</p>
    </div>
    <div class="bg-white dark:bg-zinc-900 px-4 py-3 text-center">
      <p class="text-xs text-zinc-400 dark:text-zinc-500 mb-0.5">Net</p>
      <p class="text-md font-semibold {monthlySummary.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}">
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

<!-- Add transaction -->
<button
  class="fixed bottom-6 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-6 z-30 flex items-center justify-center px-10 py-3 sm:p-3 rounded-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white shadow-md active:scale-95 transition-all cursor-pointer"
  title="Add Transaction"
  aria-label="Add Transaction"
  onclick={handleAddTransaction}
>
  <Plus size={20} />
</button>