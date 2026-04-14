/**
 * StreakBadge — displays the current hydration streak.
 * Supports two modes:
 *   - compact: small pill for header corner placement
 *   - full: card-style with message for standalone placement
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Flame, Trophy } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../constants/theme';
import type { StreakData } from '../storage/summaryStorage';

interface StreakBadgeProps {
  streak: StreakData;
  compact?: boolean;
}

export default function StreakBadge({ streak, compact = false }: StreakBadgeProps) {
  // Don't show anything if no streak at all
  if (streak.current === 0 && streak.longest === 0) return null;

  const isOnFire = streak.current >= 3;
  const isMilestone = streak.current >= 7;

  const flameColor = isMilestone
    ? '#FF6B35'
    : isOnFire
      ? '#FFA726'
      : COLORS.warning;

  // ── Compact mode (header pill) ──────────────────────────────────
  if (compact) {
    return (
      <View style={[styles.compactContainer, isOnFire && styles.compactFire]}>
        <Flame size={14} color={flameColor} />
        <Text style={[styles.compactCount, { color: flameColor }]}>
          {streak.current}
        </Text>
      </View>
    );
  }

  // ── Full mode (card) ────────────────────────────────────────────
  const getMessage = (): string => {
    if (streak.current >= 30) return 'Legendary streak! 🏆';
    if (streak.current >= 14) return 'Unstoppable! 💪';
    if (streak.current >= 7) return 'On fire this week!';
    if (streak.current >= 3) return 'Building momentum!';
    if (streak.current >= 1) return 'Keep it going!';
    return `Best: ${streak.longest} days`;
  };

  return (
    <View style={[styles.container, isOnFire && styles.containerFire]}>
      <View style={styles.left}>
        <View style={[styles.iconWrap, { backgroundColor: flameColor + '18' }]}>
          <Flame size={18} color={flameColor} />
        </View>
        <View>
          <View style={styles.streakRow}>
            <Text style={[styles.streakCount, { color: flameColor }]}>
              {streak.current}
            </Text>
            <Text style={styles.streakLabel}>
              day{streak.current !== 1 ? 's' : ''} streak
            </Text>
          </View>
          <Text style={styles.message}>{getMessage()}</Text>
        </View>
      </View>

      {streak.longest > 0 && streak.longest > streak.current && (
        <View style={styles.bestBadge}>
          <Trophy size={10} color={COLORS.textMuted} />
          <Text style={styles.bestText}>{streak.longest}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Compact ──
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.round,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingVertical: 6,
    paddingHorizontal: SPACING.md,
  },
  compactFire: {
    borderColor: 'rgba(255, 167, 38, 0.25)',
    backgroundColor: 'rgba(255, 167, 38, 0.08)',
  },
  compactCount: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
  },
  // ── Full ──
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
  },
  containerFire: {
    borderColor: 'rgba(255, 167, 38, 0.2)',
    backgroundColor: 'rgba(255, 167, 38, 0.06)',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  streakCount: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
  },
  streakLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  message: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  bestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.round,
    paddingVertical: 3,
    paddingHorizontal: SPACING.sm,
  },
  bestText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
});
