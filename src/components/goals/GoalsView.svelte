<script>
  import { goalsApi } from "src/api/goalsApi.svelte.js";
  import { formatCurrency } from "/src/api/utils.js";
  import { Plus, Trash2, Pin, Target } from "lucide-svelte";
  import AddGoalModal from "./AddGoalModal.svelte";
  import EditBalanceModal from "./EditBalanceModal.svelte";

  // mock data
  let goals = $state([{ id: crypto.randomUUID(), name: "Universal Trip", target: 2500, balance: 500 }]);

  let isModalOpen = $state(false);

  function openModal() {
    isModalOpen = true;
  }

  // edit-balance modal (slider from 0 to target)
  let isEditOpen = $state(false);
  let editGoal = $state(null);

  function openEditModal(goal) {
    editGoal = goal;
    isEditOpen = true;
  }

  function progress(goal) {
    if (!goal.target) return 0;
    return Math.min(100, Math.round((goal.balance / goal.target) * 100));
  }
</script>




<div class="px-4 sm:px-6 py-6">
  <!-- Header -->
  <div class="mb-8">
    <div class="flex items-center justify-center gap-2 mb-6">
      <!-- <Target size={28} class="text-indigo-400" /> -->
      <h1 class="text-2xl font-bold text-zinc-100">Saving Goals</h1>
    </div>
    <button
      class="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-zinc-300 rounded-xl border border-zinc-700 hover:bg-zinc-800 transition-colors cursor-pointer"
      onclick={openModal}
    >
      <Plus size={16} />
      <span>Add Goal</span>
    </button>
  </div>

  <!-- Goals list -->
  {#if goals.length === 0}
    <div class="flex flex-col items-center justify-center gap-2 py-16 text-center border border-dashed border-zinc-800 rounded-lg">
      <Target size={28} class="text-zinc-600" />
      <p class="text-sm text-zinc-400">No saving goals yet.</p>
      <button
        class="text-sm font-medium text-indigo-400 hover:underline cursor-pointer"
        onclick={openModal}
      >
        Create your first goal
      </button>
    </div>
  {:else}
    <div class="grid grid-cols-1 gap-4">
      {#each goals as goal (goal.id)}
        <article class="border border-zinc-800 bg-zinc-900 rounded-lg">
          <!-- Header -->
          <div class="flex items-start justify-between px-4 py-3 border-b border-zinc-800">
            <div class="flex flex-col gap-0.5 min-w-0">
              <h2 class="text-md font-semibold text-zinc-100 truncate">{goal.name}</h2>
              <span class="text-sm text-zinc-500">
                {formatCurrency(goal.balance)} of {formatCurrency(goal.target)}
              </span>
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <button
                class="p-1.5 rounded-md text-zinc-400 hover:text-indigo-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                aria-label="Pin goal"
                title="Pin goal"
              >
                <Pin size={14} />
              </button>
              <button
                class="p-1.5 rounded-md text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                aria-label="Delete goal"
                title="Delete goal"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <!-- Content -->
          <div class="px-4 py-3">
            <!-- Progress bar -->
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-xs font-medium text-zinc-400">Progress</span>
              <span class="text-xs font-semibold text-indigo-400">{progress(goal)}%</span>
            </div>
            <div class="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
              <div
                class="h-full rounded-full bg-indigo-400 transition-all"
                style="width: {progress(goal)}%"
              ></div>
            </div>

            <!-- Add / remove funds -->
            <div class="mt-4">
              <span class="text-xs font-medium text-zinc-400">Adjust balance</span>
              <div class="mt-1.5 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="+/- amount"
                  class="flex-1 min-w-0 px-3 py-2 text-sm border border-zinc-700 rounded-lg bg-zinc-900 text-zinc-100 placeholder-zinc-500 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                />
                <button
                  class="px-3 py-2 text-sm font-medium text-zinc-300 rounded-lg border border-zinc-700 hover:bg-zinc-800 transition-colors cursor-pointer"
                  onclick={() => openEditModal(goal)}
                >
                  Edit
                </button>
                <button
                  class="px-3 py-2 text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg active:scale-[0.98] transition-all cursor-pointer"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </article>
      {/each}
    </div>
  {/if}
</div>

<!-- Modals -->
<AddGoalModal bind:open={isModalOpen} />
<EditBalanceModal bind:open={isEditOpen} goal={editGoal} />
