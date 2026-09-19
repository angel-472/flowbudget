<script>
  import { ArrowUp, Search } from "lucide-svelte"
  import { onMount } from "svelte";
  import { fly } from "svelte/transition";
  import MonthView from "./components/budget/MonthView.svelte";
  import TransactionForm from './components/budget/TransactionForm.svelte';
  import SearchOverlay from './components/budget/SearchOverlay.svelte';
  import AuthScreen from "./components/AuthScreen.svelte";
  import { getCurrentUserResult, onAuthStateChange, signOut } from "./api/cloud/auth";
  import { budgetApi } from "./api/budgetApi.svelte.js";
  import { localCache } from "./api/localCache.js";
  import { syncQueue } from "./api/cloud/syncQueue.js";
    import GoalsView from "./components/goals/GoalsView.svelte";
    import { goalsApi } from "./api/goalsApi.svelte";
    import RecurringView from "./components/recurring/RecurringView.svelte";
    import { recurringApi } from "./api/recurringApi.svelte";
    import { router } from "./api/router.svelte.js";
    import NavBar from "./components/ui/NavBar.svelte";
    import OverflowMenu from "./components/ui/OverflowMenu.svelte";
    import PreferencesModal from "./components/ui/PreferencesModal.svelte";

  router.start();

  // ── Dark mode ──
  let darkMode = $state(false);

  if (localStorage.getItem('darkMode') !== null) {
    darkMode = localStorage.getItem('darkMode') === 'true';
    // svelte-ignore state_referenced_locally
    document.documentElement.classList.toggle('dark', darkMode);
  } else {
    darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    // svelte-ignore state_referenced_locally
    document.documentElement.classList.toggle('dark', darkMode);
  }

  function toggleDarkMode() {
    darkMode = !darkMode;
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', String(darkMode));
  }

  // ── Auth state ──
  // The cached session lets the app render immediately; Supabase confirms it in
  // the background and the "Syncing…" pill covers the gap.
  const cachedSession = localCache.loadSession();
  let user = $state(cachedSession);
  let isLoading = $state(cachedSession === null);
  let isSyncing = $state(cachedSession !== null);

  let connecting = null;
  let reconnectTimer = null;
  const RECONNECT_DELAY_MS = 15000;

  function scheduleReconnect() {
    if (reconnectTimer) return;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, RECONNECT_DELAY_MS);
  }

  /** Adopts a confirmed session, then pushes queued writes and pulls fresh data. */
  async function activate(liveUser) {
    if (user && user.id !== liveUser.id) resetData();
    user = liveUser;
    localCache.saveSession(liveUser);
    isLoading = false;
    isSyncing = true;
    syncQueue.setReady(true);
    try {
      await budgetApi.sync();
      await goalsApi.sync();
      await recurringApi.sync();
      
      isSyncing = false;
    } catch (error) {
      console.warn('FlowBudget: sync failed, retrying shortly.', error);
      scheduleReconnect();
    }
  }

  function signOutLocally() {
    resetData();
    user = null;
    isLoading = false;
    isSyncing = false;
  }

  function resetData(){
    syncQueue.setReady(false);

    budgetApi.reset();
    goalsApi.reset();
    recurringApi.reset()

    syncQueue.clear();
    localCache.clear();
  }

  function connect() {
    if (connecting) return connecting;
    connecting = (async () => {
      const { user: liveUser, offline } = await getCurrentUserResult();
      if (liveUser) {
        await activate(liveUser);
      } else if (offline && user) {
        // Cached session, unreachable server: keep serving the cache and retry.
        scheduleReconnect();
      } else {
        signOutLocally();
      }
    })().finally(() => { connecting = null; });
    return connecting;
  }

  connect();

  onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && user == null) {
      activate(session.user);
    } else if (event === 'SIGNED_OUT') {
      signOutLocally();
    }
  });

  async function handleSignOut() {
    try {
      await signOut();
    } catch (error) {
      console.warn('FlowBudget: sign out request failed.', error);
    }
    signOutLocally();
  }

  // ── Scroll to top ──
  let showScrollButton = $state(false);
  
  onMount(() => {
    const handleScroll = () => {
      showScrollButton = window.scrollY > 300;
    };
    const handleOnline = () => connect();
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('online', handleOnline);
    };
  });
  
  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── Search ──
  let showSearch = $state(false);

  // ── Preferences ──
  let showPreferences = $state(false);
</script>

<svelte:window onkeydown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); showSearch = true; } }} />

{#if user}
  <SearchOverlay bind:open={showSearch} />
  <PreferencesModal bind:open={showPreferences} {darkMode} onToggleDarkMode={toggleDarkMode} />
{/if}

{#if isLoading}
  <div class="flex items-center justify-center min-h-screen">
    <div class="flex flex-col items-center gap-3">
      <div class="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-indigo-600 dark:border-zinc-700 dark:border-t-indigo-400"></div>
      <p class="text-sm text-zinc-400 dark:text-zinc-400">Loading...</p>
    </div>
  </div>
{:else if !user}
  <AuthScreen />
{:else}
  <TransactionForm />

  {#if isSyncing}
    <div
      class="fixed top-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 pl-2.5 pr-3.5 py-1.5 rounded-full bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm border border-zinc-200 dark:border-zinc-700 shadow-sm"
      transition:fly={{ y: -8, duration: 200 }}
    >
      <span class="h-3 w-3 animate-spin rounded-full border-2 border-zinc-200 border-t-indigo-600 dark:border-zinc-600 dark:border-t-indigo-400"></span>
      <span class="text-xs font-medium text-zinc-400 dark:text-zinc-400">Syncing…</span>
    </div>
  {/if}

  <div class="min-h-screen">
    <!-- Header -->
    <header class="sticky top-0 z-20 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800">
      <div class="flex items-center justify-between h-14 max-w-3xl mx-auto px-4 sm:px-6">

        <!-- Home: back to the current month -->
        <button
          onclick={() => router.goToToday()}
          class="rounded-lg px-1 cursor-pointer"
          title="Go to current month"
        >
          <h1 class="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">FlowBudget</h1>
        </button>

        <div class="flex items-center gap-1">

          <button
            onclick={() => showSearch = true}
            class="p-2 rounded-lg text-zinc-400 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer flex gap-2 items-center"
            title="Search (⌘K)"
          >
            <Search size={20} />
          </button>

          <OverflowMenu
            onSignOut={handleSignOut}
            onPreferences={() => showPreferences = true}
          />
        </div>
      </div>
    </header>

    <!-- Content Screen Switcher — top segmented on desktop, bottom bar on mobile -->
    <NavBar />

    <!-- Main content -->
    <!-- Bottom padding clears the mobile nav bar, the add FAB and the home indicator -->
    <main class="max-w-3xl mx-auto pb-[calc(7rem+env(safe-area-inset-bottom))] sm:pb-32">
      <div id="view-panel" role="tabpanel" aria-label={router.view} tabindex="-1" class="outline-none">
        {#if router.view === "month"}
          <MonthView />
        {:else if router.view === "recurring"}
          <RecurringView />
        {:else if router.view === "goals"}
          <GoalsView />
        {/if}
      </div>
    </main>

    <!-- Scroll to top — above the nav pill on mobile, above the add button on desktop -->
    {#if showScrollButton}
      <button
        onclick={scrollToTop}
        class="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+5rem)] sm:bottom-20 sm:right-6 z-30 p-2.5 sm:p-3 rounded-full
          bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 shadow-md
          sm:bg-zinc-900 sm:dark:bg-white sm:text-white sm:dark:text-zinc-900 sm:border-transparent sm:shadow-lg sm:hover:bg-zinc-700 sm:dark:hover:bg-zinc-200
          active:scale-95 transition-all cursor-pointer"
        title="Scroll to top"
        aria-label="Scroll to top"
        transition:fly={{ y: 8, duration: 150 }}
      >
        <ArrowUp size={20} />
      </button>
    {/if}
  </div>
{/if}
