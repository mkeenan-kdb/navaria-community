import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ViewStyle,
  TextStyle,
} from 'react-native';
import {Copy, CheckSquare, Square} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import {useTheme, AppBar, Card} from '@/components/shared';
import {spacing, typography} from '@/theme';
import {processSeanchloText, convertForClipboard} from '@/utils/seanchlo';
import {useThemedStyles} from '@/hooks/useThemedStyles';
import {createCommonStyles} from '@/theme/commonStyles';

export const SeanchloTyperScreen: React.FC = () => {
  const {colors, fontFamily} = useTheme();
  const common = createCommonStyles(colors);
  const [inputText, setInputText] = useState('');
  const [copyInsular, setCopyInsular] = useState(false);

  const styles = useThemedStyles(themeColors => {
    return {
      // Removed ...common spread
      containerExtra: {
        backgroundColor: themeColors.background,
      } as ViewStyle,
      contentExtra: {
        padding: spacing.md,
        gap: spacing.md,
      } as ViewStyle,
      inputCardExtra: {
        padding: spacing.md,
      } as ViewStyle,
      outputCardExtra: {
        padding: spacing.md,
        minHeight: 200,
      } as ViewStyle,
      labelExtra: {
        marginBottom: spacing.xs,
        fontSize: typography.sizes.sm,
        fontWeight: typography.weights.medium,
        color: themeColors.text.secondary,
      } as TextStyle,
      inputExtra: {
        minHeight: 100,
        borderWidth: 1,
        borderRadius: spacing.sm,
        padding: spacing.sm,
        fontSize: typography.sizes.base,
        textAlignVertical: 'top',
        color: themeColors.text.primary,
        backgroundColor: themeColors.surfaceSubtle,
        borderColor: themeColors.border,
      } as TextStyle,
      outputHeaderExtra: {
        marginBottom: spacing.xs,
      } as ViewStyle,
      actionsExtra: {
        gap: spacing.sm,
      } as ViewStyle,
      iconButtonExtra: {
        padding: spacing.xs,
        borderRadius: spacing.sm,
      } as ViewStyle,
      outputContainerExtra: {
        padding: spacing.md,
        borderRadius: spacing.sm,
        minHeight: 150,
        backgroundColor: themeColors.surfaceSubtle,
      } as ViewStyle,
      outputTextExtra: {
        fontSize: typography.sizes['2xl'],
        textAlign: 'center',
        color: themeColors.text.primary,
      } as TextStyle,
      controlsExtra: {
        gap: spacing.md,
      } as ViewStyle,
      voiceControlExtra: {
        gap: spacing.xs,
      } as ViewStyle,
      controlLabelExtra: {
        fontSize: typography.sizes.sm,
        fontWeight: typography.weights.medium,
        color: themeColors.text.secondary,
      } as TextStyle,
      voiceChip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: 16,
        borderWidth: 1,
        marginRight: spacing.sm,
      },
      checkboxContainerExtra: {
        gap: spacing.sm,
      } as ViewStyle,
      checkboxLabelExtra: {
        fontSize: typography.sizes.base,
        color: themeColors.text.primary,
      } as TextStyle,
    };
  });

  const processedText = processSeanchloText(inputText);

  const handleCopy = async () => {
    if (!inputText) {
      return;
    }
    const textToCopy = copyInsular
      ? convertForClipboard(inputText)
      : processedText;

    await Clipboard.setStringAsync(textToCopy);
    // Could add a toast here
  };

  return (
    <View style={[common.flex1, styles.containerExtra]}>
      <AppBar
        title="Seanchló Typer"
        showBack={false}
        showMenu={true}
        showHome
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={common.flex1}>
        <ScrollView contentContainerStyle={styles.contentExtra}>
          <Card style={styles.inputCardExtra}>
            <Text style={styles.labelExtra}>Enter Text</Text>
            <TextInput
              style={styles.inputExtra}
              multiline
              placeholder="Dia dhaoibh, a chairde..."
              placeholderTextColor={colors.text.disabled}
              value={inputText}
              onChangeText={setInputText}
            />
          </Card>

          <Card style={styles.outputCardExtra}>
            <View style={[common.rowBetween, styles.outputHeaderExtra]}>
              <Text style={styles.labelExtra}>Seanchló Output</Text>
              <View style={[common.row, styles.actionsExtra]}>
                <TouchableOpacity
                  onPress={handleCopy}
                  disabled={!inputText}
                  style={[
                    styles.iconButtonExtra,
                    {backgroundColor: colors.secondary + '20'},
                  ]}>
                  <Copy size={20} color={colors.secondary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={[common.centered, styles.outputContainerExtra]}>
              <Text
                style={[
                  styles.outputTextExtra,
                  {
                    fontFamily: fontFamily,
                  },
                ]}>
                {processedText || ' '}
              </Text>
            </View>
          </Card>

          <View style={styles.controlsExtra}>
            <TouchableOpacity
              style={[common.row, styles.checkboxContainerExtra]}
              onPress={() => setCopyInsular(!copyInsular)}>
              {copyInsular ? (
                <CheckSquare size={24} color={colors.primary} />
              ) : (
                <Square size={24} color={colors.primary} />
              )}
              <Text style={styles.checkboxLabelExtra}>
                Copy Insular Characters
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};
