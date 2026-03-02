<script>
  import { Mail, Lock, EyeOff, Eye } from 'lucide-svelte';
  import { signIn, signUp } from '/src/api/auth.js';

  let isSignUp = $state(false);
  let email = $state('');
  let password = $state('');
  let showPassword = $state(false);
  let confirmPassword = $state('');
  let showConfirmPassword = $state(false);
  let error = $state('');
  let isSubmitting = $state(false);

  async function handleSubmit() {
    isSubmitting = true;
    error = '';

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          error = 'Passwords do not match.';
          isSubmitting = false;
          return;
        }
        let result = await signUp(email, password);
        isSignUp = false;
      } else {
        let result = await signIn(email, password);
      }
    } catch (err) {
      if (err.message.includes('Invalid login credentials')) {
        error = 'Invalid email or password.';
      } else if (err.message.includes('Email not confirmed')) {
        error = 'Please confirm your email before signing in.';
      } else if (err.message.includes('User already exists')) {
        error = 'An account with this email already exists.';
      } else if (err.message.includes('Password should be at least')) {
        error = 'Password must be at least 8 characters.';
      } else {
        error = 'Something went wrong. Please try again.';
      }
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="min-h-screen flex items-center justify-center px-4">
  <div class="w-full max-w-sm">
    <!-- Logo & title -->
    <div class="text-center mb-8">
      <h1 class="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">FlowBudget</h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {isSignUp ? 'Create your account' : 'Sign in to your account'}
      </p>
    </div>

    <!-- Card -->
    <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
      <form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-4">
        <!-- Email -->
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Email
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail size={16} class="text-gray-400" />
            </div>
            <input
              id="email"
              type="email"
              required
              bind:value={email}
              class="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
              placeholder="you@example.com"
              autocomplete="email"
            />
          </div>
        </div>

        <!-- Password -->
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Password
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock size={16} class="text-gray-400" />
            </div>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              bind:value={password}
              class="w-full pl-9 pr-10 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
              placeholder="Enter password"
              autocomplete="current-password"
            />
            <button
              type="button"
              onclick={() => showPassword = !showPassword}
              class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              {#if showPassword}
                <EyeOff size={16} />
              {:else}
                <Eye size={16} />
              {/if}
            </button>
          </div>
        </div>

        <!-- Confirm Password -->
        {#if isSignUp}
          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Confirm Password
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={16} class="text-gray-400" />
              </div>
              <!-- svelte-ignore a11y_autocomplete_valid -->
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                bind:value={confirmPassword}
                class="w-full pl-9 pr-10 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                placeholder="Confirm password"
                autocomplete="confirm-password"
              />
              <button
                type="button"
                onclick={() => showConfirmPassword = !showConfirmPassword}
                class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                {#if showConfirmPassword}
                  <EyeOff size={16} />
                {:else}
                  <Eye size={16} />
                {/if}
              </button>
            </div>
          </div>
        {/if}

        <!-- Error -->
        {#if error}
          <div class="rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 px-3 py-2.5">
            <p class="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        {/if}

        <!-- Submit -->
        <button
          type="submit"
          disabled={isSubmitting}
          class="w-full py-2 px-4 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all cursor-pointer"
        >
          {#if isSubmitting}
            <span class="flex items-center justify-center gap-2">
              <div class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
              {isSignUp ? 'Creating Account...' : 'Signing In...'}
            </span>
          {:else}
            {isSignUp ? 'Create Account' : 'Sign In'}
          {/if}
        </button>
      </form>
    </div>

    <!-- Toggle mode -->
    <p class="text-center mt-6 text-sm text-gray-500 dark:text-gray-400">
      {isSignUp ? 'Already have an account?' : "Don't have an account?"}
      <button
        onclick={() => {
          isSignUp = !isSignUp;
          error = '';
          confirmPassword = '';
          showPassword = false;
          showConfirmPassword = false;
        }}
        class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-medium ml-1 transition-colors"
      >
        {isSignUp ? 'Sign In' : 'Create Account'}
      </button>
    </p>

    <p class="text-center mt-4 text-xs text-gray-400 dark:text-gray-500">
      Manage your weekly budget and cash flow.
    </p>
  </div>
</div>