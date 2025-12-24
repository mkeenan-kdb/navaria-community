import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import {X, Lock, BookOpen, ChevronRight} from 'lucide-react-native';
import {useTheme} from '@/components/shared';
import {typography, spacing, borderRadius} from '@/theme';
import type {UnlockStatus} from '@/types/content';

interface Props {
  visible: boolean;
  unlockStatus: UnlockStatus;
  onClose: () => void;
  onNavigateToLesson?: (lessonId: string) => void;
}

const {height: SCREEN_HEIGHT} = Dimensions.get('window');

export const UnlockRequirementsModal: React.FC<Props> = ({
  visible,
  unlockStatus,
  onClose,
  onNavigateToLesson,
}) => {
  const {colors} = useTheme();

  if (!visible) {
    return null;
  }

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContainer: {
      backgroundColor: colors.background,
      borderTopLeftRadius: borderRadius.xl,
      borderTopRightRadius: borderRadius.xl,
      height: SCREEN_HEIGHT * 0.6,
      padding: spacing.lg,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: -4},
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 10,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    title: {
      fontSize: typography.sizes.xl,
      fontWeight: 'bold',
      color: colors.text.primary,
    },
    closeButton: {
      padding: spacing.xs,
    },
    content: {
      flex: 1,
    },
    lockIconContainer: {
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    lockIconCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.surfaceSubtle,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    message: {
      fontSize: typography.sizes.base,
      color: colors.text.secondary,
      textAlign: 'center',
      marginBottom: spacing.xl,
    },
    sectionTitle: {
      fontSize: typography.sizes.base,
      fontWeight: 'bold',
      color: colors.text.primary,
      marginBottom: spacing.md,
    },
    requirementItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      padding: spacing.md,
      borderRadius: borderRadius.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    reqIcon: {
      marginRight: spacing.md,
    },
    reqInfo: {
      flex: 1,
    },
    reqTitle: {
      fontSize: typography.sizes.base,
      fontWeight: 'bold',
      color: colors.text.primary,
      marginBottom: 2,
    },
    reqDetail: {
      fontSize: typography.sizes.sm,
      color: colors.text.secondary,
    },
    reqAction: {
      padding: spacing.sm,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Lesson Locked</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}>
            <View style={styles.lockIconContainer}>
              <View style={styles.lockIconCircle}>
                <Lock size={40} color={colors.text.disabled} />
              </View>
              <Text style={styles.message}>
                {unlockStatus.reason ||
                  'Complete the prerequisites to unlock this lesson.'}
              </Text>
            </View>

            {unlockStatus.missingPrerequisites &&
              unlockStatus.missingPrerequisites.length > 0 && (
                <View>
                  <Text style={styles.sectionTitle}>Missing Requirements</Text>
                  {unlockStatus.missingPrerequisites.map((req, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.requirementItem}
                      onPress={() => {
                        onClose();
                        onNavigateToLesson?.(req.lessonId);
                      }}
                      disabled={!onNavigateToLesson}>
                      <View style={styles.reqIcon}>
                        <BookOpen size={24} color={colors.primary} />
                      </View>
                      <View style={styles.reqInfo}>
                        <Text style={styles.reqTitle}>{req.lessonTitle}</Text>
                        <Text style={styles.reqDetail}>
                          Completed: {req.currentCompletion}/
                          {req.requiredCompletion}
                        </Text>
                      </View>
                      {onNavigateToLesson && (
                        <View style={styles.reqAction}>
                          <ChevronRight
                            size={20}
                            color={colors.text.tertiary}
                          />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
