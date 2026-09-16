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
      const weekNumber = this.getWeekNumber(currentDate, weekStartsOn);
      const { start, end } = this.getWeekDateRange(year, weekNumber, weekStartsOn);
      weeks.push(weekNumber);
      currentDate.setDate(currentDate.getDate() + 7); // Move to next week
    }
    
    return weeks;
  }

  daysToWords(amountOfDays, includeLeadOne = false){
    let output = "";
    if(amountOfDays >= 30){
      const months = amountOfDays / 30;
      amountOfDays -= Math.floor(months) * 30;
      if(months >= 2){
        output += `${Math.floor(months)} months`;
      }
      else {
        if(includeLeadOne == true){
          output += "1 ";
        }
        output += `month`;
      }
      if(amountOfDays > 0){
        output += " and ";
      }
    }
    if(amountOfDays >= 7){
      const weeks = amountOfDays / 7;
      amountOfDays -= Math.floor(weeks) * 7
      if(weeks >= 2){
        output += `${Math.floor(weeks)} weeks`;
      }
      else {
        if(output !== "" || includeLeadOne){
          output += `1 `;
        }
        output += `week`;
      }
      if(amountOfDays > 0){
        output += " and ";
      }      
    }
    if(amountOfDays > 0) {
      if(amountOfDays == 1 && (output !== "" || includeLeadOne)){
        output += "1 ";
      }
      output+= `${amountOfDays > 1 ? amountOfDays + ' ' : ''}day${amountOfDays > 1 ? 's' : ''}`
    }
    return output;
  }
  
  daysBetweenDates(firstDate, secondDate){
    const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
    const diffDays = Math.round(Math.abs(firstDate - secondDate) / oneDay);
    return diffDays;
  }
}

export const dateUtils = new DateUtils();

if(import.meta.env.DEV && window){
  window.dateUtilsRef = dateUtils;
}