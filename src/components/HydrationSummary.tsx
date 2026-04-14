import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../constants/theme';

interface HydrationSummaryProps {
  rawIntake: number;
  effectiveHydration: number;
}

const HydrationSummary: React.FC<HydrationSummaryProps> = ({
  rawIntake,
  effectiveHydration,
}) => {
  const diff = rawIntake - effectiveHydration;
  const showDiff = diff > 0 && rawIntake > 0;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Consumed</Text>
          <Text style={styles.statValue}>{Math.round(rawIntake)}ml</Text>
        </View>
        <ArrowRight size={16} color={COLORS.textMuted} />
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Effective</Text>
          <Text style={[styles.statValue, { color: COLORS.primary }]}>
            {Math.round(effectiveHydration)}ml
          </Text>
        </View>
      </View>
      {showDiff && (
        <Text style={styles.diffText}>
          -{Math.round(diff)}ml from non-water drinks
        </Text>
      )}
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.lg,
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.text,
  },
  diffText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
});

export default HydrationSummary;
