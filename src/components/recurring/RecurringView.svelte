<script>
  import { Plus } from "lucide-svelte"
  import { recurringApi } from "/src/api/recurringApi.svelte";

  function openAddModal(){

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
      onclick={openAddModal}
    >
      <Plus size={16} />
      <span>Add Recurring Expense</span>
    </button>
  </div>

</div>