# FlowBudget Supabase Migration Guide

## 🚀 Setup Instructions

### 1. Environment Variables
Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 2. Database Setup
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `database-schema.sql`
4. Run the SQL script to create tables and security policies

### 3. Authentication Setup
In your Supabase dashboard:
1. Go to Authentication > Settings
2. Ensure "Enable email confirmations" is configured as needed
3. Set up any additional auth providers if desired

### 4. Row Level Security (RLS)
The database schema automatically sets up RLS policies that ensure:
- Users can only see their own transactions
- All CRUD operations are restricted to the authenticated user
- Data is automatically filtered by `user_id`

## 🔄 Migration Process

### Option 1: Automatic Migration (Recommended)
1. Start your app: `npm run dev`
2. Sign up/sign in to create a user account
3. Open browser console
4. Run: `runMigration()`
5. Follow the prompts to migrate your localStorage data

### Option 2: Manual Migration
1. Export your localStorage data:
   ```javascript
   const data = localStorage.getItem('flowbudget_transactions');
   console.log(JSON.stringify(JSON.parse(data), null, 2));
   ```
2. Use the Supabase dashboard to manually import the data

## 🔧 App Integration

### Update App.jsx
Wrap your app with the AuthWrapper component:

```javascript
import AuthWrapper from './components/AuthWrapper.jsx';
import Dashboard from './components/Dashboard.jsx';

function App() {
  return (
    <AuthWrapper>
      <Dashboard />
    </AuthWrapper>
  );
}

export default App;
```

### Update API Imports
Replace the old mockBudgetApi imports with the new budgetApi:

```javascript
// Old
import { addTransaction, deleteTransaction, toggleTransactionStatus, getTransactionsByWeek, getTransactionsByMonth } from './mockBudgetApi.js';

// New
import { addTransaction, deleteTransaction, toggleTransactionStatus, getTransactionsByWeek, getTransactionsByMonth } from './budgetApi.js';
```

## 🔒 Security Features

### Automatic Security
- **Row Level Security (RLS)**: Automatically filters data by authenticated user
- **Secure API Keys**: Environment variables keep secrets safe
- **SQL Injection Protection**: Supabase handles parameterization
- **HTTPS**: All data transmission is encrypted

### Best Practices Implemented
- Environment variables for sensitive data
- Proper error handling with user-friendly messages
- Input validation and sanitization
- Secure authentication flows
- Database indexes for performance

## 📊 Database Schema

### flowbudget_transactions Table
```sql
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key to auth.users)
- type: VARCHAR ('incomes' | 'expenses')
- category: VARCHAR (100)
- description: TEXT
- amount: DECIMAL(12, 2)
- date: DATE
- status: VARCHAR ('pending' | 'done')
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### Indexes
- user_id (for fast user filtering)
- date (for date range queries)
- type (for income/expense filtering)
- Combined user_id + date (for optimal week/month queries)

## 🎯 API Changes

All functions now return Promises and support proper error handling:

```javascript
// Before (synchronous)
const result = addTransaction(transaction, userId);

// After (asynchronous)
try {
  const result = await addTransaction(transaction, userId);
} catch (error) {
  console.error('Failed to add transaction:', error);
}
```

## 🧪 Testing

### Development Testing
1. Use browser dev tools to monitor network requests
2. Check Supabase dashboard for real-time data
3. Test offline behavior (should gracefully fail)

### Production Checklist
- [ ] Environment variables configured
- [ ] Database schema deployed
- [ ] RLS policies tested
- [ ] Authentication flows working
- [ ] Data migration completed
- [ ] localStorage backup cleared (optional)

## 🚨 Troubleshooting

### Common Issues
1. **"Missing Supabase environment variables"**
   - Check your `.env` file exists and has correct values
   - Restart dev server after adding environment variables

2. **"User not authenticated"**
   - Ensure user is signed in before making API calls
   - Check authentication state in AuthWrapper

3. **"Database operation failed"**
   - Check Supabase dashboard for error logs
   - Verify RLS policies allow the operation
   - Ensure table exists and schema matches

4. **Migration issues**
   - Check browser console for detailed error messages
   - Verify user is authenticated before migration
   - Ensure localStorage has data to migrate

### Getting Help
- Check browser console for detailed error messages
- Review Supabase dashboard logs
- Verify network connectivity to Supabase
- Test with a fresh user account