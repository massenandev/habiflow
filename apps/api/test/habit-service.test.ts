import { describe, expect, it } from "vitest";
import { HabitService } from "../src/application/habit.service";
import { UnauthorizedDeviceError, ValidationError } from "../src/domain/errors";
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

    const done = await service.toggleDate(habit.id, input.deviceId, "2026-06-10", new Date("2026-06-10T10:00:00.000Z"));
    expect(done.completions[0].count).toBe(2);

    const undone = await service.toggleDate(habit.id, input.deviceId, "2026-06-10", new Date("2026-06-10T10:00:00.000Z"));
    expect(undone.completions).toHaveLength(0);
  });

  it("allows toggling a completion for a past date", async () => {
    const repo = new InMemoryHabitRepository();
    const service = new HabitService(repo);
    const habit = await service.create(input);

    const updated = await service.toggleDate(habit.id, input.deviceId, "2026-06-09", new Date("2026-06-10T10:00:00.000Z"));

    expect(updated.completions[0].date).toBe("2026-06-09");
    expect(updated.completions[0].count).toBe(2);
  });

  it("rejects toggling a completion for a future date", async () => {
    const repo = new InMemoryHabitRepository();
    const service = new HabitService(repo);
    const habit = await service.create(input);

    await expect(service.toggleDate(habit.id, input.deviceId, "2026-06-11", new Date("2026-06-10T10:00:00.000Z"))).rejects.toThrow(ValidationError);
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

  it("claims guest habits into an authenticated user account", async () => {
    const repo = new InMemoryHabitRepository();
    const service = new HabitService(repo);
    await service.create(input);

    const claimed = await service.claimGuestData(input.deviceId, "3f6346eb-9f7e-4d2c-b9c4-0704b28f7972");
    const guestHabits = await service.listActive(input.deviceId, "2026-06-08", "2026-06-10");
    const userHabits = await service.listActive({ deviceId: input.deviceId, userId: "3f6346eb-9f7e-4d2c-b9c4-0704b28f7972" }, "2026-06-08", "2026-06-10");

    expect(claimed).toBe(1);
    expect(guestHabits).toHaveLength(0);
    expect(userHabits).toHaveLength(1);
  });

  it("prevents authenticated users from mutating another user's habit", async () => {
    const repo = new InMemoryHabitRepository();
    const service = new HabitService(repo);
    const habit = await service.create(input, "3f6346eb-9f7e-4d2c-b9c4-0704b28f7972");

    await expect(service.archive(habit.id, { deviceId: input.deviceId, userId: "611c2301-9c97-4a24-98bd-8e5309d3504e" })).rejects.toThrow(UnauthorizedDeviceError);
  });
});
