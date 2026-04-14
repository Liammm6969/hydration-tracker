/**
 * Location service wrapping expo-location.
 * Returns user coordinates for weather lookup.
 * Never throws — returns null on failure or denial.
 */

import * as Location from 'expo-location';
import { Platform } from 'react-native';

export interface LocationCoords {
  lat: number;
  lon: number;
}

/**
 * Get the user's current location.
 * Returns null if:
 *  - Running on web
 *  - Permission denied
 *  - Location unavailable
 */
export async function getLocation(): Promise<LocationCoords | null> {
  if (Platform.OS === 'web') {
    return null;
  }

  try {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      console.log('Location permission denied — weather adjustments disabled');
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Low, // Low accuracy is fine for weather (city-level)
    });

    return {
      lat: location.coords.latitude,
      lon: location.coords.longitude,
    };
  } catch (error) {
    console.log('Location unavailable:', error);
    return null;
  }
}
