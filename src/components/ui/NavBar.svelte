<script>
  import { CalendarDays, Repeat, Target, Plus } from 'lucide-svelte';
  import { router } from '/src/api/router.svelte.js';
  import { openNewTransaction } from '/src/components/budget/TransactionForm.svelte';
  import { onMount } from 'svelte';
  import gsap from 'gsap';

  const views = [
    { id: 'month', label: 'Month', icon: CalendarDays },
    { id: 'recurring', label: 'Recurring', icon: Repeat },
    { id: 'goals', label: 'Goals', icon: Target },
  ];

  // One element list per tablist: only the visible one can take focus.
  let desktopTabs = $state([]);
  let mobileTabs = $state([]);

  // ── Liquid glass indicator ──
  // One element slides between tabs. Mid-move it stretches along the
  // direction of travel and thins out, then settles, so it reads as fluid
  // rather than as a box teleporting.
  let indicatorEl = $state();
  let placed = false;

  function indicatorX(index) {
    const tab = mobileTabs[index];
    if (!tab || !indicatorEl) return null;
    return tab.offsetLeft + (tab.offsetWidth - indicatorEl.offsetWidth) / 2;
  }

  function moveIndicator(animate) {
    const index = views.findIndex((v) => v.id === router.view);
    const x = indicatorX(index);
    if (x === null) return;

    if (!animate || !placed || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(indicatorEl, { x, scaleX: 1, scaleY: 1, opacity: 1 });
      placed = true;
      return;
    }

    gsap.killTweensOf(indicatorEl);
    gsap.to(indicatorEl, { x, duration: 0.35, ease: 'power3.inOut' });
    // Peak stretch lands at the midpoint, where the slide is fastest.
    gsap.timeline()
      .to(indicatorEl, { scaleX: 1.18, scaleY: 0.94, duration: 0.175, ease: 'sine.inOut' })
      .to(indicatorEl, { scaleX: 1, scaleY: 1, duration: 0.2, ease: 'power2.out' });
  }

  $effect(() => {
    router.view;
    moveIndicator(true);
  });

  onMount(() => {
    moveIndicator(false);
    const onResize = () => moveIndicator(false);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  });

  // Tapping the tab you're already on scrolls back to the top, as on iOS and
  // Android.
  function select(id) {
    if (router.view === id) window.scrollTo({ top: 0, behavior: 'smooth' });
    else router.go(id);
  }

  // Roving arrow-key movement between tabs, per the tablist pattern.
  function handleKeydown(e, index, tabEls) {
    let next;
    if (e.key === 'ArrowRight') next = (index + 1) % views.length;
    else if (e.key === 'ArrowLeft') next = (index - 1 + views.length) % views.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = views.length - 1;
    else return;

    e.preventDefault();
    router.go(views[next].id);
    tabEls[next]?.focus();
  }
</script>

<!-- Desktop: segmented control under the header -->
<nav class="hidden sm:block max-w-3xl mx-auto px-4 sm:px-6 pt-4">
  <div role="tablist" aria-label="Views" class="flex gap-1 rounded-2xl bg-zinc-100 dark:bg-zinc-900 p-1">
    {#each views as { id, label }, i (id)}
      <button
        type="button"
        role="tab"
        aria-selected={router.view === id}
        aria-controls="view-panel"
        tabindex={router.view === id ? 0 : -1}
        bind:this={desktopTabs[i]}
        onclick={() => select(id)}
        onkeydown={(e) => handleKeydown(e, i, desktopTabs)}
        class="flex-1 rounded-xl py-2.5 text-sm font-medium border transition-colors cursor-pointer
          {router.view === id
            ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-700'
            : 'text-zinc-400 dark:text-zinc-400 border-transparent hover:text-zinc-600 dark:hover:text-zinc-300'}"
      >
        {label}
      </button>
    {/each}
  </div>
</nav>

<!-- Mobile: floating glass pill within thumb reach, with the add action built in -->
<nav
  class="sm:hidden fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pointer-events-none"
  aria-label="Views"
>
  <div
    class="pointer-events-auto flex items-center h-14 pl-1.5 pr-1.5 rounded-3xl shadow-lg
      bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl backdrop-saturate-150
      border border-black/5 dark:border-white/10"
  >
    <div role="tablist" aria-label="Views" class="relative flex flex-1 min-w-0 h-full">
      <!-- Liquid glass indicator; positioned by GSAP -->
      <div
        bind:this={indicatorEl}
        class="absolute left-0 top-1/2 -mt-5.5 h-11 w-18 rounded-2xl pointer-events-none opacity-0
          bg-gradient-to-b from-black/[0.03] to-black/[0.01] dark:from-white/[0.12] dark:to-white/[0.08]
          border border-black/[0.03] dark:border-white/[0.10] backdrop-blur-md"
        aria-hidden="true"
      ></div>

      {#each views as { id, label, icon: Icon }, i (id)}
        {@const active = router.view === id}
        <button
          type="button"
          role="tab"
          aria-selected={active}
          aria-controls="view-panel"
          aria-label={label}
          title={label}
          tabindex={active ? 0 : -1}
          bind:this={mobileTabs[i]}
          onclick={() => select(id)}
          onkeydown={(e) => handleKeydown(e, i, mobileTabs)}
          class="relative flex-1 flex items-center justify-center h-full transition-colors duration-300 cursor-pointer
            {active ? 'text-zinc-900 dark:text-white' : 'text-zinc-400 dark:text-zinc-400'}"
        >
          <Icon size={22} strokeWidth={active ? 2.6 : 1.9} />
        </button>
      {/each}
    </div>

    <button
      type="button"
      onclick={openNewTransaction}
      class="shrink-0 ml-1 flex items-center justify-center h-11 w-11 rounded-2xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white shadow-sm active:scale-95 transition-all cursor-pointer"
      title="Add Transaction"
      aria-label="Add Transaction"
    >
      <Plus size={21} strokeWidth={2.4} />
    </button>
  </div>
</nav>
