// Utility functions for FlowBudget (date, currency, week calculations)
// Week numbering system: Apple Calendar compatible - Weeks start on Sunday, Week 1 includes January 1st

/**
 * Calculate the week number for a given date (Apple Calendar compatible)
 * Week 1 includes January 1st, even if it's a partial week
 * Each week starts on Sunday and ends on Saturday
 * 
 * @param {Date} date - The date to get the week number for
 * @returns {number} - The week number (e.g., 41 for W41)
 */
export function getWeekNumber(date) {
  // Clone the date to avoid modifying the input
  const inputDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const yearStart = new Date(inputDate.getFullYear(), 0, 1);
  
  // Calculate days since January 1st
  const daysSinceYearStart = Math.floor((inputDate - yearStart) / (1000 * 60 * 60 * 24));
  
  // Find what day of week January 1st is (0 = Sunday, 1 = Monday, etc.)
  const jan1DayOfWeek = yearStart.getDay();
  
  // Adjust calculation to include partial first week
  // Add the day offset so the first week starts from Sunday before or on Jan 1
  const adjustedDays = daysSinceYearStart + jan1DayOfWeek;
  const weekNumber = Math.floor(adjustedDays / 7) + 1;
  
  return weekNumber;
}

/**
 * Get the date range (Sunday to Saturday) for a specific week number in a year
 * Compatible with Apple Calendar week numbering
 * 
 * @param {number} year - The year
 * @param {number} weekNumber - The week number (1-based)
 * @returns {Object} - Object with start (Sunday) and end (Saturday) dates
 */
export function getWeekDateRange(year, weekNumber) {
  // Find January 1st
  const yearStart = new Date(year, 0, 1);
  const jan1DayOfWeek = yearStart.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Calculate the Sunday of the first week (which includes Jan 1)
  const firstWeekSunday = new Date(yearStart);
  if (jan1DayOfWeek !== 0) {
    // Go back to the Sunday before Jan 1
    firstWeekSunday.setDate(yearStart.getDate() - jan1DayOfWeek);
  }
  
  // Calculate the start of the requested week (Sunday)
  const startOfWeek = new Date(firstWeekSunday);
  startOfWeek.setDate(firstWeekSunday.getDate() + (weekNumber - 1) * 7);
  
  // Calculate the end of the week (Saturday)
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  
  return { 
    start: startOfWeek, 
    end: endOfWeek 
  };
}

/**
 * Generate the week structure for a given month
 * Includes all weeks that have at least one day in the target month
 * Weeks maintain their actual dates even when crossing month boundaries
 * 
 * @param {number} year - The year
 * @param {number} month - The month (0-based, January = 0)
 * @returns {Array} - Array of week objects with week numbers and date ranges
 */
export function generateMonthStructure(year, month) {
  const weeksInMonth = [];
  
  // Get the first and last day of the target month
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0); // Last day of month
  
  // Find the Sunday of the week containing the first day of the month
  const firstWeekStart = new Date(monthStart);
  const startDayOffset = monthStart.getDay(); // 0 = Sunday, 1 = Monday, etc.
  firstWeekStart.setDate(monthStart.getDate() - startDayOffset);
  
  // Find the Saturday of the week containing the last day of the month
  const lastWeekEnd = new Date(monthEnd);
  const endDayOffset = 6 - monthEnd.getDay(); // Days to add to reach Saturday
  lastWeekEnd.setDate(monthEnd.getDate() + endDayOffset);
  
  // Iterate through each week in the range
  const currentDate = new Date(firstWeekStart);
  const processedWeeks = new Set();
  
  while (currentDate <= lastWeekEnd) {
    const weekNumber = getWeekNumber(currentDate);
    
    // Only process each week once
    if (!processedWeeks.has(weekNumber) && weekNumber > 0) {
      processedWeeks.add(weekNumber);
      
      // Get the actual week boundaries
      const { start: weekStart, end: weekEnd } = getWeekDateRange(year, weekNumber);
      
      // Check if this week overlaps with our target month
      const weekOverlapsMonth = !(weekEnd < monthStart || weekStart > monthEnd);
      
      if (weekOverlapsMonth) {
        // Format the date range showing actual week dates
        const dateRange = `${weekStart.getDate()} ${weekStart.toLocaleString('en-US', { month: 'short' })} – ${weekEnd.getDate()} ${weekEnd.toLocaleString('en-US', { month: 'short' })}`;
        
        weeksInMonth.push({
          weekNumber: weekNumber,
          dateRange: dateRange,
          expenses: [],
          incomes: [],
          startDate: weekStart.toISOString(),
          endDate: weekEnd.toISOString()
        });
      }
    }
    
    // Move to next week
    currentDate.setDate(currentDate.getDate() + 7);
  }
  
  // Sort weeks by week number to ensure proper order
  return weeksInMonth.sort((a, b) => a.weekNumber - b.weekNumber);
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
