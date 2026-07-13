<script>
  import { Moon, Sun, LogOut, ArrowUp, Plus, Search } from "lucide-svelte"
  import { onMount } from "svelte";
  import { fly } from "svelte/transition";
  import MonthView from "./components/MonthView.svelte";
  import TransactionForm from './components/TransactionForm.svelte';
  import SearchOverlay from './components/SearchOverlay.svelte';
  import AuthScreen from "./components/AuthScreen.svelte";
  import { getCurrentUserResult, onAuthStateChange, signOut } from "./api/auth";
  import { signal } from "./api/signal";
  import { budgetApi } from "./api/budgetApi.svelte.js";
  import { localCache } from "./api/localCache.js";
  import { syncQueue } from "./api/syncQueue.js";
  import { dateUtils } from '/src/api/dateUtils.js';

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
  let currentView = $state("month");

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
    if (user && user.id !== liveUser.id) budgetApi.reset();
    user = liveUser;
    localCache.saveSession(liveUser);
    isLoading = false;
    isSyncing = true;
    syncQueue.setReady(true);
    try {
      await budgetApi.sync();
      isSyncing = false;
    } catch (error) {
      console.warn('FlowBudget: sync failed, retrying shortly.', error);
      scheduleReconnect();
    }
  }

  function signOutLocally() {
    syncQueue.setReady(false);
    budgetApi.reset();
    user = null;
    isLoading = false;
    isSyncing = false;
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
      showScrollButton = window.scrollY > 600;
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

  function handleAddTransaction() {
    signal.emit("OPEN_TRANSACTION_FORM", {
      transaction: {
        id: null,
        type: 'expenses',
        date: new Date().toLocaleDateString('en-CA'),
        description: '',
        amount: '',
        category: '',
        status: 'pending'
      }
    });
  }
</script>

<svelte:window onkeydown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); showSearch = true; } }} />

{#if showSearch && user}
  <SearchOverlay onClose={() => showSearch = false} />
{/if}

{#if isLoading}
  <div class="flex items-center justify-center min-h-screen">
    <div class="flex flex-col items-center gap-3">
      <div class="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-indigo-600 dark:border-gray-700 dark:border-t-indigo-400"></div>
      <p class="text-sm text-gray-400 dark:text-gray-500">Loading...</p>
    </div>
  </div>
{:else if !user}
  <AuthScreen />
{:else}
  <TransactionForm />

  {#if isSyncing}
    <div
      class="fixed top-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 pl-2.5 pr-3.5 py-1.5 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-sm"
      transition:fly={{ y: -8, duration: 200 }}
    >
      <span class="h-3 w-3 animate-spin rounded-full border-2 border-gray-200 border-t-indigo-600 dark:border-gray-600 dark:border-t-indigo-400"></span>
      <span class="text-xs font-medium text-gray-500 dark:text-gray-400">Syncing…</span>
    </div>
  {/if}

  <div class="min-h-screen">
    <!-- Header -->
    <header class="sticky top-0 z-20 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6">
      <div class="flex items-center justify-between h-14 max-w-5xl mx-auto">
        <h1 class="text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-100">FlowBudget</h1>
        
        <div class="flex items-center gap-1">
          <span class="hidden md:block text-sm text-gray-500 dark:text-gray-400 mr-2">{user.email}</span>

          <button
            onclick={() => showSearch = true}
            class="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            title="Search (⌘K)"
          >
            <Search size={18} />
          </button>

          <button
            onclick={toggleDarkMode}
            class="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            title="Toggle theme"
          >
            {#if darkMode}
              <Sun size={18} />
            {:else}
              <Moon size={18} />
            {/if}
          </button>
          
          <button
            class="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            onclick={handleSignOut}
            title="Sign Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>

    <!-- Main content -->
    <main class="max-w-5xl mx-auto">
      {#if currentView === "month"}
        <MonthView />
      {:else if currentView === "dashboard"}
        <h2 class="text-center text-xl font-medium p-8">Dashboard</h2>
      {:else if currentView === "settings"}
        <h2 class="text-center text-xl font-medium p-8">Settings</h2>
      {/if}
    </main>
    
    <!-- Floating actions -->
    <div class="fixed bottom-6 right-6 flex flex-col gap-2 z-30">
      {#if showScrollButton}
        <button
          onclick={scrollToTop}
          class="p-2.5 rounded-full bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 shadow-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 active:scale-95 transition-all cursor-pointer"
          title="Scroll to top"
          aria-label="Scroll to top"
        >
          <ArrowUp size={18} />
        </button>
      {/if}

      <button
        class="p-3 rounded-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 dark:shadow-indigo-500/20 active:scale-95 transition-all cursor-pointer"
        title="Add Transaction"
        onclick={() => handleAddTransaction()}
      >
        <Plus size={20} />
      </button>
    </div>
  </div>
{/if}
