/**
 * Weather cache using AsyncStorage.
 * 3-hour TTL to avoid API spam and slow startup.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WeatherData } from '../services/weatherService';

const CACHE_KEY = '@weather_cache';
const CACHE_TTL_MS = 3 * 60 * 60 * 1000; // 3 hours

interface CachedWeather {
  data: WeatherData;
  timestamp: number;
}

/**
 * Get cached weather data if it exists and is fresh (< 3 hours old).
 * Returns null if cache is missing, expired, or corrupt.
 */
export async function getCachedWeather(): Promise<WeatherData | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const cached: CachedWeather = JSON.parse(raw);
    const age = Date.now() - cached.timestamp;

    if (age >= CACHE_TTL_MS) {
      return null; // Expired
    }

    return cached.data;
  } catch {
    return null;
  }
}

/**
 * Save weather data to cache with current timestamp.
 */
export async function saveWeatherCache(weather: WeatherData): Promise<void> {
  try {
    const entry: CachedWeather = {
      data: weather,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch (error) {
    console.log('Failed to cache weather:', error);
  }
}
