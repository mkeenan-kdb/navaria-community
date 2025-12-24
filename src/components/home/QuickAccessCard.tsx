import React, {useCallback} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {BookOpen, Type, type LucideIcon} from 'lucide-react-native';
import {Card, useTheme, CircularAvatar} from '@/components/shared';
import {spacing, typography, borderRadius, useResponsive} from '@/theme';
import type {DrawerParamList} from '@/navigation/types';
import {useThemedStyles} from '@/hooks/useThemedStyles';
import {createCommonStyles} from '@/theme/commonStyles';
import {useUserStore} from '@/stores/userStore';

interface QuickLink {
  title: string;
  description: string;
  icon: LucideIcon;
  route: keyof DrawerParamList;
  color: string;
}

export const QuickAccessCard: React.FC = React.memo(() => {
  const {colors} = useTheme();
  const navigation =
    useNavigation<
      import('@react-navigation/native').NavigationProp<DrawerParamList>
    >();
  const {currentLanguageId} = useUserStore();
  const {columns} = useResponsive();

  const styles = useThemedStyles(themeColors => {
    const common = createCommonStyles(themeColors);
    return {
      ...common,
      title: {
        fontSize: typography.sizes.base,
        fontWeight: typography.weights.medium,
        color: themeColors.text.primary,
        marginBottom: spacing.sm,
      },
      linksContainer: {
        flexDirection: columns === 1 ? 'column' : 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
      },
      linkButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.sm,
        borderRadius: borderRadius.md,
        width: columns === 1 ? '100%' : '48%', // Basic grid logic
      },
      linkContent: {
        flex: 1,
        marginLeft: spacing.md,
      },
      linkTitle: {
        fontSize: typography.sizes.base,
        fontWeight: typography.weights.semibold,
        marginBottom: spacing.xs,
        color: themeColors.text.primary,
      },
      linkDescription: {
        fontSize: typography.sizes.sm,
        color: themeColors.text.secondary,
      },
    };
  });

  const getQuickLinks = useCallback((): QuickLink[] => {
    const links: QuickLink[] = [
      {
        title: 'Continue Learning',
        description: 'Pick up where you left off',
        icon: BookOpen,
        route: 'Courses',
        color: colors.tiontuRed,
      },
    ];

    if (currentLanguageId?.startsWith('irish')) {
      links.push({
        title: 'Seanchló Typer',
        description: 'Type in the old Irish script',
        icon: Type,
        route: 'SeanchloTyper',
        color: colors.tiontuGold,
      });
    }
    return links;
  }, [colors, currentLanguageId]);

  const quickLinks = getQuickLinks();

  const handleNavigation = useCallback(
    (link: QuickLink) => {
      if (link.route === 'Courses') {
        navigation.navigate('Courses', {screen: 'CourseSelection'});
      } else {
        navigation.navigate(link.route);
      }
    },
    [navigation],
  );

  return (
    <View>
      <Text style={styles.title}>Quick Access</Text>
      <Card>
        <View style={styles.linksContainer}>
          {quickLinks.map((link, index) => (
            <TouchableOpacity
              key={index}
              style={styles.linkButton}
              onPress={() => handleNavigation(link)}>
              <CircularAvatar
                size="md"
                icon={link.icon}
                backgroundColor={link.color}
                iconColor={colors.white}
              />
              <View style={styles.linkContent}>
                <Text style={styles.linkTitle}>{link.title}</Text>
                <Text style={styles.linkDescription}>{link.description}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </Card>
    </View>
  );
});

QuickAccessCard.displayName = 'QuickAccessCard';
