import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Slider from '@react-native-community/slider';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Target, Sun, Clock, RotateCcw, Info, Zap, Pencil } from 'lucide-react-native';
import { DRINKS } from '../../src/constants/drinks';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../../src/constants/theme';
import {
  getSettings,
  saveSettings,
  type AppSettings,
  type QuickLogItem,
  DEFAULT_QUICK_LOGS,
} from '../../src/storage/settingsStorage';
import { DEFAULT_GOAL, DEFAULT_WAKE_HOUR, DEFAULT_WAKING_HOURS } from '../../src/constants/drinks';
import EditQuickLogModal from '../../src/components/EditQuickLogModal';

export default function SettingsScreen() {
  const [settings, setSettings] = useState<AppSettings>({
    goal: DEFAULT_GOAL,
    wakeHour: DEFAULT_WAKE_HOUR,
    wakingHours: DEFAULT_WAKING_HOURS,
    quickLogs: DEFAULT_QUICK_LOGS,
  });
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [])
  );

  const loadSettings = async () => {
    const s = await getSettings();
    setSettings(s);
  };

  const updateSetting = async (key: keyof AppSettings, value: number) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    await saveSettings({ [key]: value });
  };

  const handleTimeChange = (_: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (date) {
      updateSetting('wakeHour', date.getHours());
    }
  };

  const handleEditQuickLog = (index: number) => {
    setEditingIndex(index);
    setShowEditModal(true);
  };

  const handleSaveQuickLog = async (item: QuickLogItem) => {
    if (editingIndex === null) return;
    const updatedQuickLogs = [...settings.quickLogs];
    updatedQuickLogs[editingIndex] = item;
    const updated = { ...settings, quickLogs: updatedQuickLogs };
    setSettings(updated);
    await saveSettings({ quickLogs: updatedQuickLogs });
  };

  const handleResetQuickLogs = () => {
    Alert.alert(
      'Reset Quick Logs',
      'Reset all quick log buttons to defaults?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            const updated = { ...settings, quickLogs: DEFAULT_QUICK_LOGS };
            setSettings(updated);
            await saveSettings({ quickLogs: DEFAULT_QUICK_LOGS });
          },
        },
      ]
    );
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Settings',
      'Reset all settings to defaults?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            const defaults = {
              goal: DEFAULT_GOAL,
              wakeHour: DEFAULT_WAKE_HOUR,
              wakingHours: DEFAULT_WAKING_HOURS,
              quickLogs: DEFAULT_QUICK_LOGS,
            };
            setSettings(defaults);
            await saveSettings(defaults);
          },
        },
      ]
    );
  };

  const formatHour = (hour: number): string => {
    const h = hour % 12 || 12;
    const ampm = hour < 12 ? 'AM' : 'PM';
    return `${h}:00 ${ampm}`;
  };

  const wakeDate = new Date();
  wakeDate.setHours(settings.wakeHour, 0, 0, 0);

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Customize your experience</Text>
        </View>

        {/* Daily Goal */}
        <View style={styles.settingCard}>
          <View style={styles.settingHeader}>
            <View style={[styles.settingIcon, { backgroundColor: COLORS.primaryDim }]}>
              <Target size={20} color={COLORS.primary} />
            </View>
            <View style={styles.settingHeaderText}>
              <Text style={styles.settingTitle}>Daily Goal</Text>
              <Text style={styles.settingDescription}>How much water you aim to drink daily</Text>
            </View>
          </View>
          <Text style={styles.settingValue}>{settings.goal}ml</Text>
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderMin}>500</Text>
            <View style={styles.sliderWrapper}>
              <Slider
                style={styles.slider}
                minimumValue={500}
                maximumValue={5000}
                step={100}
                value={settings.goal}
                onSlidingComplete={(value: number) => updateSetting('goal', value)}
                minimumTrackTintColor={COLORS.primary}
                maximumTrackTintColor={COLORS.surface}
                thumbTintColor={COLORS.primary}
              />
            </View>
            <Text style={styles.sliderMax}>5000</Text>
          </View>
        </View>

        {/* Wake Time */}
        <View style={styles.settingCard}>
          <View style={styles.settingHeader}>
            <View style={[styles.settingIcon, { backgroundColor: COLORS.warningDim }]}>
              <Sun size={20} color={COLORS.warning} />
            </View>
            <View style={styles.settingHeaderText}>
              <Text style={styles.settingTitle}>Wake Time</Text>
              <Text style={styles.settingDescription}>When your day starts for reminder scheduling</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.timeSelector}
            onPress={() => setShowTimePicker(true)}
          >
            <Clock size={16} color={COLORS.primary} />
            <Text style={styles.timeText}>{formatHour(settings.wakeHour)}</Text>
          </TouchableOpacity>
          {showTimePicker && (
            <DateTimePicker
              value={wakeDate}
              mode="time"
              is24Hour={false}
              onChange={handleTimeChange}
              themeVariant="dark"
            />
          )}
        </View>

        {/* Waking Hours */}
        <View style={styles.settingCard}>
          <View style={styles.settingHeader}>
            <View style={[styles.settingIcon, { backgroundColor: COLORS.successDim }]}>
              <Clock size={20} color={COLORS.success} />
            </View>
            <View style={styles.settingHeaderText}>
              <Text style={styles.settingTitle}>Waking Hours</Text>
              <Text style={styles.settingDescription}>How many hours you're awake each day</Text>
            </View>
          </View>
          <Text style={styles.settingValue}>{settings.wakingHours} hours</Text>
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderMin}>10</Text>
            <View style={styles.sliderWrapper}>
              <Slider
                style={styles.slider}
                minimumValue={10}
                maximumValue={20}
                step={1}
                value={settings.wakingHours}
                onSlidingComplete={(value: number) => updateSetting('wakingHours', value)}
                minimumTrackTintColor={COLORS.success}
                maximumTrackTintColor={COLORS.surface}
                thumbTintColor={COLORS.success}
              />
            </View>
            <Text style={styles.sliderMax}>20</Text>
          </View>
        </View>

        {/* Quick Logs Section */}
        <View style={styles.settingCard}>
          <View style={styles.settingHeader}>
            <View style={[styles.settingIcon, { backgroundColor: 'rgba(129, 212, 250, 0.15)' }]}>
              <Zap size={20} color={COLORS.accent} />
            </View>
            <View style={styles.settingHeaderText}>
              <Text style={styles.settingTitle}>Quick Log Buttons</Text>
              <Text style={styles.settingDescription}>Tap to customize each quick log</Text>
            </View>
          </View>

          <View style={styles.quickLogGrid}>
            {settings.quickLogs.map((ql, index) => {
              const drink = DRINKS[ql.drinkType];
              const Icon = drink?.icon;
              const color = drink?.color || COLORS.primary;
              return (
                <TouchableOpacity
                  key={`ql-${index}`}
                  style={[styles.quickLogCard, { backgroundColor: color + '12', borderColor: color + '25' }]}
                  onPress={() => handleEditQuickLog(index)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.quickLogIconWrap, { backgroundColor: color + '22' }]}>
                    {Icon && <Icon size={18} color={color} />}
                  </View>
                  <Text style={styles.quickLogLabel}>{drink?.label || ql.drinkType}</Text>
                  <Text style={[styles.quickLogAmount, { color }]}>+{ql.amount}ml</Text>
                  <View style={[styles.editBadge, { backgroundColor: color + '30' }]}>
                    <Pencil size={10} color={color} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={styles.resetQuickLogsBtn} onPress={handleResetQuickLogs}>
            <RotateCcw size={13} color={COLORS.textMuted} />
            <Text style={styles.resetQuickLogsText}>Reset to defaults</Text>
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <Info size={16} color={COLORS.textMuted} />
          <Text style={styles.infoText}>
            Reminders are calculated based on your daily goal distributed across your waking hours.
            The app will notify you when you're behind schedule.
          </Text>
        </View>

        {/* Reset */}
        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
          <RotateCcw size={16} color={COLORS.danger} />
          <Text style={styles.resetText}>Reset All Settings</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Quick Log Modal */}
      <EditQuickLogModal
        visible={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingIndex(null);
        }}
        onSave={handleSaveQuickLog}
        item={editingIndex !== null ? settings.quickLogs[editingIndex] : null}
        index={editingIndex ?? 0}
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
    marginBottom: SPACING.xxl,
  },
  title: {
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
  settingCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingHeaderText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.text,
  },
  settingDescription: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  settingValue: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  sliderWrapper: {
    flex: 1,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderMin: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    minWidth: 30,
  },
  sliderMax: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    minWidth: 30,
    textAlign: 'right',
  },
  timeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingVertical: SPACING.md,
  },
  timeText: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.text,
  },
  // Quick Log styles
  quickLogGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  quickLogCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xs,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    width: '30.5%',
    position: 'relative',
  },
  quickLogIconWrap: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  quickLogLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 1,
  },
  quickLogAmount: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
  },
  editBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetQuickLogsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
  },
  resetQuickLogsText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  infoCard: {
    flexDirection: 'row',
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  infoText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    lineHeight: 20,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.danger + '30',
    backgroundColor: COLORS.dangerDim,
  },
  resetText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.danger,
  },
});
