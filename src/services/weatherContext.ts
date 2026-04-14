/**
 * Weather context — single entry point for weather data.
 *
 * Flow:
 *  1. Check cache → return if fresh
 *  2. Get location
 *  3. Fetch weather API
 *  4. Save to cache
 *  5. Return data (or null if anything fails)
 *
 * This function NEVER throws. The app works perfectly without weather data.
 */

import { getLocation } from './locationService';
import { fetchWeather } from './weatherService';
import { getCachedWeather, saveWeatherCache } from '../storage/weatherCache';
import type { WeatherData } from './weatherService';

export async function getWeatherContext(): Promise<WeatherData | null> {
  try {
    // 1. Try cache first (instant)
    const cached = await getCachedWeather();
    if (cached) {
      return cached;
    }

    // 2. Cache expired or missing — get location
    const coords = await getLocation();
    if (!coords) {
      return null; // No location = no weather
    }

    // 3. Fetch fresh weather
    const weather = await fetchWeather(coords.lat, coords.lon);

    // 4. Cache for next time
    await saveWeatherCache(weather);

    return weather;
  } catch (error) {
    console.log('Weather context unavailable:', error);
    return null;
  }
}
