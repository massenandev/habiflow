import React, { useState } from "react";
import { Alert, GestureResponderEvent, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { streakGoalLabel } from "../../application/habit-presenter";
import { Habit, HabitFormValues, StreakGoal } from "../../domain/types";
import { Button } from "../components/Button";
import { AppTheme } from "../theme/theme";

const colors = [
  "#0F766E",
  "#14B8A6",
  "#2563EB",
  "#38BDF8",
  "#7C3AED",
  "#A855F7",
  "#DB2777",
  "#F43F5E",
  "#DC2626",
  "#EA580C",
  "#F59E0B",
  "#84CC16",
  "#16A34A",
  "#22C55E",
  "#64748B",
  "#111827",
  "#6B7280",
  "#0EA5E9",
  "#4F46E5",
  "#D946EF",
  "#CA8A04"
];
const presetColors = colors.slice(1);
const streakGoals: StreakGoal[] = ["none", "daily", "week", "month"];
const reminderCounts = [0, 1, 2, 3, 4, 5];
const completionCounts = [1, 2, 3, 4, 5];
const colorGridRows = 14;
const colorGridColumns = 24;
const emojiGroups = [
  {
    title: "Faces",
    emojis: [
      emojiChoice("😀", "grinning face", ["happy", "smile"]),
      emojiChoice("😄", "smiling face", ["happy", "joy"]),
      emojiChoice("😊", "blushing smile", ["calm", "happy"]),
      emojiChoice("🙂", "slight smile", ["smile"]),
      emojiChoice("😎", "cool face", ["focus"]),
      emojiChoice("🤩", "star struck", ["excited"]),
      emojiChoice("🥳", "party face", ["celebrate"]),
      emojiChoice("😌", "relieved face", ["calm"]),
      emojiChoice("🤔", "thinking face", ["think"]),
      emojiChoice("😴", "sleeping face", ["sleep", "rest"]),
      emojiChoice("🥰", "loving face", ["love"]),
      emojiChoice("😂", "laughing face", ["fun"]),
      emojiChoice("🙌", "raised hands", ["win", "celebrate"]),
      emojiChoice("👏", "clapping hands", ["applause"]),
      emojiChoice("🙏", "folded hands", ["pray", "thanks"]),
      emojiChoice("💪", "flexed biceps", ["strength", "gym"]),
      emojiChoice("🧠", "brain", ["mind", "learn"]),
      emojiChoice("❤️", "heart", ["love", "health"]),
      emojiChoice("🔥", "fire", ["streak", "energy"]),
      emojiChoice("⭐", "star", ["favorite", "goal"])
    ]
  },
  {
    title: "Health",
    emojis: [
      emojiChoice("✅", "check mark", ["done", "complete"]),
      emojiChoice("💧", "water drop", ["drink", "hydrate"]),
      emojiChoice("🥗", "salad", ["food", "healthy"]),
      emojiChoice("🍎", "apple", ["fruit", "food"]),
      emojiChoice("🍌", "banana", ["fruit", "food"]),
      emojiChoice("🥦", "broccoli", ["vegetable", "food"]),
      emojiChoice("🥛", "milk", ["drink"]),
      emojiChoice("☕", "coffee", ["drink", "cafe"]),
      emojiChoice("🫖", "tea pot", ["tea", "drink"]),
      emojiChoice("💊", "pill", ["medicine", "medication"]),
      emojiChoice("🦷", "tooth", ["teeth", "brush"]),
      emojiChoice("🧼", "soap", ["clean", "wash"]),
      emojiChoice("🛁", "bath", ["shower", "clean"]),
      emojiChoice("🛏️", "bed", ["sleep", "rest"]),
      emojiChoice("🧘", "meditation", ["yoga", "mindfulness"]),
      emojiChoice("🏃", "running", ["run", "exercise"]),
      emojiChoice("🚶", "walking", ["walk", "steps"]),
      emojiChoice("🚴", "cycling", ["bike", "exercise"]),
      emojiChoice("🏋️", "weight lifting", ["gym", "workout"]),
      emojiChoice("⚽", "soccer ball", ["sport", "football"])
    ]
  },
  {
    title: "Work",
    emojis: [
      emojiChoice("📚", "books", ["read", "study"]),
      emojiChoice("📝", "memo", ["write", "journal"]),
      emojiChoice("📒", "notebook", ["notes", "study"]),
      emojiChoice("📅", "calendar", ["schedule", "date"]),
      emojiChoice("⏰", "alarm clock", ["time", "reminder"]),
      emojiChoice("💻", "laptop", ["code", "work"]),
      emojiChoice("📱", "phone", ["mobile"]),
      emojiChoice("✉️", "envelope", ["email", "message"]),
      emojiChoice("📌", "pin", ["important"]),
      emojiChoice("📎", "paperclip", ["attach"]),
      emojiChoice("📊", "chart", ["stats", "analytics"]),
      emojiChoice("💡", "light bulb", ["idea"]),
      emojiChoice("🔒", "lock", ["secure", "privacy"]),
      emojiChoice("🎯", "target", ["goal", "focus"]),
      emojiChoice("🏆", "trophy", ["win", "achievement"]),
      emojiChoice("💬", "speech bubble", ["chat"]),
      emojiChoice("🧾", "receipt", ["budget", "expense"]),
      emojiChoice("🗂️", "files", ["organize"]),
      emojiChoice("🔎", "magnifying glass", ["search", "research"]),
      emojiChoice("🧮", "abacus", ["math", "calculate"])
    ]
  },
  {
    title: "Life",
    emojis: [
      emojiChoice("🌱", "seedling", ["plant", "growth"]),
      emojiChoice("🪴", "potted plant", ["plant", "home"]),
      emojiChoice("🎨", "palette", ["art", "paint"]),
      emojiChoice("🎸", "guitar", ["music"]),
      emojiChoice("🎧", "headphones", ["music", "listen"]),
      emojiChoice("🎮", "game controller", ["play"]),
      emojiChoice("🎬", "movie clapper", ["film", "watch"]),
      emojiChoice("📷", "camera", ["photo"]),
      emojiChoice("🧹", "broom", ["clean", "chores"]),
      emojiChoice("🧺", "basket", ["laundry"]),
      emojiChoice("🍳", "cooking", ["cook", "breakfast"]),
      emojiChoice("🛒", "shopping cart", ["shop", "groceries"]),
      emojiChoice("🚗", "car", ["drive"]),
      emojiChoice("🏠", "house", ["home"]),
      emojiChoice("🌞", "sun", ["morning"]),
      emojiChoice("🌙", "moon", ["night"]),
      emojiChoice("🌈", "rainbow", ["color"]),
      emojiChoice("✈️", "airplane", ["travel"]),
      emojiChoice("💰", "money bag", ["money", "save"]),
      emojiChoice("🎁", "gift", ["present"])
    ]
  }
];

interface Props {
  theme: AppTheme;
  habit?: Habit;
  onSave: (values: HabitFormValues) => void;
  onBack: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
}

interface EmojiChoice {
  symbol: string;
  name: string;
  keywords: string[];
}

export function HabitFormScreen({ theme, habit, onSave, onBack, onArchive, onDelete }: Props) {
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [values, setValues] = useState<HabitFormValues>({
    name: habit?.name ?? "",
    emoji: habit?.emoji ?? "",
    color: habit?.color ?? colors[0],
    goal: habit?.goal ?? { streakGoal: "daily", completionsPerDay: 1 },
    reminder: habit?.reminder ?? { count: 0, times: [] }
  });

  function save() {
    if (!values.name.trim()) {
      Alert.alert("Missing name", "Add a name for this habit.");
      return;
    }
    if (values.reminder.count !== values.reminder.times.length) {
      Alert.alert("Reminder times", "Choose a time for every active reminder.");
      return;
    }
    onSave(values);
  }

  function setReminderCount(count: number) {
    const times = Array.from({ length: count }, (_, index) => values.reminder.times[index] ?? defaultReminderTime(index));
    setValues({ ...values, reminder: { count, times } });
  }

  function setReminderTime(index: number, time: string) {
    const times = values.reminder.times.map((item, itemIndex) => (itemIndex === index ? time : item));
    setValues({ ...values, reminder: { ...values.reminder, times } });
  }

  function chooseEmoji(emoji: string) {
    setValues({ ...values, emoji });
    setEmojiPickerOpen(false);
  }

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>{habit ? "Edit Habit" : "Create Habit"}</Text>
      <View style={styles.emojiField}>
        <Pressable
          accessibilityLabel="Choose emoji"
          accessibilityRole="button"
          onPress={() => setEmojiPickerOpen(true)}
          style={[
            styles.emojiButton,
            {
              backgroundColor: theme.surface,
              borderColor: values.emoji ? values.color : theme.border
            }
          ]}
        >
          <Text style={[styles.emojiButtonText, { color: values.emoji ? theme.text : theme.muted }]}>{values.emoji || "+"}</Text>
        </Pressable>
      </View>
      <EmojiPickerModal
        theme={theme}
        visible={emojiPickerOpen}
        selectedEmoji={values.emoji}
        onSelect={chooseEmoji}
        onClear={() => chooseEmoji("")}
        onClose={() => setEmojiPickerOpen(false)}
      />
      <Field label="Name" theme={theme}>
        <TextInput value={values.name} onChangeText={(name) => setValues({ ...values, name })} placeholder="Drink water" placeholderTextColor={theme.muted} style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]} />
      </Field>
      <Field label="Color" theme={theme}>
        <View style={styles.options}>
          <Pressable
            accessibilityLabel="Choose custom color"
            accessibilityRole="button"
            onPress={() => setColorPickerOpen(true)}
            style={[styles.swatch, styles.customColorSwatch, { backgroundColor: values.color, borderColor: theme.text }]}
          >
            <Text style={styles.customColorText}>+</Text>
          </Pressable>
          {presetColors.map((color) => (
            <Text key={color} onPress={() => setValues({ ...values, color })} style={[styles.swatch, { backgroundColor: color, borderColor: values.color === color ? theme.text : color }]}> </Text>
          ))}
        </View>
      </Field>
      <ColorPickerModal
        theme={theme}
        visible={colorPickerOpen}
        selectedColor={values.color}
        onChange={(color) => setValues({ ...values, color })}
        onClose={() => setColorPickerOpen(false)}
      />
      <Field label="Streak goal" theme={theme}>
        <Segment values={streakGoals} selected={values.goal.streakGoal} theme={theme} onSelect={(streakGoal) => setValues({ ...values, goal: { ...values.goal, streakGoal: streakGoal as StreakGoal } })} labels={streakGoalLabel} />
      </Field>
      <Field label="Completions by day" theme={theme}>
        <Segment values={completionCounts.map(String)} selected={String(values.goal.completionsPerDay)} theme={theme} onSelect={(count) => setValues({ ...values, goal: { ...values.goal, completionsPerDay: Number(count) } })} labels={(count) => `${count}/day`} />
      </Field>
      <Field label={`${values.reminder.count} active reminder${values.reminder.count === 1 ? "" : "s"}`} theme={theme}>
        <Segment values={reminderCounts.map(String)} selected={String(values.reminder.count)} theme={theme} onSelect={(count) => setReminderCount(Number(count))} labels={(count) => `${count}`} />
        {values.reminder.times.map((time, index) => (
          <TextInput key={index} value={time} onChangeText={(nextTime) => setReminderTime(index, nextTime)} style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]} />
        ))}
      </Field>
      <Button label="Save" theme={theme} onPress={save} />
      {habit && onArchive ? <Button label="Archive" theme={theme} variant="secondary" onPress={onArchive} /> : null}
      {habit && onDelete ? <Button label="Delete" theme={theme} variant="danger" onPress={onDelete} /> : null}
      <Button label="Back" theme={theme} variant="secondary" onPress={onBack} />
    </ScrollView>
  );
}

function defaultReminderTime(index: number): string {
  const hour = Math.min(21, 8 + index * 3);
  return `${String(hour).padStart(2, "0")}:00`;
}

function emojiChoice(symbol: string, name: string, keywords: string[] = []): EmojiChoice {
  return { symbol, name, keywords };
}

function Field({ label, theme, children }: { label: string; theme: AppTheme; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: theme.muted }]}>{label}</Text>
      {children}
    </View>
  );
}

function EmojiPickerModal({
  theme,
  visible,
  selectedEmoji,
  onSelect,
  onClear,
  onClose
}: {
  theme: AppTheme;
  visible: boolean;
  selectedEmoji: string;
  onSelect: (emoji: string) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [customEmoji, setCustomEmoji] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const visibleGroups = emojiGroups
    .map((group) => ({
      ...group,
      emojis: normalizedQuery ? group.emojis.filter((emoji) => matchesEmojiSearch(emoji, normalizedQuery)) : group.emojis
    }))
    .filter((group) => group.emojis.length > 0);

  function chooseCustomEmoji(input: string) {
    const emoji = normalizeEmojiInput(input);
    setCustomEmoji("");
    if (emoji) {
      onSelect(emoji);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={[styles.emojiFullScreen, { backgroundColor: theme.background }]}>
        <View style={styles.emojiFullScreenHeader}>
          <Text style={[styles.emojiSheetTitle, { color: theme.text }]}>Choose emoji</Text>
          <Text onPress={onClose} style={[styles.emojiSheetAction, { color: theme.primary }]}>
            Close
          </Text>
        </View>
        <TextInput
          value={customEmoji}
          onChangeText={chooseCustomEmoji}
          placeholder="Type or paste any emoji"
          placeholderTextColor={theme.muted}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={8}
          textAlign="center"
          style={[styles.anyEmojiInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
        />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search emoji"
          placeholderTextColor={theme.muted}
          autoCapitalize="none"
          autoCorrect={false}
          style={[styles.emojiSearchInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
        />
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.emojiFullScreenContent}>
          <Pressable onPress={onClear} style={[styles.clearEmojiButton, { borderColor: theme.border, backgroundColor: theme.surface }]}>
            <Text style={[styles.clearEmojiText, { color: theme.text }]}>No emoji</Text>
          </Pressable>
          {visibleGroups.length === 0 ? <Text style={[styles.emptyEmojiSearch, { color: theme.muted }]}>No emoji found</Text> : null}
          {visibleGroups.map((group) => (
            <View key={group.title} style={styles.emojiGroup}>
              <Text style={[styles.emojiGroupTitle, { color: theme.muted }]}>{group.title}</Text>
              <View style={styles.emojiGrid}>
                {group.emojis.map((emoji) => (
                  <Pressable
                    key={`${group.title}-${emoji.symbol}`}
                    accessibilityLabel={`Choose ${emoji.name}`}
                    accessibilityRole="button"
                    onPress={() => onSelect(emoji.symbol)}
                    style={[
                      styles.emojiOption,
                      {
                        backgroundColor: selectedEmoji === emoji.symbol ? theme.primary : theme.surface,
                        borderColor: selectedEmoji === emoji.symbol ? theme.primary : theme.border
                      }
                    ]}
                  >
                    <Text style={styles.emojiOptionText}>{emoji.symbol}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function normalizeEmojiInput(value: string): string {
  return Array.from(value.trim()).slice(0, 4).join("");
}

function matchesEmojiSearch(emoji: EmojiChoice, query: string): boolean {
  return [emoji.symbol, emoji.name, ...emoji.keywords].some((value) => value.toLowerCase().includes(query));
}

function ColorPickerModal({
  theme,
  visible,
  selectedColor,
  onChange,
  onClose
}: {
  theme: AppTheme;
  visible: boolean;
  selectedColor: string;
  onChange: (color: string) => void;
  onClose: () => void;
}) {
  const [size, setSize] = useState({ width: 1, height: 1 });

  function pickColor(event: GestureResponderEvent) {
    const x = clamp(event.nativeEvent.locationX, 0, size.width);
    const y = clamp(event.nativeEvent.locationY, 0, size.height);
    const hue = (x / size.width) * 360;
    const lightness = 0.92 - (y / size.height) * 0.62;
    onChange(hslToHex(hue, 1, lightness));
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.colorSheet, { backgroundColor: theme.background, borderColor: theme.border }]}>
          <View style={styles.emojiSheetHeader}>
            <Text style={[styles.emojiSheetTitle, { color: theme.text }]}>Choose color</Text>
            <Text onPress={onClose} style={[styles.emojiSheetAction, { color: theme.primary }]}>
              Done
            </Text>
          </View>
          <View style={styles.colorPreviewRow}>
            <View style={[styles.colorPreview, { backgroundColor: selectedColor, borderColor: theme.border }]} />
            <Text style={[styles.colorValue, { color: theme.text }]}>{selectedColor.toUpperCase()}</Text>
          </View>
          <View
            onLayout={(event) => setSize(event.nativeEvent.layout)}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={pickColor}
            onResponderMove={pickColor}
            style={[styles.colorGradient, { borderColor: theme.border }]}
          >
            {Array.from({ length: colorGridRows }, (_, rowIndex) => (
              <View key={`row-${rowIndex}`} style={styles.colorGradientRow}>
                {Array.from({ length: colorGridColumns }, (_, columnIndex) => {
                  const hue = (columnIndex / (colorGridColumns - 1)) * 360;
                  const lightness = 0.92 - (rowIndex / (colorGridRows - 1)) * 0.62;
                  return <View key={`cell-${rowIndex}-${columnIndex}`} style={[styles.colorGradientCell, { backgroundColor: hslToHex(hue, 1, lightness) }]} />;
                })}
              </View>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function hslToHex(hue: number, saturation: number, lightness: number): string {
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const hueSegment = hue / 60;
  const secondary = chroma * (1 - Math.abs((hueSegment % 2) - 1));
  const match = lightness - chroma / 2;
  const [red, green, blue] =
    hueSegment >= 0 && hueSegment < 1
      ? [chroma, secondary, 0]
      : hueSegment >= 1 && hueSegment < 2
        ? [secondary, chroma, 0]
        : hueSegment >= 2 && hueSegment < 3
          ? [0, chroma, secondary]
          : hueSegment >= 3 && hueSegment < 4
            ? [0, secondary, chroma]
            : hueSegment >= 4 && hueSegment < 5
              ? [secondary, 0, chroma]
              : [chroma, 0, secondary];

  return `#${toHex(red + match)}${toHex(green + match)}${toHex(blue + match)}`;
}

function toHex(value: number): string {
  return Math.round(clamp(value, 0, 1) * 255)
    .toString(16)
    .padStart(2, "0")
    .toUpperCase();
}

function Segment({ values, selected, theme, onSelect, labels }: { values: string[]; selected: string; theme: AppTheme; onSelect: (value: string) => void; labels?: (value: any) => string }) {
  return (
    <View style={styles.options}>
      {values.map((value) => (
        <Text key={value} onPress={() => onSelect(value)} style={[styles.segment, { color: selected === value ? "#FFFFFF" : theme.text, backgroundColor: selected === value ? theme.primary : theme.surface, borderColor: theme.border }]}>
          {labels ? labels(value) : value}
        </Text>
      ))}
    </View>
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
  field: {
    gap: 8
  },
  label: {
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16
  },
  options: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  emojiField: {
    alignItems: "flex-start",
    minHeight: 64
  },
  emojiButton: {
    width: 64,
    height: 64,
    borderWidth: 1,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center"
  },
  emojiButtonText: {
    fontSize: 30,
    fontWeight: "700"
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.45)"
  },
  keyboardAvoider: {
    flex: 1,
    width: "100%",
    justifyContent: "flex-end"
  },
  emojiFullScreen: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 58
  },
  emojiFullScreenHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16
  },
  emojiFullScreenContent: {
    gap: 18,
    paddingBottom: 28
  },
  emojiSheet: {
    maxHeight: "90%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    padding: 20,
    paddingBottom: 28
  },
  emojiSheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16
  },
  emojiSheetTitle: {
    fontSize: 20,
    fontWeight: "900"
  },
  emojiSheetAction: {
    fontSize: 15,
    fontWeight: "800"
  },
  anyEmojiInput: {
    minHeight: 54,
    borderWidth: 1,
    borderRadius: 27,
    paddingHorizontal: 16,
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 10
  },
  emojiSearchInput: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    marginBottom: 16
  },
  emojiSheetContent: {
    gap: 18
  },
  clearEmojiButton: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center"
  },
  clearEmojiText: {
    fontSize: 15,
    fontWeight: "800"
  },
  emojiGroup: {
    gap: 8
  },
  emojiGroupTitle: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  emojiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  emojiOption: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center"
  },
  emojiOptionText: {
    fontSize: 24
  },
  emptyEmojiSearch: {
    paddingVertical: 16,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "700"
  },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    overflow: "hidden"
  },
  customColorSwatch: {
    alignItems: "center",
    justifyContent: "center"
  },
  customColorText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 24,
    textShadowColor: "rgba(0, 0, 0, 0.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2
  },
  colorSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    padding: 20,
    paddingBottom: 28
  },
  colorPreviewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16
  },
  colorPreview: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1
  },
  colorValue: {
    fontSize: 15,
    fontWeight: "800"
  },
  colorGradient: {
    height: 220,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden"
  },
  colorGradientRow: {
    flex: 1,
    flexDirection: "row"
  },
  colorGradientCell: {
    flex: 1
  },
  segment: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontWeight: "700"
  }
});
