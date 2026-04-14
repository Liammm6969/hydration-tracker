import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { DRINKS, type DrinkConfig } from '../constants/drinks';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../constants/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
// 3 items per row: account for container padding (SPACING.xl * 2 = 40) and gaps (SPACING.sm * 2 = 16)
const CARD_WIDTH = (SCREEN_WIDTH - 40 - 16) / 3;

interface DrinkButtonProps {
  drinkKey: string;
  amount?: number;
  onPress: (drinkKey: string, amount: number) => void;
  compact?: boolean;
}

const DrinkButton: React.FC<DrinkButtonProps> = ({
  drinkKey,
  amount,
  onPress,
  compact = false,
}) => {
  const drink = DRINKS[drinkKey];
  if (!drink) return null;

  const displayAmount = amount ?? drink.amounts[0];
  const Icon = drink.icon;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress(drinkKey, displayAmount);
  };

  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.compactButton, { borderColor: drink.color + '40' }]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Icon size={18} color={drink.color} />
        <Text style={[styles.compactLabel, { color: drink.color }]}>
          +{displayAmount}ml
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: drink.color + '18', borderColor: drink.color + '30' }]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: drink.color + '25' }]}>
        <Icon size={20} color={drink.color} />
      </View>
      <Text style={styles.label} numberOfLines={1}>{drink.label}</Text>
      <Text style={[styles.amount, { color: drink.color }]}>+{displayAmount}ml</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xs,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    width: CARD_WIDTH,
    flexGrow: 0,
    flexShrink: 0,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  label: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 1,
  },
  amount: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
  },
  compactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.round,
    borderWidth: 1,
    backgroundColor: COLORS.card,
  },
  compactLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
});

export default DrinkButton;
