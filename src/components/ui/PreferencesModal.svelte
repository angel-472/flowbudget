<script>
  import { Moon, Sun } from 'lucide-svelte';
  import Modal from './Modal.svelte';

  let { open = $bindable(false), darkMode, onToggleDarkMode } = $props();
</script>

<Modal bind:open name="preferences" title="Preferences">
  <div class="flex items-center justify-between gap-4 py-1">
    <div class="min-w-0">
      <p class="text-sm font-medium text-zinc-900 dark:text-zinc-100">Theme</p>
      <!-- The Goals and Recurring views still hardcode dark colours, so light
           mode renders wrong there. Re-enable once those are themed. -->
      <p class="mt-0.5 text-sm text-zinc-400 dark:text-zinc-400">
        Light mode is disabled until the Goals and Recurring views support it.
      </p>
    </div>
    <button
      type="button"
      disabled
      onclick={onToggleDarkMode}
      class="shrink-0 p-2 rounded-lg text-zinc-400 border border-zinc-200 dark:border-zinc-800 opacity-50 cursor-not-allowed"
      title="Toggle theme"
    >
      {#if darkMode}
        <Sun size={18} />
      {:else}
        <Moon size={18} />
      {/if}
    </button>
  </div>
</Modal>
