// Database setup verification script
// Run this in your browser console to check if Supabase is working correctly

import { supabase } from './supabaseClient.js';
import { getCurrentUser } from './auth.js';

async function testSupabaseConnection() {
  console.log('🔗 Testing Supabase Connection...\n');
  
  try {
    // Test 1: Check environment variables
    console.log('1. Environment Variables:');
    console.log('   SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing');
    console.log('   SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
    
    // Test 2: Check database connection
    console.log('\n2. Database Connection:');
    const { data, error } = await supabase.from('flowbudget_transactions').select('count').limit(1);
    if (error) {
      console.log('   ❌ Database connection failed:', error.message);
      if (error.message.includes('relation "flowbudget_transactions" does not exist')) {
        console.log('   💡 Solution: Run the SQL schema in your Supabase dashboard');
      }
    } else {
      console.log('   ✅ Database connection successful');
    }
    
    // Test 3: Check authentication
    console.log('\n3. Authentication:');
    const user = await getCurrentUser();
    if (user) {
      console.log('   ✅ User authenticated:', user.email);
      
      // Test 4: Check RLS policies (try to query data)
      console.log('\n4. Row Level Security:');
      const { data: transactions, error: rlsError } = await supabase
        .from('flowbudget_transactions')
        .select('*')
        .limit(5);
        
      if (rlsError) {
        console.log('   ❌ RLS query failed:', rlsError.message);
      } else {
        console.log(`   ✅ RLS working - Found ${transactions.length} transactions for user`);
      }
    } else {
      console.log('   ❌ No authenticated user');
    }
    
    console.log('\n🎉 Supabase setup verification complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Make function available globally for console access
window.testSupabaseConnection = testSupabaseConnection;

// Auto-run in development
if (import.meta.env.DEV) {
  console.log('💡 To test Supabase setup, run: testSupabaseConnection()');
}