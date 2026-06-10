import { Habit } from "../domain/types";

export function isCompletedForDate(habit: Habit, date: string): boolean {
  const completion = habit.completions.find((item) => item.date === date);
  return (completion?.count ?? 0) >= habit.goal.completionsPerDay;
}

export function streakGoalLabel(goal: Habit["goal"]["streakGoal"]): string {
  const labels: Record<Habit["goal"]["streakGoal"], string> = {
    none: "None",
    daily: "Daily",
    week: "Week",
    month: "Month"
  };
  return labels[goal];
}
