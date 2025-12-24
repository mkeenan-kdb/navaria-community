import React from 'react';
import {Modal, View, Text, TouchableOpacity, Switch} from 'react-native';
import type {LucideIcon} from 'lucide-react-native';
import {useTheme} from './ThemeProvider';
import {spacing, typography, opacity, sizes} from '@/theme';
import {useThemedStyles} from '@/hooks/useThemedStyles';
import {createCommonStyles} from '@/theme/commonStyles';

interface SettingsMenuItemProps {
  label: string;
  icon?: LucideIcon;
  onPress?: () => void;
  value?: boolean | string;
  type?: 'button' | 'toggle';
  disabled?: boolean;
}

export const SettingsMenuItem: React.FC<SettingsMenuItemProps> = React.memo(
  ({label, icon: Icon, onPress, value, type = 'button', disabled = false}) => {
    const {colors} = useTheme();

    const styles = useThemedStyles(themeColors => {
      const common = createCommonStyles(themeColors);
      return {
        ...common,
        menuItem: {
          flexDirection: 'row',
          alignItems: 'center',
          padding: spacing.md,
          gap: spacing.sm,
          borderBottomColor: themeColors.border,
        },
        menuText: {
          fontSize: typography.sizes.base,
          fontWeight: typography.weights.medium,
          color: themeColors.text.primary,
          flex: 1,
        },
        valueText: {
          fontSize: typography.sizes.sm,
          color: themeColors.text.secondary,
          maxWidth: 120,
        },
      };
    });

    return (
      <TouchableOpacity
        style={[styles.menuItem, disabled && {opacity: opacity.disabled}]}
        onPress={type === 'toggle' ? onPress : onPress}
        disabled={disabled}
        activeOpacity={type === 'toggle' ? 1 : opacity.pressed}>
        {Icon && <Icon size={sizes.icon.sm} color={colors.text.primary} />}
        <Text style={styles.menuText}>{label}</Text>
        {typeof value === 'string' && (
          <Text style={styles.valueText} numberOfLines={1} ellipsizeMode="tail">
            {value}
          </Text>
        )}
        {type === 'toggle' && (
          <Switch
            value={value as boolean}
            onValueChange={onPress}
            trackColor={{false: colors.border, true: colors.primary}}
            thumbColor={'#FFFFFF'}
          />
        )}
      </TouchableOpacity>
    );
  },
);

interface SettingsMenuModalProps {
  visible: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  title?: string;
}

export const SettingsMenuModal: React.FC<SettingsMenuModalProps> = React.memo(
  ({visible, onClose, children, title}) => {
    const styles = useThemedStyles(themeColors => {
      const common = createCommonStyles(themeColors);
      return {
        ...common,
        overlay: {
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.3)',
          justifyContent: 'flex-start',
          alignItems: 'flex-end',
          paddingTop: 60, // Below AppBar
          paddingRight: spacing.md,
        },
        menu: {
          borderRadius: spacing.sm,
          minWidth: 260,
          maxWidth: 300,
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 2},
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 5,
          overflow: 'hidden',
          backgroundColor: themeColors.surface,
        },
        header: {
          padding: spacing.sm,
          paddingHorizontal: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: themeColors.border,
        },
        headerText: {
          fontSize: typography.sizes.xs,
          fontWeight: typography.weights.bold,
          textTransform: 'uppercase',
          color: themeColors.text.secondary,
        },
      };
    });

    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}>
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={onClose}>
          <View style={styles.menu}>
            {title && (
              <View style={styles.header}>
                <Text style={styles.headerText}>{title}</Text>
              </View>
            )}
            {children}
          </View>
        </TouchableOpacity>
      </Modal>
    );
  },
);
