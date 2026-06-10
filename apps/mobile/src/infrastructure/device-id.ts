import AsyncStorage from "@react-native-async-storage/async-storage";

const DEVICE_ID_KEY = "habiflow.deviceId";

export async function getOrCreateDeviceId(): Promise<string> {
  const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (existing) {
    return existing;
  }
  const value = `device-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  await AsyncStorage.setItem(DEVICE_ID_KEY, value);
  return value;
}
