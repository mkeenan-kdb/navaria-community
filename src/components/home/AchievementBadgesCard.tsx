import React from 'react';
import {View, Text, TouchableOpacity, ScrollView} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {DrawerNavigationProp} from '@react-navigation/drawer';

import {Card, useTheme, AchievementBadge} from '@/components/shared';
import {useAchievementStore} from '@/stores/achievementStore';
import {useUserStore} from '@/stores/userStore';
import {spacing, typography, opacity, useResponsive} from '@/theme';
import {useThemedStyles} from '@/hooks/useThemedStyles';
import {createCommonStyles} from '@/theme/commonStyles';
import type {DrawerParamList} from '@/navigation/types';
import {getIconComponent} from '@/utils/iconMap';

export const AchievementBadgesCard: React.FC = () => {
  const {colors} = useTheme();
  const {achievementsByLanguage, polyglotAchievements} = useAchievementStore();
  const {currentLanguageId} = useUserStore();
  const navigation = useNavigation<DrawerNavigationProp<DrawerParamList>>();

  const {isMobile, containerPadding} = useResponsive();
  const styles = useThemedStyles(themeColors => {
    const common = createCommonStyles(themeColors);
    return {
      ...common,
      card: {
        padding: containerPadding,
      },
      header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      },
      title: {
        fontSize: typography.sizes.base,
        fontWeight: typography.weights.medium,
        color: themeColors.text.primary,
        marginBottom: spacing.sm,
      },
      achievementCount: {
        fontSize: typography.sizes.base,
        fontWeight: typography.weights.medium,
        color: themeColors.tiontuGold,
        marginBottom: spacing.sm,
      },
      badgesContainer: {
        flexDirection: 'row',
        gap: isMobile ? spacing.md : spacing.lg,
        paddingRight: isMobile ? spacing.md : spacing.lg,
      },
      viewAllText: {
        fontSize: typography.sizes.sm,
        color: themeColors.primary,
        fontWeight: typography.weights.semibold,
        textAlign: 'center',
        marginTop: spacing.md,
      },
    };
  });

  const handleBadgePress = () => {
    navigation.navigate('Profile');
  };

  // Combined achievements filtering
  const {displayedAchievements, totalUnlocked, totalAchievements} =
    React.useMemo(() => {
      const current = currentLanguageId
        ? achievementsByLanguage.get(currentLanguageId) || []
        : [];
      const all = [...current, ...polyglotAchievements];

      const unlocked = all.filter(a => a.isUnlocked);
      const locked = all.filter(a => !a.isUnlocked);

      return {
        displayedAchievements: [...unlocked, ...locked],
        totalUnlocked: unlocked.length,
        totalAchievements: all.length,
      };
    }, [currentLanguageId, achievementsByLanguage, polyglotAchievements]);

  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.title}>Achievements</Text>
        <Text style={styles.achievementCount}>
          {totalUnlocked} / {totalAchievements}
        </Text>
      </View>

      <Card style={styles.card}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.badgesContainer}>
          {displayedAchievements.map(achievement => (
            <AchievementBadge
              key={achievement.id}
              icon={getIconComponent(achievement.icon)}
              color={
                achievement.isUnlocked ? colors.tiontuGold : colors.accentBorder
              }
              title={achievement.title}
              isUnlocked={achievement.isUnlocked}
              onPress={handleBadgePress}
              size="md"
            />
          ))}
        </ScrollView>

        <TouchableOpacity
          onPress={handleBadgePress}
          activeOpacity={opacity.pressed}>
          <Text style={styles.viewAllText}>View All Achievements →</Text>
        </TouchableOpacity>
      </Card>
    </View>
  );
};
