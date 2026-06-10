import React, { useRef, useState } from "react";
import { Animated, PanResponder, Pressable, StyleSheet, Text, View } from "react-native";
import { recentDays } from "../../application/date-range";
import { isCompletedForDate } from "../../application/habit-presenter";
import { Habit } from "../../domain/types";
import { AppTheme } from "../theme/theme";

interface Props {
  habit: Habit;
  days: number;
  theme: AppTheme;
  onToggle: (habit: Habit) => void;
  onEdit: (habit: Habit) => void;
  onDelete: (habit: Habit) => void;
}

export function HabitRow({ habit, days, theme, onToggle, onEdit, onDelete }: Props) {
  const translateX = useRef(new Animated.Value(0)).current;
  const [open, setOpen] = useState(false);
  const dates = recentDays(days);
  const today = dates[dates.length - 1];
  const maxSwipe = 110;
  const threshold = 60;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 6,
      onPanResponderMove: (_, gestureState) => {
        const nextX = Math.min(maxSwipe, Math.max(0, gestureState.dx + (open ? maxSwipe : 0)));
        translateX.setValue(nextX);
      },
      onPanResponderRelease: (_, gestureState) => {
        const shouldOpen = gestureState.dx > threshold || (open && gestureState.dx > -10);
        Animated.spring(translateX, {
          toValue: shouldOpen ? maxSwipe : 0,
          useNativeDriver: true,
          bounciness: 0
        }).start(() => setOpen(shouldOpen));
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateX, { toValue: open ? maxSwipe : 0, useNativeDriver: true, bounciness: 0 }).start();
      }
    })
  ).current;

  const closeSwipe = () => {
    Animated.spring(translateX, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start(() => setOpen(false));
  };

  return (
    <View style={styles.swipeContainer}>
      <View style={[styles.deleteBackground, { backgroundColor: theme.danger }]}> 
        <Pressable accessibilityLabel={`Delete ${habit.name}`} accessibilityRole="button" onPress={() => onDelete(habit)} style={styles.deleteAction}>
          <Text style={styles.deleteText}>🗑️ Delete</Text>
        </Pressable>
      </View>
      <Animated.View
        {...panResponder.panHandlers}
        style={[styles.row, { backgroundColor: theme.surface, borderColor: theme.border, transform: [{ translateX }] }]}
      >
        <Pressable onPress={() => (open ? closeSwipe() : onEdit(habit))} style={styles.rowContent}>
          <View style={styles.identity}>
            <Text style={styles.emoji}>{habit.emoji || "✅"}</Text>
            <View style={styles.nameBlock}>
              <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
                {habit.name}
              </Text>
              <Text style={[styles.meta, { color: theme.muted }]}>🔥 {habit.streak.current} day streak</Text>
            </View>
          </View>
          <View style={styles.days}>
            {dates.map((date) => {
              const completed = isCompletedForDate(habit, date);
              const isToday = date === today;
              return (
                <Pressable
                  key={date}
                  onPress={(event) => {
                    event.stopPropagation();
                    if (isToday) {
                      onToggle(habit);
                    }
                  }}
                  style={[
                    styles.indicator,
                    {
                      borderRadius: 999,
                      borderColor: habit.color,
                      backgroundColor: completed ? habit.color : "transparent",
                      opacity: isToday ? 1 : 0.72
                    }
                  ]}
                />
              );
            })}
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  swipeContainer: {
    position: "relative"
  },
  deleteBackground: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 110,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8
  },
  deleteAction: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center"
  },
  deleteText: {
    color: "#FFFFFF",
    fontWeight: "700"
  },
  row: {
    minHeight: 72,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  rowContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  identity: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  emoji: {
    fontSize: 28
  },
  nameBlock: {
    flex: 1
  },
  name: {
    fontSize: 17,
    fontWeight: "800"
  },
  meta: {
    marginTop: 3,
    fontSize: 12
  },
  days: {
    flexDirection: "row",
    gap: 7
  },
  indicator: {
    width: 22,
    height: 22,
    borderWidth: 2
  }
});
