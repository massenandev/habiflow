import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { recentDays } from "../../application/date-range";
import { isCompletedForDate } from "../../application/habit-presenter";
import { Habit } from "../../domain/types";
import { Button } from "../components/Button";
import { AppTheme } from "../theme/theme";

interface Props {
  habits: Habit[];
  theme: AppTheme;
  onBack: () => void;
}

export function HistoryScreen({ habits, theme, onBack }: Props) {
  const dates = recentDays(5);
  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Habit History</Text>
      {habits.map((habit) => (
        <View key={habit.id} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.name, { color: theme.text }]}>{habit.emoji || "✅"} {habit.name}</Text>
          <View style={styles.days}>
            {dates.map((date) => (
              <View key={date} style={styles.day}>
                <Text style={[styles.date, { color: theme.muted }]}>{date.slice(5)}</Text>
                <View style={[styles.dot, { borderColor: habit.color, backgroundColor: isCompletedForDate(habit, date) ? habit.color : "transparent", borderRadius: 999 }]} />
              </View>
            ))}
          </View>
        </View>
      ))}
      <Button label="Back" theme={theme} variant="secondary" onPress={onBack} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 64,
    gap: 14
  },
  title: {
    fontSize: 28,
    fontWeight: "900"
  },
  card: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    gap: 12
  },
  name: {
    fontSize: 17,
    fontWeight: "800"
  },
  days: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  day: {
    alignItems: "center",
    gap: 6
  },
  date: {
    fontSize: 12
  },
  dot: {
    width: 24,
    height: 24,
    borderWidth: 2
  }
});
