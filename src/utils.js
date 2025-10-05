// Utility functions for FlowBudget (date, currency, week calculations)

export function getWeekNumber(date) {
  // Clone the date to avoid modifying the input
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  
  // Get to the nearest Sunday in the past (or same day if it's Sunday)
  const day = d.getUTCDay();
  if (day !== 0) { // if not Sunday, go back to Sunday
    d.setUTCDate(d.getUTCDate() - day);
  }
  
  // Get first Sunday of the year
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const firstSunday = new Date(yearStart);
  const firstDay = yearStart.getUTCDay();
  if (firstDay !== 0) {
    firstSunday.setUTCDate(yearStart.getUTCDate() + (7 - firstDay));
  }
  
  // Calculate week number
  const weekNo = Math.floor((d - firstSunday) / (7 * 24 * 60 * 60 * 1000)) + 1;
  return weekNo;
}

export function getWeekDateRange(year, week) {
  // Get first Sunday of the year
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const firstDay = yearStart.getUTCDay();
  const firstSunday = new Date(yearStart);
  if (firstDay !== 0) {
    firstSunday.setUTCDate(yearStart.getUTCDate() + (7 - firstDay));
  }
  
  // Calculate start of the requested week
  const startOfWeek = new Date(firstSunday);
  startOfWeek.setUTCDate(firstSunday.getUTCDate() + (week - 1) * 7);
  
  // Calculate end of week (Saturday)
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setUTCDate(startOfWeek.getUTCDate() + 6);
  
  return { start: startOfWeek, end: endOfWeek };
}

export function generateMonthStructure(year, month) {
  const weeksMap = new Map();
  
  // Start from last Sunday of previous month
  const monthStart = new Date(year, month, 1);
  const firstDay = new Date(monthStart);
  const lastSundayOffset = firstDay.getDay();
  firstDay.setDate(firstDay.getDate() - lastSundayOffset);
  
  // End on first Saturday of next month
  const monthEnd = new Date(year, month + 1, 0);
  const lastDay = new Date(monthEnd);
  const nextSaturdayOffset = 6 - lastDay.getDay();
  lastDay.setDate(lastDay.getDate() + nextSaturdayOffset);
  
  // Iterate through all days that might be visible in this month view
  const currentDate = new Date(firstDay);
  while (currentDate <= lastDay) {
    const weekNumber = getWeekNumber(currentDate);
    
    if (!weeksMap.has(weekNumber)) {
      const { start, end } = getWeekDateRange(currentDate.getFullYear(), weekNumber);
      
      // Always show full week dates, even if they cross month boundaries
      const dateRange = `${start.getDate()} ${start.toLocaleString('en-US', { month: 'short' })} – ${end.getDate()} ${end.toLocaleString('en-US', { month: 'short' })}`;
      
      // Only include weeks that overlap with the target month
      if ((start.getMonth() <= month && start.getFullYear() <= year) ||
          (end.getMonth() >= month && end.getFullYear() >= year)) {
        weeksMap.set(weekNumber, {
          weekNumber: weekNumber,
          dateRange: dateRange,
          expenses: [],
          incomes: [],
          startDate: start.toISOString(),
          endDate: end.toISOString()
        });
      }
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return Array.from(weeksMap.values());
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function calculateWeeklyTotals(week) {
  const income = week.incomes.reduce((sum, t) => sum + t.amount, 0);
  const expense = week.expenses.reduce((sum, t) => sum + t.amount, 0);
  return { income, expense, net: income - expense };
}
