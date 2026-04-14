import { DRINKS } from '../constants/drinks';
import type { DrinkLog } from '../storage/drinkStorage';
import { getWeatherAdjustedGoal } from '../engine/weatherRules';
import type { WeatherData } from '../services/weatherService';

/**
 * Calculate effective hydration from logs (amount × hydration factor).
 */
export const calculateHydration = (logs: DrinkLog[]): number => {
  return logs.reduce((sum, log) => {
    const factor = DRINKS[log.type]?.factor ?? 1.0;
    return sum + log.amount * factor;
  }, 0);
};

/**
 * Calculate raw total intake in ml.
 */
export const calculateRawIntake = (logs: DrinkLog[]): number => {
  return logs.reduce((sum, log) => sum + log.amount, 0);
};

/**
 * Get progress as 0.0–1.0 toward goal.
 */
export const getProgress = (hydration: number, goal: number): number => {
  if (goal <= 0) return 0;
  return Math.min(hydration / goal, 1.0);
};

/**
 * Calculate total amount per drink type.
 */
export const getTotalsByType = (logs: DrinkLog[]): Record<string, number> => {
  const totals: Record<string, number> = {};
  for (const log of logs) {
    totals[log.type] = (totals[log.type] || 0) + log.amount;
  }
  return totals;
};

/**
 * Get the most frequently logged drink type today.
 */
export const getMostUsedDrink = (logs: DrinkLog[]): string | null => {
  const counts: Record<string, number> = {};
  for (const log of logs) {
    counts[log.type] = (counts[log.type] || 0) + 1;
  }
  let maxType: string | null = null;
  let maxCount = 0;
  for (const [type, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      maxType = type;
    }
  }
  return maxType;
};

export interface ImbalanceAlert {
  drinkType: string;
  message: string;
}

/**
 * Check if any non-water drink total exceeds water total.
 * Returns the most severe imbalance, or null if balanced.
 */
export const getImbalanceAlert = (logs: DrinkLog[]): ImbalanceAlert | null => {
  const totals = getTotalsByType(logs);
  const waterTotal = totals['water'] || 0;

  const THRESHOLD = 300; // ml before we warn
  const checks: { type: string; label: string; emoji: string }[] = [
    { type: 'coffee', label: 'coffee', emoji: '☕' },
    { type: 'soda', label: 'soda', emoji: '🥤' },
    { type: 'tea', label: 'tea', emoji: '🍵' },
    { type: 'juice', label: 'juice', emoji: '🧃' },
  ];

  // Find the worst imbalance (highest ratio of non-water to water)
  let worst: ImbalanceAlert | null = null;
  let worstRatio = 0;

  for (const check of checks) {
    const amount = totals[check.type] || 0;
    if (amount >= THRESHOLD && amount > waterTotal) {
      const ratio = waterTotal > 0 ? amount / waterTotal : Infinity;
      if (ratio > worstRatio) {
        worstRatio = ratio;
        const messages: Record<string, string> = {
          coffee: `Too much coffee ${check.emoji} — add some water 💧`,
          soda: `You're drinking a lot of soda — balance it with water 💧`,
          tea: `Heavy on tea today ${check.emoji} — hydrate with some water too`,
          juice: `Lots of juice ${check.emoji} — don't forget plain water 💧`,
        };
        worst = {
          drinkType: check.type,
          message: messages[check.type] || `Balance your ${check.label} with water 💧`,
        };
      }
    }
  }

  return worst;
};

/**
 * Calculate expected hydration for this time of day.
 */
export const getExpectedHydration = (
  goal: number,
  wakeHour: number,
  wakingHours: number
): number => {
  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;
  const hoursSinceWake = Math.max(0, currentHour - wakeHour);
  const clampedHours = Math.min(hoursSinceWake, wakingHours);
  return (clampedHours / wakingHours) * goal;
};

/**
 * Get a daily summary for history views.
 */
export interface DailySummary {
  date: string;
  totalRaw: number;
  totalHydration: number;
  byType: Record<string, number>;
  logCount: number;
  goalMet: boolean;
}

export const getDailySummary = (
  date: string,
  logs: DrinkLog[],
  goal: number
): DailySummary => {
  return {
    date,
    totalRaw: calculateRawIntake(logs),
    totalHydration: calculateHydration(logs),
    byType: getTotalsByType(logs),
    logCount: logs.length,
    goalMet: calculateHydration(logs) >= goal,
  };
};

/**
 * Get the effective daily goal adjusted for weather conditions.
 * Returns baseGoal unchanged if no weather data is available.
 */
export const getEffectiveGoal = (baseGoal: number, weather: WeatherData | null): number => {
  return getWeatherAdjustedGoal(baseGoal, weather);
};
