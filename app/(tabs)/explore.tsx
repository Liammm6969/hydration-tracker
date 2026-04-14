import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SectionList,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Calendar, TrendingUp, Award, ChevronDown, ChevronRight, Flame } from 'lucide-react-native';
import { DRINKS } from '../../src/constants/drinks';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../../src/constants/theme';
import {
  getLogsForRange,
  type DrinkLog,
} from '../../src/storage/drinkStorage';
import { getSettings, type AppSettings, DEFAULT_QUICK_LOGS } from '../../src/storage/settingsStorage';
import {
  getDailySummary,
  type DailySummary,
} from '../../src/utils/hydration';
import {
  getSummariesForRange,
  getStreak,
  buildSummary,
  saveSummary,
  type StreakData,
} from '../../src/storage/summaryStorage';

type RangeFilter = '7days' | '30days';

export default function HistoryScreen() {
  const [range, setRange] = useState<RangeFilter>('7days');
  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [settings, setSettings] = useState<AppSettings>({ goal: 2000, wakeHour: 7, wakingHours: 16, quickLogs: DEFAULT_QUICK_LOGS });
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [allLogs, setAllLogs] = useState<Record<string, DrinkLog[]>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [streak, setStreak] = useState<StreakData>({ current: 0, longest: 0, lastDate: '' });

  const loadData = useCallback(async () => {
    const appSettings = await getSettings();
    setSettings(appSettings);

    const days = range === '7days' ? 7 : 30;

    // Load precomputed summaries (fast path)
    let sums = await getSummariesForRange(days);

    // Fallback: if no precomputed summaries exist, build from raw logs
    if (sums.length === 0) {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days + 1);

      const logsMap = await getLogsForRange(startDate, endDate);
      setAllLogs(logsMap);

      const rebuilt: DailySummary[] = [];
      for (const [dateStr, logs] of Object.entries(logsMap)) {
        if (logs.length > 0) {
          const summary = buildSummary(dateStr, logs, appSettings.goal);
          await saveSummary(summary); // Persist for next time
          rebuilt.push(summary);
        }
      }
      sums = rebuilt.sort((a, b) => b.date.localeCompare(a.date));
    } else {
      // Still load raw logs for expanded drill-down
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days + 1);
      const logsMap = await getLogsForRange(startDate, endDate);
      setAllLogs(logsMap);
    }

    setSummaries(sums);

    // Load streak
    const currentStreak = await getStreak();
    setStreak(currentStreak);
  }, [range]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const toggleExpand = (date: string) => {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
  };

  // Stats
  const totalDays = summaries.length;
  const daysWithLogs = summaries.filter((s) => s.logCount > 0).length;
  const goalMetDays = summaries.filter((s) => s.goalMet).length;
  const avgHydration =
    daysWithLogs > 0
      ? summaries.reduce((sum, s) => sum + s.totalHydration, 0) / daysWithLogs
      : 0;

  const formatDateStr = (dateStr: string): string => {
    const today = new Date();
    const td = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    if (dateStr === td) return 'Today';

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yd = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    if (dateStr === yd) return 'Yesterday';

    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderDayCard = (summary: DailySummary) => {
    const isExpanded = expandedDates.has(summary.date);
    const logs = allLogs[summary.date] || [];
    const sortedLogs = [...logs].sort((a, b) => b.time - a.time);

    return (
      <View key={summary.date} style={styles.dayCard}>
        <TouchableOpacity
          style={styles.dayHeader}
          onPress={() => toggleExpand(summary.date)}
        >
          <View style={styles.dayHeaderLeft}>
            <Text style={styles.dayDate}>{formatDateStr(summary.date)}</Text>
            <View style={styles.dayStats}>
              <Text style={[styles.dayHydration, summary.goalMet && { color: COLORS.success }]}>
                {Math.round(summary.totalHydration)}ml
              </Text>
              <Text style={styles.dayDivider}>/</Text>
              <Text style={styles.dayGoal}>{settings.goal}ml</Text>
              {summary.goalMet && <Award size={14} color={COLORS.success} />}
            </View>
          </View>
          <View style={styles.dayHeaderRight}>
            <Text style={styles.logCount}>{summary.logCount} drinks</Text>
            {isExpanded ? (
              <ChevronDown size={18} color={COLORS.textMuted} />
            ) : (
              <ChevronRight size={18} color={COLORS.textMuted} />
            )}
          </View>
        </TouchableOpacity>

        {/* Drink type breakdown */}
        {Object.keys(summary.byType).length > 0 && (
          <View style={styles.typeBreakdown}>
            {Object.entries(summary.byType).map(([type, amount]) => {
              const drink = DRINKS[type];
              const Icon = drink?.icon;
              return (
                <View key={type} style={styles.typeChip}>
                  {Icon && <Icon size={12} color={drink?.color || COLORS.textMuted} />}
                  <Text style={[styles.typeChipText, { color: drink?.color || COLORS.textSecondary }]}>
                    {Math.round(amount)}ml
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Expanded log entries */}
        {isExpanded && sortedLogs.length > 0 && (
          <View style={styles.expandedLogs}>
            {sortedLogs.map((log) => {
              const drink = DRINKS[log.type];
              const Icon = drink?.icon;
              return (
                <View key={log.id} style={styles.expandedLogRow}>
                  <View style={[styles.logDot, { backgroundColor: drink?.color || COLORS.primary }]} />
                  {Icon && <Icon size={14} color={drink?.color || COLORS.textMuted} />}
                  <Text style={styles.expandedLogType}>{drink?.label || log.type}</Text>
                  <Text style={[styles.expandedLogAmount, { color: drink?.color || COLORS.primary }]}>
                    +{log.amount}ml
                  </Text>
                  <Text style={styles.expandedLogTime}>{formatTime(log.time)}</Text>
                </View>
              );
            })}
          </View>
        )}

        {isExpanded && sortedLogs.length === 0 && (
          <Text style={styles.noLogsText}>No drinks logged this day</Text>
        )}
      </View>
    );
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
          <Text style={styles.title}>History</Text>
          <Text style={styles.subtitle}>Track your hydration journey</Text>
        </View>

        {/* Range Toggle */}
        <View style={styles.rangeToggle}>
          <TouchableOpacity
            style={[styles.rangeButton, range === '7days' && styles.rangeButtonActive]}
            onPress={() => setRange('7days')}
          >
            <Text style={[styles.rangeText, range === '7days' && styles.rangeTextActive]}>
              Past 7 Days
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.rangeButton, range === '30days' && styles.rangeButtonActive]}
            onPress={() => setRange('30days')}
          >
            <Text style={[styles.rangeText, range === '30days' && styles.rangeTextActive]}>
              Past 30 Days
            </Text>
          </TouchableOpacity>
        </View>

        {/* Summary Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <TrendingUp size={18} color={COLORS.primary} />
            <Text style={styles.statValue}>{Math.round(avgHydration)}ml</Text>
            <Text style={styles.statLabel}>Avg / day</Text>
          </View>
          <View style={styles.statCard}>
            <Award size={18} color={COLORS.success} />
            <Text style={styles.statValue}>{goalMetDays}/{daysWithLogs}</Text>
            <Text style={styles.statLabel}>Goals met</Text>
          </View>
          <View style={styles.statCard}>
            <Flame size={18} color={'#FFA726'} />
            <Text style={styles.statValue}>{streak.current}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Calendar size={18} color={COLORS.accent} />
            <Text style={styles.statValue}>{daysWithLogs}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
        </View>

        {/* Daily Cards */}
        {summaries.map(renderDayCard)}

        {summaries.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No history yet</Text>
            <Text style={styles.emptySubtext}>Start logging drinks to see your history here!</Text>
          </View>
        )}
      </ScrollView>
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
    marginBottom: SPACING.xl,
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
  rangeToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 3,
    marginBottom: SPACING.xl,
  },
  rangeButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.sm,
  },
  rangeButtonActive: {
    backgroundColor: COLORS.primary,
  },
  rangeText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  rangeTextActive: {
    color: COLORS.white,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: SPACING.md,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  dayCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
  },
  dayHeaderLeft: {
    flex: 1,
  },
  dayDate: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  dayStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dayHydration: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  dayDivider: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZE.sm,
  },
  dayGoal: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
  },
  dayHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  logCount: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  typeBreakdown: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 2,
    paddingHorizontal: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.round,
  },
  typeChipText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  expandedLogs: {
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  expandedLogRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.xs + 2,
  },
  logDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  expandedLogType: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    fontWeight: '500',
    flex: 1,
  },
  expandedLogAmount: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  expandedLogTime: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    minWidth: 50,
    textAlign: 'right',
  },
  noLogsText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingVertical: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl * 2,
  },
  emptyText: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    marginTop: 4,
  },
});
