import { addDays, startOfIsoWeek, startOfMonth } from "./date-utils";
import { HabitCompletion, HabitGoal } from "./types";

export interface StreakResult {
  current: number;
  best: number;
}

export class StreakService {
  calculate(goal: HabitGoal, completions: HabitCompletion[], today: string): StreakResult {
    if (goal.streakGoal === "none") {
      return { current: 0, best: 0 };
    }
    if (goal.streakGoal === "week") {
      return this.calculatePeriod(completions, today, startOfIsoWeek, (date) => addDays(date, 7));
    }
    if (goal.streakGoal === "month") {
      return this.calculatePeriod(completions, today, startOfMonth, addMonths);
    }
    return this.calculateDaily(goal, completions, today);
  }

  private calculateDaily(goal: HabitGoal, completions: HabitCompletion[], today: string): StreakResult {
    const completed = new Set(completions.filter((item) => item.count >= goal.completionsPerDay).map((item) => item.date));
    const dates = [...completed].sort();
    let best = 0;
    let run = 0;
    let previous: string | null = null;

    for (const date of dates) {
      run = previous && addDays(previous, 1) === date ? run + 1 : 1;
      best = Math.max(best, run);
      previous = date;
    }

    let current = 0;
    for (let date = today; completed.has(date); date = addDays(date, -1)) {
      current += 1;
    }

    return { current, best };
  }

  private calculatePeriod(completions: HabitCompletion[], today: string, periodStart: (date: string) => string, nextPeriod: (date: string) => string): StreakResult {
    const completedPeriods = new Set<string>();
    for (const completion of completions) {
      if (completion.count > 0) {
        completedPeriods.add(periodStart(completion.date));
      }
    }
    const periods = [...completedPeriods].sort();

    let best = 0;
    let run = 0;
    let previous: string | null = null;
    for (const period of periods) {
      run = previous && nextPeriod(previous) === period ? run + 1 : 1;
      best = Math.max(best, run);
      previous = period;
    }

    let current = 0;
    for (let period = periodStart(today); completedPeriods.has(period); period = previousPeriod(period, nextPeriod)) {
      current += 1;
    }

    return { current, best };
  }
}

function addMonths(date: string): string {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCMonth(value.getUTCMonth() + 1);
  return value.toISOString().slice(0, 10);
}

function previousPeriod(date: string, nextPeriod: (date: string) => string): string {
  if (nextPeriod === addMonths) {
    const value = new Date(`${date}T00:00:00.000Z`);
    value.setUTCMonth(value.getUTCMonth() - 1);
    return value.toISOString().slice(0, 10);
  }
  return addDays(date, -7);
}
