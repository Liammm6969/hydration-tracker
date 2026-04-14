import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { X, Check } from 'lucide-react-native';
import { DRINKS, DRINK_KEYS } from '../constants/drinks';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../constants/theme';
import type { QuickLogItem } from '../storage/settingsStorage';

interface EditQuickLogModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (item: QuickLogItem) => void;
  item: QuickLogItem | null;
  index: number;
}

const COMMON_AMOUNTS = [100, 150, 200, 250, 330, 500];

const EditQuickLogModal: React.FC<EditQuickLogModalProps> = ({
  visible,
  onClose,
  onSave,
  item,
  index,
}) => {
  const [selectedType, setSelectedType] = useState(item?.drinkType || 'water');
  const [selectedAmount, setSelectedAmount] = useState(item?.amount || 250);
  const [customAmount, setCustomAmount] = useState('');

  const drink = DRINKS[selectedType];
  const accentColor = drink?.color || COLORS.primary;

  useEffect(() => {
    if (visible && item) {
      setSelectedType(item.drinkType);
      setSelectedAmount(item.amount);
      setCustomAmount('');
    }
  }, [visible, item]);

  const handleTypeSelect = (type: string) => {
    setSelectedType(type);
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

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSave({ drinkType: selectedType, amount: selectedAmount });
    onClose();
  };

  const Icon = drink?.icon;

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
            <Text style={styles.title}>Edit Quick Log #{index + 1}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={8}>
              <X size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Preview */}
          <View style={[styles.previewCard, { backgroundColor: accentColor + '12', borderColor: accentColor + '30' }]}>
            <View style={[styles.previewIconWrap, { backgroundColor: accentColor + '25' }]}>
              {Icon && <Icon size={28} color={accentColor} />}
            </View>
            <View style={styles.previewInfo}>
              <Text style={styles.previewLabel}>{drink?.label || selectedType}</Text>
              <Text style={[styles.previewAmount, { color: accentColor }]}>+{selectedAmount}ml</Text>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Drink Type */}
            <Text style={styles.sectionLabel}>DRINK TYPE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeRow}>
              {DRINK_KEYS.map((key) => {
                const d = DRINKS[key];
                const TypeIcon = d.icon;
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
                    <TypeIcon size={18} color={isSelected ? d.color : COLORS.textMuted} />
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
          </ScrollView>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: accentColor }]}
            onPress={handleSave}
          >
            <Check size={20} color={COLORS.white} />
            <Text style={styles.saveButtonText}>
              Save · {drink?.label} {selectedAmount}ml
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
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.text,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  previewIconWrap: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewInfo: {
    flex: 1,
  },
  previewLabel: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  previewAmount: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
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
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.lg,
    marginTop: SPACING.xl,
  },
  saveButtonText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.white,
  },
});

export default EditQuickLogModal;
