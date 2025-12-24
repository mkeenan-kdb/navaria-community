import React, {useState, useEffect} from 'react';
import {Text, TouchableOpacity, View, AppState} from 'react-native';
import {Clock, Calendar} from 'lucide-react-native';
import {Card, useTheme} from '@/components/shared';
import {useThemedStyles} from '@/hooks/useThemedStyles';
import {spacing, typography} from '@/theme';
import {DateTime} from '@/utils/dateTime';
import {useFontStore} from '@/stores/fontStore';

import {useUserStore} from '@/stores/userStore';

export const TimeDisplay: React.FC = () => {
  const {currentLanguageId} = useUserStore();
  const [showInNativeLanguage, setShowInNativeLanguage] = useState(true);
  const [timeString, setTimeString] = useState('');
  const [dateString, setDateString] = useState('');
  const {colors} = useTheme();
  const {currentFont} = useFontStore();

  // Determine if current language supports native display
  const hasNativeLanguageSupport =
    currentLanguageId?.startsWith('irish') ||
    currentLanguageId === 'navajo' ||
    currentLanguageId === 'maori';

  const styles = useThemedStyles(themeColors => ({
    card: {
      marginTop: spacing.lg,
      padding: 0, // Let touchable handle padding or inner view
    },
    touchable: {
      padding: spacing.md,
      paddingHorizontal: spacing.lg,
    },
    container: {
      // styles removed in favor of Card
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      gap: spacing.md,
    },
    separator: {
      height: 1,
      opacity: 0.2,
      backgroundColor: themeColors.tiontuGold,
      width: '100%',
      marginVertical: spacing.md,
    },
    timeText: {
      fontSize: showInNativeLanguage
        ? typography.sizes.xl
        : typography.sizes.lg,
      color: themeColors.primary,
      fontFamily:
        showInNativeLanguage && hasNativeLanguageSupport
          ? currentFont
          : undefined,
      flex: 1,
      flexShrink: 1,
      flexWrap: 'wrap',
    },
    dateText: {
      fontSize: showInNativeLanguage
        ? typography.sizes.xl
        : typography.sizes.base,
      color: themeColors.text.secondary,
      fontFamily:
        showInNativeLanguage && hasNativeLanguageSupport
          ? currentFont
          : undefined,
      flex: 1,
      flexShrink: 1,
      flexWrap: 'wrap',
    },
  }));

  useEffect(() => {
    const updateTime = () => {
      const languageId =
        showInNativeLanguage && currentLanguageId
          ? currentLanguageId
          : 'english';
      setTimeString(DateTime.getCurrentTime(languageId));
      setDateString(DateTime.getCurrentDate(languageId));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        updateTime();
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [showInNativeLanguage, currentLanguageId]);

  const toggleLanguage = () => {
    if (hasNativeLanguageSupport) {
      setShowInNativeLanguage(!showInNativeLanguage);
    }
  };

  return (
    <Card style={styles.card}>
      <TouchableOpacity
        onPress={toggleLanguage}
        activeOpacity={hasNativeLanguageSupport ? 0.7 : 1}
        disabled={!hasNativeLanguageSupport}
        style={styles.touchable}>
        <View style={styles.row}>
          <Clock size={28} color={colors.primary} />
          <Text style={styles.timeText}>{timeString}</Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.row}>
          <Calendar size={24} color={colors.text.secondary} />
          <Text style={styles.dateText}>{dateString}</Text>
        </View>
      </TouchableOpacity>
    </Card>
  );
};
