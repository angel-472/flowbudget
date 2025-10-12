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


console.log(`${colors.cyan}${colors.bright}Testing getWeeksinMonth for all months in 2025:${colors.reset}\n`);
for(let month = 1; month <= 12; month++) {
  console.log(`Weeks for month ${month} of 2025: ${dateUtils.getWeeksinMonth(2025, month )}`);
}