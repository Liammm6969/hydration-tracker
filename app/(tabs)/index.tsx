import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { RotateCcw, Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, router } from 'expo-router';
import ProgressRing from '../../src/components/ProgressRing';
import HydrationSummary from '../../src/components/HydrationSummary';
import DrinkButton from '../../src/components/DrinkButton';
import TodayLog from '../../src/components/TodayLog';
import ImbalanceAlert from '../../src/components/ImbalanceAlert';
import AddDrinkModal from '../../src/components/AddDrinkModal';
import GoalBreakdown from '../../src/components/GoalBreakdown';
import StreakBadge from '../../src/components/StreakBadge';
import { DRINKS, DRINK_KEYS } from '../../src/constants/drinks';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../../src/constants/theme';
import {
  getTodayLogs,
  saveDrinkLog,
  deleteDrinkLog,
  type DrinkLog,
} from '../../src/storage/drinkStorage';
import { getSettings, type AppSettings, DEFAULT_QUICK_LOGS } from '../../src/storage/settingsStorage';
import {
  calculateHydration,
  calculateRawIntake,
  getProgress,
  getImbalanceAlert,
  getEffectiveGoal,
  type ImbalanceAlert as ImbalanceAlertType,
} from '../../src/utils/hydration';
import {
  requestPermissions,
  scheduleSmartReminder,
} from '../../src/utils/notifications';
import { getWeatherContext } from '../../src/services/weatherContext';
import { getGoalBreakdown, getWeatherNotificationContext } from '../../src/engine/weatherRules';
import type { WeatherData } from '../../src/services/weatherService';
import {
  updateTodaySummary,
  finalizeYesterdaySummary,
  updateStreak,
  getStreak,
  type StreakData,
} from '../../src/storage/summaryStorage';

export default function HomeScreen() {
  const [logs, setLogs] = useState<DrinkLog[]>([]);
  const [settings, setSettings] = useState<AppSettings>({ goal: 2000, wakeHour: 7, wakingHours: 16, quickLogs: DEFAULT_QUICK_LOGS });
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalInitialType, setModalInitialType] = useState('water');
  const [lastDrink, setLastDrink] = useState<DrinkLog | null>(null);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [streak, setStreak] = useState<StreakData>({ current: 0, longest: 0, lastDate: '' });

  const params = useLocalSearchParams();

  useEffect(() => {
    if (params.action === 'open_record_modal') {
      setShowModal(true);
      router.setParams({ action: '' });
    }
  }, [params.action]);

  const hydration = calculateHydration(logs);
  const rawIntake = calculateRawIntake(logs);
  const effectiveGoal = getEffectiveGoal(settings.goal, weather);
  const progress = getProgress(hydration, effectiveGoal);
  const imbalanceAlert = getImbalanceAlert(logs);
  const goalBreakdown = getGoalBreakdown(settings.goal, weather);

  const loadData = useCallback(async () => {
    const [todayLogs, appSettings] = await Promise.all([
      getTodayLogs(),
      getSettings(),
    ]);
    setLogs(todayLogs);
    setSettings(appSettings);
    if (todayLogs.length > 0) {
      const sorted = [...todayLogs].sort((a, b) => b.time - a.time);
      setLastDrink(sorted[0]);
    }
    setAlertDismissed(false);

    // Non-blocking weather fetch
    getWeatherContext().then((w) => setWeather(w));

    // Finalize any missed days, update today's summary, load streak
    await finalizeYesterdaySummary(appSettings.goal);
    const todaySummary = await updateTodaySummary(appSettings.goal);
    const currentStreak = await getStreak();
    setStreak(currentStreak);
  }, []);

  // Load on mount and when tab is focused
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Request notification permission on first mount
  useEffect(() => {
    requestPermissions();
  }, []);

  // Reschedule reminders when data changes
  useEffect(() => {
    const lastDrinkTime = lastDrink?.time || null;
    const weatherNotif = getWeatherNotificationContext(weather);
    scheduleSmartReminder(hydration, effectiveGoal, settings.wakeHour, settings.wakingHours, lastDrinkTime, weatherNotif);
  }, [hydration, effectiveGoal, settings, lastDrink, weather]);

  const handleQuickLog = async (drinkKey: string, amount: number) => {
    await handleAddDrink(drinkKey, amount, Date.now());
  };

  const handleAddDrink = async (type: string, amount: number, time: number) => {
    const newLog = await saveDrinkLog({ type, amount, time });
    setLogs((prev) => [...prev, newLog]);
    setLastDrink(newLog);
    setAlertDismissed(false);

    // Update precomputed summary + streak
    const summary = await updateTodaySummary(settings.goal);
    const updatedStreak = await updateStreak(summary);
    setStreak(updatedStreak);
  };

  const handleDeleteLog = async (log: DrinkLog) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await deleteDrinkLog(log.time, log.id);
    setLogs((prev) => prev.filter((l) => l.id !== log.id));

    // Refresh summary after deletion
    const summary = await updateTodaySummary(settings.goal);
    const updatedStreak = await updateStreak(summary);
    setStreak(updatedStreak);
  };

  const handleRepeatLast = () => {
    if (lastDrink) {
      handleAddDrink(lastDrink.type, lastDrink.amount, Date.now());
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hydration Tracker</Text>
            <Text style={styles.subtitle}>Stay hydrated, stay healthy 💧</Text>
          </View>
          <StreakBadge streak={streak} compact />
        </View>

        {/* Progress Ring */}
        <View style={styles.progressContainer}>
          <ProgressRing
            progress={progress}
            current={hydration}
            goal={effectiveGoal}
          />
        </View>

        {/* Hydration Summary */}
        <HydrationSummary rawIntake={rawIntake} effectiveHydration={hydration} />

        {/* Weather Goal Breakdown */}
        <GoalBreakdown
          items={goalBreakdown.items}
          finalGoal={goalBreakdown.finalGoal}
          baseGoal={settings.goal}
        />

        {/* Imbalance Alert */}
        {imbalanceAlert && !alertDismissed && (
          <View style={styles.alertContainer}>
            <ImbalanceAlert
              alert={imbalanceAlert}
              onDismiss={() => setAlertDismissed(true)}
            />
          </View>
        )}

        {/* Repeat Last Button */}
        {lastDrink && (
          <TouchableOpacity style={styles.repeatButton} onPress={handleRepeatLast}>
            <RotateCcw size={16} color={COLORS.primary} />
            <Text style={styles.repeatText}>
              Repeat: {DRINKS[lastDrink.type]?.label} +{lastDrink.amount}ml
            </Text>
          </TouchableOpacity>
        )}

        {/* Quick Log Buttons */}
        <Text style={styles.sectionTitle}>Quick Log</Text>
        <View style={styles.drinkGrid}>
          {settings.quickLogs.map((ql, index) => (
            <DrinkButton
              key={`${ql.drinkType}-${index}`}
              drinkKey={ql.drinkType}
              amount={ql.amount}
              onPress={handleQuickLog}
            />
          ))}
        </View>

        {/* Custom Add */}
        <TouchableOpacity
          style={styles.customAddButton}
          onPress={() => {
            setModalInitialType('water');
            setShowModal(true);
          }}
        >
          <Plus size={18} color={COLORS.primary} />
          <Text style={styles.customAddText}>Custom Drink</Text>
        </TouchableOpacity>

        {/* Today's Log */}
        <View style={styles.todayLogContainer}>
          <TodayLog logs={logs} onDelete={handleDeleteLog} />
        </View>
      </ScrollView>

      {/* Add Drink Modal */}
      <AddDrinkModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onAdd={handleAddDrink}
        initialType={modalInitialType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xxxl + 24,
    paddingBottom: SPACING.xxxl + 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  greeting: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  alertContainer: {
    marginTop: SPACING.lg,
  },
  repeatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primaryDim,
    borderRadius: RADIUS.round,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.lg,
  },
  repeatText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.primary,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SPACING.xxl,
    marginBottom: SPACING.md,
  },
  drinkGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  customAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingVertical: SPACING.lg,
    marginTop: SPACING.md,
  },
  customAddText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.primary,
  },
  todayLogContainer: {
    marginTop: SPACING.xxl,
  },
});
