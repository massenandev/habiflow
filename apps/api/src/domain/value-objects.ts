import { ValidationError } from "./errors";
import { HabitGoal, HabitShape, ReminderSettings } from "./types";

export function assertDeviceId(deviceId: string): string {
  const value = deviceId?.trim();
  if (!value || value.length < 8) {
    throw new ValidationError("A valid deviceId is required.");
  }
  return value;
}

export function assertHabitName(name: string): string {
  const value = name?.trim();
  if (!value) {
    throw new ValidationError("Habit name is required.");
  }
  if (value.length > 80) {
    throw new ValidationError("Habit name must be 80 characters or fewer.");
  }
  return value;
}

export function assertEmoji(emoji?: string): string {
  const value = emoji?.trim() || "✅";
  if ([...value].length > 4) {
    throw new ValidationError("Use one short emoji for the habit.");
  }
  return value;
}

export function assertColor(color: string): string {
  const value = color?.trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(value)) {
    throw new ValidationError("Color must be a hex value like #4F46E5.");
  }
  return value.toUpperCase();
}

export function assertShape(shape: HabitShape): HabitShape {
  return "circle";
}

export function assertGoal(goal: HabitGoal): HabitGoal {
  if (!["none", "daily", "week", "month"].includes(goal.streakGoal)) {
    throw new ValidationError("Unsupported streak goal.");
  }
  if (!Number.isInteger(goal.completionsPerDay) || goal.completionsPerDay < 1 || goal.completionsPerDay > 12) {
    throw new ValidationError("Completions per day must be between 1 and 12.");
  }
  return goal;
}

export function assertReminderSettings(reminder: ReminderSettings): ReminderSettings {
  if (!Number.isInteger(reminder.count) || reminder.count < 0 || reminder.count > 12) {
    throw new ValidationError("Reminder count must be between 0 and 12.");
  }
  const times = reminder.count === 0 ? [] : (reminder.times ?? []).slice(0, reminder.count).map(assertReminderTime);
  if (reminder.count > 0 && times.length !== reminder.count) {
    throw new ValidationError("Reminder times must match reminder count.");
  }
  return { count: reminder.count, times };
}

export function assertReminderTime(time: string): string {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    throw new ValidationError("Reminder time must use HH:mm format.");
  }
  return time;
}

export function assertIsoDate(date: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new ValidationError("Date must use YYYY-MM-DD format.");
  }
  return date;
}
