<script>
  import { Moon, Sun, LogOut } from "lucide-svelte"
    import MonthView from "./components/MonthView.svelte";
    import AuthScreen from "./components/AuthScreen.svelte";
    import { getCurrentUser, onAuthStateChange, signOut } from "./api/auth";

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
    isLoading = false;
    console.log("User ID:", userId, user);
  });
  let currentView = $state("month"); // Possible values: "month", "dashboard", "settings"

  onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
      user = session.user;
      userId = session.user.id;
      console.log("User signed in:", userId);
    } else if (event === 'SIGNED_OUT') {
      user = null;
      userId = null;
      console.log("User signed out");
    }
  });

  async function handleSignOut() {
    await signOut();
    userId = null;
    console.log("User signed out");
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
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
    <header class="sticky top-0 z-20 bg-white dark:bg-gray-800 shadow-md px-4 py-2 flex items-center justify-between">
      <!-- App Name -->
      <h1 class="text-xl font-black text-indigo-600 dark:text-indigo-400">FlowBudget</h1>
      <!-- Future navigation or user profile elements can go here -->
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-600 dark:text-gray-500 hidden md:block">{user.email}</span>
        <button
          onclick={toggleDarkMode}
          class="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
          title="Toggle Dark Mode"
        >
          {#if darkMode}
            <Sun width={18} height={18} />
          {:else}
            <Moon width={18} height={18} />
          {/if}
        </button>
        <button
          class="text-sm text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300 font-semibold p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
          onclick={handleSignOut}
          title="Sign Out"
        >
          <LogOut size={18} />
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
