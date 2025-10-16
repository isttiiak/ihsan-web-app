// Timezone detection utility for frontend
// Automatically detects user's browser timezone

/**
 * Get user's timezone offset in minutes
 * @returns {number} Offset in minutes (e.g., 360 for UTC+6)
 */
export function getUserTimezoneOffset() {
  // JavaScript's getTimezoneOffset() returns offset in minutes
  // BUT it's inverted (negative for east of UTC, positive for west)
  // So we negate it to get the standard format
  return -new Date().getTimezoneOffset();
}

/**
 * Get user's timezone name (e.g., "Asia/Dhaka")
 * @returns {string} IANA timezone name
 */
export function getUserTimezoneName() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (e) {
    return "Unknown";
  }
}

/**
 * Get formatted timezone info
 * @returns {object} Timezone information
 */
export function getTimezoneInfo() {
  const offsetMinutes = getUserTimezoneOffset();
  const offsetHours = offsetMinutes / 60;
  const sign = offsetMinutes >= 0 ? "+" : "";

  return {
    offsetMinutes,
    offsetHours,
    offsetString: `UTC${sign}${offsetHours}`,
    name: getUserTimezoneName(),
  };
}

/**
 * Get today's date in user's local timezone
 * @returns {string} Date string (YYYY-MM-DD)
 */
export function getTodayLocal() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Check if it's a new day in user's local timezone
 * @param {string} lastDateString - Last recorded date (YYYY-MM-DD)
 * @returns {boolean} True if it's a new day
 */
export function isNewDayLocal(lastDateString) {
  return getTodayLocal() !== lastDateString;
}

// For debugging
export function logTimezoneInfo() {
  const info = getTimezoneInfo();
  console.log("🌍 User Timezone:", info.name);
  console.log("⏰ Offset:", info.offsetString);
  console.log("📅 Today:", getTodayLocal());
}

// Example usage
if (typeof window !== "undefined") {
  // Browser environment
  console.log("Browser Timezone Detection:");
  logTimezoneInfo();
}
