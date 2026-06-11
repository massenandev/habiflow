import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Platform, SafeAreaView, useColorScheme } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Google from "expo-auth-session/providers/google";
import { AuthMode, AuthSession, Habit, HabitFormValues, ScreenName } from "./src/domain/types";
import { HabitApiClient } from "./src/infrastructure/api-client";
import { clearAuthSession, loadAuthSession, saveAuthSession } from "./src/infrastructure/auth-store";
import { getOrCreateDeviceId } from "./src/infrastructure/device-id";
import { exportHabitsPdf } from "./src/infrastructure/pdf-exporter";
import { scheduleHabitReminders } from "./src/infrastructure/notification-service";
import { defaultSettings, loadSettings, saveSettings, UserSettings } from "./src/infrastructure/settings-store";
import { DashboardScreen } from "./src/presentation/screens/DashboardScreen";
import { ExportScreen } from "./src/presentation/screens/ExportScreen";
import { HabitFormScreen } from "./src/presentation/screens/HabitFormScreen";
import { HistoryScreen } from "./src/presentation/screens/HistoryScreen";
import { ReportScreen } from "./src/presentation/screens/ReportScreen";
import { SettingsScreen } from "./src/presentation/screens/SettingsScreen";
import { ForgotPasswordScreen, GuestImportScreen, OnboardingAuthScreen } from "./src/presentation/screens/AuthScreens";
import { resolveTheme } from "./src/presentation/theme/theme";

const api = new HabitApiClient();
const missingGoogleIosClientId = "missing-google-ios-client-id";
const missingGoogleAndroidClientId = "missing-google-android-client-id";
const missingGoogleWebClientId = "missing-google-web-client-id";
const googleIosClientId = googleEnv("EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID", missingGoogleIosClientId);
const googleAndroidClientId = googleEnv("EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID", missingGoogleAndroidClientId);
const googleWebClientId = googleEnv("EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID", missingGoogleWebClientId);

export default function App() {
  const systemTheme = useColorScheme();
  const [screen, setScreen] = useState<ScreenName>("welcome");
  const [authMode, setAuthMode] = useState<AuthMode>("loading");
  const [session, setSession] = useState<AuthSession | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [selectedHabit, setSelectedHabit] = useState<Habit | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backendOnline, setBackendOnline] = useState(false);
  const theme = useMemo(() => resolveTheme(settings.theme, systemTheme), [settings.theme, systemTheme]);
  const [, googleResponse, promptGoogle] = Google.useIdTokenAuthRequest({
    iosClientId: googleIosClientId,
    androidClientId: googleAndroidClientId,
    webClientId: googleWebClientId
  });

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
    void Promise.all([getOrCreateDeviceId(), loadSettings(), loadAuthSession()]).then(([id, savedSettings, savedSession]) => {
      setDeviceId(id);
      setSettings(savedSettings);
      setSession(savedSession);
      api.setSession(savedSession, handleSessionChange);
      setAuthMode(savedSession ? "authenticated" : "signedOut");
      setScreen(savedSession ? "dashboard" : "welcome");
      if (savedSession) {
        void refresh(id, savedSettings.dashboardDays);
      }
    });
  }, [refresh]);

  useEffect(() => {
    if (googleResponse?.type === "success") {
      const idToken = googleResponse.params.id_token;
      if (idToken) {
        void completeAuth(api.social("google", idToken));
      }
    }
  }, [googleResponse]);

  async function handleSessionChange(next: AuthSession | null) {
    setSession(next);
    api.setSession(next, handleSessionChange);
    if (next) {
      await saveAuthSession(next);
    } else {
      await clearAuthSession();
      setAuthMode("signedOut");
      setScreen("welcome");
    }
  }

  async function enterGuestMode() {
    api.setSession(null, handleSessionChange);
    await clearAuthSession();
    setSession(null);
    setAuthMode("guest");
    setScreen("dashboard");
    await refresh();
  }

  async function completeAuth(request: Promise<AuthSession>) {
    try {
      const guestHabits = deviceId ? await api.listHabits(deviceId, settings.dashboardDays).catch(() => []) : [];
      const next = await request;
      await handleSessionChange(next);
      setAuthMode("authenticated");
      setScreen(guestHabits.length > 0 ? "guestImport" : "dashboard");
      if (guestHabits.length === 0) {
        await refresh();
      }
    } catch (err) {
      Alert.alert("Authentication failed", err instanceof Error ? err.message : "Try again.");
    }
  }

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

  async function toggleHabit(habit: Habit, date: string) {
    if (!deviceId) {
      return;
    }
    try {
      const updated = await api.toggleHabit(habit.id, deviceId, date);
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

  async function archiveHabitFromRow(habit: Habit) {
    if (!deviceId) {
      return;
    }
    try {
      await api.archiveHabit(habit.id, deviceId);
      await refresh();
    } catch (err) {
      Alert.alert("Could not archive habit", err instanceof Error ? err.message : "Try again.");
    }
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

  async function logout() {
    if (session) {
      await api.logout(session.refreshToken).catch(() => undefined);
    }
    await handleSessionChange(null);
  }

  async function deleteAccount() {
    Alert.alert("Delete account", "This permanently deletes your account and account habits.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void api.deleteAccount().then(async () => {
            await handleSessionChange(null);
          }).catch((err) => {
            Alert.alert("Could not delete account", err instanceof Error ? err.message : "Try again.");
          });
        }
      }
    ]);
  }

  async function loginWithApple() {
    try {
      const available = await AppleAuthentication.isAvailableAsync();
      if (!available) {
        Alert.alert("Apple login unavailable", "Apple sign-in is available on supported iOS devices.");
        return;
      }
      const credential = await AppleAuthentication.signInAsync({ requestedScopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL, AppleAuthentication.AppleAuthenticationScope.FULL_NAME] });
      if (credential.identityToken) {
        await completeAuth(api.social("apple", credential.identityToken));
      }
    } catch (err) {
      if ((err as { code?: string }).code !== "ERR_REQUEST_CANCELED") {
        Alert.alert("Apple login failed", err instanceof Error ? err.message : "Try again.");
      }
    }
  }

  function loginWithGoogle() {
    const missingClientId = Platform.OS === "ios" ? googleIosClientId === missingGoogleIosClientId : googleAndroidClientId === missingGoogleAndroidClientId;
    if (missingClientId) {
      Alert.alert("Google login not configured", `Add ${Platform.OS === "ios" ? "EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID" : "EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID"} to apps/mobile/.env.local, then restart Expo with --clear.`);
      return;
    }
    void promptGoogle();
  }

  async function exportPdf(selectedHabits: Habit[]) {
    const today = new Date();
    try {
      await exportHabitsPdf(selectedHabits, today.getMonth() + 1, today.getFullYear());
    } catch (err) {
      Alert.alert("Could not export PDF", err instanceof Error ? err.message : "Try again.");
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      {authMode === "loading" ? null : null}
      {screen === "welcome" || screen === "signup" || screen === "login" ? (
        <OnboardingAuthScreen
          mode={screen === "login" ? "login" : "signup"}
          theme={theme}
          onSubmit={(values) => completeAuth(screen === "login" ? api.login(values.email, values.password) : api.signup(values.email, values.password))}
          onSwitchMode={() => setScreen(screen === "login" ? "signup" : "login")}
          onForgotPassword={() => setScreen("forgotPassword")}
          onGuest={enterGuestMode}
          onGoogle={loginWithGoogle}
          onApple={loginWithApple}
        />
      ) : null}
      {screen === "forgotPassword" ? <ForgotPasswordScreen theme={theme} onBack={() => setScreen("login")} onSubmit={(email) => api.forgotPassword(email)} /> : null}
      {screen === "guestImport" && deviceId ? (
        <GuestImportScreen
          theme={theme}
          onImport={() => {
            void api.claimGuestData(deviceId).then(async () => {
              setScreen("dashboard");
              await refresh();
            });
          }}
          onStartFresh={() => {
            setScreen("dashboard");
            void refresh();
          }}
        />
      ) : null}
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
          onReport={() => setScreen("report")}
          onExport={() => setScreen("export")}
          onDaysChange={(dashboardDays) => {
            void updateSettings({ ...settings, dashboardDays });
          }}
          onToggle={toggleHabit}
          onEdit={(habit) => {
            setSelectedHabit(habit);
            setScreen("edit");
          }}
          onArchive={archiveHabitFromRow}
          onDelete={async (habit) => {
            if (!deviceId) {
              return;
            }
            Alert.alert("Delete habit", "This permanently removes the habit and its history.", [
              { text: "Cancel", style: "cancel" },
              {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                  try {
                    await api.deleteHabit(habit.id, deviceId);
                    await refresh();
                  } catch (err) {
                    Alert.alert("Could not delete habit", err instanceof Error ? err.message : "Try again.");
                  }
                }
              }
            ]);
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
      {screen === "report" && deviceId ? <ReportScreen api={api} deviceId={deviceId} habits={habits} theme={theme} onBack={() => setScreen("dashboard")} /> : null}
      {screen === "settings" ? <SettingsScreen settings={settings} backendOnline={backendOnline} theme={theme} onChange={updateSettings} onBack={() => setScreen("dashboard")} onLogout={authMode === "authenticated" ? logout : undefined} onDeleteAccount={authMode === "authenticated" ? deleteAccount : undefined} /> : null}
      {screen === "export" ? <ExportScreen habits={habits} theme={theme} onExport={exportPdf} onBack={() => setScreen("dashboard")} /> : null}
    </SafeAreaView>
  );
}

function googleEnv(name: string, fallback: string): string {
  const value = process.env[name]?.trim();
  return value && !value.startsWith("your-") ? value : fallback;
}
