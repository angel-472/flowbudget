# FlowBudget Architecture Analysis for Svelte Migration

## 📋 Executive Summary

This document provides a comprehensive architectural analysis of the current FlowBudget React application to facilitate a complete rewrite in Svelte. Rather than providing migration code, this focuses on understanding the application's data flow, component relationships, and core business logic to inform a ground-up Svelte implementation.

## 🎯 Application Overview

FlowBudget is a **weekly-based budget tracking application** with the following core characteristics:

- **Week-centric Design**: Everything revolves around Sunday-to-Saturday weeks
- **Apple Calendar Compatibility**: Week numbering matches Apple's calendar system
- **Cross-month Weeks**: Weeks can span multiple months (e.g., W40 appears in October view)
- **Real-time Sync**: Supabase backend with authentication and Row Level Security
- **Client-side Caching**: 5-minute cache system to avoid database reloads
- **Dark Mode Support**: System preference detection with manual toggle
- **Responsive Design**: Mobile-first with TailwindCSS

## 🏗️ Core Application Architecture

### Data Flow Overview
The application follows a **unidirectional data flow pattern** with these key elements:

1. **Authentication Layer**: Controls access to the entire application
2. **Cache Management**: Prevents unnecessary database calls
3. **State Management**: React hooks managing transactions, UI state, and cache
4. **Component Hierarchy**: Nested components with prop drilling and callback functions
5. **API Layer**: Supabase integration with error handling

### Application State Structure
The app maintains several distinct state domains:

#### **Authentication State**
- `user` object (from Supabase auth)
- Authentication status (loading, signed in, signed out)
- Managed by AuthWrapper component

#### **Date/Navigation State**
- `currentYear`, `currentMonth` (controls which data to fetch)
- `view` state ('dashboard' or 'month')
- Month options for navigation (last 12 months)

#### **Data State**
- `transactions` (current month's week data)
- `prevTransactions` (previous month's data for dashboard comparison)
- `loading`, `error` states for async operations

#### **UI State**
- `darkMode` (persisted to localStorage)
- Form open/close states
- Cache status indicators

#### **Cache State**
- `budgetCache` (Map object with user-year-month keys)
- Cache entries contain: data, timestamp, expiresAt
- 5-minute expiration policy

## 🔄 Data Architecture Deep Dive

### Week-Based Data Model
The entire application is built around this fundamental data structure:

**Week Object Structure:**
- `weekNumber`: Integer (1-53, Apple Calendar compatible)
- `dateRange`: String display ("28 Sep – 4 Oct")
- `startDate`, `endDate`: ISO string dates (full week boundaries)
- `incomes[]`: Array of income transactions
- `expenses[]`: Array of expense transactions

**Transaction Object Structure:**
- `id`: UUID (database primary key)
- `user_id`: UUID (references auth.users)
- `type`: "incomes" | "expenses"
- `description`: String (user input)
- `amount`: Decimal number
- `date`: YYYY-MM-DD string
- `category`: String (optional)
- `status`: "pending" | "done"
- `created_at`, `updated_at`: Timestamps

### Week Calculation Logic
The application implements a complex week numbering system:

**Key Principles:**
- Weeks always start on Sunday, end on Saturday
- Week 1 includes January 1st (even if partial week)
- Sequential numbering throughout the year (no week 0)
- Cross-month weeks appear in both month views

**Date Range Calculation:**
- Find first Sunday on/before January 1st
- Calculate week start by adding (weekNumber - 1) * 7 days
- Week end is always start + 6 days

**Month Structure Generation:**
- Find all weeks that overlap with target month
- Include partial weeks that cross month boundaries
- Sort by week number for consistent display

### Cache Architecture
The caching system implements a sophisticated strategy:

**Cache Key Structure:** `${userId}-${year}-${month}`
**Cache Entry Structure:**
- `data`: The actual week data array
- `timestamp`: When cached (for age calculation)
- `expiresAt`: Absolute expiration time

**Cache Behaviors:**
- 5-minute expiration per entry
- Automatic cache hits logged with age
- Cache misses trigger database fetch
- Cache invalidation on data mutations
- Both current and previous month cached

## 🎭 Component Architecture Analysis

### Component Hierarchy & Responsibilities

#### **App.jsx** (Root Application)
**Primary Responsibilities:**
- Top-level state management (all useState hooks)
- Authentication integration via user prop
- Cache management functions
- Month/year navigation logic
- Dark mode persistence
- Main layout and routing between dashboard/month view

**Key State Management:**
- Manages 10+ pieces of state
- Complex useEffect dependencies for data fetching
- useMemo for derived calculations
- useCallback for cache functions

**Data Flow Control:**
- Receives user from AuthWrapper
- Fetches budget data on mount and date changes
- Passes data down via props
- Receives callbacks from child components

#### **AuthWrapper.jsx** (Authentication Guard)
**Primary Responsibilities:**
- Authentication state management
- Sign up/sign in/sign out flows
- Session persistence
- Loading states during auth checks
- Auth form UI with validation

**Key Features:**
- Function-as-children pattern for user injection
- Dark mode toggle (independent of main app)
- Form validation and error handling
- Responsive design with mobile support

#### **Dashboard.jsx** (Overview Screen)
**Primary Responsibilities:**
- Monthly financial overview display
- Current vs previous month comparisons
- Visual charts and trend indicators
- Quick navigation to month view

**Data Dependencies:**
- `monthlyBudget` (current month totals)
- `prevMonthlyBudget` (previous month totals)
- Date navigation functions

**UI Features:**
- Three-column metric cards (income, expenses, net)
- Trend indicators with icons and percentages
- Interactive bar chart visualization
- Responsive grid layout

#### **MonthView.jsx** (Month Detail Screen)
**Primary Responsibilities:**
- Display all weeks in selected month
- Month navigation controls
- Monthly summary footer
- Container for WeekCard components

**Data Flow:**
- Receives transactions array (weeks)
- Passes individual week data to WeekCard
- Handles month navigation callbacks
- Calculates and displays monthly totals

#### **WeekCard.jsx** (Week Container)
**Primary Responsibilities:**
- Display single week information
- Week header with number and date range
- Container for TransactionList components
- Add transaction button and modal
- Weekly totals calculation and display

**State Management:**
- Local state for form modal open/close
- useMemo for weekly totals calculation
- Passes transaction callbacks up to parent

**UI Structure:**
- Header with week number and date range
- Two-column layout for incomes/expenses
- Footer with net total
- Modal overlay for transaction form

#### **TransactionList.jsx** (Transaction Display)
**Primary Responsibilities:**
- Render transactions in table format
- Sort transactions by date
- Handle transaction actions (toggle status, delete)
- Empty state handling
- Duplicate detection debugging

**Key Features:**
- Type-specific styling (green for income, red for expenses)
- Date sorting and formatting
- Action buttons with icons
- Responsive table design
- Key-based rendering for React optimization

#### **TransactionForm.jsx** (Add/Edit Form)
**Primary Responsibilities:**
- Transaction input form
- Form validation
- Date-based week calculation
- Dynamic week target display
- Form submission handling

**Complex Logic:**
- Real-time week number calculation based on date
- Cross-month transaction warnings
- Form validation with error display
- Date defaults based on current week

#### **CacheStatus.jsx** (Developer Tool)
**Primary Responsibilities:**
- Display cache hit/miss status
- Show cache age and expiration
- Visual indicators for cache state
- Development debugging aid

**Cache State Display:**
- Current cache status for active month
- Age calculation and display
- Expiration countdown
- Icon-based status indicators

### Component Communication Patterns

#### **Props Down, Callbacks Up**
The application uses traditional React patterns:
- Data flows down through props
- User actions bubble up through callback functions
- State is lifted to common ancestors

#### **Event Handler Patterns**
- `onAddTransaction` - Bubbles from form to App
- `onRemoveTransaction` - Bubbles from list to App
- `onToggleStatus` - Bubbles from list to App
- `setError` - Error handling callback
- `setDate` - Navigation callback

#### **Derived State Calculations**
- Monthly totals calculated from transaction arrays
- Weekly totals calculated in individual components
- Cache status derived from cache Map and current date

## 🔌 API & External Integration Architecture

### Supabase Integration Layer

#### **supabaseClient.js** (Database Client)
**Configuration:**
- Environment variable validation
- Client configuration with auth settings
- Error handling utilities
- Current user helpers

#### **budgetApi.js** (Data Access Layer)
**Key Functions:**
- `addTransaction` - Create new transaction
- `deleteTransaction` - Remove transaction by ID
- `toggleTransactionStatus` - Update status field
- `getTransactionsByWeek` - Fetch week data
- `getTransactionsByMonth` - Fetch month structure
- `fetchOrCreateMonthBudget` - Main data fetching function

**Important Patterns:**
- All functions return Promises
- Automatic user ID handling via RLS
- Date range queries with timezone handling
- Week structure generation logic
- Error handling with descriptive messages

#### **auth.js** (Authentication Layer)
**Authentication Functions:**
- `signUp`, `signIn`, `signOut` - Auth flows
- `getCurrentUser` - Session checking
- `onAuthStateChange` - Auth event listener
- `resetPassword`, `updatePassword` - Password management

### Database Schema Understanding

#### **Row Level Security (RLS)**
- All queries automatically filtered by authenticated user
- No need to pass user IDs in most API calls
- Database enforces data isolation

#### **Transaction Table Structure**
- Flat storage (no week grouping in database)
- Date-based queries for week/month data
- Week structure built in application layer
- Optimized indexes for date range queries

## 🎨 UI Architecture & Styling

### TailwindCSS Implementation
**Styling Strategy:**
- Utility-first CSS approach
- Dark mode via class toggling
- Responsive design with mobile-first breakpoints
- Component-level styling (no global CSS)

**Dark Mode System:**
- System preference detection
- LocalStorage persistence
- Document class manipulation
- Component-level dark: prefixes

### Icon System (Lucide React)
**Icon Usage Patterns:**
- Functional icons for actions (Plus, Trash2, Check, Circle)
- Navigation icons (Home, ChevronLeft, ChevronRight)
- Status icons (Sun, Moon, Database, Clock)
- Trend indicators (TrendingUp, TrendingDown)

### Responsive Design Strategy
**Breakpoint Usage:**
- Mobile-first design approach
- Grid layouts for dashboard metrics
- Table overflow for transaction lists
- Modal overlays for forms
- Sidebar navigation on desktop

## 📊 Business Logic Architecture

### Financial Calculations
**Weekly Totals Logic:**
- Sum all incomes in week
- Sum all expenses in week
- Calculate net (income - expense)
- Color coding based on positive/negative

**Monthly Totals Logic:**
- Aggregate all weekly totals
- Compare current vs previous month
- Percentage change calculations
- Trend indicator logic

### Week Management Logic
**Week Number Calculation:**
- Apple Calendar compatibility algorithm
- January 1st always in Week 1
- Sunday-based week boundaries
- Cross-year week handling

**Month Structure Generation:**
- Find overlapping weeks for month
- Include partial weeks at month boundaries
- Sort weeks numerically
- Generate display date ranges

### Transaction Management
**Optimistic Updates:**
- Immediate UI updates for user feedback
- Database persistence in background
- Rollback on failure
- Duplicate prevention at multiple levels

**Cache Invalidation:**
- Cache updates on successful mutations
- Expiration-based automatic refresh
- Manual cache clearing capabilities

## 🔄 State Management Patterns

### React Hooks Usage
**useState Patterns:**
- Primitive state for simple values
- Object state for complex data
- Array state for collections
- Map state for cache storage

**useEffect Patterns:**
- Data fetching on mount and dependency changes
- Cleanup for auth listeners
- DOM manipulation for dark mode
- Cache expiration checking

**useMemo Patterns:**
- Expensive calculations (monthly totals)
- Derived state (month options)
- Date objects (today reference)

**useCallback Patterns:**
- Cache management functions
- Event handlers passed to children
- API call functions

### State Update Patterns
**Immutable Updates:**
- Spread operators for object updates
- Array methods that return new arrays
- Map constructor for cache updates
- State updater functions for complex changes

**Async State Management:**
- Loading flags for async operations
- Error state for failure handling
- Success state for user feedback
- Optimistic updates for perceived performance

## 🚧 Error Handling Architecture

### Error Boundaries
**Error Types:**
- Network errors (Supabase connectivity)
- Authentication errors (session expiry)
- Validation errors (form input)
- Application errors (unexpected states)

**Error Display:**
- Toast-style error messages
- Form field validation errors
- Loading state error handling
- Network connectivity feedback

### Data Validation
**Client-side Validation:**
- Form input validation
- Data type checking
- Range validation (positive amounts)
- Required field validation

**Server-side Validation:**
- Database constraints
- RLS policy enforcement
- Data sanitization
- Type coercion

## 📱 User Experience Architecture

### Navigation Patterns
**Route-less Navigation:**
- State-based view switching
- No URL routing (single-page app)
- Sidebar navigation for months
- Breadcrumb-style navigation

**User Flow Patterns:**
- Dashboard → Month View → Week transactions
- Quick add from any week
- Easy month switching
- Persistent user preferences

### Interaction Patterns
**Form Interactions:**
- Modal-based transaction forms
- Real-time validation feedback
- Auto-focus on form elements
- Keyboard navigation support

**Data Interactions:**
- Click to toggle transaction status
- Hover effects for interactive elements
- Loading states for async actions
- Optimistic UI updates

## 🔧 Development & Build Architecture

### Vite Configuration
**Build Setup:**
- React plugin for JSX support
- TailwindCSS integration
- HMR disabled (stability preference)
- Development server on port 8001

### Environment Management
**Environment Variables:**
- Supabase URL and keys
- Development vs production configs
- Secret management
- Environment validation

### Code Organization
**File Structure Strategy:**
- Component-based organization
- Utility function separation
- API layer isolation
- Clear separation of concerns

This architectural analysis provides the foundation for understanding how FlowBudget works internally, making it easier to design and implement a Svelte version that maintains the same functionality while leveraging Svelte's strengths.