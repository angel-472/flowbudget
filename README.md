# 💰 FlowBudget

> **A modern, intuitive weekly budget tracking application built with Svelte 5**

FlowBudget helps you take control of your finances with a fresh approach to budgeting. Instead of overwhelming monthly overviews, FlowBudget focuses on manageable weekly periods, making it easier to track spending patterns and stay on budget.

[![Built with Svelte 5](https://img.shields.io/badge/Svelte-5-ff3e00?style=flat&logo=svelte)](https://svelte.dev/)
[![Powered by Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)
[![Styled with Tailwind](https://img.shields.io/badge/Tailwind-38BDF8?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Icons by Lucide](https://img.shields.io/badge/Lucide-000?style=flat&logo=lucide&logoColor=white)](https://lucide.dev/)

**🚀 Try FlowBudget Live Demo:**  
Experience all features in your browser — no install required!  
👉 [flowbudget.pages.dev](https://flowbudget.pages.dev/)

## ✨ Features

### 📅 **Week-Based Budgeting**
- **Apple Calendar Compatible**: Uses Sunday-Saturday week system for familiar navigation
- **Monthly Overview**: See all weeks in a month at a glance
- **Smart Date Handling**: Automatic week number calculation and date range display

### 💸 **Transaction Management**
- **Quick Entry**: Add income and expenses with intuitive forms
- **Real-time Updates**: Instant UI updates with optimistic rendering
- **Status Tracking**: Mark transactions as pending or completed
- **Smart Sorting**: Transactions automatically sorted by date
- **Edit & Delete**: Full CRUD operations with confirmation modals

### 🎨 **Modern UI/UX**
- **Glassmorphism Design**: Beautiful frosted glass effects throughout
- **Dark Mode Support**: Seamless light/dark theme switching with system preference detection
- **Responsive Layout**: Optimized for desktop and mobile devices
- **Animated Backgrounds**: Canvas-based particle animations for visual appeal
- **Gradient Accents**: Beautiful gradient text and buttons

### 🔐 **Secure Authentication**
- **Supabase Auth**: Secure email/password authentication
- **Row Level Security**: Database-level security for user data isolation
- **Session Management**: Automatic login state persistence

## 🎨 Design Philosophy

FlowBudget embraces a **week-centric approach** to budgeting because:

1. **Manageable Timeframes**: Weekly cycles are easier to mentally track than monthly
2. **Regular Check-ins**: Encourages frequent budget reviews
3. **Flexible Planning**: Adapt spending patterns within shorter periods
4. **Reduced Overwhelm**: Smaller data sets are less intimidating

The UI prioritizes **clarity and efficiency**:
- Glassmorphism effects create depth without distraction
- Consistent color coding (green for income, red for expenses)
- Minimal cognitive load with intuitive interactions


## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or pnpm

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/angel-472/flowbudget.git
   cd flowbudget
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:8001`


## 🎯 Core Architecture

### **Svelte 5 Runes System**
FlowBudget leverages Svelte 5's new reactivity system:
- `$state()` - Local component state management
- `$derived()` - Computed values that automatically update
- `$props()` - Type-safe component properties

### **Signal-Based Communication**
A custom signal system enables efficient communication across modules:
```javascript
signal.emit("UPDATE_TRANSACTION", { transaction });
signal.sub("REFRESH_MONTH_VIEW", componentId, callback);
```

## 🛠️ Development

### **Available Scripts**

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to Cloudflare Pages
npm run deploy
```

### **Key Technologies**

- **Frontend**: Svelte 5, Vite, TailwindCSS 4
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Icons**: Lucide Svelte
- **Deployment**: Cloudflare Pages
- **Styling**: TailwindCSS with custom glassmorphism components

### **Database Schema**

```sql
-- Transactions table
create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  type text check (type in ('incomes', 'expenses')),
  description text not null,
  amount decimal(10,2) not null,
  category text,
  date date not null,
  status text check (status in ('pending', 'done')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now())
);
```

## 📱 Browser Support

- ✅ Chrome/Chromium 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 📄 License

This project is licensed under the MIT License – see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Svelte Team](https://svelte.dev/) – For the amazing framework
- [Supabase](https://supabase.com/) – For the backend infrastructure
- [Tailwind CSS](https://tailwindcss.com/) – For the utility-first styling
- [Lucide](https://lucide.dev/) – For the beautiful icons
- [GitHub Copilot Pro](https://github.com/features/copilot) – For AI-powered coding assistance and technical writing

---

<div align="center">

**Built with ❤️ by [github.com/angel-472](https://github.com/angel-472)**

*Empowering better financial habits, one week at a time.*

</div>
