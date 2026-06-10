import { randomUUID } from "crypto";
import { assertColor, assertDeviceId, assertEmoji, assertGoal, assertHabitName, assertReminderSettings } from "./value-objects";
import { HabitGoal, HabitProps, ReminderSettings } from "./types";

export interface CreateHabitInput {
  deviceId: string;
  name: string;
  emoji?: string;
  color: string;
  goal: HabitGoal;
  reminder: ReminderSettings;
}

export class Habit {
  private constructor(private readonly props: HabitProps) {}

  static create(input: CreateHabitInput, now = new Date()): Habit {
    return new Habit({
      id: randomUUID(),
      deviceId: assertDeviceId(input.deviceId),
      name: assertHabitName(input.name),
      emoji: assertEmoji(input.emoji),
      color: assertColor(input.color),
      shape: "circle",
      goal: assertGoal(input.goal),
      reminder: assertReminderSettings(input.reminder),
      status: "active",
      createdAt: now,
      updatedAt: now
    });
  }

  static rehydrate(props: HabitProps): Habit {
    return new Habit({
      ...props,
      deviceId: assertDeviceId(props.deviceId),
      name: assertHabitName(props.name),
      emoji: assertEmoji(props.emoji),
      color: assertColor(props.color),
      shape: "circle",
      goal: assertGoal(props.goal),
      reminder: assertReminderSettings(props.reminder)
    });
  }

  update(input: Partial<Omit<CreateHabitInput, "deviceId">>, now = new Date()): Habit {
    const nextReminder = input.reminder ?? this.props.reminder;

    return Habit.rehydrate({
      ...this.props,
      name: input.name === undefined ? this.props.name : assertHabitName(input.name),
      emoji: input.emoji === undefined ? this.props.emoji : assertEmoji(input.emoji),
      color: input.color === undefined ? this.props.color : assertColor(input.color),
      shape: "circle",
      goal: input.goal === undefined ? this.props.goal : assertGoal(input.goal),
      reminder: assertReminderSettings(nextReminder),
      updatedAt: now
    });
  }

  archive(now = new Date()): Habit {
    return Habit.rehydrate({ ...this.props, status: "archived", updatedAt: now });
  }

  get snapshot(): HabitProps {
    return { ...this.props, goal: { ...this.props.goal }, reminder: { ...this.props.reminder } };
  }
}
