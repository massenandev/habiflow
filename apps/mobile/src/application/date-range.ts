export function isoToday(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  const next = new Date(`${date}T00:00:00.000Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

export function recentDays(count: number, now = new Date()): string[] {
  const safeCount = Math.max(1, Math.min(5, count));
  const today = isoToday(now);
  return Array.from({ length: safeCount }, (_, index) => addDays(today, index - safeCount + 1));
}
