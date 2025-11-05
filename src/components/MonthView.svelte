<script>
  import { ChevronLeft, ChevronRight } from 'lucide-svelte';
  import { budgetApi } from '/src/api/budgetApi.svelte.js';
  import { dateUtils } from '/src/api/dateUtils.js';
  import { formatCurrency } from '/src/api/utils.js';
  import WeekCard from './WeekCard.svelte';
  
  // Mock state variables
  let currentMonth = $state(new Date().getMonth());
  let currentYear = $state(new Date().getFullYear());
  
  // Compute month name
  let monthName = $derived(new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' }));
  
  // Month navigation functions
  function selectPrevMonth() {  
    if (currentMonth === 0) {
      currentMonth = 11;
      currentYear--;
    } else {
      currentMonth--;
    }
  }
  
  function selectNextMonth() {
    if (currentMonth === 11) {
      currentMonth = 0;
      currentYear++;
    } else {
      currentMonth++;
    }
  }

  // Add 1 to currentMonth when passing to getWeeksInMonth since it expects 1-12 instead of 0-11)
  let weeksInMonth = $derived(dateUtils.getWeeksInMonth(currentYear, currentMonth + 1));
  
  // Calculate monthly summary
  let monthlySummary = $derived.by(() => {
    let allTransactions = budgetApi.getAllTransactions();
    
    // Filter transactions for current month
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
      
    let net = totalIncome - totalExpenses;
    
    return {
      income: totalIncome,
      expenses: totalExpenses,
      net: net,
      transactionCount: monthTransactions.length
    };
  });
</script>

<div class="flex-1 p-4 sm:p-6 lg:p-8">
  <!-- Month Selector -->
  <header class="flex justify-between items-center mb-8 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md dark:shadow-lg dark:shadow-black/20 top-0 z-10 border border-gray-100 dark:border-gray-700/50">
    <div class="flex items-center space-x-4 justify-center w-full">
      <button
        onclick={selectPrevMonth}
        class="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer"
        title="Previous Month"
      >
        <ChevronLeft size={24} />
      </button>
      <h2 class="text-3xl font-extrabold transition duration-0 w-70 text-center {currentMonth == new Date().getMonth() && currentYear == new Date().getFullYear() ? 'bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent' : 'text-gray-900 dark:text-white'}">
        {monthName} {currentYear}
      </h2>
      <button
        onclick={selectNextMonth}
        class="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer"
        title="Next Month"
      >
        <ChevronRight size={24} />
      </button>
    </div>
  </header>
  
  <!-- Week Cards -->
  <div class="flex flex-col gap-8">
    {#each weeksInMonth as weekNumber (weekNumber)}
      <WeekCard {weekNumber} {currentMonth} {currentYear}/>
    {/each}
  </div>

  <!-- Monthly Summary -->
  <div class="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-lg dark:shadow-black/20 border border-gray-100 dark:border-gray-700/50 overflow-hidden">
    <div class="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-700 dark:to-purple-700">
      <h3 class="text-xl font-bold text-white">Monthly Summary</h3>
      <p class="text-sm text-indigo-100 dark:text-indigo-200">{monthlySummary.transactionCount} transactions</p>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
      <!-- Total Income -->
      <div class="bg-green-50 dark:bg-green-900/30 rounded-lg p-4 border border-green-200 dark:border-green-700/50">
        <p class="text-sm font-medium text-green-600 dark:text-green-400 mb-1">Total Income</p>
        <p class="text-2xl font-bold text-green-700 dark:text-green-300">{formatCurrency(monthlySummary.income)}</p>
      </div>
      
      <!-- Total Expenses -->
      <div class="bg-red-50 dark:bg-red-900/30 rounded-lg p-4 border border-red-200 dark:border-red-700/50">
        <p class="text-sm font-medium text-red-600 dark:text-red-400 mb-1">Total Expenses</p>
        <p class="text-2xl font-bold text-red-700 dark:text-red-300">{formatCurrency(monthlySummary.expenses)}</p>
      </div>
      
      <!-- Net -->
      <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600/50">
        <p class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Net</p>
        <p class="text-2xl font-bold {monthlySummary.net >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}">
          {formatCurrency(monthlySummary.net)}
        </p>
      </div>
    </div>
  </div>
</div>