const DAY_OF_WEEK_LABELS = ["日", "月", "火", "水", "木", "金", "土"] as const;

/**
 * Format a date string (e.g. "2025-01-15") to Japanese display format
 * e.g. "2025年1月15日（水）"
 */
export function formatDateJa(dateStr: string): string {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const dayOfWeek = DAY_OF_WEEK_LABELS[d.getDay()];
  return `${year}年${month}月${day}日（${dayOfWeek}）`;
}

/**
 * Build a list of available date strings (YYYY-MM-DD) within a booking window,
 * excluding regular holidays.
 */
export function buildAvailableDates(
  bookingWindowDays: number,
  regularHolidays: number[],
): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = 0; i < bookingWindowDays && i < 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dayOfWeek = d.getDay();
    if (!regularHolidays.includes(dayOfWeek)) {
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      dates.push(dateStr);
    }
  }
  return dates;
}
