<script>
  import { onMount } from 'svelte';
  import { Search, X, TrendingUp, TrendingDown } from 'lucide-svelte';
  import Fuse from 'fuse.js';
  import { budgetApi } from '/src/api/budgetApi.svelte.js';
  import { signal } from '/src/api/signal.js';
  import { formatCurrency } from '/src/api/utils.js';
  import { dateUtils } from '/src/api/dateUtils.js';

  let { onClose } = $props();

  let query = $state('');
  let inputEl;

  let searchList = $derived(
    budgetApi.transactions.map(t => ({ ...t, amountStr: String(t.amount) }))
  );

  let fuse = $derived(
    new Fuse(searchList, {
      keys: [
        { name: 'description', weight: 0.5 },
        { name: 'category', weight: 0.3 },
        { name: 'amountStr', weight: 0.2 },
      ],
      threshold: 0.4,
      minMatchCharLength: 1,
      ignoreLocation: true,
    })
  );

  let results = $derived(
    query.trim().length >= 1
      ? fuse.search(query).slice(0, 30).map(r => r.item)
      : budgetApi.transactions
          .slice()
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 30)
  );

  onMount(() => inputEl?.focus());

  function handleKeydown(e) {
    if (e.key === 'Escape') onClose();
  }

  function handleSelect(t) {
    signal.emit('NAVIGATE_TO_DATE', { date: t.date });
    onClose();
  }

  function formatDate(dateStr) {
    return dateUtils.createLocalDate(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div
  class="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-start justify-center pt-16 px-4"
  role="presentation"
  onclick={(e) => { if (e.target === e.currentTarget) onClose(); }}
  onkeydown={(e) => { if (e.key === 'Escape') onClose(); }}
>
  <div
    class="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
    role="dialog"
    aria-modal="true"
    aria-label="Search transactions"
    tabindex="-1"
  >
    <!-- Input row -->
    <div class="flex items-center gap-3 px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
      <Search size={18} class="shrink-0 text-zinc-400 dark:text-zinc-400" />
      <input
        bind:this={inputEl}
        bind:value={query}
        placeholder="Search transactions…"
        class="flex-1 bg-transparent text-base text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-400 outline-none"
      />
      <button
        onclick={() => { if (query) query = ''; else onClose(); }}
        class="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-pointer"
      >
        <X size={16} />
      </button>
    </div>

    <!-- Results -->
    <div class="max-h-[60vh] overflow-y-auto">
      {#if query.trim().length >= 1 && results.length === 0}
        <p class="py-12 text-center text-sm text-zinc-400 dark:text-zinc-400">
          No results for "<span class="font-medium">{query}</span>"
        </p>
      {:else}
        <div class="divide-y divide-zinc-100 dark:divide-zinc-800">
          {#each results as t (t.id)}
            <button
              class="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors text-left cursor-pointer"
              onclick={() => handleSelect(t)}
            >
              <div class="shrink-0 p-1.5 rounded-lg {t.type === 'incomes' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}">
                {#if t.type === 'incomes'}
                  <TrendingUp size={14} />
                {:else}
                  <TrendingDown size={14} />
                {/if}
              </div>

              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{t.description}</p>
                <p class="text-xs text-zinc-400 dark:text-zinc-400">
                  {t.category || 'Uncategorized'} · {formatDate(t.date)}
                </p>
              </div>

              <div class="flex flex-col items-end shrink-0 gap-0.5">
                <span class="text-sm font-medium tabular-nums {t.type === 'incomes' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}">
                  {formatCurrency(t.amount)}
                </span>
                <span class="text-xs text-zinc-400 dark:text-zinc-400 capitalize">{t.status}</span>
              </div>
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Footer hint -->
    <div class="px-4 py-2 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-400 dark:text-zinc-400 flex justify-between">
      <span>
        {#if query.trim().length >= 1}
          {results.length} result{results.length !== 1 ? 's' : ''}
        {:else}
          Recent transactions
        {/if}
      </span>
      <span>Click to navigate · Esc to close</span>
    </div>
  </div>
</div>
