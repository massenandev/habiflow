import { describe, expect, it } from "vitest";
import { HabitService } from "../src/application/habit.service";
import { UnauthorizedDeviceError } from "../src/domain/errors";
import { InMemoryHabitRepository } from "./in-memory-habit.repository";

const input = {
  deviceId: "device-12345",
  name: "Read",
  emoji: "📚",
  color: "#7C3AED",
  goal: { streakGoal: "daily" as const, completionsPerDay: 2 },
  reminder: { count: 1, times: ["08:30"] }
};

describe("HabitService", () => {
  it("creates and lists active habits by device", async () => {
    const repo = new InMemoryHabitRepository();
    const service = new HabitService(repo);
    await service.create(input);

    const habits = await service.listActive(input.deviceId, "2026-06-08", "2026-06-10");

    expect(habits).toHaveLength(1);
    expect(habits[0].name).toBe("Read");
  });

  it("toggles today's completion done and undone", async () => {
    const repo = new InMemoryHabitRepository();
    const service = new HabitService(repo);
    const habit = await service.create(input);

    const done = await service.toggleToday(habit.id, input.deviceId, new Date("2026-06-10T10:00:00.000Z"));
    expect(done.completions[0].count).toBe(2);

    const undone = await service.toggleToday(habit.id, input.deviceId, new Date("2026-06-10T10:00:00.000Z"));
    expect(undone.completions).toHaveLength(0);
  });

  it("prevents another device from mutating a habit", async () => {
    const repo = new InMemoryHabitRepository();
    const service = new HabitService(repo);
    const habit = await service.create(input);

    await expect(service.archive(habit.id, "device-99999")).rejects.toThrow(UnauthorizedDeviceError);
  });

  it("archives habits so they no longer appear on the dashboard", async () => {
    const repo = new InMemoryHabitRepository();
    const service = new HabitService(repo);
    const habit = await service.create(input);
    await service.archive(habit.id, input.deviceId);

    const habits = await service.listActive(input.deviceId, "2026-06-08", "2026-06-10");

    expect(habits).toHaveLength(0);
  });
});
