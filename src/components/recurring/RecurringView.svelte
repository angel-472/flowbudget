<script>
  import { Plus, Pencil, Trash } from "lucide-svelte"
  import { recurringApi } from "/src/api/recurringApi.svelte";
  import RecurringForm from "./RecurringForm.svelte";
  import { formatCurrency } from "/src/api/utils.js";
  import { dateUtils } from "/src/api/dateUtils";
  import DeleteRecurringModal from "./DeleteRecurringModal.svelte";
  import { signal } from "/src/api/signal";
  import { onDestroy } from "svelte";

  let recurringExpenses = $state(recurringApi.recurring)

  let isFormOpen = $state(false)
  let currentExpense = $state(undefined);

  function openForm(expenseId){
    currentExpense = recurringApi.getById(expenseId) ?? undefined;
    isFormOpen = true;
  }

  function getNextOcurrenceString(recurringExpense){
    let output = "";
    const intervalDays = recurringExpense.frequencyDays;
    const startDate = dateUtils.createLocalDate(recurringExpense.startDate).setHours(0,0,0,0);
    const today = new Date().setHours(0,0,0,0);
    
    // calculate days between start and today
    const differenceInMs = Math.abs(today - startDate);
    const msInDay = 1000 * 60 * 60 * 24;
    const daysDiff = Math.round(differenceInMs / msInDay);

    if(startDate >= today){
      if(daysDiff == 0){
        output = "today";
      }
      else {
        output = `in ` + dateUtils.daysToWords(daysDiff, true);
        const nextDate = new Date(today);
        nextDate.setDate(nextDate.getDate() + daysDiff);
        const nextDateString = dateUtils.createLocalDate(nextDate.toISOString().split("T")[0]).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        output += ` (${nextDateString})`;
      }
    }
    else{
      // add the interval to the current day
      const daysToAdd = intervalDays - (daysDiff % intervalDays)
      const nextDate = new Date(today);
      nextDate.setDate(nextDate.getDate() + daysToAdd);
      const daysUntilNext = dateUtils.daysBetweenDates(nextDate, today);
      output = `in ` + dateUtils.daysToWords(daysUntilNext, true);
      const nextDateString = dateUtils.createLocalDate(nextDate.toISOString().split("T")[0]).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      output += ` (${nextDateString})`;
    }
    return output;
  }

  let deleteTarget = $state({name: undefined, id: undefined});
  let isDeleteOpen = $state(false);

  function openDelete(expenseId){
    const target = recurringApi.getById(expenseId);
    if(target == undefined){
      console.warn(`RecurringView: Attempted to delete expense with id '${expenseId}' but it could not be found. Ignoring.`);
      return;
    }
    isDeleteOpen = true;
    deleteTarget = {name: target.name, id: target.id}
  }

  function onCloseDelete(){
    // clears the delete target
    deleteTarget = {};
  }

  function confirmDelete(){
    console.log("deletion confirmed!!!" + deleteTarget.id)
    recurringApi.delete(deleteTarget.id);
  }


  const SIGNAL_SUB_ID = "RecurringViewComponent"
  signal.sub("UPDATE_RECURRING", SIGNAL_SUB_ID, () => {
    requestAnimationFrame(() => {
      recurringExpenses = recurringApi.recurring;
    })
  });

  onDestroy(() => {
    signal.unsubAll(SIGNAL_SUB_ID);
  });

  // Sorts expenses from large to small
  $effect(() => {
    recurringExpenses.sort((a,b) => a.frequencyDays - b.frequencyDays || b.amount - a.amount) //first by frequency then by amount
  })

  let monthlyAverage = $state();
  $effect(() => {
    const total = recurringExpenses.reduce((accumulator, currentItem) => {
      if (currentItem.frequencyDays > 31) return accumulator;
      return accumulator + currentItem.amount;
    }, 0);
    monthlyAverage = total;
  })
</script>

<div class="px-4 sm:px-6 py-6">

  <!-- Header -->
  <div class="mb-8">
    <div class="flex items-center justify-center gap-2 mb-6">
      <!-- <Target size={28} class="text-indigo-400" /> -->
      <h1 class="text-2xl font-bold text-zinc-100">Recurring Expenses</h1>
    </div>

    <article class="flex flex-col items-center justify-between px-4 py-3 border border-zinc-800 bg-zinc-900 rounded-xl mb-6">
      <p class="text-zinc-500 mb-0.5 text-xs">Monthly Average</p>
      <p class="text-md font-semibold text-red-400">{formatCurrency(monthlyAverage)}</p>
    </article>

    <button
      class="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-zinc-300 rounded-xl border border-zinc-700 hover:bg-zinc-800 transition-colors cursor-pointer"
      onclick={() => {openForm()}}
    >
      <Plus size={16} />
      <span>Add Recurring Expense</span>
    </button>
  </div>

  <!-- Recurring Expenses list -->
  {#if recurringExpenses.length === 0}
    <div class="flex flex-col items-center justify-center gap-2 py-16 text-center border border-dashed border-zinc-800 rounded-lg">
      <p class="text-sm text-zinc-400">No recurring expenses yet.</p>
      <button
        class="text-sm font-medium text-indigo-400 hover:underline cursor-pointer"
        onclick={() => {openForm()}}
      >
        Create your first recurring expense
      </button>
    </div>
  {:else}
    <div class="grid grid-cols-1 gap-4">
      {#each recurringExpenses as recurringExpense (recurringExpense.id)}
        <article class="flex items-center justify-between gap-3 px-4 py-3 border border-zinc-800 bg-zinc-900 rounded-lg">
          <div class="flex flex-col gap-0.5 min-w-0">

            <h2 class="text-md font-semibold text-zinc-100 truncate">{recurringExpense.name}</h2>

            <span class="text-sm text-zinc-400">
              <span class="text-md font-semibold text-red-400">{formatCurrency(recurringExpense.amount)}</span>
              every {dateUtils.daysToWords(recurringExpense.frequencyDays)}              
            </span>

            <span class="text-sm text-zinc-400">
              Due again {getNextOcurrenceString(recurringExpense)}
            </span>

          </div>
          <div class="flex items-center gap-2 shrink-0">
            <button
              class="p-1.5 rounded-md text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors cursor-pointer"
              aria-label="Edit recurring expense"
              title="Edit recurring expense"
              onclick={() => openDelete(recurringExpense.id)}
            >
              <Trash size={14} />
            </button>
            <button
              class="p-1.5 rounded-md text-zinc-400 hover:text-indigo-400 hover:bg-zinc-800 transition-colors cursor-pointer"
              aria-label="Edit recurring expense"
              title="Edit recurring expense"
              onclick={() => openForm(recurringExpense.id)}
            >
              <Pencil size={14} />
            </button>
          </div>
        </article>
      {/each}
    </div>
  {/if}
</div>

{#if isFormOpen}
  <RecurringForm bind:open={isFormOpen} bind:currentExpense={currentExpense}/>
{/if}

{#if isDeleteOpen}
  <DeleteRecurringModal bind:open={isDeleteOpen} bind:name={deleteTarget.name} onconfirm={confirmDelete}/>
{/if}