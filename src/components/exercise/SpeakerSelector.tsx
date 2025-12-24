import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleProp,
  ViewStyle,
} from 'react-native';
import {useTheme, CircularAvatar} from '@/components/shared';
import {useThemedStyles} from '@/hooks/useThemedStyles';
import {ChevronDown, X, CheckCircle} from 'lucide-react-native';
import {
  spacing,
  borderRadius,
  typography,
  opacity,
  withOpacity,
  useResponsive,
} from '@/theme';

interface Speaker {
  id: string;
  name: string;
  profilePictureUrl?: string | null;
}

interface SpeakerSelectorProps {
  speakers: Speaker[];
  selectedSpeakerId: string | null;
  onSelectSpeaker: (speakerId: string) => void;
  style?: StyleProp<ViewStyle>;
}

export const SpeakerSelector: React.FC<SpeakerSelectorProps> = React.memo(
  ({speakers, selectedSpeakerId, onSelectSpeaker, style}) => {
    const {colors} = useTheme();
    const [modalVisible, setModalVisible] = useState(false);

    // Derive selected speaker object
    const selectedSpeaker =
      speakers.find(s => s.id === selectedSpeakerId) || speakers[0];

    const {isDesktop, isTablet} = useResponsive();
    const styles = useThemedStyles(themeColors => ({
      container: {
        flexDirection: 'row',
        alignItems: 'center',
      },
      triggerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.xs,
        paddingRight: spacing.sm,
        backgroundColor: themeColors.surfaceElevated,
        borderRadius: borderRadius.full,
        borderWidth: 1,
        borderColor: themeColors.border,
        gap: spacing.xs,
      },
      triggerText: {
        fontSize: typography.sizes.xs,
        fontWeight: typography.weights.medium,
        color: themeColors.text.primary,
      },
      modalOverlay: {
        flex: 1,
        backgroundColor: withOpacity('#000000', opacity.overlay),
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
      },
      modalContent: {
        width: '100%',
        maxWidth: isDesktop ? 600 : isTablet ? 500 : 320,
        backgroundColor: themeColors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
      },
      modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
        paddingBottom: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: themeColors.border,
      },
      modalTitle: {
        fontSize: typography.sizes.lg,
        fontWeight: typography.weights.bold,
        color: themeColors.text.primary,
      },
      speakerList: {
        maxHeight: 300,
      },
      speakerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.sm,
        borderRadius: borderRadius.md,
        marginBottom: spacing.xs,
        gap: spacing.md,
      },
      speakerItemActive: {
        backgroundColor: themeColors.surfaceElevated,
        borderWidth: 1,
        borderColor: themeColors.primary,
      },
      speakerInfo: {
        flex: 1,
      },
      speakerName: {
        fontSize: typography.sizes.base,
        fontWeight: typography.weights.medium,
        color: themeColors.text.primary,
      },
      checkIcon: {
        marginLeft: spacing.sm,
      },
    }));

    if (!speakers || speakers.length === 0) {
      return null;
    }

    const getAvatarSource = (speakerName: string, url?: string | null) => {
      return {
        uri: url || `https://ui-avatars.com/api/?name=${speakerName}`,
      };
    };

    return (
      <>
        <TouchableOpacity
          style={[styles.triggerButton, style]}
          onPress={() => setModalVisible(true)}
          activeOpacity={opacity.hover}>
          <CircularAvatar
            size="xs"
            source={getAvatarSource(
              selectedSpeaker?.name || 'Speaker',
              selectedSpeaker?.profilePictureUrl,
            )}
          />
          <Text style={styles.triggerText}>
            {selectedSpeaker?.name || 'Select Speaker'}
          </Text>
          <ChevronDown size={16} color={colors.text.secondary} />
        </TouchableOpacity>

        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}>
            <View
              style={styles.modalContent}
              onStartShouldSetResponder={() => true}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Speaker</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <X size={24} color={colors.text.secondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.speakerList}>
                {speakers.map(speaker => (
                  <TouchableOpacity
                    key={speaker.id}
                    style={[
                      styles.speakerItem,
                      selectedSpeakerId === speaker.id &&
                        styles.speakerItemActive,
                    ]}
                    onPress={() => {
                      onSelectSpeaker(speaker.id);
                      setModalVisible(false);
                    }}
                    activeOpacity={opacity.pressed}>
                    <CircularAvatar
                      size="md"
                      source={getAvatarSource(
                        speaker.name,
                        speaker.profilePictureUrl,
                      )}
                    />
                    <View style={styles.speakerInfo}>
                      <Text style={styles.speakerName}>{speaker.name}</Text>
                    </View>
                    {selectedSpeakerId === speaker.id && (
                      <CheckCircle
                        size={20}
                        color={colors.primary}
                        style={styles.checkIcon}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      </>
    );
  },
);

SpeakerSelector.displayName = 'SpeakerSelector';
