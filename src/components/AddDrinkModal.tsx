import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { X, Clock, Check } from 'lucide-react-native';
import { DRINKS, DRINK_KEYS } from '../constants/drinks';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../constants/theme';

interface AddDrinkModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (type: string, amount: number, time: number) => void;
  initialType?: string;
}

const COMMON_AMOUNTS = [100, 150, 200, 250, 330, 500];

const AddDrinkModal: React.FC<AddDrinkModalProps> = ({
  visible,
  onClose,
  onAdd,
  initialType = 'water',
}) => {
  const [selectedType, setSelectedType] = useState(initialType);
  const [selectedAmount, setSelectedAmount] = useState(250);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);

  const drink = DRINKS[selectedType];
  const accentColor = drink?.color || COLORS.primary;

  const handleTypeSelect = (type: string) => {
    setSelectedType(type);
    setSelectedAmount(DRINKS[type]?.amounts[0] || 250);
    Haptics.selectionAsync();
  };

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
    Haptics.selectionAsync();
  };

  const handleCustomAmountChange = (text: string) => {
    setCustomAmount(text);
    const parsed = parseInt(text);
    if (parsed > 0) {
      setSelectedAmount(parsed);
    }
  };

  const handleTimeChange = (_: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (date) {
      setSelectedTime(date);
    }
  };

  const handleAdd = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onAdd(selectedType, selectedAmount, selectedTime.getTime());
    // Reset for next use
    setSelectedTime(new Date());
    setCustomAmount('');
    onClose();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Reset state when modal opens
  React.useEffect(() => {
    if (visible) {
      setSelectedType(initialType);
      setSelectedAmount(DRINKS[initialType]?.amounts[0] || 250);
      setSelectedTime(new Date());
      setCustomAmount('');
      setShowTimePicker(false);
    }
  }, [visible, initialType]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Log a Drink</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={8}>
              <X size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Drink Type */}
            <Text style={styles.sectionLabel}>TYPE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeRow}>
              {DRINK_KEYS.map((key) => {
                const d = DRINKS[key];
                const Icon = d.icon;
                const isSelected = selectedType === key;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.typePill,
                      isSelected
                        ? { backgroundColor: d.color + '25', borderColor: d.color }
                        : { backgroundColor: COLORS.surface, borderColor: COLORS.cardBorder },
                    ]}
                    onPress={() => handleTypeSelect(key)}
                  >
                    <Icon size={18} color={isSelected ? d.color : COLORS.textMuted} />
                    <Text
                      style={[
                        styles.typeLabel,
                        { color: isSelected ? d.color : COLORS.textSecondary },
                      ]}
                    >
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Volume */}
            <Text style={styles.sectionLabel}>VOLUME</Text>
            <View style={styles.amountGrid}>
              {COMMON_AMOUNTS.map((amt) => (
                <TouchableOpacity
                  key={amt}
                  style={[
                    styles.amountPill,
                    selectedAmount === amt && !customAmount
                      ? { backgroundColor: accentColor + '25', borderColor: accentColor }
                      : { backgroundColor: COLORS.surface, borderColor: COLORS.cardBorder },
                  ]}
                  onPress={() => handleAmountSelect(amt)}
                >
                  <Text
                    style={[
                      styles.amountLabel,
                      {
                        color:
                          selectedAmount === amt && !customAmount
                            ? accentColor
                            : COLORS.textSecondary,
                      },
                    ]}
                  >
                    {amt}ml
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.customRow}>
              <TextInput
                style={[styles.customInput, { borderColor: customAmount ? accentColor : COLORS.cardBorder }]}
                placeholder="Custom ml"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
                value={customAmount}
                onChangeText={handleCustomAmountChange}
                maxLength={5}
              />
            </View>

            {/* Time */}
            <Text style={styles.sectionLabel}>TIME</Text>
            <TouchableOpacity
              style={styles.timeButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Clock size={18} color={COLORS.primary} />
              <Text style={styles.timeText}>{formatTime(selectedTime)}</Text>
              <Text style={styles.timeHint}>Tap to change</Text>
            </TouchableOpacity>

            {showTimePicker && (
              <DateTimePicker
                value={selectedTime}
                mode="time"
                is24Hour
                onChange={handleTimeChange}
                themeVariant="dark"
              />
            )}
          </ScrollView>

          {/* Log Button */}
          <TouchableOpacity
            style={[styles.logButton, { backgroundColor: accentColor }]}
            onPress={handleAdd}
          >
            <Check size={20} color={COLORS.white} />
            <Text style={styles.logButtonText}>
              Log {drink?.label} · {selectedAmount}ml
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xxxl,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.text,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  sectionLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: SPACING.sm,
    marginTop: SPACING.lg,
  },
  typeRow: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.round,
    borderWidth: 1.5,
    marginRight: SPACING.sm,
  },
  typeLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  amountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  amountPill: {
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
  },
  amountLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  customRow: {
    marginTop: SPACING.md,
  },
  customInput: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  timeText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  timeHint: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
  },
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.lg,
    marginTop: SPACING.xl,
  },
  logButtonText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.white,
  },
});

export default AddDrinkModal;
