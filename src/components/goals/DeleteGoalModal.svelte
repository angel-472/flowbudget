<script>
  import { goalsApi } from "../../api/goalsApi.svelte";
  import { formatCurrency } from "/src/api/utils.js";
  import ConfirmDialog from '/src/components/ui/ConfirmDialog.svelte';

  let { open = $bindable(false), goal, onclose } = $props();

  // The parent clears `goal` as soon as the dialog starts closing; keep the
  // last one so the text doesn't vanish while the sheet slides away.
  let shown = $state(null);
  $effect(() => {
    if (goal) shown = goal;
  });

  function confirmDelete() {
    if (shown) goalsApi.delete(shown.id);
  }
</script>

<ConfirmDialog
  bind:open
  name="delete-goal"
  title="Delete Savings Goal?"
  {onclose}
  onconfirm={confirmDelete}
  onclosed={() => shown = null}
>
  Are you sure you want to delete
  <span class="font-medium text-zinc-700 dark:text-zinc-200">{shown?.name}</span>? This will
  remove its balance of {formatCurrency(shown?.balance ?? 0)} and can't be undone.
</ConfirmDialog>
