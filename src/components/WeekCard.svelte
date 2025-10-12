<script>
  import { dateUtils } from '../api/dateUtils.js';
  import { Plus } from 'lucide-svelte';
  
  let props = $props();
  let weekNumber = props.weekNumber ?? 1;
  let currentMonth = props.currentMonth ?? 1;
  let currentYear = props.currentYear ?? 2023;

  let cardStyles = "bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md dark:shadow-lg dark:shadow-black/20 sticky top-0 z-10 border border-gray-100 dark:border-gray-700/50";
  let dateRange = dateUtils.getWeekDateRange(currentYear, weekNumber);

  function openAddItemModal() {
    // Placeholder function for opening a modal to add a new item
    console.log(`Open modal to add new item for Week ${weekNumber}`);
  }
</script>

<article class="flex {cardStyles}">
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
</article>