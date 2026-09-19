<script>
  import { recurringApi } from "src/api/recurringApi.svelte";
    import { onMount } from "svelte";

  let { open = $bindable(false), onsubmit, currentExpense } = $props();

  // form fields (separate from state because no data should change until submitted)
  let name = $state('');
  let amount = $state(0);
  let frequencyDays = $state(0);
  let startDate = $state(new Date().toISOString().split('T')[0]);


  let nameField = $state();

  function close() {
    open = false; //uses the bound prop to change the variable on RecurringView, closing itself
    name = '';
    amount = 0;
    frequencyDays = 30;
    currentExpense = undefined;
  }

  onMount(() => {
    if(currentExpense == undefined){
      console.log(`Current expense is undefined, staging new one`)
      currentExpense = recurringApi.getNewRecurring();
      requestAnimationFrame(() => nameField.focus());
    }
    name = currentExpense.name;
    amount = currentExpense.amount;
    frequencyDays = currentExpense.frequencyDays;
    startDate = currentExpense.startDate;
  })

  // when the submit button is clicked
  function handleSubmit(e) {
    e.preventDefault();
    onsubmit?.({ name, amount, frequencyDays }); //fires the onsubmit parent function parameter (if added)
    
    Object.assign(currentExpense, {name, amount, frequencyDays, startDate});
    if(currentExpense.isNew){
      recurringApi.addRecurring(currentExpense);
    }
    else {
      recurringApi.update(currentExpense.id);
    }
    close();
  }
</script>

<svelte:window     onkeydown={(e) => e.key === 'Escape' && open && close()}></svelte:window>


{#if currentExpense}
<!-- Backdrop -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
>
  <!-- Modal -->
  <div class="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl p-5">
    <h3 class="text-base font-bold text-zinc-100 mb-4">{currentExpense.isNew == true ? 'New' : 'Edit'} Recurring Expense</h3>

    <form onsubmit={handleSubmit} class="space-y-3">
      <label class="flex flex-col gap-1">
        <input
          type="text"
          bind:value={name}
          bind:this={nameField}
          placeholder="Goal Name e.g. Rent, Phone Bill"
          class="px-3 py-2 text-md border border-zinc-700 rounded-lg bg-zinc-900 text-zinc-100 placeholder-zinc-400 font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
          required
        />
      </label>

      <label class="flex flex-col gap-1">
        <span class="text-xs font-medium text-zinc-400">Amount ($)</span>
        <input
          type="number"
          bind:value={amount}
          placeholder="0.00"
          step="0.01"
          min="0.01"
          class="px-3 py-2 text-sm border border-zinc-700 rounded-lg bg-zinc-900 text-zinc-100 placeholder-zinc-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
          required
        />
      </label>

      <label class="flex flex-col gap-1">
        <span class="text-xs font-medium text-zinc-400">Start Date</span>
        <input
          type="date"
          bind:value={startDate}
          class="px-3 py-2 text-sm border border-zinc-700 rounded-lg bg-zinc-900 text-zinc-100 placeholder-zinc-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
        />
      </label>

      <label class="flex flex-col gap-1">
        <span class="text-xs font-medium text-zinc-400">Interval (days)</span>
        <input
          type="number"
          bind:value={frequencyDays}
          placeholder="0.00"
          step="1"
          min="7"
          class="px-3 py-2 text-sm border border-zinc-700 rounded-lg bg-zinc-900 text-zinc-100 placeholder-zinc-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
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
          {currentExpense.isNew ? "Add" : "Save"}
        </button>
      </div>
    </form>
  </div>
</div>
{/if}