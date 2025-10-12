//Utility class for date operations (Apple Calendar week numbering style)
class DateUtils {
  /**
   * Create a local date from a date string (YYYY-MM-DD) without timezone issues
   */
  createLocalDate(dateString) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  /**
   * Calculate the week number for a given date (Apple Calendar compatible)
   * Week 1 includes January 1st, even if it's a partial week
   * Each week starts on Sunday and ends on Saturday
   */
  getWeekNumber(date) {
    const inputDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const yearStart = new Date(inputDate.getFullYear(), 0, 1);
    const daysSinceYearStart = Math.floor((inputDate - yearStart) / (1000 * 60 * 60 * 24));
    const jan1DayOfWeek = yearStart.getDay();
    const adjustedDays = daysSinceYearStart + jan1DayOfWeek;
    const weekNumber = Math.floor(adjustedDays / 7) + 1;
    return weekNumber;
  }

  /** 
   * Get the date range (Sunday to Saturday) for a specific week number in a year
   */
  getWeekDateRange(year, weekNumber) {
    const yearStart = new Date(year, 0, 1);
    const jan1DayOfWeek = yearStart.getDay();
    const firstWeekSunday = new Date(yearStart);
    if (jan1DayOfWeek !== 0) {
      firstWeekSunday.setDate(yearStart.getDate() - jan1DayOfWeek);
    }
    const startOfWeek = new Date(firstWeekSunday);
    startOfWeek.setDate(firstWeekSunday.getDate() + (weekNumber - 1) * 7);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    // Build array of dates from start to end
    const dates = [];
    for (let d = new Date(startOfWeek); d <= endOfWeek; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d));
    }
    return dates;
  }

  getWeeksInMonth(year, monthNumber) {
    const weeks = [];
    const monthStart = this.createLocalDate(`${year}-${monthNumber}-01`);
    const monthEnd = this.createLocalDate(`${year}-${monthNumber + 1}-01`);
    monthEnd.setDate(monthEnd.getDate() - 1); // Set to last day of the month
    const currentDate = new Date(monthStart);
    
    // Go back to find the Sunday that starts the first week of the month
    // console.log({monthStart, monthEnd, currentDate})
    while (currentDate.getDay() !== 0) {
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