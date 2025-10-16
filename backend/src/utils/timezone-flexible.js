// Timezone utility - Supports any timezone offset
// Can work with user-provided timezone or default to Dhaka

const DEFAULT_TIMEZONE_OFFSET = 6 * 60; // Dhaka: UTC+6 in minutes (default)

/**
 * Get current date/time in specified timezone
 * @param {number} offsetMinutes - Timezone offset in minutes (default: Dhaka UTC+6)
 * @returns {Date} Date object adjusted to specified timezone
 */
export function getLocalDate(
  dateLike = Date.now(),
  offsetMinutes = DEFAULT_TIMEZONE_OFFSET
) {
  const date = new Date(dateLike);
  const localTime = new Date(date.getTime() + offsetMinutes * 60 * 1000);
  return localTime;
}

/**
 * Truncate to start of day in specified timezone (local midnight)
 * @param {Date|number} dateLike - Date or timestamp
 * @param {number} offsetMinutes - Timezone offset in minutes
 * @returns {Date} Date set to midnight in specified timezone
 */
export function truncateToTimezone(
  dateLike = Date.now(),
  offsetMinutes = DEFAULT_TIMEZONE_OFFSET
) {
  const date = new Date(dateLike);

  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();

  const totalMinutes = hours * 60 + minutes;
  const localMinutes = totalMinutes + offsetMinutes;

  if (localMinutes >= 24 * 60) {
    date.setUTCDate(day + 1);
  } else if (localMinutes < 0) {
    date.setUTCDate(day - 1);
  }

  // Calculate UTC hours for local midnight
  const utcHourForLocalMidnight = (24 - Math.floor(offsetMinutes / 60)) % 24;
  date.setUTCHours(utcHourForLocalMidnight, 0, 0, 0);

  return date;
}

/**
 * Get "today" in specified timezone as a date string (YYYY-MM-DD)
 * @param {number} offsetMinutes - Timezone offset in minutes
 * @returns {string} Date string in specified timezone
 */
export function getTodayString(offsetMinutes = DEFAULT_TIMEZONE_OFFSET) {
  const now = new Date();
  const localTime = new Date(now.getTime() + offsetMinutes * 60 * 1000);

  const year = localTime.getUTCFullYear();
  const month = String(localTime.getUTCMonth() + 1).padStart(2, "0");
  const day = String(localTime.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Check if it's a new day in specified timezone
 * @param {string} lastDateString - Last recorded date (YYYY-MM-DD)
 * @param {number} offsetMinutes - Timezone offset in minutes
 * @returns {boolean} True if it's a new day
 */
export function isNewDay(
  lastDateString,
  offsetMinutes = DEFAULT_TIMEZONE_OFFSET
) {
  const today = getTodayString(offsetMinutes);
  return lastDateString !== today;
}

// Backward compatibility - Dhaka-specific functions (use default offset)
export const truncateDhakaDate = (dateLike) =>
  truncateToTimezone(dateLike, DEFAULT_TIMEZONE_OFFSET);
export const getTodayDhakaString = () =>
  getTodayString(DEFAULT_TIMEZONE_OFFSET);
export const getDhakaDate = (dateLike) =>
  getLocalDate(dateLike, DEFAULT_TIMEZONE_OFFSET);

// Export default offset for reference
export { DEFAULT_TIMEZONE_OFFSET };

// Example usage
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("Testing Multi-Timezone Support:");
  console.log("\nDhaka (UTC+6):");
  console.log("  Today:", getTodayString(360));
  console.log("  Midnight:", truncateToTimezone(Date.now(), 360).toISOString());

  console.log("\nNew York (UTC-5):");
  console.log("  Today:", getTodayString(-300));
  console.log(
    "  Midnight:",
    truncateToTimezone(Date.now(), -300).toISOString()
  );

  console.log("\nLondon (UTC+0):");
  console.log("  Today:", getTodayString(0));
  console.log("  Midnight:", truncateToTimezone(Date.now(), 0).toISOString());
}
