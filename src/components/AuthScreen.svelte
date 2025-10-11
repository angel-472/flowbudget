<script>
  import { Sun, Moon, Mail, Lock, EyeOff, Eye, UserPlus, LogIn } from 'lucide-svelte';
  import { signIn, signUp } from '/src/api/auth.js';

  let isSignUp = $state(false);
  let email = $state('');
  let password = $state('');
  let showPassword = $state(false);
  let confirmPassword = $state('');
  let showConfirmPassword = $state(false);
  let error = $state('');
  let isSubmitting = $state(false);

  //Handle submit
  async function handleSubmit() {
    isSubmitting = true;
    error = '';

    try {
      if (isSignUp) {
        // Sign up logic
        if (password !== confirmPassword) {
          error = 'Passwords do not match.';
          isSubmitting = false;
          return;
        }
        let result = await signUp(email, password);
        console.log(`Sign up result: `, result);
      } else {
        // Sign in logic
        let result = await signIn(email, password);
        console.log(`Sign in result: `, result);
      }
    } catch (err) {
      error = 'An error occurred. Please try again.';
      if(err.message.includes('Invalid login credentials')) {
        error = 'Invalid email or password. Please try again.';
      }
      else if(err.message.includes('Email not confirmed')) {
        error = 'Your email is not confirmed. Please check your inbox before signing in.';
      }
    } finally {
      isSubmitting = false;
    }
  }
</script>


<div class={`min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950 transition-colors duration-300 `}>
  <div class="max-w-md w-full mx-4">
    <!-- Auth Card -->
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <!-- Header -->
      <div class="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-700 dark:to-purple-700 px-8 py-8 text-center">
        <h1 class="text-3xl font-black text-white mb-2">FlowBudget</h1>
        <p class="text-indigo-100 dark:text-indigo-200 font-medium">
          {#if isSignUp}
            Create your account
          {:else}
            Welcome back
          {/if}
        </p>
      </div>

      <!-- Form -->
      <div class="px-8 py-8">
        <form onsubmit={(e) => {e.preventDefault(); handleSubmit(); }} class="space-y-6">
          <!-- Email Field -->
          <div>
            <label for="email" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={18} class="text-gray-400 dark:text-gray-500" />
              </div>
              <input
                id="email"
                type="email"
                required
                bind:value={email}
                class="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Enter your email"
                autocomplete="email"
              />
            </div>
          </div>

          <!-- Password Field -->
          <div>
            <label for="password" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={18} class="text-gray-400 dark:text-gray-500" />
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                bind:value={password}
                class="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Enter your password"
                autocomplete="current-password"
              />
              <button
                type="button"
                onclick={() => showPassword = !showPassword}
                class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                {#if showPassword}
                  <EyeOff size={18} />
                {:else}
                  <Eye size={18} />
                {/if}
              </button>
            </div>
          </div>

          <!-- Confirm Password Field (Sign Up Only) -->
          {#if isSignUp}
            <div>
              <label for="confirmPassword" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Confirm Password
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} class="text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  bind:value={confirmPassword}
                  class="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="Confirm your password"
                  autocomplete="confirm-password"
                />
                <button
                  type="button"
                  onclick={() => showConfirmPassword = !showConfirmPassword}
                  class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {#if showConfirmPassword}
                    <EyeOff size={18} />
                  {:else}
                    <Eye size={18} />
                  {/if}
                </button>
              </div>
            </div>
          {/if}

          <!-- Error Message -->
          {#if error}
            <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <p class="text-red-600 dark:text-red-400 text-sm font-medium">{error}</p>
            </div>
          {/if}

          <!-- Submit Button -->
          <button
            type="submit"
            disabled={isSubmitting}
            class="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.98]"
          >
            {#if isSubmitting}
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {isSignUp ? 'Creating Account...' : 'Signing In...'}
            {:else}
              {#if isSignUp}
                <UserPlus size={18} class="mr-2" />
                Create Account
              {:else}
                <LogIn size={18} class="mr-2" />
                Sign In
              {/if}
            {/if}
          </button>
        </form>

        <!-- Toggle Sign Up/Sign In -->
        <div class="mt-8 text-center">
          <button
            onclick={() => {
              isSignUp = !isSignUp;
              error = '';
              confirmPassword = '';
              showPassword = false;
              showConfirmPassword = false;
            }}
            class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 text-sm font-semibold transition-colors duration-200"
          >
            {#if isSignUp}
              Already have an account? Sign in
            {:else}
              Don't have an account? Create Account
            {/if}
          </button>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="text-center mt-8">
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Effortlessly manage your weekly budget and cash flow.
      </p>
    </div>
  </div>
</div>