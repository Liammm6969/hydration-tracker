/**
 * Daily summary storage — precomputed summaries persisted to AsyncStorage.
 *
 * Design principle: Logs are raw data. Summaries are the processed, UI-ready output.
 * Summaries are computed once at end-of-day (or when the app opens on a new day)
 * and stored so the UI never recalculates from raw logs.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTodayLogs, getLogsForDate, type DrinkLog } from './drinkStorage';
import {
  calculateHydration,
  calculateRawIntake,
  getTotalsByType,
  type DailySummary,
} from '../utils/hydration';

const SUMMARY_PREFIX = '@summary_';
const STREAK_KEY = '@hydration_streak';
const LAST_SUMMARY_DATE_KEY = '@last_summary_date';

// ─── Summary Persistence ─────────────────────────────────────────────

/**
 * Get the stored summary for a specific date.
 */
export const getSummary = async (dateStr: string): Promise<DailySummary | null> => {
  try {
    const raw = await AsyncStorage.getItem(`${SUMMARY_PREFIX}${dateStr}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/**
 * Save a precomputed summary for a specific date.
 */
export const saveSummary = async (summary: DailySummary): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      `${SUMMARY_PREFIX}${summary.date}`,
      JSON.stringify(summary)
    );
  } catch (error) {
    console.log('Failed to save summary:', error);
  }
};

/**
 * Get summaries for a range of dates.
 * Returns stored summaries (does NOT recompute from logs).
 */
export const getSummariesForRange = async (days: number): Promise<DailySummary[]> => {
  const summaries: DailySummary[] = [];
  const today = new Date();

  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = formatDateKey(d);
    const summary = await getSummary(dateStr);
    if (summary && summary.logCount > 0) {
      summaries.push(summary);
    }
  }

  return summaries;
};

// ─── Summary Generation ──────────────────────────────────────────────

/**
 * Build a DailySummary from raw logs for a given date.
 */
export const buildSummary = (
  dateStr: string,
  logs: DrinkLog[],
  goal: number
): DailySummary => {
  const totalHydration = calculateHydration(logs);
  return {
    date: dateStr,
    totalRaw: calculateRawIntake(logs),
    totalHydration,
    byType: getTotalsByType(logs),
    logCount: logs.length,
    goalMet: totalHydration >= goal,
  };
};

/**
 * Generate and store today's summary.
 * Called on each drink log and when the app opens.
 * This is cheap — it just recalculates today's summary from today's logs.
 */
export const updateTodaySummary = async (goal: number): Promise<DailySummary> => {
  const todayStr = formatDateKey(new Date());
  const logs = await getTodayLogs();
  const summary = buildSummary(todayStr, logs, goal);
  await saveSummary(summary);
  return summary;
};

/**
 * Finalize yesterday's summary if it hasn't been done yet.
 * Called on app open — catches the case where the user closed the app
 * before midnight without a final summary being saved.
 */
export const finalizeYesterdaySummary = async (goal: number): Promise<void> => {
  const lastDate = await AsyncStorage.getItem(LAST_SUMMARY_DATE_KEY);
  const todayStr = formatDateKey(new Date());

  // If we already processed today, nothing to do
  if (lastDate === todayStr) return;

  // Finalize any missed days between lastDate and today
  if (lastDate) {
    const last = parseDate(lastDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const current = new Date(last);
    current.setDate(current.getDate() + 1);

    while (current < today) {
      const dateStr = formatDateKey(current);
      const existingSummary = await getSummary(dateStr);
      if (!existingSummary) {
        // Build summary from raw logs for this missed day
        const logs = await getLogsForDate(current);
        const summary = buildSummary(dateStr, logs, goal);
        await saveSummary(summary);
      }
      current.setDate(current.getDate() + 1);
    }
  }

  // Mark today as processed
  await AsyncStorage.setItem(LAST_SUMMARY_DATE_KEY, todayStr);
};

// ─── Streak ──────────────────────────────────────────────────────────

export interface StreakData {
  current: number;   // Current consecutive days meeting goal
  longest: number;   // All-time longest streak
  lastDate: string;  // Last date that was counted toward streak
}

const DEFAULT_STREAK: StreakData = {
  current: 0,
  longest: 0,
  lastDate: '',
};

/**
 * Get the current streak data.
 */
export const getStreak = async (): Promise<StreakData> => {
  try {
    const raw = await AsyncStorage.getItem(STREAK_KEY);
    if (!raw) return DEFAULT_STREAK;
    return { ...DEFAULT_STREAK, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STREAK;
  }
};

/**
 * Save streak data.
 */
const saveStreak = async (streak: StreakData): Promise<void> => {
  await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(streak));
};

/**
 * Update the streak based on a day's summary.
 * Call this after finalizing a day's summary.
 *
 * Logic:
 *   - If summary.goalMet → streak++
 *   - If !summary.goalMet → streak = 0
 *   - Handles gaps (missed days reset streak)
 */
export const updateStreak = async (summary: DailySummary): Promise<StreakData> => {
  const streak = await getStreak();
  const summaryDate = summary.date;

  // If this date was already counted, don't double count
  if (summaryDate === streak.lastDate) {
    // But update if the goalMet status changed (e.g., user logged more water)
    if (summary.goalMet && streak.current === 0) {
      streak.current = 1;
      streak.longest = Math.max(streak.longest, streak.current);
    } else if (!summary.goalMet) {
      streak.current = 0;
    }
    await saveStreak(streak);
    return streak;
  }

  // Check if this is the next consecutive day
  const expectedPrev = getPreviousDateStr(summaryDate);
  const isConsecutive = streak.lastDate === expectedPrev || streak.lastDate === '';

  if (summary.goalMet) {
    if (isConsecutive) {
      streak.current += 1;
    } else {
      // Gap in days — start new streak
      streak.current = 1;
    }
    streak.longest = Math.max(streak.longest, streak.current);
  } else {
    streak.current = 0;
  }

  streak.lastDate = summaryDate;
  await saveStreak(streak);
  return streak;
};

/**
 * Recalculate streak from stored summaries (recovery/migration).
 * Walks backwards from today to find the current streak length.
 */
export const recalculateStreak = async (): Promise<StreakData> => {
  let current = 0;
  const today = new Date();

  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = formatDateKey(d);
    const summary = await getSummary(dateStr);

    // Skip today if no logs yet (don't break streak for today)
    if (i === 0 && (!summary || summary.logCount === 0)) {
      continue;
    }

    if (summary && summary.goalMet) {
      current++;
    } else {
      break; // Streak broken
    }
  }

  // Get longest from stored data (we can't easily recalculate this)
  const existing = await getStreak();
  const longest = Math.max(existing.longest, current);

  const streak: StreakData = {
    current,
    longest,
    lastDate: formatDateKey(today),
  };

  await saveStreak(streak);
  return streak;
};

// ─── Date Helpers ────────────────────────────────────────────────────

export const formatDateKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const parseDate = (dateStr: string): Date => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setHours(0, 0, 0, 0);
  return date;
};

const getPreviousDateStr = (dateStr: string): string => {
  const date = parseDate(dateStr);
  date.setDate(date.getDate() - 1);
  return formatDateKey(date);
};
