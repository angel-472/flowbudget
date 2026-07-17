<script>
    import { goalsApi } from "../../api/goalsApi.svelte";
  import { formatCurrency } from "/src/api/utils.js";

  let { open = $bindable(false), goal, onsubmit, onclose } = $props();

  // local values seeded from the goal (no data functionality yet)
  let name = $state("");
  let balance = $state(0);
  let target = $state(0);

  // seed the inputs whenever a goal is loaded into the modal
  $effect(() => {
    if (goal) {
      name = goal.name;
      balance = parseFloat(goal.balance);
      target = parseFloat(goal.target);
    }
  });

  let progress = $derived(
    target ? Math.min(100, Math.round((balance / target) * 100)) : 0
  );

  function close() {
    open = false;
    name = "";
    balance = 0;
    target = 0;
    if(onclose) onclose();
  }

  function handleSubmit(e) {
    e.preventDefault();
    let goalInstance = goalsApi.getById(goal.id);
    goalInstance.name = name;
    goalInstance.balance = balance;
    goalInstance.target = target;
    goalsApi.updateGoal(goal.id);
    onsubmit?.({ name, balance, target });
    close();
  }
</script>

{#if open && goal}
  <!-- Backdrop -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
    onkeydown={(e) => e.key === 'Escape' && close()}
  >
    <!-- Modal -->
    <div class="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <h3 class="text-base font-bold text-zinc-100 mb-4">Adjust Balance</h3>

      <form onsubmit={handleSubmit} class="space-y-4">
        <!-- Current value readout -->
        <div class="flex items-baseline gap-2">
          <span class="text-2xl font-bold text-zinc-100">{formatCurrency(balance)}</span>
          <span class="text-2xl font-bold text-zinc-500">/ {formatCurrency(target)}</span>
          <span class="ml-auto text-sm text-zinc-500">{progress}%</span>
        </div>

        <!-- Editable name -->
        <label class="flex flex-col gap-1">
          <span class="text-xs font-medium text-zinc-400">Name</span>
          <input
            type="text"
            bind:value={name}
            class="px-3 py-2 text-sm border border-zinc-700 rounded-lg bg-zinc-900 text-zinc-100 placeholder-zinc-500 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
          />
        </label>

        <!-- Exact balance & target inputs -->
        <div class="grid grid-cols-2 gap-3">
          <label class="flex flex-col gap-1">
            <span class="text-xs font-medium text-zinc-400">Current balance ($)</span>
            <input
              type="number"
              bind:value={balance}
              step="0.01"
              min="0"
              class="px-3 py-2 text-sm border border-zinc-700 rounded-lg bg-zinc-900 text-zinc-100 placeholder-zinc-500 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
            />
          </label>
          <label class="flex flex-col gap-1">
            <span class="text-xs font-medium text-zinc-400">Target ($)</span>
            <input
              type="number"
              bind:value={target}
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
            Save
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
