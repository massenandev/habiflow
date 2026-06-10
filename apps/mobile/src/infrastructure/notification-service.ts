import * as Notifications from "expo-notifications";
import { Habit } from "../domain/types";

export async function scheduleHabitReminders(habit: Pick<Habit, "id" | "name" | "emoji" | "reminder">): Promise<string[]> {
  if (habit.reminder.count === 0 || habit.reminder.times.length === 0) {
    return [];
  }

  const permission = await Notifications.requestPermissionsAsync();
  if (permission.status !== "granted") {
    return [];
  }

  return Promise.all(
    habit.reminder.times.map((time) => {
      const [hour, minute] = time.split(":").map(Number);
      return Notifications.scheduleNotificationAsync({
        content: {
          title: `${habit.emoji || "✅"} ${habit.name}`,
          body: "Time for your habit."
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute
        }
      });
    })
  );
}
