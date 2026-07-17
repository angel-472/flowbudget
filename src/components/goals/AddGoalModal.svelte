<script>
  import { goalsApi } from "src/api/goalsApi.svelte";

  let { open = $bindable(false), onsubmit } = $props();

  // form fields (no data functionality yet)
  let name = $state('');
  let target = $state('');
  let balance = $state('');

  function close() {
    open = false;
    name = '';
    target = '';
    balance = '';
  }

  function handleSubmit(e) {
    e.preventDefault();
    onsubmit?.({ name, target, balance }); //fires the onsubmit parent function parameter (if added)
    
    // TODO: wire up goal creation
    goalsApi.addGoal({name, target, balance});
    close();
  }
</script>

{#if open}
  <!-- Backdrop -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
    onkeydown={(e) => e.key === 'Escape' && close()}
    onclick={(e) => e.target === e.currentTarget && close()}
  >
    <!-- Modal -->
    <div class="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <h3 class="text-base font-bold text-zinc-100 mb-4">New Saving Goal</h3>

      <form onsubmit={handleSubmit} class="space-y-3">
        <label class="flex flex-col gap-1">
          <span class="text-xs font-medium text-zinc-400">Goal name</span>
          <input
            type="text"
            bind:value={name}
            placeholder="e.g. Universal Trip, Emergency Fund"
            class="px-3 py-2 text-sm border border-zinc-700 rounded-lg bg-zinc-900 text-zinc-100 placeholder-zinc-500 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
            required
          />
        </label>

        <div class="grid grid-cols-2 gap-3">
          <label class="flex flex-col gap-1">
            <span class="text-xs font-medium text-zinc-400">Target ($)</span>
            <input
              type="number"
              bind:value={target}
              placeholder="0.00"
              step="0.01"
              min="0.01"
              class="px-3 py-2 text-sm border border-zinc-700 rounded-lg bg-zinc-900 text-zinc-100 placeholder-zinc-500 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
              required
            />
          </label>

          <label class="flex flex-col gap-1">
            <span class="text-xs font-medium text-zinc-400">Starting balance ($)</span>
            <input
              type="number"
              bind:value={balance}
              placeholder="0.00"
              step="0.01"
              min="0"
              class="px-3 py-2 text-sm border border-zinc-700 rounded-lg bg-zinc-900 text-zinc-100 placeholder-zinc-500 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
            />
          </label>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onclick={close}
            class="px-3 py-1.5 text-sm font-medium text-zinc-300 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="px-4 py-1.5 text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg active:scale-[0.98] transition-all cursor-pointer"
          >
            Add Goal
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
