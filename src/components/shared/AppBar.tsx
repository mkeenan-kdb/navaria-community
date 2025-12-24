import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StatusBar} from 'react-native';
import {ArrowLeft, Menu, Home, Settings, X} from 'lucide-react-native';
import {useTheme} from './ThemeProvider';
import {AppBarSettingsMenu} from './AppBarSettingsMenu';
import {borderRadius, spacing, typography} from '@/theme';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation, DrawerActions} from '@react-navigation/native';
import {useThemedStyles} from '@/hooks/useThemedStyles';
import {createCommonStyles} from '@/theme/commonStyles';

interface AppBarProps {
  title?: string;
  showBack?: boolean;
  showMenu?: boolean;
  showHome?: boolean;
  showSettings?: boolean; // Now defaults to true
  showExerciseSettings?: boolean; // Show exercise-specific settings (animations, sound, etc.)
  showClose?: boolean;
  onBackPress?: () => void;
  onMenuPress?: () => void;
  onHomePress?: () => void;
  onSettingsPress?: () => void; // Optional custom handler
  onClosePress?: () => void;
  rightElement?: React.ReactNode;
  useCelticFont?: boolean;
  backgroundColor?: string;
  titleStyle?: object;
  style?: object;
}

export const AppBar: React.FC<AppBarProps> = ({
  title,
  showBack = false,
  showMenu = false,
  showHome = false,
  showSettings = true, // Now defaults to true
  showExerciseSettings = false,
  showClose = false,
  onBackPress,
  onMenuPress,
  onHomePress,
  onSettingsPress,
  onClosePress,
  rightElement,
  useCelticFont = false,
  backgroundColor,
  titleStyle,
  style,
}) => {
  const {colors, isDark} = useTheme();
  const common = createCommonStyles(colors);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  // Default to appBar color if no color provided
  const bgColor = backgroundColor || colors.appBar;

  // Use dark text in light mode, white text in dark mode
  const contentColor = isDark ? colors.white : colors.black;

  const styles = useThemedStyles(themeColors => {
    const common = createCommonStyles(themeColors);
    return {
      ...common,
      containerExtra: {
        zIndex: 1000,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.2,
        shadowRadius: 2,
        borderRadius: borderRadius['3xl'],
      },
      contentExtra: {
        paddingHorizontal: spacing.md,
      },
      leftElementExtra: {
        minWidth: 40,
        alignItems: 'flex-start',
      },
      // titleContainer removed (use common.flex1 + common.centered)
      rightElementExtra: {
        minWidth: 40,
        justifyContent: 'flex-end',
        gap: spacing.sm,
      },
      iconButtonExtra: {
        padding: spacing.xs,
        borderRadius: spacing.sm, // Add standard radius if missing?
      },
      title: {
        fontSize: typography.sizes['2xl'],
        fontFamily: typography.fonts.celtic,
        fontWeight: typography.weights.bold,
        textAlign: 'center',
      },
      celticTitle: {
        fontFamily: typography.fonts.celtic,
        fontSize: typography.sizes['2xl'],
      },
    };
  });

  return (
    <>
      {/* Set status bar style based on theme */}
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      {/* Safe area spacer - fills the status bar area */}
      <View style={{height: insets.top, backgroundColor: 'transparent'}} />
      <View
        style={[
          styles.containerExtra,
          {
            backgroundColor: bgColor,
            marginHorizontal: spacing.sm,
            marginTop: spacing.xs,
            height: 56, // Fixed height without status bar
          },
          style,
        ]}>
        <View style={[common.rowBetween, common.flex1, styles.contentExtra]}>
          {/* Left Element (Back, Menu, or Close) */}
          <View style={styles.leftElementExtra}>
            {showBack ? (
              <TouchableOpacity
                onPress={onBackPress || (() => navigation.goBack())}
                style={styles.iconButtonExtra}>
                <ArrowLeft size={24} color={contentColor} />
              </TouchableOpacity>
            ) : showClose ? (
              <TouchableOpacity
                onPress={onClosePress || (() => navigation.goBack())}
                style={styles.iconButtonExtra}>
                <X size={24} color={contentColor} />
              </TouchableOpacity>
            ) : showMenu ? (
              <TouchableOpacity
                onPress={
                  onMenuPress ||
                  (() => navigation.dispatch(DrawerActions.openDrawer()))
                }
                style={styles.iconButtonExtra}>
                <Menu size={24} color={contentColor} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Title */}
          <View style={[common.flex1, common.centered]}>
            <Text
              style={[
                styles.title,
                useCelticFont && styles.celticTitle,
                {color: contentColor},
                titleStyle,
              ]}
              numberOfLines={1}>
              {title}
            </Text>
          </View>

          {/* Right Element (Home, Settings, or Custom) */}
          <View style={[common.row, styles.rightElementExtra]}>
            {rightElement}
            {showHome && (
              <TouchableOpacity
                onPress={
                  onHomePress || (() => navigation.navigate('Home' as never))
                }
                style={styles.iconButtonExtra}>
                <Home size={24} color={contentColor} />
              </TouchableOpacity>
            )}
            {showSettings && (
              <TouchableOpacity
                onPress={onSettingsPress || (() => setShowSettingsMenu(true))}
                style={styles.iconButtonExtra}>
                <Settings size={24} color={contentColor} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
      {/* Built-in Settings Menu */}
      <AppBarSettingsMenu
        visible={showSettingsMenu}
        onClose={() => setShowSettingsMenu(false)}
        showExerciseSettings={showExerciseSettings}
      />
    </>
  );
};
