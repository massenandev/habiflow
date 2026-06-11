import * as SecureStore from "expo-secure-store";
import { AuthSession } from "../domain/types";

const SESSION_KEY = "habiflow.auth.session";

export async function loadAuthSession(): Promise<AuthSession | null> {
  const raw = await SecureStore.getItemAsync(SESSION_KEY);
  return raw ? (JSON.parse(raw) as AuthSession) : null;
}

export async function saveAuthSession(session: AuthSession): Promise<void> {
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
}

export async function clearAuthSession(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}
