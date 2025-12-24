/* eslint-disable no-alert */
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Platform,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {
  useTheme,
  Card,
  Button,
  AppBar,
  LanguageSelectionModal,
} from '@/components/shared';
import {AchievementsList} from '@/components/profile/AchievementsList';
import {useUserStore} from '@/stores/userStore';
import {clearContentCache} from '@/services/dynamicContent';
import {LANGUAGES} from '@/constants';
import {spacing, typography} from '@/theme';
import {useThemedStyles} from '@/hooks/useThemedStyles';
import {createCommonStyles} from '@/theme/commonStyles';

export const ProfileScreen: React.FC = () => {
  const {colors, isDark, toggleTheme} = useTheme();
  const common = createCommonStyles(colors);
  const {user, profile, signOut, resetXP, resetProgress} = useUserStore();
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const [showLanguageModal, setShowLanguageModal] = React.useState(false);

  const currentLanguage = LANGUAGES.find(
    l => l.id === profile?.learningLanguageId,
  );

  const styles = useThemedStyles(themeColors => {
    return {
      contentExtra: {
        padding: spacing.lg,
        gap: spacing.lg,
      },
      userInfoExtra: {
        alignItems: 'center',
      },
      avatarExtra: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: spacing.md,
        backgroundColor: themeColors.tiontuRed,
      },
      avatarImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
      } as ImageStyle,
      avatarText: {
        fontSize: typography.sizes['3xl'],
        fontWeight: typography.weights.bold,
        color: themeColors.white,
      },
      name: {
        fontSize: typography.sizes['2xl'],
        fontWeight: typography.weights.bold,
        marginBottom: spacing.xs,
        color: themeColors.text.primary,
      },
      email: {
        fontSize: typography.sizes.base,
        color: themeColors.text.secondary,
      },
      sectionTitle: {
        fontSize: typography.sizes.xl,
        fontWeight: typography.weights.bold,
        marginBottom: spacing.lg,
        color: themeColors.tiontuBrown,
      },
      sectionTitleDanger: {
        color: themeColors.tiontuRed,
      },
      statsGridExtra: {
        justifyContent: 'space-around',
      } as ViewStyle,
      statItemExtra: {
        alignItems: 'center',
      } as ViewStyle,
      statValue: {
        fontSize: typography.sizes['3xl'],
        fontWeight: typography.weights.bold,
        marginBottom: spacing.xs,
      },
      statLabel: {
        fontSize: typography.sizes.sm,
        color: themeColors.text.secondary,
      },
      settingItem: {
        paddingVertical: spacing.md,
      },
      settingItemBorder: {
        borderTopWidth: 1,
        borderTopColor: themeColors.border,
      },
      settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      },
      settingLabel: {
        fontSize: typography.sizes.base,
        fontWeight: typography.weights.medium,
        color: themeColors.text.primary,
      },
      settingValue: {
        fontSize: typography.sizes.sm,
        marginTop: spacing.xs,
        color: themeColors.text.secondary,
      },
      toggleExtra: {
        width: 50,
        height: 28,
        borderRadius: 14,
        padding: 2,
        justifyContent: 'center',
      },
      toggleThumb: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: themeColors.background,
      },
      toggleThumbActive: {
        alignSelf: 'flex-end',
      },
      signOutButton: {
        marginTop: spacing.md,
      },
      dangerButtons: {
        gap: spacing.md,
      },
      resetButton: {
        borderColor: 'transparent',
        backgroundColor: themeColors.background,
      },
      textInfo: {color: themeColors.info} as TextStyle,
      textWarning: {color: themeColors.warning} as TextStyle,
      textError: {color: themeColors.error} as TextStyle,
    };
  });

  const openMenu = () => {
    navigation.openDrawer?.();
  };

  const handleSignOut = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to sign out?')) {
        signOut().catch(error => console.error('Sign out error:', error));
      }
      return;
    }

    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch (error) {
            console.error('Sign out error:', error);
          }
        },
      },
    ]);
  };

  const handleResetXP = () => {
    if (Platform.OS === 'web') {
      if (
        window.confirm(
          'Are you sure you want to reset your XP? This cannot be undone.',
        )
      ) {
        resetXP()
          .then(() => window.alert('Your XP has been reset.'))
          .catch(() => window.alert('Failed to reset XP. Please try again.'));
      }
      return;
    }

    Alert.alert(
      'Reset XP',
      'Are you sure you want to reset your XP? This cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetXP();
              Alert.alert('Success', 'Your XP has been reset.');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset XP. Please try again.');
            }
          },
        },
      ],
    );
  };

  const handleResetProgress = () => {
    if (Platform.OS === 'web') {
      if (
        window.confirm(
          'Are you sure you want to reset ALL your progress? This will delete all lesson history, achievements, and stats. This cannot be undone.',
        )
      ) {
        resetProgress()
          .then(() => window.alert('Your progress has been reset.'))
          .catch(() =>
            window.alert('Failed to reset progress. Please try again.'),
          );
      }
      return;
    }

    Alert.alert(
      'Reset Progress',
      'Are you sure you want to reset ALL your progress? This will delete all lesson history, achievements, and stats. This cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Reset All',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetProgress();
              Alert.alert('Success', 'Your progress has been reset.');
            } catch (error) {
              Alert.alert(
                'Error',
                'Failed to reset progress. Please try again.',
              );
            }
          },
        },
      ],
    );
  };

  const handleClearCache = () => {
    if (Platform.OS === 'web') {
      if (
        window.confirm(
          'This will clear all cached course and lesson data. The app will reload fresh data from the server.',
        )
      ) {
        try {
          clearContentCache();
          window.alert(
            'Cache cleared! Please navigate to courses to reload fresh data.',
          );
        } catch (error) {
          window.alert('Failed to clear cache. Please try again.');
        }
      }
      return;
    }

    Alert.alert(
      'Clear Cache',
      'This will clear all cached course and lesson data. The app will reload fresh data from the server.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Clear Cache',
          onPress: () => {
            try {
              clearContentCache();
              Alert.alert(
                'Success',
                'Cache cleared! Please navigate to courses to reload fresh data.',
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache. Please try again.');
            }
          },
        },
      ],
    );
  };

  if (!user || !profile) {
    return null;
  }

  return (
    <View style={common.container}>
      <AppBar title="Profile" showMenu showHome onMenuPress={openMenu} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={common.flex1}
        contentContainerStyle={styles.contentExtra}>
        {/* User Info */}
        <Card>
          <View style={styles.userInfoExtra}>
            <View
              style={[
                common.centered,
                styles.avatarExtra,
                profile.avatarUrl
                  ? {backgroundColor: 'transparent'}
                  : undefined,
              ]}>
              {profile.avatarUrl ? (
                <Image
                  source={{uri: profile.avatarUrl}}
                  style={styles.avatarImage}
                />
              ) : (
                <Text style={styles.avatarText}>
                  {profile.displayName?.[0]?.toUpperCase() ||
                    user.email?.[0]?.toUpperCase() ||
                    'U'}
                </Text>
              )}
            </View>
            <Text style={styles.name}>{profile.displayName || 'Learner'}</Text>
            <Text style={styles.email}>{user.email}</Text>
          </View>
        </Card>

        {/* Stats */}
        <Card>
          <Text style={styles.sectionTitle}>Your Statistics</Text>
          <View style={[common.row, styles.statsGridExtra]}>
            <View style={styles.statItemExtra}>
              <Text style={[styles.statValue, {color: colors.tiontuGold}]}>
                {profile.totalXP}
              </Text>
              <Text style={styles.statLabel}>Total XP</Text>
            </View>
            <View style={styles.statItemExtra}>
              <Text style={[styles.statValue, {color: colors.tiontuGreen}]}>
                {profile.currentStreak}
              </Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            <View style={styles.statItemExtra}>
              <Text style={[styles.statValue, {color: colors.tiontuRed}]}>
                {profile.longestStreak}
              </Text>
              <Text style={styles.statLabel}>Longest Streak</Text>
            </View>
          </View>
        </Card>

        {/* Achievements */}
        <AchievementsList />

        {/* Settings */}
        <Card>
          <Text style={styles.sectionTitle}>Settings</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setShowLanguageModal(true)}>
            <View>
              <Text style={styles.settingLabel}>Learning Language</Text>
              <Text style={styles.settingValue}>
                {currentLanguage?.name || 'Irish (Standard)'}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={[styles.settingItem, styles.settingItemBorder]}>
            <View style={common.rowBetween}>
              <Text style={styles.settingLabel}>Dark Mode</Text>
              <TouchableOpacity
                style={[
                  common.centered,
                  styles.toggleExtra,
                  isDark
                    ? {backgroundColor: colors.tiontuGreen}
                    : {backgroundColor: colors.border},
                ]}
                onPress={toggleTheme}>
                <View
                  style={[
                    styles.toggleThumb,
                    isDark && styles.toggleThumbActive,
                  ]}
                />
              </TouchableOpacity>
            </View>
          </View>
        </Card>

        {/* Developer Tools */}
        <Card>
          <Text style={styles.sectionTitle}>Developer Tools</Text>
          <Button
            title="Clear Cache"
            onPress={handleClearCache}
            variant="outline"
            style={styles.resetButton}
            textStyle={styles.textInfo}
          />
        </Card>

        {/* Danger Zone */}
        <Card>
          <Text style={[styles.sectionTitle, styles.sectionTitleDanger]}>
            Danger Zone
          </Text>
          <View style={styles.dangerButtons}>
            <Button
              title="Reset XP"
              onPress={handleResetXP}
              variant="outline"
              style={styles.resetButton}
              textStyle={styles.textWarning}
            />
            <Button
              title="Reset All Progress"
              onPress={handleResetProgress}
              variant="outline"
              style={styles.resetButton}
              textStyle={styles.textError}
            />
          </View>
        </Card>

        {/* Sign Out */}
        <Button
          title="Sign Out"
          onPress={handleSignOut}
          variant="outline"
          style={styles.signOutButton}
        />
      </ScrollView>

      <LanguageSelectionModal
        visible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
      />
    </View>
  );
};
