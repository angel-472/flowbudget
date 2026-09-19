<script>
  import { ChevronLeft, ChevronRight } from 'lucide-svelte';
  import Modal from '/src/components/ui/Modal.svelte';
  import { router } from '/src/api/router.svelte.js';

  let { open = $bindable(false), month, year } = $props();

  // Local until a month is picked, so browsing years doesn't navigate.
  let draftYear = $state(year);

  $effect(() => {
    if (open) draftYear = year;
  });

  const months = Array.from({ length: 12 }, (_, i) =>
    new Date(2000, i).toLocaleString('default', { month: 'short' })
  );

  const today = new Date();

  // Navigating closes this picker via the router, which reuses its history
  // entry for the destination month.
  function select(index) {
    router.go('month', { month: index, year: draftYear });
  }

  function goToday() {
    router.goToToday();
  }
</script>

<Modal bind:open name="month-picker" title="Jump to month">
  <div class="flex items-center justify-between mb-4">
    <button
      type="button"
      onclick={() => draftYear--}
      class="p-2 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
      aria-label="Previous year"
    >
      <ChevronLeft size={20} />
    </button>
    <span class="text-lg font-bold tabular-nums text-zinc-900 dark:text-zinc-100">{draftYear}</span>
    <button
      type="button"
      onclick={() => draftYear++}
      class="p-2 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
      aria-label="Next year"
    >
      <ChevronRight size={20} />
    </button>
  </div>

  <div class="grid grid-cols-3 gap-2">
    {#each months as label, i (label)}
      {@const isSelected = i === month && draftYear === year}
      {@const isToday = i === today.getMonth() && draftYear === today.getFullYear()}
      <button
        type="button"
        onclick={() => select(i)}
        class="py-2.5 rounded-xl text-sm font-medium border transition-colors cursor-pointer
          {isSelected
            ? 'bg-indigo-600 dark:bg-indigo-500 text-white border-transparent'
            : isToday
              ? 'text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              : 'text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'}"
      >
        {label}
      </button>
    {/each}
  </div>

  <button
    type="button"
    onclick={goToday}
    class="mt-4 w-full py-2.5 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
  >
    Today
  </button>
</Modal>
