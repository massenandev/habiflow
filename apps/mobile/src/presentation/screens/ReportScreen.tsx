import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { isoToday } from "../../application/date-range";
import { Habit } from "../../domain/types";
import { HabitApiClient } from "../../infrastructure/api-client";
import { Button } from "../components/Button";
import { AppTheme } from "../theme/theme";

type ReportRange = "year" | "6m" | "3m" | "1m";

const ranges: { key: ReportRange; label: string }[] = [
  { key: "year", label: "Year" },
  { key: "6m", label: "Last 6 months" },
  { key: "3m", label: "Last 3 months" },
  { key: "1m", label: "Last month" }
];

interface Props {
  api: HabitApiClient;
  deviceId: string;
  habits: Habit[];
  theme: AppTheme;
  onBack: () => void;
}

export function ReportScreen({ api, deviceId, habits, theme, onBack }: Props) {
  const [range, setRange] = useState<ReportRange>("1m");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countsByHabitId, setCountsByHabitId] = useState<Record<string, number>>({});
  const from = useMemo(() => rangeStart(range), [range]);
  const to = useMemo(() => isoToday(), []);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const results = await Promise.all(
          habits.map(async (habit) => {
            const history = await api.history(habit.id, deviceId, from, to);
            return [habit.id, history.filter((item) => item.count > 0).length] as const;
          })
        );

        if (!active) {
          return;
        }

        setCountsByHabitId(Object.fromEntries(results));
      } catch (err) {
        if (!active) {
          return;
        }
        setError(err instanceof Error ? err.message : "Unable to load reports.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [api, deviceId, from, habits, to]);

  const rows = useMemo(
    () =>
      habits.map((habit) => ({
        habit,
        completedTimes: countsByHabitId[habit.id] ?? 0
      })),
    [countsByHabitId, habits]
  );

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Reports</Text>
      <View style={styles.filters}>
        {ranges.map((item) => (
          <Button key={item.key} label={item.label} theme={theme} variant={range === item.key ? "primary" : "secondary"} onPress={() => setRange(item.key)} />
        ))}
      </View>
      {loading ? <ActivityIndicator color={theme.primary} /> : null}
      {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}
      {rows.map(({ habit, completedTimes }) => (
        <View key={habit.id} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.name, { color: theme.text }]}>
            {habit.emoji || "✅"} {habit.name}
          </Text>
          <Text style={[styles.value, { color: theme.text }]}>
            completed {completedTimes} time{completedTimes === 1 ? "" : "s"}
          </Text>
        </View>
      ))}
      {!loading && rows.length === 0 ? <Text style={[styles.empty, { color: theme.muted }]}>No habits yet.</Text> : null}
      <Button label="Back" theme={theme} variant="secondary" onPress={onBack} />
    </ScrollView>
  );
}

function rangeStart(range: ReportRange): string {
  const now = new Date();
  const value = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (range === "year") {
    value.setUTCFullYear(value.getUTCFullYear() - 1);
  } else if (range === "6m") {
    value.setUTCMonth(value.getUTCMonth() - 6);
  } else if (range === "3m") {
    value.setUTCMonth(value.getUTCMonth() - 3);
  } else {
    value.setUTCMonth(value.getUTCMonth() - 1);
  }
  return value.toISOString().slice(0, 10);
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
  filters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  card: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    gap: 8
  },
  name: {
    fontSize: 17,
    fontWeight: "800"
  },
  value: {
    fontSize: 15,
    fontWeight: "700"
  },
  empty: {
    textAlign: "center",
    marginTop: 32,
    fontSize: 15
  },
  error: {
    fontSize: 14,
    fontWeight: "700"
  }
});
