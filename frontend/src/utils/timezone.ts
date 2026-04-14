// Timezone detection utility for frontend
// Automatically detects user's browser timezone

/**
 * Get user's timezone offset in minutes (positive for east of UTC)
 */
export function getUserTimezoneOffset(): number {
  return -new Date().getTimezoneOffset();
}

/**
 * Get user's IANA timezone name (e.g., "Asia/Dhaka")
 */
export function getUserTimezoneName(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'Unknown';
  }
}

export interface TimezoneInfo {
  offsetMinutes: number;
  offsetHours: number;
  offsetString: string;
  name: string;
}

export function getTimezoneInfo(): TimezoneInfo {
  const offsetMinutes = getUserTimezoneOffset();
  const offsetHours = offsetMinutes / 60;
  const sign = offsetMinutes >= 0 ? '+' : '';
  return {
    offsetMinutes,
    offsetHours,
    offsetString: `UTC${sign}${offsetHours}`,
    name: getUserTimezoneName(),
  };
}

/**
 * Get today's date string (YYYY-MM-DD) in the user's local timezone
 */
export function getTodayLocal(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isNewDayLocal(lastDateString: string): boolean {
  return getTodayLocal() !== lastDateString;
}
