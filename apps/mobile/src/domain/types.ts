export type HabitShape = "circle";
export type StreakGoal = "none" | "daily" | "week" | "month";
export type ThemeMode = "system" | "light" | "dark";
export type ScreenName = "dashboard" | "create" | "edit" | "history" | "settings" | "export";

export interface HabitGoal {
  streakGoal: StreakGoal;
  completionsPerDay: number;
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  deviceId: string;
  date: string;
  count: number;
  createdAt: string;
  updatedAt: string;
}

export interface Habit {
  id: string;
  deviceId: string;
  name: string;
  emoji: string;
  color: string;
  shape: HabitShape;
  goal: HabitGoal;
  reminder: {
    count: number;
    times: string[];
  };
  status: "active" | "archived";
  streak: {
    current: number;
    best: number;
  };
  completions: HabitCompletion[];
  createdAt: string;
  updatedAt: string;
}

export interface HabitFormValues {
  name: string;
  emoji: string;
  color: string;
  goal: HabitGoal;
  reminder: {
    count: number;
    times: string[];
  };
}
