import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, SafeAreaView, useColorScheme } from "react-native";
import { Habit, HabitFormValues, ScreenName } from "./src/domain/types";
import { HabitApiClient } from "./src/infrastructure/api-client";
import { getOrCreateDeviceId } from "./src/infrastructure/device-id";
import { exportHabitPdf } from "./src/infrastructure/pdf-exporter";
import { scheduleHabitReminders } from "./src/infrastructure/notification-service";
import { defaultSettings, loadSettings, saveSettings, UserSettings } from "./src/infrastructure/settings-store";
import { DashboardScreen } from "./src/presentation/screens/DashboardScreen";
import { ExportScreen } from "./src/presentation/screens/ExportScreen";
import { HabitFormScreen } from "./src/presentation/screens/HabitFormScreen";
import { HistoryScreen } from "./src/presentation/screens/HistoryScreen";
import { SettingsScreen } from "./src/presentation/screens/SettingsScreen";
import { resolveTheme } from "./src/presentation/theme/theme";

const api = new HabitApiClient();

export default function App() {
  const systemTheme = useColorScheme();
  const [screen, setScreen] = useState<ScreenName>("dashboard");
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [selectedHabit, setSelectedHabit] = useState<Habit | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backendOnline, setBackendOnline] = useState(false);
  const theme = useMemo(() => resolveTheme(settings.theme, systemTheme), [settings.theme, systemTheme]);

  const refresh = useCallback(async (id = deviceId, days = settings.dashboardDays) => {
    if (!id) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [items, online] = await Promise.all([api.listHabits(id, days), api.health()]);
      setHabits(items);
      setBackendOnline(online);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load habits.");
      setBackendOnline(false);
    } finally {
      setLoading(false);
    }
  }, [deviceId, settings.dashboardDays]);

  useEffect(() => {
    void Promise.all([getOrCreateDeviceId(), loadSettings()]).then(([id, savedSettings]) => {
      setDeviceId(id);
      setSettings(savedSettings);
      void refresh(id, savedSettings.dashboardDays);
    });
  }, [refresh]);

  async function saveHabit(values: HabitFormValues) {
    if (!deviceId) {
      return;
    }
    try {
      const habit = selectedHabit ? await api.updateHabit(selectedHabit.id, deviceId, values) : await api.createHabit(deviceId, values);
      const notificationIds = await scheduleHabitReminders(habit);
      if (habit.reminder.count > 0 && notificationIds.length === 0) {
        Alert.alert("Reminder disabled", "Notification permission was not granted, so the habit was saved without a reminder.");
      }
      setScreen("dashboard");
      setSelectedHabit(undefined);
      await refresh();
    } catch (err) {
      Alert.alert("Could not save habit", err instanceof Error ? err.message : "Try again.");
    }
  }

  async function toggleHabit(habit: Habit) {
    if (!deviceId) {
      return;
    }
    try {
      const updated = await api.toggleHabit(habit.id, deviceId);
      setHabits((items) => items.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to toggle habit.");
    }
  }

  async function archiveHabit() {
    if (!deviceId || !selectedHabit) {
      return;
    }
    await api.archiveHabit(selectedHabit.id, deviceId);
    setSelectedHabit(undefined);
    setScreen("dashboard");
    await refresh();
  }

  async function deleteHabit() {
    if (!deviceId || !selectedHabit) {
      return;
    }
    Alert.alert("Delete habit", "This permanently removes the habit and its history.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void api.deleteHabit(selectedHabit.id, deviceId).then(() => {
            setSelectedHabit(undefined);
            setScreen("dashboard");
            void refresh();
          });
        }
      }
    ]);
  }

  async function updateSettings(next: UserSettings) {
    setSettings(next);
    await saveSettings(next);
    await refresh(deviceId, next.dashboardDays);
  }

  async function exportPdf(habit: Habit) {
    const today = new Date();
    try {
      await exportHabitPdf(habit, today.getMonth() + 1, today.getFullYear());
    } catch (err) {
      Alert.alert("Could not export PDF", err instanceof Error ? err.message : "Try again.");
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      {screen === "dashboard" ? (
        <DashboardScreen
          habits={habits}
          days={settings.dashboardDays}
          theme={theme}
          loading={loading}
          error={error}
          onCreate={() => {
            setSelectedHabit(undefined);
            setScreen("create");
          }}
          onSettings={() => setScreen("settings")}
          onHistory={() => setScreen("history")}
          onExport={() => setScreen("export")}
          onToggle={toggleHabit}
          onEdit={(habit) => {
            setSelectedHabit(habit);
            setScreen("edit");
          }}
        />
      ) : null}
      {screen === "create" || screen === "edit" ? (
        <HabitFormScreen
          habit={selectedHabit}
          theme={theme}
          onSave={saveHabit}
          onBack={() => {
            setSelectedHabit(undefined);
            setScreen("dashboard");
          }}
          onArchive={selectedHabit ? archiveHabit : undefined}
          onDelete={selectedHabit ? deleteHabit : undefined}
        />
      ) : null}
      {screen === "history" ? <HistoryScreen habits={habits} theme={theme} onBack={() => setScreen("dashboard")} /> : null}
      {screen === "settings" ? <SettingsScreen settings={settings} backendOnline={backendOnline} theme={theme} onChange={updateSettings} onBack={() => setScreen("dashboard")} /> : null}
      {screen === "export" ? <ExportScreen habits={habits} theme={theme} onExport={exportPdf} onBack={() => setScreen("dashboard")} /> : null}
    </SafeAreaView>
  );
}
