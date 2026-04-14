/**
 * Weather rules engine.
 * Pure functions that convert temperature data into hydration adjustments.
 * Temperature-only approach (no humidity).
 */

import type { WeatherData } from '../services/weatherService';

/**
 * Get hydration multiplier based on temperature.
 *   ≥ 35°C → 1.30  (extreme heat)
 *   ≥ 32°C → 1.25
 *   ≥ 28°C → 1.15
 *   ≥ 24°C → 1.05
 *   < 24°C → 1.00  (no adjustment)
 */
export function getWeatherMultiplier(temp: number): number {
  if (temp >= 35) return 1.30;
  if (temp >= 32) return 1.25;
  if (temp >= 28) return 1.15;
  if (temp >= 24) return 1.05;
  return 1.00;
}

/**
 * Calculate weather-adjusted goal.
 * Returns the base goal unchanged if weather is null.
 */
export function getWeatherAdjustedGoal(baseGoal: number, weather: WeatherData | null): number {
  if (!weather) return baseGoal;
  const multiplier = getWeatherMultiplier(weather.temp);
  return Math.round(baseGoal * multiplier);
}

/**
 * Get the extra ml added by weather.
 */
export function getWeatherExtraMl(baseGoal: number, weather: WeatherData | null): number {
  if (!weather) return 0;
  const adjusted = getWeatherAdjustedGoal(baseGoal, weather);
  return adjusted - baseGoal;
}

/**
 * Get a human-friendly label for the current weather tier.
 */
export function getWeatherLabel(weather: WeatherData | null): string | null {
  if (!weather) return null;
  const temp = weather.temp;
  if (temp >= 35) return 'Extreme heat';
  if (temp >= 32) return 'Very hot day';
  if (temp >= 28) return 'Hot day';
  if (temp >= 24) return 'Warm day';
  return null; // No label when no adjustment
}

/**
 * Get notification context message for weather conditions.
 * Returns null when no weather adjustment applies.
 */
export function getWeatherNotificationContext(weather: WeatherData | null): string | null {
  if (!weather) return null;
  const temp = weather.temp;

  if (temp >= 35) return "Extreme heat 🌡️ — you're losing water fast. Drink more!";
  if (temp >= 32) return "Hot day 🌡️ — you're dehydrating faster than usual";
  if (temp >= 28) return "It's warm today — increase your hydration pace";
  if (temp >= 24) return "Mild warmth today — stay hydrated";
  return null;
}

export interface GoalBreakdownItem {
  emoji: string;
  label: string;
  amount: number; // ml added (0 if base)
  description: string;
}

/**
 * Build the goal breakdown for the expandable UI.
 */
export function getGoalBreakdown(
  baseGoal: number,
  weather: WeatherData | null
): { items: GoalBreakdownItem[]; finalGoal: number } {
  const weatherExtra = getWeatherExtraMl(baseGoal, weather);
  const weatherLabel = getWeatherLabel(weather);
  const finalGoal = baseGoal + weatherExtra;

  const items: GoalBreakdownItem[] = [
    {
      emoji: '🎯',
      label: 'Base goal',
      amount: baseGoal,
      description: 'Your daily target',
    },
  ];

  if (weatherExtra > 0 && weatherLabel) {
    items.push({
      emoji: '🌡️',
      label: 'Weather',
      amount: weatherExtra,
      description: `${weatherLabel} (${Math.round(weather!.temp)}°C)`,
    });
  }

  return { items, finalGoal };
}
