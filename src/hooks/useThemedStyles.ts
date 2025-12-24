import {useMemo} from 'react';
import {StyleSheet, ViewStyle, TextStyle, ImageStyle} from 'react-native';
import {useTheme} from '@/components/shared/ThemeProvider';
import {colors as themeColorsObj, ThemeColors} from '@/theme/colors';

type NamedStyles<T> = {[P in keyof T]: ViewStyle | TextStyle | ImageStyle};
type AppColors = ThemeColors & typeof themeColorsObj;

export const useThemedStyles = <T extends NamedStyles<T>>(
  stylesCallback: (colors: AppColors) => T,
) => {
  const {colors} = useTheme();

  return useMemo(() => {
    return StyleSheet.create(stylesCallback(colors));
  }, [colors, stylesCallback]);
};
