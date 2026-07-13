//Utility class for date operations (Apple Calendar week numbering style)
class DateUtils {
  /**
   * Create a local date from a date string (YYYY-MM-DD) without timezone issues
   */
  createLocalDate(dateString) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  // Calculate the week number for a given date based on the specific start day
  getWeekNumber(date, weekStartsOn = 0) {
    const input = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const yearStart = new Date(input.getFullYear(), 0, 1);
    const daysSinceStart = Math.floor((input - yearStart) / 86400000);
    const offset = (yearStart.getDay() - weekStartsOn + 7) % 7;
    return Math.floor((daysSinceStart + offset) / 7) + 1;
  }

  /** 
   * Get the date range for a specific week number of the year, with arbitrary week start day 0 = Sunday <--> 6 = Saturday
   */
  getWeekDateRange(year, weekNumber, weekStartsOn = 0) {
    const yearStart = new Date(year, 0, 1);
    const offset = (yearStart.getDay() - weekStartsOn + 7) % 7;
    const start = new Date(year, 0, 1 - offset + (weekNumber - 1) * 7);

    return Array.from({ length: 7 }, (_, i) =>
      new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
    );
  }

  getWeeksInMonth(year, monthNumber, weekStartsOn = 0) {
    const weeks = [];
    const monthStart = this.createLocalDate(`${year}-${monthNumber}-01`);
    const monthEnd = this.createLocalDate(`${year}-${monthNumber + 1}-01`);
    monthEnd.setDate(monthEnd.getDate() - 1); // Set to last day of the month
    const currentDate = new Date(monthStart);
    
    // Go back to find the Sunday that starts the first week of the month
    // console.log({monthStart, monthEnd, currentDate})
    while (currentDate.getDay() !== weekStartsOn) {
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    // Find all weeks until we pass the end of the month
    while (currentDate <= monthEnd) {
      const weekNumber = this.getWeekNumber(currentDate);
      const { start, end } = this.getWeekDateRange(year, weekNumber);
      weeks.push(weekNumber);
      currentDate.setDate(currentDate.getDate() + 7); // Move to next week
    }
    
    return weeks;
  }
}

export const dateUtils = new DateUtils();