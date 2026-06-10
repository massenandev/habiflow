import { describe, expect, it } from "vitest";
import { Habit } from "../src/domain/habit";
import { StreakService } from "../src/domain/streak.service";
import { ValidationError } from "../src/domain/errors";
import { HabitCompletion } from "../src/domain/types";

const baseInput = {
  deviceId: "device-12345",
  name: "Drink water",
  emoji: "💧",
  color: "#2DD4BF",
  goal: { streakGoal: "daily" as const, completionsPerDay: 1 },
  reminder: { count: 0, times: [] }
};

describe("Habit domain", () => {
  it("validates required habit name", () => {
    expect(() => Habit.create({ ...baseInput, name: "" })).toThrow(ValidationError);
  });

  it("archives a habit without deleting its identity", () => {
    const habit = Habit.create(baseInput);
    const archived = habit.archive();
    expect(archived.snapshot.id).toBe(habit.snapshot.id);
    expect(archived.snapshot.status).toBe("archived");
  });

  it("requires reminder times to match reminder count", () => {
    expect(() => Habit.create({ ...baseInput, reminder: { count: 1, times: [] } })).toThrow(ValidationError);
  });
});

describe("StreakService", () => {
  const service = new StreakService();

  it("calculates daily current and best streaks", () => {
    const completions = ["2026-06-08", "2026-06-09", "2026-06-10"].map((date) => completion(date, 1));
    expect(service.calculate(baseInput.goal, completions, "2026-06-10")).toEqual({ current: 3, best: 3 });
  });

  it("calculates weekly streaks when a habit has completions in consecutive weeks", () => {
    const goal = { streakGoal: "week" as const, completionsPerDay: 1 };
    const completions = [completion("2026-06-01", 1), completion("2026-06-08", 1)];
    expect(service.calculate(goal, completions, "2026-06-10")).toEqual({ current: 2, best: 2 });
  });
});

function completion(date: string, count: number): HabitCompletion {
  return {
    id: date,
    habitId: "habit-1",
    deviceId: "device-12345",
    date,
    count,
    createdAt: new Date(`${date}T00:00:00.000Z`),
    updatedAt: new Date(`${date}T00:00:00.000Z`)
  };
}
