import { Habit } from "../../domain/habit";
import { HabitCompletion } from "../../domain/types";

export const HABIT_REPOSITORY = Symbol("HABIT_REPOSITORY");

export interface HabitRepository {
  save(habit: Habit): Promise<void>;
  findById(id: string): Promise<Habit | null>;
  listActiveByDevice(deviceId: string): Promise<Habit[]>;
  listActiveByUser(userId: string): Promise<Habit[]>;
  claimGuestHabits(deviceId: string, userId: string): Promise<number>;
  deleteById(id: string): Promise<void>;
  findCompletion(habitId: string, date: string): Promise<HabitCompletion | null>;
  upsertCompletion(completion: HabitCompletion): Promise<void>;
  deleteCompletion(habitId: string, date: string): Promise<void>;
  listCompletions(habitId: string, from: string, to: string): Promise<HabitCompletion[]>;
  listAllCompletions(habitId: string): Promise<HabitCompletion[]>;
}
