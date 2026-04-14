import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { DRINKS } from '../constants/drinks';
import type { DrinkLog } from '../storage/drinkStorage';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../constants/theme';

interface TodayLogProps {
  logs: DrinkLog[];
  onDelete: (log: DrinkLog) => void;
}

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const LogItem: React.FC<{ item: DrinkLog; onDelete: (log: DrinkLog) => void }> = ({
  item,
  onDelete,
}) => {
  const drink = DRINKS[item.type];
  const Icon = drink?.icon;

  return (
    <View style={styles.logItem}>
      <View style={[styles.logIcon, { backgroundColor: (drink?.color || COLORS.primary) + '20' }]}>
        {Icon && <Icon size={16} color={drink?.color || COLORS.primary} />}
      </View>
      <View style={styles.logInfo}>
        <Text style={styles.logType}>{drink?.label || item.type}</Text>
        <Text style={styles.logTime}>{formatTime(item.time)}</Text>
      </View>
      <Text style={[styles.logAmount, { color: drink?.color || COLORS.primary }]}>
        +{item.amount}ml
      </Text>
      <TouchableOpacity
        onPress={() => onDelete(item)}
        style={styles.deleteButton}
        hitSlop={8}
      >
        <Trash2 size={14} color={COLORS.textMuted} />
      </TouchableOpacity>
    </View>
  );
};

const TodayLog: React.FC<TodayLogProps> = ({ logs, onDelete }) => {
  const sortedLogs = [...logs].sort((a, b) => b.time - a.time);

  if (logs.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Today's Drinks</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No drinks logged yet</Text>
          <Text style={styles.emptySubtext}>Tap a button above to log your first drink!</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Today's Drinks</Text>
        <Text style={styles.countBadge}>{logs.length}</Text>
      </View>
      <FlatList
        data={sortedLogs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <LogItem item={item} onDelete={onDelete} />}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: SPACING.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  countBadge: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: COLORS.primary,
    backgroundColor: COLORS.primaryDim,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.round,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    gap: SPACING.md,
  },
  logIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logInfo: {
    flex: 1,
  },
  logType: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  logTime: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  logAmount: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  deleteButton: {
    padding: SPACING.xs,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    marginTop: 4,
  },
});

export default TodayLog;
