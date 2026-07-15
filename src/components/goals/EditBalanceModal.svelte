<script>
  import { formatCurrency } from "/src/api/utils.js";

  let { open = $bindable(false), goal, onsubmit } = $props();

  // local balance seeded from the goal (no data functionality yet)
  let balance = $state(0);

  // seed the slider/input whenever a goal is loaded into the modal
  $effect(() => {
    if (goal) balance = goal.balance;
  });

  let progress = $derived(
    goal && goal.target ? Math.min(100, Math.round((balance / goal.target) * 100)) : 0
  );

  function close() {
    open = false;
  }

  function handleSubmit(e) {
    e.preventDefault();
    // TODO: wire up balance update
    onsubmit?.(balance);
    close();
  }
</script>

{#if open && goal}
  <!-- Backdrop -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
    onkeydown={(e) => e.key === 'Escape' && close()}
    onclick={(e) => e.target === e.currentTarget && close()}
  >
    <!-- Modal -->
    <div class="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <h3 class="text-base font-bold text-zinc-100 mb-1">Adjust Balance</h3>
      <p class="text-xs text-zinc-500 mb-4">{goal.name}</p>

      <form onsubmit={handleSubmit} class="space-y-4">
        <!-- Current value readout -->
        <div class="flex items-baseline justify-between">
          <span class="text-2xl font-bold text-zinc-100">{formatCurrency(balance)}</span>
          <span class="text-sm text-zinc-500">of {formatCurrency(goal.target)} · {progress}%</span>
        </div>

        <!-- Slider from 0 to target -->
        <input
          type="range"
          min="0"
          max={goal.target}
          step="1"
          bind:value={balance}
          class="w-full accent-indigo-500 cursor-pointer"
        />
        <div class="flex justify-between text-xs text-zinc-500">
          <span>{formatCurrency(0)}</span>
          <span>{formatCurrency(goal.target)}</span>
        </div>

        <!-- Exact amount input -->
        <label class="flex flex-col gap-1">
          <span class="text-xs font-medium text-zinc-400">Exact amount ($)</span>
          <input
            type="number"
            bind:value={balance}
            step="0.01"
            min="0"
            max={goal.target}
            class="px-3 py-2 text-sm border border-zinc-700 rounded-lg bg-zinc-900 text-zinc-100 placeholder-zinc-500 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
          />
        </label>

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
            Save
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
