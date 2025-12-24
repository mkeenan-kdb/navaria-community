import React from 'react';
import {View, Text, ViewStyle, TextStyle} from 'react-native';
import {Card, useTheme} from '@/components/shared';
import {spacing, typography} from '@/theme';
import type {UserProfile, UserLanguageStats} from '@/types/user';
import {useThemedStyles} from '@/hooks/useThemedStyles';
import {createCommonStyles} from '@/theme/commonStyles';

interface UserStatsCardProps {
  profile: UserProfile;
  languageStats: UserLanguageStats | null;
}

import {LANGUAGES} from '@/constants';

export const UserStatsCard: React.FC<UserStatsCardProps> = ({
  profile,
  languageStats,
}) => {
  const {colors} = useTheme();
  const common = createCommonStyles(colors);

  const styles = useThemedStyles(themeColors => {
    return {
      titleExtra: {
        fontSize: typography.sizes.base,
        fontWeight: typography.weights.medium,
        color: themeColors.text.primary,
        marginBottom: spacing.sm,
      } as TextStyle,
      statsContainerExtra: {
        justifyContent: 'space-around',
        padding: spacing.xxs, // Moved from inline
      } as ViewStyle,
      statExtra: {
        alignItems: 'center',
        paddingHorizontal: spacing.xs,
      } as ViewStyle,
      statValueExtra: {
        fontSize: typography.sizes['2xl'],
        fontWeight: typography.weights.bold,
        marginBottom: spacing.xs,
        textAlign: 'center',
      } as TextStyle,
      statValueSmallExtra: {
        fontSize: typography.sizes.base,
        fontWeight: typography.weights.semibold,
      } as TextStyle,
      statLabelExtra: {
        fontSize: typography.sizes.sm,
        color: themeColors.text.secondary,
      } as TextStyle,
      separatorExtra: {
        width: 1,
        height: '70%',
        marginHorizontal: spacing.sm,
        backgroundColor: themeColors.tiontuGold,
        opacity: 0.2,
        alignSelf: 'center',
      } as ViewStyle,
    };
  });

  const currentLanguage = LANGUAGES.find(
    l => l.id === profile.learningLanguageId,
  );

  const formatXP = (xp: number): string | number => {
    if (xp >= 1000000) {
      return (xp / 1000000).toFixed(1).replace(/\.0$/, '') + 'm';
    }
    if (xp >= 1000) {
      return (xp / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return xp;
  };

  const stats = [
    {
      label: 'Total XP',
      value: formatXP(profile.totalXP),
      color: colors.tiontuGold,
    },
    {
      label: `${currentLanguage?.name || 'Language'} XP`,
      value: languageStats?.totalXP ? formatXP(languageStats.totalXP) : 0,
      color: colors.tiontuRed,
    },
    {
      label: 'Day Streak',
      value: profile.currentStreak,
      color: colors.tiontuGreen,
    },
  ];

  return (
    <View>
      <Text style={styles.titleExtra}>Your Progress</Text>
      <Card>
        <View style={[common.row, styles.statsContainerExtra]}>
          {stats.map((stat, index) => (
            <React.Fragment key={index}>
              <View style={styles.statExtra}>
                <Text
                  style={[styles.statValueExtra, {color: stat.color}]}
                  numberOfLines={2}
                  adjustsFontSizeToFit>
                  {stat.value}
                </Text>
                <Text style={styles.statLabelExtra}>{stat.label}</Text>
              </View>
              {index < stats.length - 1 && (
                <View style={styles.separatorExtra} />
              )}
            </React.Fragment>
          ))}
        </View>
      </Card>
    </View>
  );
};
