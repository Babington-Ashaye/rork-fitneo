import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const CHUNK_SIZE = 1800;
const memoryStorage = new Map<string, string>();

function normalizeKey(key: string) {
  return key.replace(/[^A-Za-z0-9._-]/g, "_");
}

function metaKey(key: string) {
  return `${normalizeKey(key)}.meta`;
}

function chunkKey(key: string, index: number) {
  return `${normalizeKey(key)}.chunk.${index}`;
}

async function removeNativeValue(key: string) {
  const metadata = await SecureStore.getItemAsync(metaKey(key));
  const count = metadata ? Number(metadata) : 0;
  await Promise.all(
    Array.from({ length: Number.isFinite(count) ? count : 0 }, (_, index) =>
      SecureStore.deleteItemAsync(chunkKey(key, index))
    )
  );
  await SecureStore.deleteItemAsync(metaKey(key));
}

async function setNativeValue(key: string, value: string) {
  await removeNativeValue(key);
  const chunks = value.match(new RegExp(`.{1,${CHUNK_SIZE}}`, "gs")) ?? [""];
  await Promise.all(
    chunks.map((chunk, index) =>
      SecureStore.setItemAsync(chunkKey(key, index), chunk, {
        keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY
      })
    )
  );
  await SecureStore.setItemAsync(metaKey(key), String(chunks.length), {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY
  });
}

export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === "web") {
      const memoryValue = memoryStorage.get(key);
      if (memoryValue !== undefined) return memoryValue;
      const storedValue = await AsyncStorage.getItem(key);
      if (storedValue !== null) {
        memoryStorage.set(key, storedValue);
      }
      return storedValue;
    }
    if (!(await SecureStore.isAvailableAsync())) {
      return memoryStorage.get(key) ?? null;
    }

    const metadata = await SecureStore.getItemAsync(metaKey(key));
    const count = metadata ? Number(metadata) : 0;
    if (count > 0 && Number.isFinite(count)) {
      const chunks = await Promise.all(
        Array.from({ length: count }, (_, index) =>
          SecureStore.getItemAsync(chunkKey(key, index))
        )
      );
      if (chunks.every((chunk) => chunk !== null)) {
        return chunks.join("");
      }
      await removeNativeValue(key);
    }

    // One-time migration from legacy plaintext storage, followed by deletion.
    const legacyValue = await AsyncStorage.getItem(key);
    if (legacyValue !== null) {
      await setNativeValue(key, legacyValue);
      await AsyncStorage.removeItem(key);
      return legacyValue;
    }
    await AsyncStorage.removeItem(key);
    return null;
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === "web" || !(await SecureStore.isAvailableAsync())) {
      memoryStorage.set(key, value);
      await AsyncStorage.setItem(key, value);
      return;
    }
    await setNativeValue(key, value);
    await AsyncStorage.removeItem(key);
  },

  async removeItem(key: string): Promise<void> {
    memoryStorage.delete(key);
    if (Platform.OS !== "web" && await SecureStore.isAvailableAsync()) {
      await removeNativeValue(key);
    }
    await AsyncStorage.removeItem(key);
  }
};
