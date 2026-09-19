<script>
  import { recurringApi } from "src/api/recurringApi.svelte";
  import { untrack } from "svelte";
  import Modal from "/src/components/ui/Modal.svelte";

  let { open = $bindable(false), onsubmit, currentExpense = $bindable() } = $props();

  // form fields (separate from state because no data should change until submitted)
  let name = $state('');
  let amount = $state(0);
  let frequencyDays = $state(0);
  let startDate = $state(new Date().toISOString().split('T')[0]);

  // The expense this open/close cycle is editing, staged when the form opens.
  // Kept until the exit animation ends so the title and button don't flip.
  let editing = $state(null);

  $effect(() => {
    if (!open) return;
    untrack(() => {
      editing = currentExpense ?? recurringApi.getNewRecurring();
      name = editing.name;
      amount = editing.amount;
      frequencyDays = editing.frequencyDays;
      startDate = editing.startDate;
    });
  });

  function close() {
    open = false; //uses the bound prop to change the variable on RecurringView, closing itself
  }

  // Runs once the sheet is gone, so the fields don't blank out mid-animation.
  function reset() {
    name = '';
    amount = 0;
    frequencyDays = 30;
    editing = null;
    currentExpense = undefined;
  }

  // when the submit button is clicked
  function handleSubmit(e) {
    e.preventDefault();
    onsubmit?.({ name, amount, frequencyDays }); //fires the onsubmit parent function parameter (if added)
    
    Object.assign(editing, {name, amount, frequencyDays, startDate});
    if(editing.isNew){
      recurringApi.addRecurring(editing);
    }
    else {
      recurringApi.update(editing.id);
    }
    close();
  }
</script>

<Modal
  bind:open
  name="recurring-form"
  title="{editing?.isNew ? 'New' : 'Edit'} Recurring Expense"
  onClosed={reset}
>
    <form onsubmit={handleSubmit} class="space-y-3">
      <label class="flex flex-col gap-1">
        <input
          type="text"
          bind:value={name}
            placeholder="Expense Name e.g. Rent, Phone Bill"
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
          {editing?.isNew ? "Add" : "Save"}
        </button>
      </div>
    </form>
</Modal>
