// Timezone utility - Supports any timezone offset
// Can work with user-provided timezone or default to Dhaka

export const DEFAULT_TIMEZONE_OFFSET = 6 * 60; // Dhaka: UTC+6 in minutes (default)

/**
 * Get current date/time in specified timezone
 */
export function getLocalDate(dateLike: number | Date = Date.now(), offsetMinutes: number = DEFAULT_TIMEZONE_OFFSET): Date {
  const date = new Date(dateLike);
  return new Date(date.getTime() + offsetMinutes * 60 * 1000);
}

/**
 * Truncate to start of day in specified timezone (local midnight)
 */
export function truncateToTimezone(dateLike: number | Date = Date.now(), offsetMinutes: number = DEFAULT_TIMEZONE_OFFSET): Date {
  const date = new Date(dateLike);

  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const day = date.getUTCDate();

  const totalMinutes = hours * 60 + minutes;
  const localMinutes = totalMinutes + offsetMinutes;

  if (localMinutes >= 24 * 60) {
    date.setUTCDate(day + 1);
  } else if (localMinutes < 0) {
    date.setUTCDate(day - 1);
  }

  // UTC time of local midnight, in minutes — keep the minute component so
  // half-hour offsets (India +5:30, Nepal +5:45, Iran +3:30) get a correct
  // day boundary instead of one shifted by 30–45 minutes.
  const DAY_MIN = 24 * 60;
  const utcMinutesForLocalMidnight = ((DAY_MIN - offsetMinutes) % DAY_MIN + DAY_MIN) % DAY_MIN;
  date.setUTCHours(
    Math.floor(utcMinutesForLocalMidnight / 60),
    utcMinutesForLocalMidnight % 60,
    0, 0
  );

  return date;
}

/**
 * Get "today" in specified timezone as a date string (YYYY-MM-DD)
 */
export function getTodayString(offsetMinutes: number = DEFAULT_TIMEZONE_OFFSET): string {
  const now = new Date();
  const localTime = new Date(now.getTime() + offsetMinutes * 60 * 1000);

  const year = localTime.getUTCFullYear();
  const month = String(localTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(localTime.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Check if it's a new day in specified timezone
 */
export function isNewDay(lastDateString: string, offsetMinutes: number = DEFAULT_TIMEZONE_OFFSET): boolean {
  return lastDateString !== getTodayString(offsetMinutes);
}

// Backward compatibility aliases
export const truncateDhakaDate = (dateLike: number | Date): Date =>
  truncateToTimezone(dateLike, DEFAULT_TIMEZONE_OFFSET);
export const getTodayDhakaString = (): string =>
  getTodayString(DEFAULT_TIMEZONE_OFFSET);
export const getDhakaDate = (dateLike: number | Date): Date =>
  getLocalDate(dateLike, DEFAULT_TIMEZONE_OFFSET);
