/**
 * Notification action handler — processes taps on notification action buttons.
 *
 * Actions:
 *   record_250  → Log 250ml water instantly
 *   repeat_last → Re-log the user's last drink
 *   dismiss     → No-op (just clear the notification)
 *
 * This module works even when the app is backgrounded or killed,
 * because the listener is registered at the root layout level.
 */

import * as Notifications from 'expo-notifications';
import { saveDrinkLog, getTodayLogs, type DrinkLog } from '../storage/drinkStorage';
import { getSettings } from '../storage/settingsStorage';
import { updateTodaySummary, updateStreak } from '../storage/summaryStorage';
import { router } from 'expo-router';

// De-duplicate guard: prevent double-logging within 3 seconds
let lastActionTimestamp = 0;

/**
 * Handle a notification action response.
 * Called by the listener in the root layout.
 */
export const handleNotificationAction = async (
  response: Notifications.NotificationResponse
): Promise<void> => {
  const actionId = response.actionIdentifier;

  // Ignore the default tap (just opens the app)
  if (actionId === Notifications.DEFAULT_ACTION_IDENTIFIER) {
    return;
  }

  // De-duplicate guard
  const now = Date.now();
  if (now - lastActionTimestamp < 3000) {
    console.log('Notification action ignored (duplicate tap)');
    return;
  }
  lastActionTimestamp = now;

  try {
    if (actionId === 'record_250') {
      await logDrinkFromNotification('water', 250);
    } else if (actionId === 'open_record_modal') {
      router.push({ pathname: '/', params: { action: 'open_record_modal' } });
    } else if (actionId === 'dismiss') {
      // No action needed — notification is cleared automatically
    }
  } catch (error) {
    console.log('Notification action handler error:', error);
  }
};

/**
 * Log a drink from a notification action.
 * Updates storage, summary, and streak.
 */
const logDrinkFromNotification = async (type: string, amount: number): Promise<void> => {
  await saveDrinkLog({ type, amount, time: Date.now() });

  // Update precomputed summary + streak
  const settings = await getSettings();
  const summary = await updateTodaySummary(settings.goal);
  await updateStreak(summary);

  console.log(`[Notification Action] Logged ${amount}ml ${type}`);
};
