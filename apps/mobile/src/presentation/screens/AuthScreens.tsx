import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Button } from "../components/Button";
import { AppTheme } from "../theme/theme";

export function OnboardingAuthScreen({
  mode,
  theme,
  onSubmit,
  onSwitchMode,
  onForgotPassword,
  onGuest,
  onGoogle,
  onApple
}: {
  mode: "signup" | "login";
  theme: AppTheme;
  onSubmit: (values: { email: string; password: string }) => Promise<void>;
  onSwitchMode: () => void;
  onForgotPassword: () => void;
  onGuest: () => void;
  onGoogle: () => void;
  onApple: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const isSignup = mode === "signup";

  async function submit() {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing fields", "Enter your email and password.");
      return;
    }
    setSaving(true);
    try {
      await onSubmit({ email, password });
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={[styles.keyboardScreen, { backgroundColor: theme.background }]}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.authContainer}>
        <View style={styles.brandBlock}>
          <Text style={styles.seed}>🌱</Text>
          <Text style={[styles.brand, { color: theme.text }]}>HabiFlow</Text>
          <Text style={[styles.tagline, { color: theme.muted }]}>Build consistency every day</Text>
        </View>

        <View style={styles.authPanel}>
          <SocialButton label="Continue with Google" icon="G" theme={theme} onPress={onGoogle} />
          {Platform.OS === "ios" ? <SocialButton label="Continue with Apple" icon="" theme={theme} onPress={onApple} /> : null}

          <View style={styles.dividerRow}>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <Text style={[styles.dividerText, { color: theme.muted }]}>or</Text>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
          </View>

          <LabeledInput label="Email" value={email} onChangeText={setEmail} theme={theme} keyboardType="email-address" />
          <LabeledInput label="Password" value={password} onChangeText={setPassword} theme={theme} secureTextEntry />

          {!isSignup ? (
            <Pressable onPress={onForgotPassword} style={styles.forgotLink}>
              <Text style={[styles.linkText, { color: theme.primary }]}>Forgot password?</Text>
            </Pressable>
          ) : null}

          <Button label={saving ? "Please wait..." : isSignup ? "Create Account" : "Sign In"} theme={theme} onPress={submit} />

          <Pressable accessibilityRole="button" onPress={onGuest} style={styles.guestLink}>
            <Text style={[styles.guestText, { color: theme.text }]}>Continue as Guest →</Text>
          </Pressable>

          <View style={styles.switchBlock}>
            <Text style={[styles.switchCopy, { color: theme.muted }]}>{isSignup ? "Already have an account?" : "Don’t have an account?"}</Text>
            <Pressable accessibilityRole="button" onPress={onSwitchMode}>
              <Text style={[styles.switchAction, { color: theme.primary }]}>{isSignup ? "Sign In" : "Create Account"}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function ForgotPasswordScreen({ theme, onSubmit, onBack }: { theme: AppTheme; onSubmit: (email: string) => Promise<void>; onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!email.trim()) {
      Alert.alert("Missing email", "Enter your account email.");
      return;
    }
    setSaving(true);
    try {
      await onSubmit(email);
      Alert.alert("Check your email", "If this account exists, password reset instructions were sent.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={[styles.keyboardScreen, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.formContainer}>
        <Text style={[styles.title, { color: theme.text }]}>Forgot password</Text>
        <Text style={[styles.copy, { color: theme.muted }]}>Enter your email and we will send reset instructions.</Text>
        <AuthInput value={email} onChangeText={setEmail} placeholder="Email" theme={theme} keyboardType="email-address" />
        <Button label={saving ? "Please wait..." : "Send reset link"} theme={theme} onPress={submit} />
        <Button label="Back" theme={theme} variant="secondary" onPress={onBack} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function GuestImportScreen({ theme, onImport, onStartFresh }: { theme: AppTheme; onImport: () => void; onStartFresh: () => void }) {
  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Import guest habits?</Text>
      <Text style={[styles.copy, { color: theme.muted }]}>This device has habits created as a guest. You can move them into your new account or start fresh.</Text>
      <View style={styles.actions}>
        <Button label="Import guest habits" theme={theme} onPress={onImport} />
        <Button label="Start fresh" theme={theme} variant="secondary" onPress={onStartFresh} />
      </View>
    </View>
  );
}

function AuthInput({
  value,
  onChangeText,
  placeholder,
  theme,
  secureTextEntry,
  keyboardType
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  theme: AppTheme;
  secureTextEntry?: boolean;
  keyboardType?: "email-address";
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={theme.muted}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
      autoCapitalize="none"
      style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
    />
  );
}

function LabeledInput({
  label,
  value,
  onChangeText,
  theme,
  secureTextEntry,
  keyboardType
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  theme: AppTheme;
  secureTextEntry?: boolean;
  keyboardType?: "email-address";
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={[styles.inputLabel, { color: theme.text }]}>{label}</Text>
      <AuthInput value={value} onChangeText={onChangeText} placeholder="" theme={theme} secureTextEntry={secureTextEntry} keyboardType={keyboardType} />
    </View>
  );
}

function SocialButton({ label, icon, theme, onPress }: { label: string; icon: string; theme: AppTheme; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.socialButton, { borderColor: theme.border, backgroundColor: pressed ? theme.surface : "transparent" }]}>
      <Text style={[styles.socialIcon, { color: theme.text }]}>{icon}</Text>
      <Text style={[styles.socialText, { color: theme.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    gap: 16
  },
  keyboardScreen: {
    flex: 1
  },
  authContainer: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 54,
    paddingBottom: 34,
    justifyContent: "center"
  },
  brandBlock: {
    alignItems: "center",
    marginBottom: 34
  },
  seed: {
    fontSize: 48,
    marginBottom: 18
  },
  formContainer: {
    flexGrow: 1,
    padding: 24,
    justifyContent: "center",
    gap: 14
  },
  brand: {
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 0
  },
  tagline: {
    marginTop: 18,
    fontSize: 16,
    textAlign: "center"
  },
  authPanel: {
    gap: 16
  },
  title: {
    fontSize: 30,
    fontWeight: "900"
  },
  copy: {
    fontSize: 16,
    lineHeight: 23
  },
  actions: {
    gap: 10,
    marginTop: 8
  },
  socialButton: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12
  },
  socialIcon: {
    width: 22,
    textAlign: "center",
    fontSize: 19,
    fontWeight: "900"
  },
  socialText: {
    fontSize: 16,
    fontWeight: "800"
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 2
  },
  divider: {
    flex: 1,
    height: 1
  },
  dividerText: {
    fontSize: 14,
    fontWeight: "700"
  },
  inputGroup: {
    gap: 7
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "800"
  },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16
  },
  forgotLink: {
    alignSelf: "flex-end",
    marginTop: -6
  },
  linkText: {
    fontSize: 14,
    fontWeight: "800"
  },
  guestLink: {
    alignSelf: "flex-start",
    paddingVertical: 4
  },
  guestText: {
    fontSize: 15,
    fontWeight: "800"
  },
  switchBlock: {
    alignItems: "center",
    gap: 4,
    marginTop: 4
  },
  switchCopy: {
    fontSize: 14,
    fontWeight: "700"
  },
  switchAction: {
    fontSize: 15,
    fontWeight: "900"
  }
});
