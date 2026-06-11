import { Inject, Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { Habit, CreateHabitInput } from "../domain/habit";
import { HabitCompletion, HabitGoal, HabitShape, ReminderSettings } from "../domain/types";
import { HabitNotFoundError, UnauthorizedDeviceError, ValidationError } from "../domain/errors";
import { assertDeviceId, assertIsoDate } from "../domain/value-objects";
import { isFutureIso, todayIso } from "../domain/date-utils";
import { StreakResult, StreakService } from "../domain/streak.service";
import { HABIT_REPOSITORY, HabitRepository } from "./ports/habit-repository";

export interface HabitDto {
  id: string;
  deviceId: string;
  userId?: string | null;
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

export type HabitOwner = { deviceId: string; userId?: string | null };
type HabitOwnerInput = HabitOwner | string;

@Injectable()
export class HabitService {
  private readonly streakService = new StreakService();

  constructor(@Inject(HABIT_REPOSITORY) private readonly habits: HabitRepository) {}

  async create(input: CreateHabitInput, userId?: string | null): Promise<HabitDto> {
    const nextInput = { ...input, userId: userId ?? input.userId ?? null };
    const habit = Habit.create(nextInput);
    await this.habits.save(habit);
    return this.toDto(habit, []);
  }

  async update(
    habitId: string,
    owner: HabitOwnerInput,
    input: Partial<{ name: string; emoji: string; color: string; goal: HabitGoal; reminder: ReminderSettings }>
  ): Promise<HabitDto> {
    const habit = await this.requireOwnedHabit(habitId, this.normalizeOwner(owner));
    const updated = habit.update(input);
    await this.habits.save(updated);
    const completions = await this.habits.listAllCompletions(habitId);
    return this.toDto(updated, completions);
  }

  async archive(habitId: string, owner: HabitOwnerInput): Promise<HabitDto> {
    const habit = await this.requireOwnedHabit(habitId, this.normalizeOwner(owner));
    const archived = habit.archive();
    await this.habits.save(archived);
    const completions = await this.habits.listAllCompletions(habitId);
    return this.toDto(archived, completions);
  }

  async delete(habitId: string, owner: HabitOwnerInput): Promise<void> {
    await this.requireOwnedHabit(habitId, this.normalizeOwner(owner));
    await this.habits.deleteById(habitId);
  }

  async listActive(owner: HabitOwnerInput, from: string, to: string): Promise<HabitDto[]> {
    const normalizedOwner = this.normalizeOwner(owner);
    assertDeviceId(normalizedOwner.deviceId);
    assertIsoDate(from);
    assertIsoDate(to);
    const active = normalizedOwner.userId ? await this.habits.listActiveByUser(normalizedOwner.userId) : await this.habits.listActiveByDevice(normalizedOwner.deviceId);
    return Promise.all(
      active.map(async (habit) => {
        const snapshot = habit.snapshot;
        const completions = await this.habits.listCompletions(snapshot.id, from, to);
        const allCompletions = await this.habits.listAllCompletions(snapshot.id);
        return this.toDto(habit, completions, allCompletions);
      })
    );
  }

  async toggleDate(habitId: string, owner: HabitOwnerInput, date: string, now = new Date()): Promise<HabitDto> {
    const habit = await this.requireOwnedHabit(habitId, this.normalizeOwner(owner));
    const snapshot = habit.snapshot;
    const normalizedDate = assertIsoDate(date);
    if (isFutureIso(normalizedDate, now)) {
      throw new ValidationError("Future habit completions are not allowed.");
    }
    const existing = await this.habits.findCompletion(habitId, normalizedDate);

    if (existing && existing.count > 0) {
      await this.habits.deleteCompletion(habitId, normalizedDate);
    } else {
      await this.habits.upsertCompletion({
        id: existing?.id ?? randomUUID(),
        habitId,
        deviceId: snapshot.deviceId,
        date: normalizedDate,
        count: snapshot.goal.completionsPerDay,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now
      });
    }

    const completions = await this.habits.listAllCompletions(habitId);
    return this.toDto(habit, completions);
  }

  async history(habitId: string, owner: HabitOwnerInput, from: string, to: string): Promise<HabitCompletion[]> {
    await this.requireOwnedHabit(habitId, this.normalizeOwner(owner));
    return this.habits.listCompletions(habitId, assertIsoDate(from), assertIsoDate(to));
  }

  async streak(habitId: string, owner: HabitOwnerInput): Promise<StreakResult> {
    const habit = await this.requireOwnedHabit(habitId, this.normalizeOwner(owner));
    const completions = await this.habits.listAllCompletions(habitId);
    return this.streakService.calculate(habit.snapshot.goal, completions, todayIso());
  }

  async claimGuestData(deviceId: string, userId: string): Promise<number> {
    assertDeviceId(deviceId);
    return this.habits.claimGuestHabits(deviceId, userId);
  }

  private async requireOwnedHabit(habitId: string, owner: HabitOwner): Promise<Habit> {
    assertDeviceId(owner.deviceId);
    const habit = await this.habits.findById(habitId);
    if (!habit) {
      throw new HabitNotFoundError("Habit was not found.");
    }
    const snapshot = habit.snapshot;
    const ownedByUser = owner.userId && snapshot.userId === owner.userId;
    const ownedByDevice = !owner.userId && !snapshot.userId && snapshot.deviceId === owner.deviceId;
    if (!ownedByUser && !ownedByDevice) {
      throw new UnauthorizedDeviceError("This habit belongs to another device.");
    }
    return habit;
  }

  private normalizeOwner(owner: HabitOwnerInput): HabitOwner {
    return typeof owner === "string" ? { deviceId: owner } : owner;
  }

  private toDto(habit: Habit, visibleCompletions: HabitCompletion[], streakCompletions = visibleCompletions): HabitDto {
    const snapshot = habit.snapshot;
    return {
      id: snapshot.id,
      deviceId: snapshot.deviceId,
      userId: snapshot.userId,
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
