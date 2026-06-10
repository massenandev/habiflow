import { Injectable } from "@nestjs/common";
import { Habit } from "../domain/habit";
import { HabitCompletion, HabitProps } from "../domain/types";
import { PersistenceError } from "../domain/errors";
import { HabitRepository } from "../application/ports/habit-repository";
import { PrismaService } from "./prisma.service";

@Injectable()
export class PrismaHabitRepository implements HabitRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(habit: Habit): Promise<void> {
    const item = habit.snapshot;
    await this.safe(
      this.prisma.habit.upsert({
        where: { id: item.id },
        create: {
          id: item.id,
          deviceId: item.deviceId,
          name: item.name,
          emoji: item.emoji,
          color: item.color,
          shape: "circle",
          goalType: item.goal.streakGoal,
          targetCount: item.goal.completionsPerDay,
          targetPeriod: "day",
          reminderEnabled: item.reminder.count > 0,
          reminderTime: item.reminder.times[0] ?? null,
          reminderCount: item.reminder.count,
          reminderTimes: item.reminder.times,
          status: item.status,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt
        },
        update: {
          name: item.name,
          emoji: item.emoji,
          color: item.color,
          shape: "circle",
          goalType: item.goal.streakGoal,
          targetCount: item.goal.completionsPerDay,
          targetPeriod: "day",
          reminderEnabled: item.reminder.count > 0,
          reminderTime: item.reminder.times[0] ?? null,
          reminderCount: item.reminder.count,
          reminderTimes: item.reminder.times,
          status: item.status,
          updatedAt: item.updatedAt
        }
      })
    );
  }

  async findById(id: string): Promise<Habit | null> {
    const row = await this.safe(this.prisma.habit.findUnique({ where: { id } }));
    return row ? this.toHabit(row) : null;
  }

  async listActiveByDevice(deviceId: string): Promise<Habit[]> {
    const rows = await this.safe(
      this.prisma.habit.findMany({
        where: { deviceId, status: "active" },
        orderBy: { createdAt: "asc" }
      })
    );
    return rows.map((row) => this.toHabit(row));
  }

  async deleteById(id: string): Promise<void> {
    await this.safe(this.prisma.habit.delete({ where: { id } }));
  }

  async findCompletion(habitId: string, date: string): Promise<HabitCompletion | null> {
    const row = await this.safe(
      this.prisma.habitCompletion.findUnique({
        where: { habitId_completionDate: { habitId, completionDate: this.toDate(date) } }
      })
    );
    return row ? this.toCompletion(row) : null;
  }

  async upsertCompletion(completion: HabitCompletion): Promise<void> {
    await this.safe(
      this.prisma.habitCompletion.upsert({
        where: {
          habitId_completionDate: {
            habitId: completion.habitId,
            completionDate: this.toDate(completion.date)
          }
        },
        create: {
          id: completion.id,
          habitId: completion.habitId,
          deviceId: completion.deviceId,
          completionDate: this.toDate(completion.date),
          count: completion.count,
          createdAt: completion.createdAt,
          updatedAt: completion.updatedAt
        },
        update: {
          count: completion.count,
          updatedAt: completion.updatedAt
        }
      })
    );
  }

  async deleteCompletion(habitId: string, date: string): Promise<void> {
    await this.safe(
      this.prisma.habitCompletion.deleteMany({
        where: { habitId, completionDate: this.toDate(date) }
      })
    );
  }

  async listCompletions(habitId: string, from: string, to: string): Promise<HabitCompletion[]> {
    const rows = await this.safe(
      this.prisma.habitCompletion.findMany({
        where: {
          habitId,
          completionDate: {
            gte: this.toDate(from),
            lte: this.toDate(to)
          }
        },
        orderBy: { completionDate: "asc" }
      })
    );
    return rows.map((row) => this.toCompletion(row));
  }

  async listAllCompletions(habitId: string): Promise<HabitCompletion[]> {
    const rows = await this.safe(
      this.prisma.habitCompletion.findMany({
        where: { habitId },
        orderBy: { completionDate: "asc" }
      })
    );
    return rows.map((row) => this.toCompletion(row));
  }

  private async safe<T>(operation: Promise<T>): Promise<T> {
    try {
      return await operation;
    } catch (error) {
      throw new PersistenceError(error instanceof Error ? error.message : "Database operation failed.");
    }
  }

  private toDate(date: string): Date {
    return new Date(`${date}T00:00:00.000Z`);
  }

  private toIsoDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private toHabit(row: {
    id: string;
    deviceId: string;
    name: string;
    emoji: string;
    color: string;
    shape: string;
    goalType: string;
    targetCount: number;
    targetPeriod: string;
    reminderEnabled: boolean;
    reminderTime: string | null;
    reminderCount: number;
    reminderTimes: string[];
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }): Habit {
    const props: HabitProps = {
      id: row.id,
      deviceId: row.deviceId,
      name: row.name,
      emoji: row.emoji,
      color: row.color,
      shape: "circle",
      goal: {
        streakGoal: row.goalType as HabitProps["goal"]["streakGoal"],
        completionsPerDay: row.targetCount
      },
      reminder: {
        count: row.reminderCount ?? (row.reminderEnabled ? 1 : 0),
        times: row.reminderTimes?.length ? row.reminderTimes : row.reminderTime ? [row.reminderTime] : []
      },
      status: row.status as HabitProps["status"],
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };
    return Habit.rehydrate(props);
  }

  private toCompletion(row: {
    id: string;
    habitId: string;
    deviceId: string;
    completionDate: Date;
    count: number;
    createdAt: Date;
    updatedAt: Date;
  }): HabitCompletion {
    return {
      id: row.id,
      habitId: row.habitId,
      deviceId: row.deviceId,
      date: this.toIsoDate(row.completionDate),
      count: row.count,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };
  }
}
