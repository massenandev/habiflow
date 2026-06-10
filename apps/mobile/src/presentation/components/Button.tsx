import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { AppTheme } from "../theme/theme";

interface Props {
  label: string;
  theme: AppTheme;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
}

export function Button({ label, theme, onPress, variant = "primary" }: Props) {
  const backgroundColor = variant === "primary" ? theme.primary : variant === "danger" ? theme.danger : "transparent";
  const color = variant === "secondary" ? theme.text : "#FFFFFF";
  return (
    <Pressable onPress={onPress} style={[styles.button, { backgroundColor, borderColor: theme.border }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  text: {
    fontSize: 15,
    fontWeight: "700"
  }
});
