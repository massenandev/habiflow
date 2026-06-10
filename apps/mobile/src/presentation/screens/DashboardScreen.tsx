import React from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { CalendarDays, FileText, Settings } from "lucide-react-native";
import { Habit } from "../../domain/types";
import { Button } from "../components/Button";
import { HabitRow } from "../components/HabitRow";
import { AppTheme } from "../theme/theme";

interface Props {
  habits: Habit[];
  days: number;
  theme: AppTheme;
  loading: boolean;
  error: string | null;
  onCreate: () => void;
  onSettings: () => void;
  onHistory: () => void;
  onExport: () => void;
  onToggle: (habit: Habit) => void;
  onEdit: (habit: Habit) => void;
}

export function DashboardScreen({ habits, days, theme, loading, error, onCreate, onSettings, onHistory, onExport, onToggle, onEdit }: Props) {
  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: theme.text }]}>My Habits</Text>
            <Text style={[styles.subtitle, { color: theme.muted }]}>Last {days} day{days === 1 ? "" : "s"}</Text>
          </View>
          <Button label="+" theme={theme} onPress={onCreate} />
        </View>
        {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}
        {loading ? <ActivityIndicator color={theme.primary} /> : null}
        <View style={styles.list}>
          {habits.map((habit) => (
            <HabitRow key={habit.id} habit={habit} days={days} theme={theme} onToggle={onToggle} onEdit={onEdit} />
          ))}
        </View>
        {!loading && habits.length === 0 ? <Text style={[styles.empty, { color: theme.muted }]}>Create your first habit with the + button.</Text> : null}
      </ScrollView>
      <View style={[styles.bottomMenu, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <MenuButton label="History" theme={theme} onPress={onHistory} icon={<CalendarDays size={23} color={theme.text} strokeWidth={2.2} />} />
        <MenuButton label="Export PDF" theme={theme} onPress={onExport} icon={<FileText size={23} color={theme.text} strokeWidth={2.2} />} />
        <MenuButton label="Settings" theme={theme} onPress={onSettings} icon={<Settings size={23} color={theme.text} strokeWidth={2.2} />} />
      </View>
    </View>
  );
}

function MenuButton({ label, theme, icon, onPress }: { label: string; theme: AppTheme; icon: React.ReactNode; onPress: () => void }) {
  return (
    <Pressable accessibilityLabel={label} accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.menuButton, { backgroundColor: pressed ? theme.background : "transparent" }]}>
      {icon}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1
  },
  container: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 64,
    paddingBottom: 118,
    gap: 18
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  title: {
    fontSize: 30,
    fontWeight: "900"
  },
  subtitle: {
    marginTop: 3,
    fontSize: 14
  },
  list: {
    gap: 10
  },
  empty: {
    textAlign: "center",
    marginTop: 32,
    fontSize: 15
  },
  error: {
    fontSize: 14,
    fontWeight: "700"
  },
  bottomMenu: {
    position: "absolute",
    left: 72,
    right: 72,
    bottom: 28,
    minHeight: 58,
    borderWidth: 1,
    borderRadius: 28,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000000",
    shadowOpacity: 0.13,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8
  },
  menuButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center"
  }
});
