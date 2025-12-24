import React, {useState, useEffect} from 'react';
import {View, Text, ScrollView, TouchableOpacity} from 'react-native';
import {Languages, Globe, Trophy} from 'lucide-react-native';
import {AchievementCard} from './AchievementCard';
import {useAchievementStore} from '@/stores/achievementStore';
import {useUserStore} from '@/stores/userStore';
import {spacing, typography, borderRadius} from '@/theme';
import {useThemedStyles} from '@/hooks/useThemedStyles';
import {createCommonStyles} from '@/theme/commonStyles';
import {useTheme} from '@/components/shared';

// Language display names
const LANGUAGE_NAMES: Record<string, string> = {
  irish_std: 'Irish',
  irish_mun: 'Irish (Munster)',
  irish_con: 'Irish (Connacht)',
  irish_ul: 'Irish (Ulster)',
  navajo: 'Navajo',
  maori: 'Māori',
};

export const AchievementsList: React.FC = () => {
  const {colors} = useTheme();
  const {currentLanguageId} = useUserStore();
  const {
    achievementsByLanguage,
    polyglotAchievements,
    getAchievementsForLanguage,
  } = useAchievementStore();

  const [selectedTab, setSelectedTab] = useState<string | 'polyglot'>(
    currentLanguageId || 'polyglot',
  );

  // Get all languages that have achievements
  const languages = Array.from(achievementsByLanguage.keys());

  // Ensure current language is loaded
  useEffect(() => {
    if (currentLanguageId && !achievementsByLanguage.has(currentLanguageId)) {
      getAchievementsForLanguage(currentLanguageId);
    }
  }, [currentLanguageId, achievementsByLanguage, getAchievementsForLanguage]);

  // Get achievements for selected tab
  const displayedAchievements =
    selectedTab === 'polyglot'
      ? polyglotAchievements
      : achievementsByLanguage.get(selectedTab) || [];

  const unlockedCount = displayedAchievements.filter(a => a.isUnlocked).length;
  const totalCount = displayedAchievements.length;

  const styles = useThemedStyles(themeColors => {
    const common = createCommonStyles(themeColors);
    return {
      ...common,
      container: {
        marginTop: spacing.lg,
      },
      header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
        paddingHorizontal: spacing.xs,
      },
      title: {
        fontSize: typography.sizes.xl,
        fontWeight: typography.weights.bold,
        color: themeColors.text.primary,
      },
      count: {
        fontSize: typography.sizes.base,
        fontWeight: typography.weights.medium,
        color: themeColors.text.secondary,
      },
      tabsContainer: {
        marginBottom: spacing.md,
      },
      tabsScroll: {
        paddingHorizontal: spacing.xs,
      },
      tabsContent: {
        flexDirection: 'row',
        gap: spacing.sm,
      },
      tab: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: themeColors.border,
        backgroundColor: themeColors.surface,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
      },
      tabActive: {
        backgroundColor: themeColors.tiontuGreen,
        borderColor: themeColors.tiontuGreen,
      },
      tabText: {
        fontSize: typography.sizes.sm,
        fontWeight: typography.weights.medium,
        color: themeColors.text.primary,
      },
      tabTextActive: {
        color: themeColors.white,
      },
      list: {
        gap: spacing.sm,
      },
      emptyState: {
        padding: spacing.xl,
        alignItems: 'center',
      },
      emptyText: {
        fontSize: typography.sizes.base,
        color: themeColors.text.secondary,
        textAlign: 'center',
      },
    };
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Achievements</Text>
        <Text style={styles.count}>
          {unlockedCount} / {totalCount}
        </Text>
      </View>

      {/* Language Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScroll}
          contentContainerStyle={styles.tabsContent}>
          {/* Current Language Tab (if available) */}
          {currentLanguageId && (
            <TouchableOpacity
              style={[
                styles.tab,
                selectedTab === currentLanguageId && styles.tabActive,
              ]}
              onPress={() => setSelectedTab(currentLanguageId)}>
              <Languages
                size={16}
                color={
                  selectedTab === currentLanguageId
                    ? colors.white
                    : colors.text.primary
                }
              />
              <Text
                style={[
                  styles.tabText,
                  selectedTab === currentLanguageId && styles.tabTextActive,
                ]}>
                {LANGUAGE_NAMES[currentLanguageId] || currentLanguageId}
              </Text>
            </TouchableOpacity>
          )}

          {/* Other Language Tabs */}
          {languages
            .filter(lang => lang !== currentLanguageId)
            .map(lang => (
              <TouchableOpacity
                key={lang}
                style={[styles.tab, selectedTab === lang && styles.tabActive]}
                onPress={() => setSelectedTab(lang)}>
                <Languages
                  size={16}
                  color={
                    selectedTab === lang ? colors.white : colors.text.primary
                  }
                />
                <Text
                  style={[
                    styles.tabText,
                    selectedTab === lang && styles.tabTextActive,
                  ]}>
                  {LANGUAGE_NAMES[lang] || lang}
                </Text>
              </TouchableOpacity>
            ))}

          {/* Polyglot Tab */}
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'polyglot' && styles.tabActive]}
            onPress={() => setSelectedTab('polyglot')}>
            <Globe
              size={16}
              color={
                selectedTab === 'polyglot' ? colors.white : colors.text.primary
              }
            />
            <Text
              style={[
                styles.tabText,
                selectedTab === 'polyglot' && styles.tabTextActive,
              ]}>
              Polyglot
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Achievements List */}
      {displayedAchievements.length > 0 ? (
        <View style={styles.list}>
          {displayedAchievements.map(achievement => (
            <AchievementCard key={achievement.id} achievement={achievement} />
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Trophy size={48} color={colors.text.secondary} />
          <Text style={styles.emptyText}>
            No achievements yet. Start learning to unlock them!
          </Text>
        </View>
      )}
    </View>
  );
};
