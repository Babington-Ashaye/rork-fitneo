import AsyncStorage from "@react-native-async-storage/async-storage";

function waterKey(userId: string | null, date = new Date()) {
  return `fitneo.water.${userId ?? "local"}.${date.toISOString().slice(0, 10)}`;
}

export async function loadWaterIntake(userId: string | null, goal: number) {
  const value = Number(await AsyncStorage.getItem(waterKey(userId)));
  return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
}

export async function saveWaterIntake(userId: string | null, amount: number, goal: number) {
  const normalized = Math.max(0, Math.round(amount));
  await AsyncStorage.setItem(waterKey(userId), String(normalized));
  return normalized;
}
