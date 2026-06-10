import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Habit } from "../../domain/types";
import { Button } from "../components/Button";
import { AppTheme } from "../theme/theme";

interface Props {
  habits: Habit[];
  theme: AppTheme;
  onExport: (habit: Habit) => void;
  onBack: () => void;
}

export function ExportScreen({ habits, theme, onExport, onBack }: Props) {
  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Export PDF</Text>
      {habits.map((habit) => (
        <View key={habit.id} style={[styles.row, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.name, { color: theme.text }]}>{habit.emoji} {habit.name}</Text>
          <Button label="Export" theme={theme} onPress={() => onExport(habit)} />
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
  row: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10
  },
  name: {
    flex: 1,
    fontSize: 17,
    fontWeight: "800"
  }
});
