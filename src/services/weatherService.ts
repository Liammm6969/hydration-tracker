/**
 * Weather service using Open-Meteo API (no API key required).
 * Fetches current weather conditions for hydration goal adjustment.
 */

export interface WeatherData {
  temp: number;       // °C
  windSpeed: number;  // km/h
  time: string;       // ISO timestamp from API
}

const API_BASE = 'https://api.open-meteo.com/v1/forecast';
const TIMEOUT_MS = 10_000;

/**
 * Fetch current weather for the given coordinates.
 * Throws on network failure or timeout.
 */
export async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const url = `${API_BASE}?latitude=${lat}&longitude=${lon}&current_weather=true`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, { signal: controller.signal });

    if (!res.ok) {
      throw new Error(`Weather API responded with ${res.status}`);
    }

    const data = await res.json();
    const current = data.current_weather;

    if (!current) {
      throw new Error('Missing current_weather in API response');
    }

    return {
      temp: current.temperature,
      windSpeed: current.windspeed,
      time: current.time,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
