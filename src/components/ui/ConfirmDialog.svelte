<script>
  import { AlertTriangle } from 'lucide-svelte';
  import Modal from './Modal.svelte';

  let {
    open = $bindable(false),
    title = 'Are you sure?',
    confirmLabel = 'Delete',
    name = 'confirm',
    onconfirm,
    onclose,
    onclosed,
    children,
  } = $props();

  function close() {
    open = false;
    onclose?.();
  }

  function confirm() {
    onconfirm?.();
    close();
  }
</script>

<Modal bind:open {name} showClose={false} onClose={onclose} onClosed={onclosed}>
  <div class="flex items-start gap-3">
    <div class="shrink-0 p-2 rounded-lg bg-red-100 dark:bg-red-500/10">
      <AlertTriangle size={20} class="text-red-600 dark:text-red-400" />
    </div>
    <div class="min-w-0">
      <h3 class="text-base font-bold text-zinc-900 dark:text-zinc-100">{title}</h3>
      <p class="mt-1 text-sm text-zinc-400 dark:text-zinc-400">
        {@render children?.()}
      </p>
    </div>
  </div>

  <div class="flex justify-end gap-2 pt-5">
    <button
      type="button"
      onclick={close}
      class="px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-300 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
    >
      Cancel
    </button>
    <button
      type="button"
      onclick={confirm}
      class="px-4 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 rounded-lg active:scale-[0.98] transition-all cursor-pointer"
    >
      {confirmLabel}
    </button>
  </div>
</Modal>
