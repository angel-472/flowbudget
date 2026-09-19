<script>
  import ConfirmDialog from '/src/components/ui/ConfirmDialog.svelte';

  let { open = $bindable(false), name, onclose, onconfirm } = $props();
</script>

<ConfirmDialog
  bind:open
  name="delete-recurring"
  title="Delete Recurring Expense?"
  {onclose}
  {onconfirm}
>
  Are you sure you want to delete
  <span class="font-medium text-zinc-700 dark:text-zinc-200">{name}</span>? This will
  remove the recurring expense and all future transactions. This action can't be undone.
</ConfirmDialog>
