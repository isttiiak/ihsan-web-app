// Timezone utility for Dhaka (UTC+6)
// This ensures all date calculations use local Dhaka timezone

const DHAKA_TIMEZONE_OFFSET = 6 * 60; // UTC+6 in minutes

/**
 * Get current date/time in Dhaka timezone (UTC+6)
 * @returns {Date} Date object adjusted to Dhaka timezone
 */
export function getDhakaDate(dateLike = Date.now()) {
  const date = new Date(dateLike);
  // Convert to Dhaka time by adding 6 hours
  const dhakaTime = new Date(
    date.getTime() + DHAKA_TIMEZONE_OFFSET * 60 * 1000
  );
  return dhakaTime;
}

/**
 * Truncate to start of day in Dhaka timezone (midnight in Dhaka)
 * @param {Date|number} dateLike - Date or timestamp
 * @returns {Date} Date set to midnight Dhaka time
 */
export function truncateDhakaDate(dateLike = Date.now()) {
  const date = new Date(dateLike);

  // Get Dhaka local date components
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();

  // Calculate total minutes since UTC midnight
  const totalMinutes = hours * 60 + minutes;

  // Add Dhaka offset
  const dhakaMinutes = totalMinutes + DHAKA_TIMEZONE_OFFSET;

  // If Dhaka time is in the next day, increment date
  if (dhakaMinutes >= 24 * 60) {
    date.setUTCDate(day + 1);
  }

  // Set to Dhaka midnight (which is 18:00 UTC previous day for UTC+6)
  date.setUTCHours(18, 0, 0, 0); // 18:00 UTC = 00:00 Dhaka (UTC+6)

  return date;
}

/**
 * Get "today" in Dhaka timezone as a date string (YYYY-MM-DD format in Dhaka time)
 * @returns {string} Date string in Dhaka timezone
 */
export function getTodayDhakaString() {
  const now = new Date();

  // Add 6 hours to get Dhaka time
  const dhakaTime = new Date(now.getTime() + DHAKA_TIMEZONE_OFFSET * 60 * 1000);

  // Extract year, month, day in Dhaka timezone
  const year = dhakaTime.getUTCFullYear();
  const month = String(dhakaTime.getUTCMonth() + 1).padStart(2, "0");
  const day = String(dhakaTime.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Check if it's a new day in Dhaka timezone
 * @param {string} lastDateString - Last recorded date (YYYY-MM-DD)
 * @returns {boolean} True if it's a new day in Dhaka
 */
export function isNewDayDhaka(lastDateString) {
  const today = getTodayDhakaString();
  return lastDateString !== today;
}

/**
 * Get midnight of a specific date in Dhaka timezone
 * @param {string} dateString - Date string (YYYY-MM-DD)
 * @returns {Date} Date object set to midnight of that day in Dhaka
 */
export function getDhakaMidnight(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 18, 0, 0, 0)); // 18:00 UTC = 00:00 Dhaka
  return date;
}

/**
 * Calculate days difference in Dhaka timezone
 * @param {Date} date1
 * @param {Date} date2
 * @returns {number} Number of days difference
 */
export function daysDifferenceDhaka(date1, date2) {
  const d1 = truncateDhakaDate(date1);
  const d2 = truncateDhakaDate(date2);
  return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
}

// Example usage and testing
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("Testing Dhaka Timezone Utilities:");
  console.log("Current UTC time:", new Date().toISOString());
  console.log("Current Dhaka time:", getDhakaDate().toISOString());
  console.log("Today in Dhaka (string):", getTodayDhakaString());
  console.log("Dhaka midnight (truncated):", truncateDhakaDate().toISOString());
  console.log("Is new day from 2025-10-16?", isNewDayDhaka("2025-10-16"));
}
