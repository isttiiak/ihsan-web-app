// Legacy Dhaka-specific timezone utilities (kept for dailyCron compatibility)
// Prefer timezone-flexible.ts for new code

const DHAKA_TIMEZONE_OFFSET = 6 * 60; // UTC+6 in minutes

export function getDhakaDate(dateLike: number | Date = Date.now()): Date {
  const date = new Date(dateLike);
  return new Date(date.getTime() + DHAKA_TIMEZONE_OFFSET * 60 * 1000);
}

export function truncateDhakaDate(dateLike: number | Date = Date.now()): Date {
  const date = new Date(dateLike);

  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const day = date.getUTCDate();

  const totalMinutes = hours * 60 + minutes;
  const dhakaMinutes = totalMinutes + DHAKA_TIMEZONE_OFFSET;

  if (dhakaMinutes >= 24 * 60) {
    date.setUTCDate(day + 1);
  }

  date.setUTCHours(18, 0, 0, 0); // 18:00 UTC = 00:00 Dhaka (UTC+6)
  return date;
}

export function getTodayDhakaString(): string {
  const now = new Date();
  const dhakaTime = new Date(now.getTime() + DHAKA_TIMEZONE_OFFSET * 60 * 1000);
  const year = dhakaTime.getUTCFullYear();
  const month = String(dhakaTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(dhakaTime.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isNewDayDhaka(lastDateString: string): boolean {
  return lastDateString !== getTodayDhakaString();
}

export function getDhakaMidnight(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1, 18, 0, 0, 0));
}

export function daysDifferenceDhaka(date1: Date, date2: Date): number {
  const d1 = truncateDhakaDate(date1);
  const d2 = truncateDhakaDate(date2);
  return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}
