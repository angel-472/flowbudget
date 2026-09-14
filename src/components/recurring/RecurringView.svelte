<script>
  import { Plus, Pencil } from "lucide-svelte"
  import { recurringApi } from "/src/api/recurringApi.svelte";
  import RecurringForm from "./RecurringForm.svelte";
  import { formatCurrency } from "/src/api/utils.js";

  let recurringExpenses = $state(recurringApi.recurring)

  let isFormOpen = $state(false)
  let currentExpense = $state(undefined);

  function openForm(expenseId){
    currentExpense = recurringApi.getById(expenseId) ?? undefined;
    isFormOpen = true;
  }
</script>

<div class="px-4 sm:px-6 py-6">

  <!-- Header -->
  <div class="mb-8">
    <div class="flex items-center justify-center gap-2 mb-6">
      <!-- <Target size={28} class="text-indigo-400" /> -->
      <h1 class="text-2xl font-bold text-zinc-100">Recurring Expenses</h1>
    </div>
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
            <span class="text-sm text-zinc-500">
              Every {recurringExpense.frequencyDays} {recurringExpense.frequencyDays == 1 ? "day" : "days"}
            </span>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <span class="text-md font-semibold text-zinc-100">{formatCurrency(recurringExpense.amount)}</span>
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
