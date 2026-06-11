import React, { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BarChart3, CalendarDays, FileText, Settings } from "lucide-react-native";
import { recentDays } from "../../application/date-range";
import { Habit } from "../../domain/types";
import { Button } from "../components/Button";
import { HABIT_DATE_CELL_WIDTH, HABIT_DAY_GAP, habitDateTrackWidth } from "../components/habit-day-layout";
import { HabitRow } from "../components/HabitRow";
import { AppTheme } from "../theme/theme";

const rangeOptions = [1, 2, 3, 4, 5];

interface Props {
  habits: Habit[];
  days: number;
  theme: AppTheme;
  loading: boolean;
  error: string | null;
  onCreate: () => void;
  onSettings: () => void;
  onHistory: () => void;
  onReport: () => void;
  onExport: () => void;
  onDaysChange: (days: number) => void;
  onToggle: (habit: Habit, date: string) => void;
  onEdit: (habit: Habit) => void;
  onArchive: (habit: Habit) => void;
  onDelete: (habit: Habit) => void;
}

export function DashboardScreen({ habits, days, theme, loading, error, onCreate, onSettings, onHistory, onReport, onExport, onDaysChange, onToggle, onEdit, onArchive, onDelete }: Props) {
  const [rangeOpen, setRangeOpen] = useState(false);
  const dates = recentDays(days);
  const trackWidth = habitDateTrackWidth(days);

  function chooseDays(nextDays: number) {
    setRangeOpen(false);
    if (nextDays !== days) {
      onDaysChange(nextDays);
    }
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: theme.text }]}>My Habits</Text>
          </View>
          <Button label="+" theme={theme} onPress={onCreate} />
        </View>
        {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}
        {loading ? <ActivityIndicator color={theme.primary} /> : null}
        <View style={styles.listToolbar}>
          <Pressable
            accessibilityLabel="Choose dashboard day range"
            accessibilityRole="button"
            onPress={() => setRangeOpen((open) => !open)}
            style={[styles.rangeButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <Text style={[styles.rangeButtonText, { color: theme.text }]}>Last {days} day{days === 1 ? "" : "s"}</Text>
          </Pressable>
          <View style={[styles.dateHeader, { width: trackWidth }]}>
            {dates.map((date) => (
              <DateHeaderCell key={date} date={date} theme={theme} />
            ))}
          </View>
        </View>
        {rangeOpen ? (
          <View style={styles.rangeOptions}>
            {rangeOptions.map((option) => (
              <Pressable key={option} onPress={() => chooseDays(option)} style={[styles.rangeOption, { backgroundColor: option === days ? theme.primary : theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.rangeOptionText, { color: option === days ? "#FFFFFF" : theme.text }]}>{option}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        <View style={styles.list}>
          {habits.map((habit) => (
            <HabitRow key={habit.id} habit={habit} days={days} theme={theme} onToggle={onToggle} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />
          ))}
        </View>
        {!loading && habits.length === 0 ? <Text style={[styles.empty, { color: theme.muted }]}>Create your first habit with the + button.</Text> : null}
      </ScrollView>
      <View style={[styles.bottomMenu, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <MenuButton label="History" theme={theme} onPress={onHistory} icon={<CalendarDays size={23} color={theme.text} strokeWidth={2.2} />} />
        <MenuButton label="Reports" theme={theme} onPress={onReport} icon={<BarChart3 size={23} color={theme.text} strokeWidth={2.2} />} />
        <MenuButton label="Export PDF" theme={theme} onPress={onExport} icon={<FileText size={23} color={theme.text} strokeWidth={2.2} />} />
        <MenuButton label="Settings" theme={theme} onPress={onSettings} icon={<Settings size={23} color={theme.text} strokeWidth={2.2} />} />
      </View>
    </View>
  );
}

function DateHeaderCell({ date, theme }: { date: string; theme: AppTheme }) {
  const value = new Date(`${date}T00:00:00.000Z`);
  const today = new Date();
  const isToday = date === today.toISOString().slice(0, 10);
  const weekday = value.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }).slice(0, 2).toLowerCase();
  const day = value.getUTCDate();

  return (
    <View style={styles.dateCell}>
      <Text style={[styles.dateText, { color: theme.muted }, isToday ? { color: theme.text, fontWeight: "900" } : null]}>{weekday}</Text>
      <Text style={[styles.dateText, { color: theme.muted }, isToday ? { color: theme.text, fontWeight: "900" } : null]}>{day}</Text>
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
  listToolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  rangeButton: {
    minHeight: 36,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  rangeButtonText: {
    fontSize: 14,
    fontWeight: "800"
  },
  dateHeader: {
    flexDirection: "row",
    gap: HABIT_DAY_GAP,
    flexShrink: 0
  },
  dateCell: {
    width: HABIT_DATE_CELL_WIDTH,
    minHeight: 30,
    alignItems: "center",
    justifyContent: "center"
  },
  dateText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "700"
  },
  rangeOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: -8
  },
  rangeOption: {
    width: 38,
    height: 34,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center"
  },
  rangeOptionText: {
    fontSize: 14,
    fontWeight: "900"
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
