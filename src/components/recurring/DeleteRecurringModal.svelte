<script>
  import { formatCurrency } from "/src/api/utils.js";
  import { AlertTriangle } from "lucide-svelte";

  let { open = $bindable(false), name, onclose, onconfirm } = $props();

  function close() {
    open = false;
    if (onclose) onclose();
  }

  function confirmDelete() {
    if (onconfirm) onconfirm();
    close();
  }
</script>

  <!-- Backdrop -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
    onclick={(e) => e.target === e.currentTarget && close()}
    onkeydown={(e) => e.key === 'Escape' && close()}
  >
    <!-- Modal -->
    <div class="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <div class="flex items-start gap-3">
        <div class="shrink-0 p-2 rounded-lg bg-red-500/10">
          <AlertTriangle size={20} class="text-red-400" />
        </div>
        <div class="min-w-0">
          <h3 class="text-base font-bold text-zinc-100">Delete Recurring Expense</h3>
          <p class="mt-1 text-sm text-zinc-400">
            Are you sure you want to delete
            <span class="font-medium text-zinc-200">{name}</span>? This will
            remove the recurring expense and all future transactions. This action can't be
            undone.
          </p>
        </div>
      </div>

      <div class="flex justify-end gap-2 pt-5">
        <button
          type="button"
          onclick={close}
          class="px-3 py-1.5 text-sm font-medium text-zinc-300 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onclick={confirmDelete}
          class="px-4 py-1.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg active:scale-[0.98] transition-all cursor-pointer"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
