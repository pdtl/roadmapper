/**
 * Date range and position utilities for the timeline.
 * All functions are pure (no DOM or global state).
 */

/**
 * Compute the date range to display from a list of events.
 * Adds a 7-day buffer on each side. If no events, uses current month ± 1.
 * @param {Array<{ date?: string }>} events - Events with optional date (YYYY-MM-DD)
 * @returns {{ start: Date, end: Date }} - Range as Date objects
 */
export function getDateRange(events) {
  if (!events.length) {
    const d = new Date();
    const start = new Date(d);
    start.setMonth(start.getMonth() - 1);
    const end = new Date(d);
    end.setMonth(end.getMonth() + 1);
    return { start, end };
  }
  let min = Infinity;
  let max = -Infinity;
  for (const evt of events) {
    const t = new Date(evt.date).getTime();
    if (t < min) min = t;
    if (t > max) max = t;
  }
  const start = new Date(min);
  const end = new Date(max);
  start.setDate(start.getDate() - 7);
  end.setDate(end.getDate() + 7);
  return { start, end };
}

/**
 * Map a date string to a position in [0, 1] within the given range.
 * @param {string} dateStr - ISO date string (YYYY-MM-DD)
 * @param {{ start: Date, end: Date }} range - Display range
 * @returns {number} - Position 0..1 (clamped)
 */
export function dateToOffset(dateStr, range) {
  const t = new Date(dateStr).getTime();
  const start = range.start.getTime();
  const end = range.end.getTime();
  const total = end - start;
  if (total <= 0) return 0;
  const pos = (t - start) / total;
  return Math.max(0, Math.min(1, pos));
}

/**
 * Today's date as YYYY-MM-DD (for comparisons and today-line).
 * @returns {string}
 */
export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
