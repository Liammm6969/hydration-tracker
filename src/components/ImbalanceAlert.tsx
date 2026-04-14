import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { AlertTriangle, X } from 'lucide-react-native';
import { DRINKS } from '../constants/drinks';
import type { ImbalanceAlert as ImbalanceAlertType } from '../utils/hydration';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../constants/theme';

interface ImbalanceAlertProps {
  alert: ImbalanceAlertType;
  onDismiss: () => void;
}

const ImbalanceAlert: React.FC<ImbalanceAlertProps> = ({ alert, onDismiss }) => {
  const drinkColor = DRINKS[alert.drinkType]?.color || COLORS.warning;

  return (
    <View style={[styles.container, { borderColor: drinkColor + '40', backgroundColor: drinkColor + '12' }]}>
      <View style={styles.iconContainer}>
        <AlertTriangle size={20} color={drinkColor} />
      </View>
      <Text style={styles.message} numberOfLines={2}>
        {alert.message}
      </Text>
      <TouchableOpacity onPress={onDismiss} style={styles.dismissButton} hitSlop={8}>
        <X size={16} color={COLORS.textMuted} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: SPACING.md,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    fontWeight: '500',
    lineHeight: 18,
  },
  dismissButton: {
    padding: 4,
  },
});

export default ImbalanceAlert;
