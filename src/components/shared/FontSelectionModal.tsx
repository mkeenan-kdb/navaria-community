import React from 'react';
import {Modal, View, Text, ScrollView, TouchableOpacity} from 'react-native';
import {X, Check} from 'lucide-react-native';
import {useTheme} from './ThemeProvider';
import {useFontStore} from '@/stores/fontStore';
import {useUserStore} from '@/stores/userStore';
import {spacing, typography} from '@/theme';
import {useThemedStyles} from '@/hooks/useThemedStyles';
import {createCommonStyles} from '@/theme/commonStyles';

interface FontSelectionModalProps {
  visible: boolean;
  onClose: () => void;
}

export const FontSelectionModal: React.FC<FontSelectionModalProps> = ({
  visible,
  onClose,
}) => {
  const {colors} = useTheme();
  const {currentFont, setFont, getFontsForLanguage} = useFontStore();
  const {currentLanguageId} = useUserStore();

  const availableFonts = getFontsForLanguage(currentLanguageId);

  const styles = useThemedStyles(themeColors => {
    const common = createCommonStyles(themeColors);
    return {
      ...common,
      modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
      },
      modalContent: {
        borderTopLeftRadius: spacing.lg,
        borderTopRightRadius: spacing.lg,
        maxHeight: '70%',
        backgroundColor: themeColors.surface,
      },
      modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: themeColors.border,
      },
      modalTitle: {
        fontSize: typography.sizes.xl,
        fontWeight: typography.weights.bold,
        color: themeColors.text.primary,
      },
      fontList: {
        padding: spacing.md,
      },
      fontItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.sm,
        borderRadius: spacing.sm,
        marginBottom: spacing.xs,
      },
      fontName: {
        fontSize: typography.sizes.lg,
      },
    };
  });

  const handleFontSelect = (family: string) => {
    setFont(family);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Font</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.fontList}>
            {Object.entries(availableFonts).map(([name, family]) => (
              <TouchableOpacity
                key={name}
                style={[
                  styles.fontItem,
                  {
                    backgroundColor:
                      currentFont === family
                        ? colors.primary + '10'
                        : 'transparent',
                  },
                ]}
                onPress={() => handleFontSelect(family)}>
                <Text
                  style={[
                    styles.fontName,
                    {
                      color:
                        currentFont === family
                          ? colors.primary
                          : colors.text.primary,
                      fontFamily: family,
                      fontSize: typography.sizes.lg,
                    },
                  ]}>
                  {name}
                </Text>
                {currentFont === family && (
                  <Check size={24} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
