export type HabitStatus = "active" | "archived";
export type HabitShape = "circle";
export type StreakGoal = "none" | "daily" | "week" | "month";

export interface HabitGoal {
  streakGoal: StreakGoal;
  completionsPerDay: number;
}

export interface ReminderSettings {
  count: number;
  times: string[];
}

export interface HabitProps {
  id: string;
  deviceId: string;
  userId?: string | null;
  name: string;
  emoji: string;
  color: string;
  shape: HabitShape;
  goal: HabitGoal;
  reminder: ReminderSettings;
  status: HabitStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  deviceId: string;
  date: string;
  count: number;
  createdAt: Date;
  updatedAt: Date;
}
