import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { getExpectedHydration } from './hydration';

const isNative = Platform.OS !== 'web';

const NOTIFICATION_CATEGORY = 'hydration';

// Configure notification handler for foreground (native only)
if (isNative) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (e) {
    // Notifications not available (e.g. Expo Go on SDK 53+)
    console.log('Notifications handler setup skipped:', e);
  }
}

/**
 * Set up interactive notification category with action buttons.
 * Call this once on app startup.
 */
export const setupNotificationCategory = async (): Promise<void> => {
  if (!isNative) return;

  try {
    await Notifications.setNotificationCategoryAsync(NOTIFICATION_CATEGORY, [
      {
        identifier: 'record_250',
        buttonTitle: '+250ml',
      },
      {
        identifier: 'open_record_modal',
        buttonTitle: 'Record a Drink',
        options: { opensAppToForeground: true },
      },
      {
        identifier: 'dismiss',
        buttonTitle: 'Dismiss',
        options: { isDestructive: true },
      },
    ]);
  } catch (e) {
    console.log('Notification category setup skipped:', e);
  }
};

/**
 * Request notification permissions.
 * Returns true if granted (always false on web or when unavailable).
 */
export const requestPermissions = async (): Promise<boolean> => {
  if (!isNative) return false;

  try {
    if (!Device.isDevice) {
      console.log('Notifications require a physical device');
      return false;
    }

    // Create Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('hydration', {
        name: 'Hydration Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4FC3F7',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (e) {
    console.log('Notification permissions unavailable:', e);
    return false;
  }
};

/**
 * Cancel all scheduled notifications.
 */
export const cancelAllReminders = async (): Promise<void> => {
  if (!isNative) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (e) {
    // silently ignore
  }
};

/**
 * Schedule a smart hydration reminder.
 * Called every time a drink is logged or the app is opened.
 */
export const scheduleSmartReminder = async (
  currentHydration: number,
  goal: number,
  wakeHour: number,
  wakingHours: number,
  lastDrinkTime: number | null,
  weatherContext?: string | null
): Promise<void> => {
  if (!isNative) return;

  try {
    await cancelAllReminders();

    // Don't schedule if we've already met the goal
    if (currentHydration >= goal) return;

    // Anti-spam: don't remind if a drink was logged less than 45 min ago
    if (lastDrinkTime) {
      const minutesSinceLastDrink = (Date.now() - lastDrinkTime) / 60000;
      if (minutesSinceLastDrink < 45) {
        // Schedule for when the 45-min window expires
        const secondsUntilReminder = Math.ceil((45 - minutesSinceLastDrink) * 60);
        await scheduleNotification(
          'Time to hydrate! 💧',
          "It's been a while since your last drink.",
          secondsUntilReminder
        );
        return;
      }
    }

    // Check if behind schedule
    const expected = getExpectedHydration(goal, wakeHour, wakingHours);
    const deficit = expected - currentHydration;

    if (deficit > 200) {
      // Behind by more than 200ml — remind urgently
      const title = weatherContext
        ? "Hot day — you're falling behind! 🌡️"
        : "You're behind on hydration! 💧";
      const body = weatherContext
        ? `${weatherContext}. You should have had ~${Math.round(expected)}ml by now.`
        : `You should have had ~${Math.round(expected)}ml by now. Drink some water!`;
      // Shorter interval in hot weather
      const seconds = weatherContext ? 3 * 60 : 5 * 60;
      await scheduleNotification(title, body, seconds);
    } else if (deficit > 0) {
      // Slightly behind — remind in 30 minutes (20 in hot weather)
      const body = weatherContext
        ? 'The heat increases your water needs — grab a glass now.'
        : 'A glass of water would be perfect right now.';
      const seconds = weatherContext ? 20 * 60 : 30 * 60;
      await scheduleNotification('Stay on track! 💧', body, seconds);
    } else {
      // On track — remind in 60 minutes
      await scheduleNotification(
        'Keep it up! 💧',
        "Don't forget to keep sipping throughout the day.",
        60 * 60
      );
    }
  } catch (e) {
    console.log('Smart reminder scheduling skipped:', e);
  }
};

/**
 * Schedule an imbalance alert notification.
 */
export const scheduleImbalanceAlert = async (message: string): Promise<void> => {
  if (!isNative) return;
  await scheduleNotification('Drink Balance Alert ⚠️', message, 1);
};

/**
 * Schedule a local notification.
 */
const scheduleNotification = async (
  title: string,
  body: string,
  seconds: number
): Promise<void> => {
  if (!isNative) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        categoryIdentifier: NOTIFICATION_CATEGORY,
        data: { type: 'hydration_reminder' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(seconds, 1),
      },
    });
  } catch (error) {
    console.log('Failed to schedule notification:', error);
  }
};
