/**
 * Test Suite for DateUtils Class
 * 
 * This file contains comprehensive tests for the DateUtils class methods.
 * Run this file with Node.js to execute all tests and verify functionality.
 * 
 * Usage:
 *   node src/tests/dateUtils.test.js
 */

import { dateUtils } from '../api/dateUtils.js';

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Test runner utilities
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`${colors.green}✓${colors.reset} ${message}`);
  } else {
    failedTests++;
    console.log(`${colors.red}✗${colors.reset} ${message}`);
  }
}

function assertEquals(actual, expected, message) {
  const condition = actual === expected;
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`${colors.green}✓${colors.reset} ${message}`);
  } else {
    failedTests++;
    console.log(`${colors.red}✗${colors.reset} ${message}`);
    console.log(`  Expected: ${colors.cyan}${expected}${colors.reset}`);
    console.log(`  Actual: ${colors.magenta}${actual}${colors.reset}`);
  }
}

function assertDeepEquals(actual, expected, message) {
  const condition = JSON.stringify(actual) === JSON.stringify(expected);
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`${colors.green}✓${colors.reset} ${message}`);
  } else {
    failedTests++;
    console.log(`${colors.red}✗${colors.reset} ${message}`);
    console.log(`  Expected: ${colors.cyan}${JSON.stringify(expected)}${colors.reset}`);
    console.log(`  Actual: ${colors.magenta}${JSON.stringify(actual)}${colors.reset}`);
  }
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function testSection(name) {
  console.log(`\n${colors.blue}${colors.bright}=== ${name} ===${colors.reset}`);
}

// Test Suite
console.log(`${colors.cyan}${colors.bright}🧪 DateUtils Test Suite${colors.reset}`);
console.log(`${colors.yellow}Testing Apple Calendar compatible date utilities${colors.reset}\n`);

// Test 1: createLocalDate()
testSection('createLocalDate() Tests');

const testDate1 = dateUtils.createLocalDate('2025-10-12');
assertEquals(testDate1.getFullYear(), 2025, 'createLocalDate should parse year correctly');
assertEquals(testDate1.getMonth(), 9, 'createLocalDate should parse month correctly (0-based)');
assertEquals(testDate1.getDate(), 12, 'createLocalDate should parse day correctly');

const testDate2 = dateUtils.createLocalDate('2024-02-29');
assertEquals(testDate2.getFullYear(), 2024, 'createLocalDate should handle leap year');
assertEquals(testDate2.getMonth(), 1, 'createLocalDate should handle February correctly');
assertEquals(testDate2.getDate(), 29, 'createLocalDate should handle leap day');

const testDate3 = dateUtils.createLocalDate('2025-01-01');
assertEquals(testDate3.getFullYear(), 2025, 'createLocalDate should handle New Year correctly');
assertEquals(testDate3.getMonth(), 0, 'createLocalDate should handle January (month 0)');
assertEquals(testDate3.getDate(), 1, 'createLocalDate should handle first day of year');

// Test 2: getWeekNumber()
testSection('getWeekNumber() Tests');

// Test known dates and their expected week numbers
const jan1_2025 = new Date(2025, 0, 1); // January 1, 2025 (Wednesday)
const weekNum1 = dateUtils.getWeekNumber(jan1_2025);
assertEquals(weekNum1, 1, 'January 1, 2025 should be in week 1');

const jan7_2025 = new Date(2025, 0, 7); // January 7, 2025 (Tuesday)
const weekNum2 = dateUtils.getWeekNumber(jan7_2025);
assertEquals(weekNum2, 2, 'January 7, 2025 should be in week 2');

const dec31_2024 = new Date(2024, 11, 31); // December 31, 2024 (Tuesday)
const weekNum3 = dateUtils.getWeekNumber(dec31_2024);
assert(weekNum3 >= 52, 'December 31, 2024 should be in week 52 or 53');

// Test mid-year date
const july4_2025 = new Date(2025, 6, 4); // July 4, 2025
const weekNum4 = dateUtils.getWeekNumber(july4_2025);
assert(weekNum4 >= 25 && weekNum4 <= 30, 'July 4, 2025 should be in a reasonable week range');

// Test October 12, 2025 (current date context)
const oct12_2025 = new Date(2025, 9, 12); // October 12, 2025
const weekNum5 = dateUtils.getWeekNumber(oct12_2025);
assert(weekNum5 >= 40 && weekNum5 <= 45, 'October 12, 2025 should be around week 41-42');

// Test 3: getWeekDateRange()
testSection('getWeekDateRange() Tests');

// Test week 1 of 2025
const week1_2025 = dateUtils.getWeekDateRange(2025, 1);
assertEquals(formatDate(week1_2025.start), '2024-12-29', 'Week 1 2025 should start on December 29, 2024 (Sunday)');
assertEquals(formatDate(week1_2025.end), '2025-01-04', 'Week 1 2025 should end on January 4, 2025 (Saturday)');

// Test week 2 of 2025
const week2_2025 = dateUtils.getWeekDateRange(2025, 2);
assertEquals(formatDate(week2_2025.start), '2025-01-05', 'Week 2 2025 should start on January 5, 2025 (Sunday)');
assertEquals(formatDate(week2_2025.end), '2025-01-11', 'Week 2 2025 should end on January 11, 2025 (Saturday)');

// Test a mid-year week
const week26_2025 = dateUtils.getWeekDateRange(2025, 26);
const week26Start = week26_2025.start;
const week26End = week26_2025.end;
assertEquals(week26Start.getDay(), 0, 'Week 26 should start on Sunday (day 0)');
assertEquals(week26End.getDay(), 6, 'Week 26 should end on Saturday (day 6)');

// Test that the range is exactly 7 days
const daysDiff = (week26End - week26Start) / (1000 * 60 * 60 * 24);
assertEquals(daysDiff, 6, 'Week range should span exactly 6 days (Sunday to Saturday inclusive)');

// Test week 52 of 2025
const week52_2025 = dateUtils.getWeekDateRange(2025, 52);
assert(week52_2025.start.getFullYear() === 2025, 'Week 52 2025 should start in 2025');
assert(week52_2025.end.getFullYear() === 2025 || week52_2025.end.getFullYear() === 2026, 'Week 52 2025 might end in 2025 or 2026');

// Test Integration: Round-trip testing
testSection('Integration Tests (Round-trip)');

// Test that getWeekNumber and getWeekDateRange are consistent
const testDates = [
  new Date(2025, 0, 15),  // January 15, 2025
  new Date(2025, 3, 10),  // April 10, 2025
  new Date(2025, 6, 20),  // July 20, 2025
  new Date(2025, 9, 12),  // October 12, 2025
];

testDates.forEach((date, index) => {
  const weekNum = dateUtils.getWeekNumber(date);
  const weekRange = dateUtils.getWeekDateRange(date.getFullYear(), weekNum);
  
  const isDateInRange = date >= weekRange.start && date <= weekRange.end;
  assert(isDateInRange, `Round-trip test ${index + 1}: Date ${formatDate(date)} should fall within its calculated week range`);
});

// Test Edge Cases
testSection('Edge Case Tests');

// Test leap year February 29
const feb29_2024 = new Date(2024, 1, 29);
const feb29Week = dateUtils.getWeekNumber(feb29_2024);
assert(feb29Week >= 8 && feb29Week <= 10, 'February 29, 2024 should be in a reasonable week');

// Test year boundary
const dec30_2024 = new Date(2024, 11, 30); // Monday
const jan1_2025_wed = new Date(2025, 0, 1); // Wednesday
const dec30Week = dateUtils.getWeekNumber(dec30_2024);
const jan1Week = dateUtils.getWeekNumber(jan1_2025_wed);

// These should be in different weeks since Jan 1 starts a new week 1
assert(dec30Week !== jan1Week, 'December 30, 2024 and January 1, 2025 should be in different weeks');

// Performance Test
testSection('Performance Test');

const startTime = Date.now();
for (let i = 0; i < 1000; i++) {
  const randomDate = new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
  dateUtils.getWeekNumber(randomDate);
  dateUtils.getWeekDateRange(2025, Math.floor(Math.random() * 52) + 1);
}
const endTime = Date.now();
const duration = endTime - startTime;

assert(duration < 1000, `Performance test: 1000 operations should complete in under 1 second (took ${duration}ms)`);

// Test Summary
testSection('Test Summary');

console.log(`\n${colors.bright}📊 Test Results:${colors.reset}`);
console.log(`${colors.green}✓ Passed: ${passedTests}${colors.reset}`);
console.log(`${colors.red}✗ Failed: ${failedTests}${colors.reset}`);
console.log(`📝 Total: ${totalTests}`);

if (failedTests === 0) {
  console.log(`\n${colors.green}${colors.bright}🎉 All tests passed! DateUtils is working correctly.${colors.reset}`);
  process.exit(0);
} else {
  console.log(`\n${colors.red}${colors.bright}❌ ${failedTests} test(s) failed. Please review the DateUtils implementation.${colors.reset}`);
  process.exit(1);
}