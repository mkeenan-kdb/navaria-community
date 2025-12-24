import React, {useCallback} from 'react';
import {View, Text, ScrollView, Image} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {useTheme, AppLoadingSpinner, AppBar} from '@/components/shared';
import {useUserStore} from '@/stores/userStore';
import {UserStatsCard} from '@/components/home/UserStatsCard';
import {HomepagePhraseCard} from '@/components/home/HomepagePhraseCard';
import {QuickAccessCard} from '@/components/home/QuickAccessCard';
import {AchievementBadgesCard} from '@/components/home/AchievementBadgesCard';
import {TimeDisplay} from '@/components/home/TimeDisplay';
import {spacing, typography, borderRadius} from '@/theme';
import {useThemedStyles} from '@/hooks/useThemedStyles';
import {createCommonStyles} from '@/theme/commonStyles';
import type {DrawerParamList} from '@/navigation/types';

export const HomeScreen: React.FC = () => {
  const {colors, isDark} = useTheme();
  const {profile, user, loadProfile, languageStats} = useUserStore();
  const navigation = useNavigation<DrawerNavigationProp<DrawerParamList>>();

  const styles = useThemedStyles(themeColors => {
    const common = createCommonStyles(themeColors);
    return {
      ...common,
      scroll: {
        flex: 1,
        width: '100%',
      },
      content: {
        paddingHorizontal: spacing.md,
        paddingBottom: spacing['2xl'],
        gap: spacing.lg,
      },
      hero: {
        marginTop: spacing.md,
        padding: spacing.xl,
        paddingVertical: spacing.xl,
        borderRadius: borderRadius.xl,
        backgroundColor: themeColors.surface,
      },
      logo: {
        width: 130,
        height: 130,
        alignSelf: 'center',
        marginBottom: spacing.md,
      },
      heroTitle: {
        fontSize: typography.sizes['6xl'],
        fontWeight: typography.weights.bold,
        marginBottom: spacing.xs,
        textAlign: 'center',
        color: themeColors.primary,
        fontFamily: typography.fonts.celtic,
      },
      greeting: {
        fontSize: typography.sizes.lg,
        color: themeColors.text.primary,
        textAlign: 'center',
        marginTop: spacing.md,
      },
      tagLine: {
        fontSize: typography.sizes.sm,
        color: themeColors.text.secondary,
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: spacing.xs,
      },
      greetingHighlight: {
        fontWeight: typography.weights.semibold,
      },
    };
  });

  const openMenu = () => {
    navigation.openDrawer?.();
  };

  // Reload profile when screen comes into focus to update stats
  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadProfile(user.id);
      }
    }, [user, loadProfile]),
  );

  // Log font usage
  React.useEffect(() => {
    console.log('[HOME] HomeScreen rendered');
    console.log('[HOME] Typography fonts:', typography.fonts);
    console.log('[HOME] Celtic font:', typography.fonts.celtic);
  }, []);

  if (!profile || !user) {
    return <AppLoadingSpinner message="Loading your dashboard..." />;
  }

  return (
    <View style={styles.container}>
      <AppBar
        title="Navaria Home"
        showMenu
        onMenuPress={openMenu}
        useCelticFont
        backgroundColor={colors.appBar}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.content}>
        {/* Hero Section */}
        <View style={styles.hero}>
          <Image
            source={
              isDark
                ? require('../../../assets/images/app_logo_circular_original_darkmode.png')
                : require('../../../assets/images/app_logo_circular_original_lightmode.png')
            }
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.heroTitle}>Navaria</Text>
          <Text style={styles.tagLine}>Reclaim your voice</Text>
          <Text style={styles.greeting}>
            Welcome back,{' '}
            <Text style={styles.greetingHighlight}>
              {profile.displayName || user.email?.split('@')[0] || 'Learner'}
            </Text>
          </Text>
          <TimeDisplay />
        </View>
        {/* User Stats */}
        <UserStatsCard profile={profile} languageStats={languageStats} />
        {/* Quick Access Links */}
        <QuickAccessCard />
        {/* Achievements Summary */}
        <AchievementBadgesCard />
        {/* Daily Phrase */}
        <HomepagePhraseCard />
      </ScrollView>
    </View>
  );
};
