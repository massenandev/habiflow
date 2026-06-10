import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { recentDays } from "../../application/date-range";
import { isCompletedForDate } from "../../application/habit-presenter";
import { Habit } from "../../domain/types";
import { AppTheme } from "../theme/theme";

interface Props {
  habit: Habit;
  days: number;
  theme: AppTheme;
  onToggle: (habit: Habit) => void;
  onEdit: (habit: Habit) => void;
}

export function HabitRow({ habit, days, theme, onToggle, onEdit }: Props) {
  const dates = recentDays(days);
  const today = dates[dates.length - 1];
  return (
    <Pressable onPress={() => onEdit(habit)} style={[styles.row, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.identity}>
        <Text style={styles.emoji}>{habit.emoji || "✅"}</Text>
        <View style={styles.nameBlock}>
          <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
            {habit.name}
          </Text>
          <Text style={[styles.meta, { color: theme.muted }]}>🔥 {habit.streak.current} day streak</Text>
        </View>
      </View>
      <View style={styles.days}>
        {dates.map((date) => {
          const completed = isCompletedForDate(habit, date);
          const isToday = date === today;
          return (
            <Pressable
              key={date}
              onPress={(event) => {
                event.stopPropagation();
                if (isToday) {
                  onToggle(habit);
                }
              }}
              style={[
                styles.indicator,
                {
                  borderRadius: 999,
                  borderColor: habit.color,
                  backgroundColor: completed ? habit.color : "transparent",
                  opacity: isToday ? 1 : 0.72
                }
              ]}
            />
          );
        })}
      </View>
    </Pressable>
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
    gap: 7
  },
  indicator: {
    width: 22,
    height: 22,
    borderWidth: 2
  }
});
