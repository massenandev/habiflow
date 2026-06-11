export type HabitShape = "circle";
export type StreakGoal = "none" | "daily" | "week" | "month";
export type ThemeMode = "system" | "light" | "dark";
export type ScreenName = "welcome" | "signup" | "login" | "forgotPassword" | "dashboard" | "create" | "edit" | "history" | "report" | "settings" | "export" | "guestImport";
export type AuthMode = "loading" | "guest" | "authenticated" | "signedOut";

export interface AuthUser {
  id: string;
  email: string | null;
  displayName: string | null;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

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
  userId?: string | null;
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
