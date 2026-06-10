import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { ThemeMode } from "../../domain/types";
import { UserSettings } from "../../infrastructure/settings-store";
import { Button } from "../components/Button";
import { AppTheme } from "../theme/theme";

interface Props {
  settings: UserSettings;
  backendOnline: boolean;
  theme: AppTheme;
  onChange: (settings: UserSettings) => void;
  onBack: () => void;
}

export function SettingsScreen({ settings, backendOnline, theme, onChange, onBack }: Props) {
  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
      <Text style={[styles.label, { color: theme.muted }]}>Theme</Text>
      <View style={styles.row}>
        {(["system", "light", "dark"] as ThemeMode[]).map((mode) => (
          <Button key={mode} label={mode} theme={theme} variant={settings.theme === mode ? "primary" : "secondary"} onPress={() => onChange({ ...settings, theme: mode })} />
        ))}
      </View>
      <Text style={[styles.label, { color: theme.muted }]}>Dashboard days</Text>
      <View style={styles.row}>
        {[1, 2, 3, 4, 5].map((days) => (
          <Button key={days} label={String(days)} theme={theme} variant={settings.dashboardDays === days ? "primary" : "secondary"} onPress={() => onChange({ ...settings, dashboardDays: days })} />
        ))}
      </View>
      <View style={[styles.status, { borderColor: theme.border, backgroundColor: theme.surface }]}>
        <Text style={{ color: theme.text }}>Backend: {backendOnline ? "online" : "offline"}</Text>
      </View>
      <Button label="Back" theme={theme} variant="secondary" onPress={onBack} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 64,
    gap: 16
  },
  title: {
    fontSize: 28,
    fontWeight: "900"
  },
  label: {
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  status: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14
  }
});
