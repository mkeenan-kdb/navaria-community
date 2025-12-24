import React, {useState} from 'react';
import {Modal, View, Text, ScrollView, TouchableOpacity} from 'react-native';
import {X, Check, ChevronDown, ChevronRight} from 'lucide-react-native';
import {useTheme} from './ThemeProvider';
import {useUserStore} from '@/stores/userStore';
import {LANGUAGES} from '@/constants';
import {spacing, typography, borderRadius} from '@/theme';
import {useThemedStyles} from '@/hooks/useThemedStyles';
import {createCommonStyles} from '@/theme/commonStyles';

interface LanguageSelectionModalProps {
  visible: boolean;
  onClose: () => void;
}

// Define Irish dialects as a group
const IRISH_DIALECTS = [
  {id: 'irish_std', name: 'Standard', code: 'ga'},
  {id: 'irish_mun', name: 'Munster', code: 'ga-mun'},
  {id: 'irish_con', name: 'Connacht', code: 'ga-con'},
  {id: 'irish_ul', name: 'Ulster', code: 'ga-ul'},
];

// Other languages (non-Irish)
const OTHER_LANGUAGES = LANGUAGES.filter(lang => !lang.id.startsWith('irish_'));

export const LanguageSelectionModal: React.FC<LanguageSelectionModalProps> = ({
  visible,
  onClose,
}) => {
  const {colors} = useTheme();
  const {currentLanguageId, setLanguage} = useUserStore();
  const [irishExpanded, setIrishExpanded] = useState(() => {
    // Start expanded if an Irish dialect is selected
    return currentLanguageId?.startsWith('irish_') ?? false;
  });

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
      list: {
        padding: spacing.md,
      },
      item: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.sm,
        borderRadius: spacing.sm,
        marginBottom: spacing.xs,
      },
      itemName: {
        fontSize: typography.sizes.lg,
        color: themeColors.text.primary,
      },
      groupHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
      },
      dialectsContainer: {
        marginLeft: spacing.md,
        marginBottom: spacing.sm,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.sm,
        backgroundColor: themeColors.background,
        borderRadius: borderRadius.md,
        borderLeftWidth: 3,
        borderLeftColor: themeColors.primary,
      },
      subItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.sm,
        borderRadius: spacing.sm,
      },
      subItemName: {
        fontSize: typography.sizes.base,
        color: themeColors.text.primary,
      },
      separator: {
        height: 1,
        backgroundColor: themeColors.border,
        marginVertical: spacing.md,
        marginHorizontal: spacing.sm,
      },
    };
  });

  const handleSelect = async (id: string) => {
    await setLanguage(id);
    onClose();
  };

  const isIrishSelected = currentLanguageId?.startsWith('irish_');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Language</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.list}>
            {/* Irish Group - Expandable */}
            <TouchableOpacity
              style={[
                styles.item,
                {
                  backgroundColor: isIrishSelected
                    ? colors.primary + '10'
                    : 'transparent',
                },
              ]}
              onPress={() => setIrishExpanded(!irishExpanded)}>
              <View style={styles.groupHeader}>
                {irishExpanded ? (
                  <ChevronDown size={20} color={colors.text.secondary} />
                ) : (
                  <ChevronRight size={20} color={colors.text.secondary} />
                )}
                <Text
                  style={[
                    styles.itemName,
                    {
                      color: isIrishSelected
                        ? colors.primary
                        : colors.text.primary,
                      fontWeight: isIrishSelected
                        ? typography.weights.bold
                        : typography.weights.normal,
                    },
                  ]}>
                  Irish
                </Text>
              </View>
              {isIrishSelected && <Check size={24} color={colors.primary} />}
            </TouchableOpacity>

            {/* Irish Dialects - Shown when expanded */}
            {irishExpanded && (
              <View style={styles.dialectsContainer}>
                {IRISH_DIALECTS.map(dialect => (
                  <TouchableOpacity
                    key={dialect.id}
                    style={[
                      styles.subItem,
                      {
                        backgroundColor:
                          currentLanguageId === dialect.id
                            ? colors.primary + '20'
                            : 'transparent',
                      },
                    ]}
                    onPress={() => handleSelect(dialect.id)}>
                    <Text
                      style={[
                        styles.subItemName,
                        {
                          color:
                            currentLanguageId === dialect.id
                              ? colors.primary
                              : colors.text.primary,
                          fontWeight:
                            currentLanguageId === dialect.id
                              ? typography.weights.semibold
                              : typography.weights.normal,
                        },
                      ]}>
                      {dialect.name}
                    </Text>
                    {currentLanguageId === dialect.id && (
                      <Check size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Other Languages */}
            {OTHER_LANGUAGES.map(lang => (
              <TouchableOpacity
                key={lang.id}
                style={[
                  styles.item,
                  {
                    backgroundColor:
                      currentLanguageId === lang.id
                        ? colors.primary + '10'
                        : 'transparent',
                  },
                ]}
                onPress={() => handleSelect(lang.id)}>
                <View style={styles.groupHeader}>
                  <View style={{width: 20}} />
                  <Text
                    style={[
                      styles.itemName,
                      {
                        color:
                          currentLanguageId === lang.id
                            ? colors.primary
                            : colors.text.primary,
                        fontWeight:
                          currentLanguageId === lang.id
                            ? typography.weights.bold
                            : typography.weights.normal,
                      },
                    ]}>
                    {lang.name}
                  </Text>
                </View>
                {currentLanguageId === lang.id && (
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
