export const HABIT_DAY_GAP = 7;
export const HABIT_DAY_HIT_SIZE = 22;
export const HABIT_DAY_INDICATOR_SIZE = 22;

export const HABIT_DATE_CELL_WIDTH = 28;

export function habitDayTrackWidth(days: number): number {
  return days * HABIT_DAY_HIT_SIZE + Math.max(0, days - 1) * HABIT_DAY_GAP;
}

export function habitDateTrackWidth(days: number): number {
  return days * HABIT_DATE_CELL_WIDTH + Math.max(0, days - 1) * HABIT_DAY_GAP;
}
