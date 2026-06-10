import { describe, expect, it } from "vitest";
import { recentDays } from "../src/application/date-range";
import { streakGoalLabel, isCompletedForDate } from "../src/application/habit-presenter";
import { Habit } from "../src/domain/types";

describe("mobile presenters", () => {
  it("limits recent days to the dashboard v1 range", () => {
    expect(recentDays(9, new Date("2026-06-10T00:00:00.000Z"))).toEqual(["2026-06-06", "2026-06-07", "2026-06-08", "2026-06-09", "2026-06-10"]);
  });

  it("checks whether a habit is complete for a date", () => {
    expect(isCompletedForDate(habit, "2026-06-10")).toBe(true);
    expect(isCompletedForDate(habit, "2026-06-09")).toBe(false);
  });

  it("renders goal labels", () => {
    expect(streakGoalLabel("week")).toBe("Week");
  });
});

const habit: Habit = {
  id: "habit-1",
  deviceId: "device-12345",
  name: "Read",
  emoji: "📚",
  color: "#7C3AED",
  shape: "circle",
  goal: { streakGoal: "daily", completionsPerDay: 1 },
  reminder: { count: 0, times: [] },
  status: "active",
  streak: { current: 1, best: 3 },
  completions: [
    {
      id: "completion-1",
      habitId: "habit-1",
      deviceId: "device-12345",
      date: "2026-06-10",
      count: 1,
      createdAt: "2026-06-10T00:00:00.000Z",
      updatedAt: "2026-06-10T00:00:00.000Z"
    }
  ],
  createdAt: "2026-06-10T00:00:00.000Z",
  updatedAt: "2026-06-10T00:00:00.000Z"
};
