import React from 'react';
import {View, Text} from 'react-native';
import {CheckCircle} from 'lucide-react-native';
import {useTheme, Card} from '@/components/shared';
import {spacing, typography, borderRadius} from '@/theme';
import type {Achievement} from '@/types/user';
import {useThemedStyles} from '@/hooks/useThemedStyles';
import {createCommonStyles} from '@/theme/commonStyles';
import {getIconComponent} from '@/utils/iconMap';

interface AchievementCardProps {
  achievement: Achievement;
}

export const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
}) => {
  const {colors} = useTheme();
  const {title, description, icon, isUnlocked} = achievement;

  const styles = useThemedStyles(themeColors => {
    const common = createCommonStyles(themeColors);
    return {
      ...common,
      card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        marginBottom: spacing.sm,
      },
      iconContainer: {
        width: 56,
        height: 56,
        borderRadius: borderRadius.full,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
      },
      content: {
        flex: 1,
      },
      title: {
        fontSize: typography.sizes.lg,
        fontWeight: typography.weights.bold,
        marginBottom: 2,
      },
      description: {
        fontSize: typography.sizes.sm,
      },
      checkContainer: {
        marginLeft: spacing.sm,
      },
    };
  });

  const IconComponent = getIconComponent(icon);

  return (
    <Card
      gradientColors={
        !isUnlocked ? [colors.surfaceSubtle, colors.surfaceSubtle] : undefined
      }
      style={styles.card}>
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: isUnlocked
              ? colors.tiontuGold + '20'
              : colors.text.tertiary + '20',
          },
        ]}>
        <IconComponent
          size={32}
          color={isUnlocked ? colors.tiontuGold : colors.text.tertiary}
        />
      </View>
      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            {color: isUnlocked ? colors.text.primary : colors.text.tertiary},
          ]}>
          {title}
        </Text>
        <Text
          style={[
            styles.description,
            {color: isUnlocked ? colors.text.secondary : colors.text.tertiary},
          ]}>
          {description}
        </Text>
      </View>
      {isUnlocked && (
        <View style={styles.checkContainer}>
          <CheckCircle size={20} color={colors.success} />
        </View>
      )}
    </Card>
  );
};
