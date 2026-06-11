import { Habit } from "../src/domain/habit";
import { HabitCompletion } from "../src/domain/types";
import { HabitRepository } from "../src/application/ports/habit-repository";

export class InMemoryHabitRepository implements HabitRepository {
  readonly habits = new Map<string, Habit>();
  readonly completions = new Map<string, HabitCompletion>();

  async save(habit: Habit): Promise<void> {
    this.habits.set(habit.snapshot.id, habit);
  }

  async findById(id: string): Promise<Habit | null> {
    return this.habits.get(id) ?? null;
  }

  async listActiveByDevice(deviceId: string): Promise<Habit[]> {
    return [...this.habits.values()].filter((habit) => habit.snapshot.deviceId === deviceId && !habit.snapshot.userId && habit.snapshot.status === "active");
  }

  async listActiveByUser(userId: string): Promise<Habit[]> {
    return [...this.habits.values()].filter((habit) => habit.snapshot.userId === userId && habit.snapshot.status === "active");
  }

  async claimGuestHabits(deviceId: string, userId: string): Promise<number> {
    let count = 0;
    for (const habit of this.habits.values()) {
      const snapshot = habit.snapshot;
      if (snapshot.deviceId === deviceId && !snapshot.userId) {
        this.habits.set(snapshot.id, Habit.rehydrate({ ...snapshot, userId, updatedAt: new Date() }));
        count += 1;
      }
    }
    return count;
  }

  async deleteById(id: string): Promise<void> {
    this.habits.delete(id);
    for (const key of this.completions.keys()) {
      if (key.startsWith(`${id}:`)) {
        this.completions.delete(key);
      }
    }
  }

  async findCompletion(habitId: string, date: string): Promise<HabitCompletion | null> {
    return this.completions.get(`${habitId}:${date}`) ?? null;
  }

  async upsertCompletion(completion: HabitCompletion): Promise<void> {
    this.completions.set(`${completion.habitId}:${completion.date}`, completion);
  }

  async deleteCompletion(habitId: string, date: string): Promise<void> {
    this.completions.delete(`${habitId}:${date}`);
  }

  async listCompletions(habitId: string, from: string, to: string): Promise<HabitCompletion[]> {
    return [...this.completions.values()]
      .filter((item) => item.habitId === habitId && item.date >= from && item.date <= to)
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async listAllCompletions(habitId: string): Promise<HabitCompletion[]> {
    return [...this.completions.values()].filter((item) => item.habitId === habitId).sort((a, b) => a.date.localeCompare(b.date));
  }
}
