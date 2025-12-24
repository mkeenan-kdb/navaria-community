import React, {useState, useRef} from 'react';
import {View, Text, TouchableOpacity, ViewStyle, TextStyle} from 'react-native';
import {useTheme} from '@/components/shared';
import {spacing, typography, borderRadius, opacity} from '@/theme';
import {hapticSelection} from '@/services/haptics';
import {useThemedStyles} from '@/hooks/useThemedStyles';
import {createCommonStyles} from '@/theme/commonStyles';
import {ThemeColors} from '@/theme/colors';

interface IrishKeyboardProps {
  onLetterPress: (letter: string) => void;
  onBackspace?: () => void;
  disabled?: boolean;
}

const FADA_MAP: Record<string, string> = {
  a: 'á',
  A: 'Á',
  e: 'é',
  E: 'É',
  i: 'í',
  I: 'Í',
  o: 'ó',
  O: 'Ó',
  u: 'ú',
  U: 'Ú',
};

const KEYBOARD_ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
];

const SPECIAL_CHARS = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['.', ',', '?', '!', '-', "'", '"', ':', ';'],
  ['ḃ', 'ċ', 'ḋ', 'ḟ', 'ġ', 'ṁ', 'ṗ', 'ṡ', 'ṫ'],
];

// Move styles creation outside component for performance
const createKeyboardStyles = (themeColors: ThemeColors) => {
  const common = createCommonStyles(themeColors);
  return {
    ...common,
    container: {
      borderTopWidth: 2,
      paddingBottom: spacing.md,
      shadowColor: themeColors.black,
      shadowOffset: {width: 0, height: -1},
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 3,
      backgroundColor: themeColors.background,
      borderTopColor: themeColors.border,
    } as ViewStyle,
    keyboardWrapper: {
      maxWidth: 800,
      width: '100%',
      alignSelf: 'center',
      paddingHorizontal: spacing.xs,
      paddingTop: spacing.sm,
    } as ViewStyle,
    row: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.xs,
    } as ViewStyle,
    rowSpacer: {
      width: 20,
    } as ViewStyle,
    spacer: {
      width: 4,
    } as ViewStyle,
    key: {
      minWidth: 36,
      height: 48,
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: 3,
      borderRadius: borderRadius.sm,
      borderWidth: 1,
      shadowColor: themeColors.black,
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.08,
      shadowRadius: 1,
      elevation: 1,
    } as ViewStyle,
    keyText: {
      fontSize: typography.sizes['2xl'],
      fontWeight: typography.weights.semibold,
      fontFamily: 'MeathFLF',
    } as TextStyle,
    modifierKey: {
      minWidth: 56,
      height: 48,
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: 3,
      borderRadius: borderRadius.sm,
      borderWidth: 1,
      borderColor: 'transparent',
      shadowColor: themeColors.black,
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.08,
      shadowRadius: 1,
      elevation: 1,
    } as ViewStyle,
    shiftKey: {
      minWidth: 60,
    } as ViewStyle,
    backspaceKey: {
      minWidth: 60,
    } as ViewStyle,
    modifierKeyText: {
      fontSize: typography.sizes.xl,
      fontWeight: typography.weights.bold,
    } as TextStyle,
    keyDisabled: {
      opacity: opacity.disabled,
    } as ViewStyle,
    bottomRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: spacing.xs,
    } as ViewStyle,
    specialToggle: {
      minWidth: 70,
    } as ViewStyle,
    fadaKey: {
      minWidth: 70,
      marginLeft: spacing.xs,
    } as ViewStyle,
    spaceKey: {
      flex: 1,
      height: 48,
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: spacing.xs,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: 'transparent',
      shadowColor: themeColors.black,
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.15,
      shadowRadius: 2,
      elevation: 2,
    } as ViewStyle,
    spaceBar: {
      width: 80,
      height: 4,
      borderRadius: 2,
    } as ViewStyle,
  };
};

const IrishKeyboardComponent: React.FC<IrishKeyboardProps> = ({
  onLetterPress,
  onBackspace,
  disabled = false,
}) => {
  const {colors} = useTheme();
  const [shiftActive, setShiftActive] = useState(false);
  const [fadaMode, setFadaMode] = useState(false);
  const [specialMode, setSpecialMode] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const longPressKey = useRef<string | null>(null);

  // Use stable reference to styles callback for performance
  const styles = useThemedStyles(createKeyboardStyles);

  const handleKeyPress = (key: string) => {
    if (disabled) {
      return;
    }

    hapticSelection();
    let charToSend = key;

    // Apply shift
    if (shiftActive) {
      charToSend = key.toUpperCase();
      setShiftActive(false); // Auto-disable shift after one key
    }

    // Apply fada if mode is active and key is a vowel
    if (fadaMode && FADA_MAP[charToSend]) {
      charToSend = FADA_MAP[charToSend];
      setFadaMode(false); // Auto-disable after one key
    }

    onLetterPress(charToSend);
  };

  const handleSpace = () => {
    if (disabled) {
      return;
    }
    hapticSelection();
    onLetterPress(' ');
  };

  const handleShift = () => {
    hapticSelection();
    setShiftActive(!shiftActive);
  };

  const handleFada = () => {
    hapticSelection();
    setFadaMode(!fadaMode);
  };

  const handleSpecialToggle = () => {
    hapticSelection();
    setSpecialMode(!specialMode);
  };

  const handleBackspace = () => {
    if (disabled || !onBackspace) {
      return;
    }
    hapticSelection();
    onBackspace();
  };

  const handleLongPressStart = (key: string) => {
    if (disabled) {
      return;
    }
    longPressKey.current = key;
    longPressTimer.current = setTimeout(() => {
      // Show fada if it's a vowel
      const char = shiftActive ? key.toUpperCase() : key;
      if (FADA_MAP[char]) {
        hapticSelection();
        onLetterPress(FADA_MAP[char]);
        setShiftActive(false);
        longPressTimer.current = null;
        longPressKey.current = null;
      }
    }, 350); // Reduced from 500ms for better responsiveness
  };

  const handleLongPressEnd = (key: string) => {
    if (longPressTimer.current && longPressKey.current === key) {
      // Regular press - timer didn't fire
      clearTimeout(longPressTimer.current);
      handleKeyPress(key);
    }
    longPressTimer.current = null;
    longPressKey.current = null;
  };

  const renderKey = (key: string) => {
    const isVowel = ['a', 'e', 'i', 'o', 'u'].includes(key.toLowerCase());
    const showFadaHint = fadaMode && isVowel;
    const displayKey = shiftActive ? key.toUpperCase() : key;
    const fadaChar = FADA_MAP[displayKey];

    return (
      <TouchableOpacity
        key={key}
        onPressIn={() => handleLongPressStart(key)}
        onPressOut={() => handleLongPressEnd(key)}
        onLongPress={() => {}} // Handled by timer
        delayLongPress={350}
        disabled={disabled}
        accessibilityRole="keyboardkey"
        accessibilityLabel={key}
        accessibilityState={{disabled}}
        style={[
          styles.key,
          showFadaHint && {
            backgroundColor: colors.tiontuGold + '40',
            borderColor: colors.tiontuGold,
          },
          disabled && styles.keyDisabled,
          {
            backgroundColor: showFadaHint
              ? colors.tiontuGold + '40'
              : colors.surface,
            borderColor: showFadaHint ? colors.tiontuGold : colors.border,
          },
        ]}
        activeOpacity={opacity.pressed}>
        <Text
          style={[
            styles.keyText,
            {color: disabled ? colors.text.tertiary : colors.text.primary},
          ]}>
          {showFadaHint && fadaChar ? fadaChar : displayKey}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderModifierKey = (
    label: string,
    onPress: () => void,
    isActive: boolean,
    modifierStyle?: {activeColor?: string; style?: ViewStyle},
  ) => {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="keyboardkey"
        accessibilityLabel={label}
        accessibilityState={{disabled, selected: isActive}}
        style={[
          styles.modifierKey,
          isActive && {
            backgroundColor: modifierStyle?.activeColor || colors.tiontuRed,
          },
          disabled && styles.keyDisabled,
          !isActive && {backgroundColor: colors.surface},
          modifierStyle?.style,
        ]}
        activeOpacity={opacity.pressed}>
        <Text
          style={[
            styles.modifierKeyText,
            {color: isActive ? colors.white : colors.text.primary},
            disabled && {color: colors.text.tertiary},
          ]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const rows = specialMode ? SPECIAL_CHARS : KEYBOARD_ROWS;

  return (
    <View style={styles.container}>
      <View style={styles.keyboardWrapper}>
        {/* Keyboard rows */}
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {/* Shift key on third row (letters mode only) */}
            {rowIndex === 2 && !specialMode && (
              <>
                {renderModifierKey('⇧', handleShift, shiftActive, {
                  style: styles.shiftKey,
                })}
                <View style={styles.spacer} />
              </>
            )}

            {/* Spacer for middle row alignment */}
            {rowIndex === 1 && <View style={styles.rowSpacer} />}

            {/* Letter/special keys */}
            {row.map(key => renderKey(key))}

            {/* Spacer for middle row alignment */}
            {rowIndex === 1 && <View style={styles.rowSpacer} />}

            {/* Backspace on third row (letters mode only) */}
            {rowIndex === 2 && !specialMode && (
              <>
                <View style={styles.spacer} />
                <TouchableOpacity
                  onPress={handleBackspace}
                  disabled={!onBackspace || disabled}
                  accessibilityRole="keyboardkey"
                  accessibilityLabel="Backspace"
                  accessibilityState={{disabled: !onBackspace || disabled}}
                  style={[
                    styles.modifierKey,
                    styles.backspaceKey,
                    {backgroundColor: colors.surface},
                    (!onBackspace || disabled) && styles.keyDisabled,
                  ]}
                  activeOpacity={opacity.pressed}>
                  <Text
                    style={[
                      styles.modifierKeyText,
                      {
                        color:
                          !onBackspace || disabled
                            ? colors.text.tertiary
                            : colors.text.primary,
                      },
                    ]}>
                    ⌫
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        ))}

        {/* Bottom row with special keys */}
        <View style={styles.bottomRow}>
          {renderModifierKey(
            specialMode ? 'ABC' : '?123',
            handleSpecialToggle,
            false,
            {style: styles.specialToggle},
          )}
          {renderModifierKey('Fada', handleFada, fadaMode, {
            activeColor: colors.tiontuGold,
            style: styles.fadaKey,
          })}
          <TouchableOpacity
            onPress={handleSpace}
            disabled={disabled}
            accessibilityRole="keyboardkey"
            accessibilityLabel="Space"
            accessibilityState={{disabled}}
            style={[
              styles.spaceKey,
              {backgroundColor: colors.surface},
              disabled && styles.keyDisabled,
            ]}
            activeOpacity={opacity.pressed}>
            <View
              style={[styles.spaceBar, {backgroundColor: colors.text.tertiary}]}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// Memoize keyboard to prevent re-renders on parent updates
export const IrishKeyboard = React.memo(IrishKeyboardComponent);
