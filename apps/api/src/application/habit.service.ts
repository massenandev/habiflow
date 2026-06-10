import { Inject, Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { Habit, CreateHabitInput } from "../domain/habit";
import { HabitCompletion, HabitGoal, HabitShape, ReminderSettings } from "../domain/types";
import { HabitNotFoundError, UnauthorizedDeviceError } from "../domain/errors";
import { assertDeviceId, assertIsoDate } from "../domain/value-objects";
import { todayIso } from "../domain/date-utils";
import { StreakResult, StreakService } from "../domain/streak.service";
import { HABIT_REPOSITORY, HabitRepository } from "./ports/habit-repository";

export interface HabitDto {
  id: string;
  deviceId: string;
  name: string;
  emoji: string;
  color: string;
  shape: HabitShape;
  goal: HabitGoal;
  reminder: ReminderSettings;
  status: string;
  streak: StreakResult;
  completions: HabitCompletion[];
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class HabitService {
  private readonly streakService = new StreakService();

  constructor(@Inject(HABIT_REPOSITORY) private readonly habits: HabitRepository) {}

  async create(input: CreateHabitInput): Promise<HabitDto> {
    const habit = Habit.create(input);
    await this.habits.save(habit);
    return this.toDto(habit, []);
  }

  async update(
    habitId: string,
    deviceId: string,
    input: Partial<{ name: string; emoji: string; color: string; goal: HabitGoal; reminder: ReminderSettings }>
  ): Promise<HabitDto> {
    const habit = await this.requireOwnedHabit(habitId, deviceId);
    const updated = habit.update(input);
    await this.habits.save(updated);
    const completions = await this.habits.listAllCompletions(habitId);
    return this.toDto(updated, completions);
  }

  async archive(habitId: string, deviceId: string): Promise<HabitDto> {
    const habit = await this.requireOwnedHabit(habitId, deviceId);
    const archived = habit.archive();
    await this.habits.save(archived);
    const completions = await this.habits.listAllCompletions(habitId);
    return this.toDto(archived, completions);
  }

  async delete(habitId: string, deviceId: string): Promise<void> {
    await this.requireOwnedHabit(habitId, deviceId);
    await this.habits.deleteById(habitId);
  }

  async listActive(deviceId: string, from: string, to: string): Promise<HabitDto[]> {
    assertDeviceId(deviceId);
    assertIsoDate(from);
    assertIsoDate(to);
    const active = await this.habits.listActiveByDevice(deviceId);
    return Promise.all(
      active.map(async (habit) => {
        const snapshot = habit.snapshot;
        const completions = await this.habits.listCompletions(snapshot.id, from, to);
        const allCompletions = await this.habits.listAllCompletions(snapshot.id);
        return this.toDto(habit, completions, allCompletions);
      })
    );
  }

  async toggleToday(habitId: string, deviceId: string, now = new Date()): Promise<HabitDto> {
    const habit = await this.requireOwnedHabit(habitId, deviceId);
    const snapshot = habit.snapshot;
    const date = todayIso(now);
    const existing = await this.habits.findCompletion(habitId, date);

    if (existing && existing.count > 0) {
      await this.habits.deleteCompletion(habitId, date);
    } else {
      await this.habits.upsertCompletion({
        id: existing?.id ?? randomUUID(),
        habitId,
        deviceId: snapshot.deviceId,
        date,
        count: snapshot.goal.completionsPerDay,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now
      });
    }

    const completions = await this.habits.listAllCompletions(habitId);
    return this.toDto(habit, completions);
  }

  async history(habitId: string, deviceId: string, from: string, to: string): Promise<HabitCompletion[]> {
    await this.requireOwnedHabit(habitId, deviceId);
    return this.habits.listCompletions(habitId, assertIsoDate(from), assertIsoDate(to));
  }

  async streak(habitId: string, deviceId: string): Promise<StreakResult> {
    const habit = await this.requireOwnedHabit(habitId, deviceId);
    const completions = await this.habits.listAllCompletions(habitId);
    return this.streakService.calculate(habit.snapshot.goal, completions, todayIso());
  }

  private async requireOwnedHabit(habitId: string, deviceId: string): Promise<Habit> {
    assertDeviceId(deviceId);
    const habit = await this.habits.findById(habitId);
    if (!habit) {
      throw new HabitNotFoundError("Habit was not found.");
    }
    if (habit.snapshot.deviceId !== deviceId) {
      throw new UnauthorizedDeviceError("This habit belongs to another device.");
    }
    return habit;
  }

  private toDto(habit: Habit, visibleCompletions: HabitCompletion[], streakCompletions = visibleCompletions): HabitDto {
    const snapshot = habit.snapshot;
    return {
      id: snapshot.id,
      deviceId: snapshot.deviceId,
      name: snapshot.name,
      emoji: snapshot.emoji,
      color: snapshot.color,
      shape: snapshot.shape,
      goal: snapshot.goal,
      reminder: snapshot.reminder,
      status: snapshot.status,
      streak: this.streakService.calculate(snapshot.goal, streakCompletions, todayIso()),
      completions: visibleCompletions,
      createdAt: snapshot.createdAt.toISOString(),
      updatedAt: snapshot.updatedAt.toISOString()
    };
  }
}
