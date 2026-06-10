import { ColorSchemeName } from "react-native";
import { ThemeMode } from "../../domain/types";

export interface AppTheme {
  dark: boolean;
  background: string;
  surface: string;
  text: string;
  muted: string;
  border: string;
  primary: string;
  danger: string;
}

export function resolveTheme(mode: ThemeMode, system: ColorSchemeName): AppTheme {
  const dark = mode === "dark" || (mode === "system" && system === "dark");
  return dark
    ? {
        dark,
        background: "#111827",
        surface: "#1F2937",
        text: "#F9FAFB",
        muted: "#9CA3AF",
        border: "#374151",
        primary: "#2DD4BF",
        danger: "#F87171"
      }
    : {
        dark,
        background: "#F8FAFC",
        surface: "#FFFFFF",
        text: "#111827",
        muted: "#64748B",
        border: "#CBD5E1",
        primary: "#0F766E",
        danger: "#DC2626"
      };
}
