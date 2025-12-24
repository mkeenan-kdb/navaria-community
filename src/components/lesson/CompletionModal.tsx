import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import {Card, Button, useTheme} from '@/components/shared';
import {spacing, typography, borderRadius} from '@/theme';
import {useThemedStyles} from '@/hooks/useThemedStyles';

interface CompletionModalProps {
  visible: boolean;
  xpEarned: number;

  // NEW: Stats props
  accuracy?: number; // 0-100
  mistakes?: number;
  timeSpentSeconds?: number;
  perfectBonus?: boolean;
  noHintsBonus?: boolean;

  onContinue: () => void;
  onReturnToCourse: () => void;
}

// Helper function to format time
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  if (mins === 0) {
    return `${secs} s`;
  }
  return `${mins}m ${secs} s`;
};

const createStyles = (colors: any) => ({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  } as ViewStyle,
  modal: {
    width: '100%',
    maxWidth: 400,
    padding: spacing.xl,
    alignItems: 'center',
  } as ViewStyle,
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    backgroundColor: colors.success + '20',
  } as ViewStyle,
  icon: {
    fontSize: 48,
    color: colors.success,
  } as TextStyle,
  title: {
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    marginBottom: spacing.lg,
    textAlign: 'center',
    color: colors.text.primary,
    fontFamily: typography.fonts.celtic,
  } as TextStyle,
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    marginBottom: spacing.lg,
    width: '100%',
  } as ViewStyle,
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.lg,
    width: '100%',
  } as ViewStyle,
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  } as ViewStyle,
  statItem: {
    alignItems: 'center',
  } as ViewStyle,
  statValue: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xs,
  } as TextStyle,
  statLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    textAlign: 'center',
  } as TextStyle,
  bonusContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    flexWrap: 'wrap',
    justifyContent: 'center',
  } as ViewStyle,
  bonusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.tiontuGold + '20',
  } as ViewStyle,
  bonusText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.tiontuGold,
  } as TextStyle,
  actions: {
    width: '100%',
    gap: spacing.sm,
    alignItems: 'center',
  } as ViewStyle,
  button: {
    width: '100%',
  } as ViewStyle,
});

export const CompletionModal: React.FC<CompletionModalProps> = React.memo(
  ({
    visible,
    xpEarned,
    accuracy,
    timeSpentSeconds,
    perfectBonus,
    noHintsBonus,
    onContinue,
    onReturnToCourse,
  }) => {
    const styles = useThemedStyles(createStyles);
    const {colors} = useTheme();

    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onReturnToCourse}>
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={onReturnToCourse}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={e => e.stopPropagation()}>
            <Card style={styles.modal} celticBorder>
              {/* Success Icon */}
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>✓</Text>
              </View>

              {/* Title */}
              <Text style={styles.title}>Exercise Complete!</Text>

              {/* NEW: Stats Grid */}
              <View style={styles.statsGrid}>
                {/* XP */}
                <View style={styles.statCard}>
                  <Text style={[styles.statValue, {color: colors.tiontuGold}]}>
                    +{xpEarned}
                  </Text>
                  <Text style={styles.statLabel}>XP Earned</Text>
                </View>

                {/* Accuracy */}
                {accuracy !== undefined && (
                  <View style={styles.statCard}>
                    <Text
                      style={[
                        styles.statValue,
                        {
                          color:
                            accuracy >= 90
                              ? colors.success
                              : accuracy >= 70
                                ? colors.warning
                                : colors.error,
                        },
                      ]}>
                      {Math.round(accuracy)}%
                    </Text>
                    <Text style={styles.statLabel}>Accuracy</Text>
                  </View>
                )}

                {/* Time */}
                {timeSpentSeconds !== undefined && (
                  <View style={styles.statCard}>
                    <Text style={[styles.statValue, {color: colors.accent}]}>
                      {formatTime(timeSpentSeconds)}
                    </Text>
                    <Text style={styles.statLabel}>Time</Text>
                  </View>
                )}
              </View>

              {/* Bonus Chips */}
              {(perfectBonus || noHintsBonus) && (
                <View style={styles.bonusContainer}>
                  {perfectBonus && (
                    <View style={styles.bonusChip}>
                      <Text style={styles.bonusText}>🎯 Perfect!</Text>
                    </View>
                  )}
                  {noHintsBonus && (
                    <View style={styles.bonusChip}>
                      <Text style={styles.bonusText}>💡 No Hints</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Actions */}
              <View style={styles.actions}>
                <Button
                  title="Continue Learning"
                  onPress={onContinue}
                  style={styles.button}
                />
                <Button
                  title="Return to Course"
                  onPress={onReturnToCourse}
                  variant="outline"
                  style={styles.button}
                />
              </View>
            </Card>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    );
  },
);
