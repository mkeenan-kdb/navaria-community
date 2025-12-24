import React from 'react';
import {View, Image, ImageSourcePropType, ViewStyle} from 'react-native';
import {LucideIcon} from 'lucide-react-native';
import {useThemedStyles} from '@/hooks/useThemedStyles';
import {useTheme} from '@/components/shared/ThemeProvider';
import {sizes} from '@/theme';
import {ThemeColors} from '@/theme/colors';

type AvatarSize = keyof typeof sizes.avatar;

interface CircularAvatarProps {
  size?: AvatarSize;
  source?: ImageSourcePropType;
  icon?: LucideIcon;
  iconColor?: string;
  backgroundColor?: string;
  style?: ViewStyle;
}

const createStyles = (
  size: number,
  backgroundColor: string,
  colors: ThemeColors,
) => ({
  container: {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: backgroundColor || colors.surfaceElevated,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    overflow: 'hidden' as const,
  },
  image: {
    width: '100%' as const,
    height: '100%' as const,
  },
});

export const CircularAvatar: React.FC<CircularAvatarProps> = React.memo(
  ({size = 'md', source, icon: Icon, iconColor, backgroundColor, style}) => {
    const {colors} = useTheme();
    const sizeValue = sizes.avatar[size];
    const iconSize = sizeValue * 0.5;

    const styles = useThemedStyles(themeColors =>
      createStyles(sizeValue, backgroundColor || '', themeColors),
    );

    return (
      <View style={[styles.container, style]}>
        {source && (
          <Image source={source} style={styles.image} resizeMode="cover" />
        )}
        {Icon && !source && (
          <Icon size={iconSize} color={iconColor || colors.text.primary} />
        )}
      </View>
    );
  },
);

CircularAvatar.displayName = 'CircularAvatar';
