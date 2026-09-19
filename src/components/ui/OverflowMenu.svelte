<script>
  import { MoreVertical, LogOut, Settings } from 'lucide-svelte';
  import { fly } from 'svelte/transition';

  let { onSignOut, onPreferences } = $props();

  let open = $state(false);
  let menuEl = $state();

  function handleWindowClick(e) {
    if (open && menuEl && !menuEl.contains(e.target)) open = false;
  }

  function run(action) {
    open = false;
    action?.();
  }
</script>

<svelte:window
  onclick={handleWindowClick}
  onkeydown={(e) => e.key === 'Escape' && (open = false)}
/>

<div class="relative" bind:this={menuEl}>
  <button
    type="button"
    onclick={() => (open = !open)}
    aria-haspopup="menu"
    aria-expanded={open}
    class="p-2 rounded-lg text-zinc-400 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
    title="More"
  >
    <MoreVertical size={20} />
  </button>

  {#if open}
    <div
      role="menu"
      tabindex="-1"
      class="absolute right-0 mt-1 w-48 py-1 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg z-40"
      transition:fly={{ y: -4, duration: 120 }}
    >
      <button
        type="button"
        role="menuitem"
        onclick={() => run(onPreferences)}
        class="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
      >
        <Settings size={16} />
        Preferences
      </button>
      <button
        type="button"
        role="menuitem"
        onclick={() => run(onSignOut)}
        class="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
      >
        <LogOut size={16} />
        Sign out
      </button>
    </div>
  {/if}
</div>
