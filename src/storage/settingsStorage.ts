import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_GOAL, DEFAULT_WAKE_HOUR, DEFAULT_WAKING_HOURS } from '../constants/drinks';

export interface QuickLogItem {
  drinkType: string;
  amount: number;
}

export interface AppSettings {
  goal: number;
  wakeHour: number;
  wakingHours: number;
  quickLogs: QuickLogItem[];
}

const SETTINGS_KEY = '@hydration_settings';

export const DEFAULT_QUICK_LOGS: QuickLogItem[] = [
  { drinkType: 'water', amount: 250 },
  { drinkType: 'coffee', amount: 150 },
  { drinkType: 'tea', amount: 200 },
  { drinkType: 'juice', amount: 200 },
  { drinkType: 'soda', amount: 250 },
];

export const getDefaultSettings = (): AppSettings => ({
  goal: DEFAULT_GOAL,
  wakeHour: DEFAULT_WAKE_HOUR,
  wakingHours: DEFAULT_WAKING_HOURS,
  quickLogs: DEFAULT_QUICK_LOGS,
});

export const getSettings = async (): Promise<AppSettings> => {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...getDefaultSettings(),
        ...parsed,
        quickLogs: parsed.quickLogs ?? DEFAULT_QUICK_LOGS,
      };
    }
    return getDefaultSettings();
  } catch {
    return getDefaultSettings();
  }
};

export const saveSettings = async (settings: Partial<AppSettings>): Promise<AppSettings> => {
  const current = await getSettings();
  const updated = { ...current, ...settings };
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  return updated;
};
