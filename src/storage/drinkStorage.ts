import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DrinkLog {
  id: string;
  type: string;
  amount: number;
  time: number; // timestamp
}

const getKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `@drinks_${y}-${m}-${d}`;
};

const todayKey = (): string => getKey(new Date());

export const saveDrinkLog = async (log: Omit<DrinkLog, 'id'>): Promise<DrinkLog> => {
  const key = getKey(new Date(log.time));
  const existing = await getLogsForKey(key);
  const newLog: DrinkLog = {
    ...log,
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  };
  existing.push(newLog);
  await AsyncStorage.setItem(key, JSON.stringify(existing));
  return newLog;
};

const getLogsForKey = async (key: string): Promise<DrinkLog[]> => {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const getTodayLogs = async (): Promise<DrinkLog[]> => {
  return getLogsForKey(todayKey());
};

export const getLogsForDate = async (date: Date): Promise<DrinkLog[]> => {
  return getLogsForKey(getKey(date));
};

export const getLogsForRange = async (
  startDate: Date,
  endDate: Date
): Promise<Record<string, DrinkLog[]>> => {
  const result: Record<string, DrinkLog[]> = {};
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  while (current <= end) {
    const key = getKey(current);
    const dateStr = key.replace('@drinks_', '');
    result[dateStr] = await getLogsForKey(key);
    current.setDate(current.getDate() + 1);
  }
  return result;
};

export const deleteDrinkLog = async (logTime: number, logId: string): Promise<void> => {
  const date = new Date(logTime);
  const key = getKey(date);
  const logs = await getLogsForKey(key);
  const filtered = logs.filter((l) => l.id !== logId);
  await AsyncStorage.setItem(key, JSON.stringify(filtered));
};

export const clearTodayLogs = async (): Promise<void> => {
  await AsyncStorage.removeItem(todayKey());
};
