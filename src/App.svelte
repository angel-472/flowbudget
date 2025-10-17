<script>
  import { Moon, Sun, LogOut } from "lucide-svelte"
    import MonthView from "./components/MonthView.svelte";
    import TransactionForm from './components/TransactionForm.svelte';
    import AuthScreen from "./components/AuthScreen.svelte";
    import { getCurrentUser, onAuthStateChange, signOut } from "./api/auth";
    import { signal } from "./api/signal";
    import { budgetApi } from "./api/budgetApi";

  //
  // Dark mode state management
  // 
  let darkMode = $state(false);

  // Check localStorage or system preference for initial dark mode value
  if (localStorage.getItem('darkMode') !== null) {
    darkMode = localStorage.getItem('darkMode') === 'true';
    // svelte-ignore state_referenced_locally
    document.documentElement.classList.toggle('dark', darkMode);
    // svelte-ignore state_referenced_locally
    console.log(`${darkMode ? '🌙' : '☀️'} Dark mode from localStorage: ${darkMode ? 'Enabled' : 'Disabled'}`);
  } else {
    darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    // svelte-ignore state_referenced_locally
    document.documentElement.classList.toggle('dark', darkMode);
    // svelte-ignore state_referenced_locally
    console.log(`${darkMode ? '🌙' : '☀️'} System preference for dark mode: ${darkMode ? 'Enabled' : 'Disabled'}`);
  }

  function toggleDarkMode() {
    darkMode = !darkMode;
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  };

  // 
  // User authentication state
  // 
  let user = $state(null);
  let userId = $derived(user ? user.id : null);
  let isLoading = $state(true);
  getCurrentUser().then(currentUser => {
    user = currentUser;
    if(user == null){
      isLoading = false; // stops loading to allow use of auth screen
    }
  });
  let currentView = $state("month"); // Possible values: "month", "dashboard", "settings"

  onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
      isLoading = true; // wait for database sync
      user = session.user;
      userId = session.user.id;
      console.log("User signed in:", userId);
      budgetApi.fetchAllTransactions().then(() => {
        isLoading = false; // stops loading screen when transactions are fetched after sign in
      }); // Fetches all transactions, not that scalable but fine for demo purposes
    } else if (event === 'SIGNED_OUT') {
      user = null;
      userId = null;
      console.log("User signed out");
    }
  });

  async function handleSignOut() {
    await signOut();
    userId = null;
    console.log("User signed out 😡");
  }
</script>

<!-- TODO: Show something while isLoading -->
{#if isLoading}
  <div class="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
  </div>
{:else if !user}
  <AuthScreen />
{:else}
  <TransactionForm />
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
    <header class="sticky top-0 z-20 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-lg px-5 py-3 flex items-center justify-between border-b border-gray-200/30 dark:border-gray-700/30">
      <!-- App Name -->
      <h1 class="text-xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">FlowBudget</h1>
      
      <!-- Header options -->
      <div class="flex items-center gap-3">
        <!-- User email -->
        <div class="hidden md:flex items-center px-4 py-1.5 rounded-full bg-gray-50/70 dark:bg-gray-700/50 border border-gray-200/50 dark:border-gray-600/30 shadow-sm backdrop-blur-sm">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{user.email}</span>
        </div>
        
        <!-- Dark mode toggle -->
        <button
          onclick={toggleDarkMode}
          class="p-2 rounded-full text-gray-700 dark:text-gray-200 hover:bg-gray-100/70 dark:hover:bg-gray-700/70 transition-all duration-300 shadow-sm border border-gray-200/50 dark:border-gray-600/30 backdrop-blur-sm cursor-pointer"
          title="Toggle Dark Mode"
        >
          {#if darkMode}
            <Sun width={18} height={18} class="drop-shadow-sm" />
          {:else}
            <Moon width={18} height={18} class="drop-shadow-sm" />
          {/if}
        </button>
        
        <!-- Sign out button -->
        <button
          class="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300 font-medium py-1.5 px-3 rounded-lg hover:bg-red-50/70 dark:hover:bg-red-900/30 transition-all duration-300 shadow-sm border border-red-200/50 dark:border-red-800/30 backdrop-blur-sm cursor-pointer"
          onclick={handleSignOut}
          title="Sign Out"
        >
          <LogOut size={18} class="drop-shadow-sm" />
          <span class="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
    <main>
      {#if currentView === "month"}
        <MonthView />
      {:else if currentView === "dashboard"}
        <h2 class="text-center text-2xl font-bold text-gray-800 dark:text-gray-200 p-4">Dashboard</h2>
        <!-- Dashboard component would go here -->
      {:else if currentView === "settings"}
        <h2 class="text-center text-2xl font-bold text-gray-800 dark:text-gray-200 p-4">Settings</h2>
        <!-- Settings component would go here -->
      {/if}
    </main>
  </div>
{/if}
