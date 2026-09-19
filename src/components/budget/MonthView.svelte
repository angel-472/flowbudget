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
  import WeekCard from './WeekCard.svelte';
  import { onMount, tick } from 'svelte';
  import { recurringApi } from '/src/api/recurringApi.svelte';
  import { router } from '/src/api/router.svelte.js';
  import MonthPicker from './MonthPicker.svelte';
  import { openNewTransaction } from './TransactionForm.svelte';

  // The selected month lives in the URL, so it survives tab switches and
  // reloads and can be linked to.
  let currentMonth = $derived(router.month);
  let currentYear = $derived(router.year);

  let isPickerOpen = $state(false);
  
  let monthName = $derived(new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' }));
  let isCurrentMonth = $derived(currentMonth === new Date().getMonth() && currentYear === new Date().getFullYear());
  
  function selectPrevMonth() {
    const month = currentMonth === 0 ? 11 : currentMonth - 1;
    const year = currentMonth === 0 ? currentYear - 1 : currentYear;
    router.go('month', { month, year, replace: true });
  }

  function selectNextMonth() {
    const month = currentMonth === 11 ? 0 : currentMonth + 1;
    const year = currentMonth === 11 ? currentYear + 1 : currentYear;
    router.go('month', { month, year, replace: true });
  }

  let weeksInMonth = $derived(dateUtils.getWeeksInMonth(currentYear, currentMonth + 1, budgetApi.weekStartDay));
  
  let monthlySummary = $derived.by(() => {
    let allTransactions = budgetApi.getAllTransactions();
    let monthTransactions = allTransactions.filter(t => {
      let transactionDate = dateUtils.createLocalDate(t.date);
      return transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear;
    });

    //TODO: TO COUNT RECURRING TOWARDS TOTAL EXPENSES: FOR EACH WEEK IN MONTH GET ALL OCURRENCES, FILTER EXCLUDED DATES, PUSH MOCK TRANSACTION INTO MONTH TRANSACTIONS ARRAY
    
    let totalIncome = monthTransactions
      .filter(t => t.type === 'incomes')
      .reduce((sum, t) => sum + t.amount, 0);
    let totalExpenses = monthTransactions
      .filter(t => t.type === 'expenses')
      .reduce((sum, t) => sum + t.amount, 0);

    // Add Recurring Expenses
    let totalFromRecurring = 0;
    for(const weekNumber of weeksInMonth){
      const recurringExpenses = recurringApi.findExpensesInWeek(currentYear, weekNumber);
      for(const ocurrence of recurringExpenses){
        if(ocurrence.date.getMonth() !== currentMonth) continue;
        totalFromRecurring += ocurrence.expense.amount;
      }
    }

    totalExpenses += totalFromRecurring;
      
    return {
      income: totalIncome,
      expenses: totalExpenses,
      net: totalIncome - totalExpenses,
      transactionCount: monthTransactions.length
    };
  });

  function scrollTo(id, offset = 100, smooth = true) {
    const element = document.getElementById(id);
    if (!element) return;
    var elementPosition = element.getBoundingClientRect().top;
    var offsetPosition = elementPosition + window.pageYOffset - offset;
    window.scrollTo({ top: offsetPosition, behavior: smooth ? "smooth" : "auto" });
  }

  async function scrollToDate(dateStr, smooth) {
    const target = dateUtils.createLocalDate(dateStr);
    await tick();
    scrollTo(`week-view-${dateUtils.getWeekNumber(target, budgetApi.weekStartDay)}`, 80, smooth);
  }

  // A route carrying ?d=YYYY-MM-DD (a search result, say) asks us to scroll to
  // that week. This runs whenever the route changes, so it works no matter
  // which tab the navigation came from.
  $effect(() => {
    if (!router.pendingDate) return;
    scrollToDate(router.consumePendingDate(), true);
  });

  onMount(() => {
    if (!hasScrolledToCurrentWeek) {
      hasScrolledToCurrentWeek = true;
      // Don't fight a pending deep link for control of the scroll position.
      if (!router.pendingDate) {
        const today = new Date().toLocaleDateString('en-CA');
        setTimeout(() => scrollToDate(today, false), 50);
      }
    }
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
    <button
      type="button"
      class="text-center rounded-lg px-3 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
      onclick={() => isPickerOpen = true}
      title="Jump to month"
    >
      <h2 class="text-2xl font-bold tracking-tight {isCurrentMonth ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-900 dark:text-zinc-100'}">
        {monthName} {currentYear}
      </h2>
      <p class="text-xs text-zinc-400 dark:text-zinc-400 mt-0.5">
        {monthlySummary.transactionCount} transaction{monthlySummary.transactionCount !== 1 ? 's' : ''}
      </p>
    </button>
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
      <p class="text-xs text-zinc-400 dark:text-zinc-400 mb-0.5">Income</p>
      <p class="text-md font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(monthlySummary.income)}</p>
    </div>
    <div class="bg-white dark:bg-zinc-900 px-4 py-3 text-center">
      <p class="text-xs text-zinc-400 dark:text-zinc-400 mb-0.5">Expenses</p>
      <p class="text-md font-semibold text-red-600 dark:text-red-400">{formatCurrency(monthlySummary.expenses)}</p>
    </div>
    <div class="bg-white dark:bg-zinc-900 px-4 py-3 text-center">
      <p class="text-xs text-zinc-400 dark:text-zinc-400 mb-0.5">Net</p>
      <p class="text-md font-semibold {monthlySummary.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}">
        {formatCurrency(monthlySummary.net)}
      </p>
    </div>
  </div>
  
  <!-- Week cards -->
  <div class="flex flex-col gap-4">
    <!-- Keyed by month and year too: week numbers repeat every year, and
         WeekCard reads its props once, so a reused card would keep showing
         the previous month's data. -->
    {#each weeksInMonth as weekNumber (`${currentYear}-${currentMonth}-${weekNumber}`)}
      <WeekCard {weekNumber} {currentMonth} {currentYear}/>
    {/each}
  </div>
</div>

<!-- Add transaction (desktop; on mobile it lives in the nav bar) -->
<button
  class="hidden sm:flex fixed bottom-6 right-6 z-30 items-center justify-center p-3 rounded-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white shadow-md active:scale-95 transition-all cursor-pointer"
  title="Add Transaction"
  aria-label="Add Transaction"
  onclick={openNewTransaction}
>
  <Plus size={20} />
</button>

<MonthPicker bind:open={isPickerOpen} month={currentMonth} year={currentYear} />
