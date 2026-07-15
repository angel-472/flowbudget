import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Debug environment variables
console.log('🔧 Supabase Environment Debug:', {
  url: supabaseUrl ? '✅ URL loaded' : '❌ URL missing',
  key: supabaseAnonKey ? '✅ Key loaded' : '❌ Key missing',
  env: import.meta.env.MODE
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Environment variables:', {
    VITE_SUPABASE_URL: supabaseUrl,
    VITE_SUPABASE_ANON_KEY: supabaseAnonKey ? '[HIDDEN]' : undefined,
    allEnvVars: Object.keys(import.meta.env).filter(key => key.startsWith('VITE_'))
  });
  throw new Error('Missing Supabase environment variables. Please check your .env file and restart the dev server.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'flowbudget@1.0.0'
    }
  }
})

// Helper function to handle Supabase errors
export function handleSupabaseError(error) {
  if (error) {
    console.error('Supabase error:', error)
    throw new Error(error.message || 'Database operation failed')
  }
}

// Helper function to get current user ID
export async function getCurrentUserId() {
  const { data: { user }, error } = await supabase.auth.getUser()
  handleSupabaseError(error)
  
  if (!user) {
    throw new Error('User not authenticated')
  }
  
  return user.id
}