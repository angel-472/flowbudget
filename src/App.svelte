<script>
  import { Moon, Sun, LogOut, ArrowUp, Plus } from "lucide-svelte"
  import { onMount } from "svelte";
  import MonthView from "./components/MonthView.svelte";
  import TransactionForm from './components/TransactionForm.svelte';
  import AuthScreen from "./components/AuthScreen.svelte";
  import { getCurrentUser, onAuthStateChange, signOut } from "./api/auth";
  import { signal } from "./api/signal";
  import { budgetApi } from "./api/budgetApi.svelte.js";
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
  let user = $state(null);
  let userId = $derived(user ? user.id : null);
  let isLoading = $state(true);
  getCurrentUser().then(currentUser => {
    user = currentUser;
    if (user == null) isLoading = false;
  });
  let currentView = $state("month");

  onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && user == null) {
      isLoading = true;
      user = session.user;
      userId = session.user.id;
      budgetApi.fetchAllTransactions().then(() => {
        isLoading = false;
      });
    } else if (event === 'SIGNED_OUT') {
      user = null;
      userId = null;
    }
  });

  async function handleSignOut() {
    await signOut();
    userId = null;
  }
  
  // ── Scroll to top ──
  let showScrollButton = $state(false);
  
  onMount(() => {
    const handleScroll = () => {
      showScrollButton = window.scrollY > 600;
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  });
  
  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

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
  <div class="min-h-screen">
    <!-- Header -->
    <header class="sticky top-0 z-20 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6">
      <div class="flex items-center justify-between h-14 max-w-5xl mx-auto">
        <h1 class="text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-100">FlowBudget</h1>
        
        <div class="flex items-center gap-1">
          <span class="hidden md:block text-sm text-gray-500 dark:text-gray-400 mr-2">{user.email}</span>
          
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
