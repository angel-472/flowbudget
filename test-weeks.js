// Test file for week calculation logic
import { getWeekNumber, getWeekDateRange, generateMonthStructure } from './src/utils.js';

console.log('🧪 Week Calculation Tests - Apple Calendar Verification\n');

// Test what day January 1, 2025 is
console.log('=== Year 2025 Analysis ===');
const jan1_2025 = new Date(2025, 0, 1); // January 1, 2025
console.log('January 1, 2025:', jan1_2025.toDateString(), '- Day of week:', jan1_2025.getDay());

// Find the first Sunday of 2025
let firstSunday = new Date(2025, 0, 1);
while (firstSunday.getDay() !== 0) {
  firstSunday.setDate(firstSunday.getDate() + 1);
}
console.log('First Sunday of 2025:', firstSunday.toDateString());
console.log('Our week number for first Sunday:', getWeekNumber(firstSunday));

// Check what Apple might be doing - maybe they count partial first week?
console.log('\n=== Apple Calendar Logic Investigation ===');
console.log('If Apple counts Jan 1-4 as Week 1 (partial week):');
const jan1Week = getWeekNumber(jan1_2025);
console.log('January 1, 2025 week number:', jan1Week);

// Test specific dates to understand the pattern
const testDates = [
  new Date(2025, 0, 1),   // Jan 1 (Wed)
  new Date(2025, 0, 5),   // Jan 5 (Sun) - First Sunday
  new Date(2025, 0, 12),  // Jan 12 (Sun) - Second Sunday
  new Date(2025, 8, 28),  // Sep 28 (Sun)
  new Date(2025, 9, 5),   // Oct 5 (Sun)
];

console.log('\nDate analysis:');
testDates.forEach(date => {
  console.log(`${date.toDateString()}: Week ${getWeekNumber(date)}`);
});

// Apple Calendar might use ISO week or different starting logic
console.log('\n=== Alternative Week Calculation (Apple-style) ===');
function getAppleWeekNumber(date) {
  const inputDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const yearStart = new Date(inputDate.getFullYear(), 0, 1);
  
  // Apple might count from January 1 regardless of day
  const daysSinceYearStart = Math.floor((inputDate - yearStart) / (1000 * 60 * 60 * 24));
  
  // Find what day of week Jan 1 is
  const jan1DayOfWeek = yearStart.getDay(); // 0 = Sunday
  
  // Adjust the calculation to count partial first week
  const adjustedDays = daysSinceYearStart + jan1DayOfWeek;
  const weekNumber = Math.floor(adjustedDays / 7) + 1;
  
  return weekNumber;
}

console.log('Testing Apple-style calculation:');
testDates.forEach(date => {
  console.log(`${date.toDateString()}: Our: W${getWeekNumber(date)}, Apple-style: W${getAppleWeekNumber(date)}`);
});

// Check October 5 specifically
console.log('\n=== October 5, 2025 Analysis ===');
const oct5 = new Date(2025, 9, 5);
console.log('October 5, 2025:', oct5.toDateString());
console.log('Our calculation: W' + getWeekNumber(oct5));
console.log('Apple-style calculation: W' + getAppleWeekNumber(oct5));

// Let's also check what week September 29 to October 5 should be
console.log('\n=== Week Range Check ===');
for (let i = 29; i <= 31; i++) {
  const date = new Date(2025, 8, i); // September
  if (date.getDate() === i) {
    console.log(`Sep ${i}: Our W${getWeekNumber(date)}, Apple W${getAppleWeekNumber(date)}`);
  }
}

for (let i = 1; i <= 5; i++) {
  const date = new Date(2025, 9, i); // October
  console.log(`Oct ${i}: Our W${getWeekNumber(date)}, Apple W${getAppleWeekNumber(date)}`);
}