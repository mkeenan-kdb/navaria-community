import React, {useCallback} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {
  DrawerContentScrollView,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {
  Home,
  BookOpen,
  Type,
  User,
  Settings,
  LucideIcon,
} from 'lucide-react-native';
import {useTheme} from '@/components/shared';
import {useUserStore} from '@/stores/userStore';
import {spacing, typography} from '@/theme';
import {useThemedStyles} from '@/hooks/useThemedStyles';
import {createCommonStyles} from '@/theme/commonStyles';

export const DrawerContent: React.FC<DrawerContentComponentProps> = props => {
  const {colors} = useTheme();
  const {user, profile, currentLanguageId, languageStats, loadProfile} =
    useUserStore();

  // Reload profile data when drawer becomes visible
  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadProfile(user.id);
      }
    }, [user, loadProfile]),
  );

  const styles = useThemedStyles(themeColors => {
    const common = createCommonStyles(themeColors);
    return {
      ...common,
      container: {
        flex: 1,
      },
      header: {
        padding: spacing.lg,
        borderRadius: spacing.lg,
        backgroundColor: themeColors.surface,
        // Native shadow for depth
        shadowColor: themeColors.glow,
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
      },
      appTitle: {
        fontSize: typography.sizes['5xl'],
        fontWeight: typography.weights.bold,
        marginBottom: spacing.xs,
        color: themeColors.primary,
        fontFamily: typography.fonts.celtic,
      },
      tagline: {
        fontSize: typography.sizes.sm,
        fontStyle: 'italic',
        marginBottom: spacing.md,
        color: themeColors.text.secondary,
      },
      userInfo: {
        marginTop: spacing.sm,
      },
      userName: {
        fontSize: typography.sizes.lg,
        fontWeight: typography.weights.medium,
        marginBottom: spacing.md,
        color: themeColors.text.primary,
      },
      statsRow: {
        flexDirection: 'row',
        gap: spacing.lg,
      },
      stat: {
        alignItems: 'center',
      },
      statValue: {
        fontSize: typography.sizes.xl,
        fontWeight: typography.weights.bold,
      },
      statLabel: {
        fontSize: typography.sizes.sm,
        marginTop: spacing.xs,
        color: themeColors.text.secondary,
      },
      menu: {
        paddingTop: spacing.md,
      },
      menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        minHeight: 48,
        borderRadius: spacing.sm,
        marginHorizontal: spacing.sm,
        marginVertical: spacing.sm / 2,
      },
      menuIcon: {
        marginRight: spacing.md,
      },
      menuText: {
        fontSize: typography.sizes.lg,
        fontWeight: typography.weights.normal,
      },
    };
  });

  const isIrishLanguage = [
    'irish_std',
    'irish_con',
    'irish_mun',
    'irish_ul',
  ].includes(currentLanguageId || '');

  // Check if user has admin access (strictly admin role)
  const isAdmin = profile?.role === 'admin';

  // Get root navigation for navigating to Admin stack
  const rootNavigation = useNavigation<any>();

  const menuItems: {
    name: string;
    route: string;
    icon: LucideIcon;
    isRoot?: boolean;
  }[] = [
    {name: 'Home', route: 'Home', icon: Home},
    {name: 'Courses', route: 'Courses', icon: BookOpen},
    ...(isIrishLanguage
      ? [{name: 'Seanchló Typer', route: 'SeanchloTyper', icon: Type}]
      : []),
    {name: 'Profile', route: 'Profile', icon: User},
    ...(isAdmin
      ? [
          {
            name: 'Admin Dashboard',
            route: 'Admin',
            icon: Settings,
            isRoot: true,
          },
        ]
      : []),
  ];

  return (
    <DrawerContentScrollView
      {...props}
      style={{backgroundColor: colors.surface}}
      contentContainerStyle={styles.container}>
      {/* Header with user info */}
      <View style={styles.header}>
        <Text style={styles.appTitle}>Navaria</Text>
        <Text style={styles.tagline}>Minority languages, Made accessible</Text>
        {profile && (
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {profile.displayName || user?.email}
            </Text>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={[styles.statValue, {color: colors.secondary}]}>
                  {profile.totalXP}
                </Text>
                <Text style={styles.statLabel}>Total XP</Text>
              </View>
              <View style={styles.stat}>
                <Text style={[styles.statValue, {color: colors.tiontuRed}]}>
                  {languageStats?.totalXP || 0}
                </Text>
                <Text style={styles.statLabel}>Lang XP</Text>
              </View>
              <View style={styles.stat}>
                <Text style={[styles.statValue, {color: colors.accent}]}>
                  {profile.currentStreak}
                </Text>
                <Text style={styles.statLabel}>Streak</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Menu items */}
      <View style={styles.menu}>
        {menuItems.map(item => {
          const isActive =
            props.state.routeNames[props.state.index] === item.route;
          const IconComponent = item.icon;
          return (
            <TouchableOpacity
              key={item.route}
              style={[
                styles.menuItem,
                isActive && {
                  backgroundColor: colors.surfaceSubtle,
                  borderLeftWidth: 2,
                  borderLeftColor: colors.info,
                  marginLeft: spacing.lg,
                },
                !isActive && {
                  backgroundColor: colors.surface,
                },
              ]}
              onPress={() => {
                if (item.isRoot) {
                  rootNavigation.navigate(item.route);
                } else {
                  props.navigation.navigate(item.route);
                }
              }}>
              <IconComponent
                size={22}
                color={isActive ? colors.primary : colors.text.secondary}
                style={styles.menuIcon}
              />
              <Text
                style={[
                  styles.menuText,
                  {color: isActive ? colors.text.primary : colors.text.primary},
                  isActive && {fontWeight: typography.weights.semibold},
                ]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </DrawerContentScrollView>
  );
};
