/**
 * dates.ts — Tiny date helpers.
 *
 * The scheduling algorithm works with whole days, stored as text like
 * "2026-08-17" (local time). These two functions are all the date math
 * the app needs: "what day is today?" and "what day is it in N days?".
 * They live in their own file so both the algorithm and the session
 * builder can use them without importing each other.
 */

/** Today's date as 'YYYY-MM-DD' in local time. */
export function todayStr(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** The date N days after the given 'YYYY-MM-DD' date. */
export function addDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return todayStr(new Date(y, m - 1, d + n));
}

/** How many days from date a to date b (positive when b is after a). */
export function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  const ms = new Date(by, bm - 1, bd).getTime() - new Date(ay, am - 1, ad).getTime();
  return Math.round(ms / 86_400_000);
}
