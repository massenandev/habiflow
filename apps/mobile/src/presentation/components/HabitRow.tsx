import React from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { isoToday, recentDays } from "../../application/date-range";
import { isCompletedForDate } from "../../application/habit-presenter";
import { Habit } from "../../domain/types";
import { AppTheme } from "../theme/theme";
import { HABIT_DAY_GAP, HABIT_DAY_HIT_SIZE, HABIT_DAY_INDICATOR_SIZE, habitDayTrackWidth } from "./habit-day-layout";

interface Props {
  habit: Habit;
  days: number;
  theme: AppTheme;
  onToggle: (habit: Habit, date: string) => void;
  onEdit: (habit: Habit) => void;
  onArchive: (habit: Habit) => void;
  onDelete: (habit: Habit) => void;
}

export function HabitRow({ habit, days, theme, onToggle, onEdit, onArchive, onDelete }: Props) {
  const dates = recentDays(days);
  const today = isoToday();
  const trackWidth = habitDayTrackWidth(days);
  const showOptions = () =>
    Alert.alert(habit.name, "Choose an action", [
      { text: "Cancel", style: "cancel" },
      { text: "Edit", onPress: () => onEdit(habit) },
      { text: "Archive", onPress: () => onArchive(habit) },
      { text: "Delete", style: "destructive", onPress: () => onDelete(habit) }
    ]);

  return (
    <View style={[styles.row, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.rowContent}>
        <Pressable delayLongPress={220} onLongPress={showOptions} style={styles.identity}>
          <Text style={styles.emoji}>{habit.emoji || "✅"}</Text>
          <View style={styles.nameBlock}>
            <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
              {habit.name}
            </Text>
            <Text style={[styles.meta, { color: theme.muted }]}>🔥 {habit.streak.current} day streak</Text>
          </View>
        </Pressable>
        <View pointerEvents="box-none" style={[styles.days, { width: trackWidth }]}>
          {dates.map((date) => {
            const completed = isCompletedForDate(habit, date);
            const isToday = date === today;
            const canToggle = date <= today;
            return (
              <Pressable
                key={date}
                pressRetentionOffset={0}
                style={styles.dayPressable}
                onPress={() => {
                  if (canToggle) {
                    onToggle(habit, date);
                  }
                }}
              >
                <View
                  style={[
                    styles.indicator,
                    {
                      borderRadius: 999,
                      borderColor: habit.color,
                      backgroundColor: completed ? habit.color : "transparent",
                      opacity: canToggle ? 1 : 0.45,
                      transform: [{ scale: isToday ? 1.02 : 1 }]
                    }
                  ]}
                />
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 72,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  rowContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  identity: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  emoji: {
    fontSize: 28
  },
  nameBlock: {
    flex: 1
  },
  name: {
    fontSize: 17,
    fontWeight: "800"
  },
  meta: {
    marginTop: 3,
    fontSize: 12
  },
  days: {
    flexDirection: "row",
    gap: HABIT_DAY_GAP,
    flexShrink: 0,
    alignItems: "center"
  },
  dayPressable: {
    width: HABIT_DAY_HIT_SIZE,
    height: HABIT_DAY_HIT_SIZE,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible"
  },
  indicator: {
    width: HABIT_DAY_INDICATOR_SIZE,
    height: HABIT_DAY_INDICATOR_SIZE,
    borderWidth: 2
  }
});
