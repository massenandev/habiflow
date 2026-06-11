import { addDays } from "./date-utils";
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

    const anchor = completed.has(today) ? today : completed.has(addDays(today, -1)) ? addDays(today, -1) : null;
    let current = 0;
    for (let date = anchor; date && completed.has(date); date = addDays(date, -1)) {
      current += 1;
    }

    return { current, best };
  }
}
