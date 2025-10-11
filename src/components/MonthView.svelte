<script>
  import { ChevronLeft, ChevronRight } from 'lucide-svelte';
  import { budgetApi } from '/src/api/budgetApi.js';
  
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
</script>

<div class="flex-1 p-4 sm:p-6 lg:p-8">
      <header class="flex justify-between items-center mb-8 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md sticky top-0 z-10 border border-gray-100 dark:border-gray-700/50">
        <div class="flex items-center space-x-4 justify-center w-full">
          <button
            onclick={selectPrevMonth}
            class="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            title="Previous Month"
          >
            <ChevronLeft size={24} />
          </button>
          <h2 class="text-3xl font-extrabold transition duration-0 w-70 text-center {currentMonth == new Date().getMonth() && currentYear == new Date().getFullYear() ? 'bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent' : 'text-gray-900 dark:text-white'}">
            {monthName} {currentYear}
          </h2>
          <button
            onclick={selectNextMonth}
            class="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            title="Next Month"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </header>
</div>