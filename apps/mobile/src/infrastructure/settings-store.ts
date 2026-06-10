import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemeMode } from "../domain/types";

const SETTINGS_KEY = "habiflow.settings";

export interface UserSettings {
  theme: ThemeMode;
  dashboardDays: number;
}

export const defaultSettings: UserSettings = {
  theme: "system",
  dashboardDays: 3
};

export async function loadSettings(): Promise<UserSettings> {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  return raw ? { ...defaultSettings, ...JSON.parse(raw) } : defaultSettings;
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
