import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import 'react-native-reanimated';
import { COLORS } from '../src/constants/theme';
import { setupNotificationCategory } from '../src/utils/notifications';
import { handleNotificationAction } from '../src/services/notificationActions';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  // Set up notification category + action listener on app start
  useEffect(() => {
    // Register interactive notification buttons
    setupNotificationCategory();

    // Listen for notification action taps (works in background + killed state)
    const subscription = Notifications.addNotificationResponseReceivedListener(
      handleNotificationAction
    );

    return () => subscription.remove();
  }, []);

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: 'modal', title: 'Modal' }}
        />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}
