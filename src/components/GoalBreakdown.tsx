/**
 * GoalBreakdown — expandable component showing how the daily goal is calculated.
 * Shows a subtle badge when weather adjusts the goal, tappable to reveal full breakdown.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../constants/theme';
import type { GoalBreakdownItem } from '../engine/weatherRules';

// Enable LayoutAnimation on Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface GoalBreakdownProps {
  items: GoalBreakdownItem[];
  finalGoal: number;
  baseGoal: number;
}

export default function GoalBreakdown({ items, finalGoal, baseGoal }: GoalBreakdownProps) {
  const [expanded, setExpanded] = useState(false);

  const hasAdjustment = finalGoal !== baseGoal;

  // Don't render anything if there's no adjustment
  if (!hasAdjustment) return null;

  const extraMl = finalGoal - baseGoal;
  const weatherItem = items.find((i) => i.emoji === '🌡️');

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  };

  return (
    <View style={styles.container}>
      {/* Subtle Badge — always visible */}
      <TouchableOpacity
        style={styles.badge}
        onPress={toggleExpanded}
        activeOpacity={0.7}
      >
        <View style={styles.badgeLeft}>
          <Text style={styles.badgeEmoji}>🌡️</Text>
          <View>
            <Text style={styles.badgeTitle}>
              {weatherItem?.description ?? 'Hot day adjustment'}
            </Text>
            <Text style={styles.badgeSubtitle}>
              Goal adjusted to {finalGoal}ml (+{extraMl}ml)
            </Text>
          </View>
        </View>
        <View style={styles.chevronWrap}>
          {expanded ? (
            <ChevronUp size={16} color={COLORS.textMuted} />
          ) : (
            <ChevronDown size={16} color={COLORS.textMuted} />
          )}
        </View>
      </TouchableOpacity>

      {/* Expandable Breakdown */}
      {expanded && (
        <View style={styles.breakdown}>
          {items.map((item, index) => (
            <View key={index} style={styles.breakdownRow}>
              <View style={styles.rowLeft}>
                <Text style={styles.rowEmoji}>{item.emoji}</Text>
                <Text style={styles.rowLabel}>{item.label}</Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={styles.rowAmount}>
                  {item.emoji === '🎯'
                    ? `${item.amount}ml`
                    : `+${item.amount}ml`}
                </Text>
                <Text style={styles.rowDesc}>{item.description}</Text>
              </View>
            </View>
          ))}

          {/* Divider */}
          <View style={styles.divider} />

          {/* Final */}
          <View style={styles.breakdownRow}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowEmoji}>📊</Text>
              <Text style={[styles.rowLabel, styles.finalLabel]}>Final Goal</Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={[styles.rowAmount, styles.finalAmount]}>
                {finalGoal}ml
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: SPACING.md,
  },
  // Badge (always visible)
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 167, 38, 0.08)',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 167, 38, 0.15)',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  badgeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  badgeEmoji: {
    fontSize: 20,
  },
  badgeTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.warning,
  },
  badgeSubtitle: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  chevronWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 167, 38, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Breakdown (expandable)
  breakdown: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginTop: SPACING.sm,
    padding: SPACING.lg,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  rowEmoji: {
    fontSize: 16,
    width: 24,
    textAlign: 'center',
  },
  rowLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  rowRight: {
    alignItems: 'flex-end',
  },
  rowAmount: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: COLORS.text,
  },
  rowDesc: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
    marginVertical: SPACING.sm,
  },
  finalLabel: {
    fontWeight: '700',
    color: COLORS.text,
  },
  finalAmount: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
    color: COLORS.primary,
  },
});
