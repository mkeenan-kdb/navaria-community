import React, {useEffect, useState, useCallback} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {Card, useTheme} from '@/components/shared';
import {spacing, typography} from '@/theme';
import {getRandomHomepagePhrase} from '@/services/content';
import type {HomepagePhrase} from '@/types';
import {useThemedStyles} from '@/hooks/useThemedStyles';
import {createCommonStyles} from '@/theme/commonStyles';
import {Eye, EyeOff} from 'lucide-react-native';
import {useUserStore} from '@/stores/userStore';
import {AVAILABLE_FONTS} from '@/stores/fontStore';

export const HomepagePhraseCard: React.FC = () => {
  const {colors, fontFamily} = useTheme();
  const [phrase, setPhrase] = useState<HomepagePhrase | null>(null);
  const [showSource, setShowSource] = useState(false);
  const [loading, setLoading] = useState(true);
  const {currentLanguageId} = useUserStore();

  // Determine if we should apply the Celtic font
  // Only apply custom font if it's Irish and the font is a Celtic one
  const isIrish = currentLanguageId?.startsWith('irish');
  const isCelticFont =
    Object.values(AVAILABLE_FONTS).includes(fontFamily) &&
    fontFamily !== 'System';
  const effectiveFontFamily = isIrish && isCelticFont ? fontFamily : undefined;

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
      content: {
        gap: spacing.md,
      },
      targetContainer: {
        backgroundColor: themeColors.surfaceElevated, // Removed nested background
        padding: spacing.md,
        borderRadius: spacing.sm, // Removed radius
        borderLeftWidth: 2,
        borderLeftColor: themeColors.tiontuRed,
      },
      targetRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing.sm,
      },
      targetText: {
        flex: 1,
        fontSize: typography.sizes.xl,
        fontWeight: typography.weights.bold,
        color: themeColors.text.primary,
      },
      eyeButton: {
        padding: spacing.xs,
        borderRadius: spacing.xs,
        backgroundColor: themeColors.surface,
      },
      sourceText: {
        fontSize: typography.sizes.base,
        color: themeColors.text.secondary,
        lineHeight: typography.sizes.base * 1.5,
        marginTop: spacing.sm,
      },
      explanation: {
        fontSize: typography.sizes.sm,
        fontStyle: 'italic',
        color: themeColors.text.secondary,
      },
      loading: {
        fontSize: typography.sizes.base,
        textAlign: 'center',
        paddingVertical: spacing.lg,
        color: themeColors.text.secondary,
      },
      refreshButton: {
        marginTop: spacing.md,
        alignSelf: 'flex-end',
      },
      refreshText: {
        fontSize: typography.sizes.sm,
        fontWeight: typography.weights.medium,
        color: themeColors.tiontuGold,
      },
    };
  });

  const loadPhrase = useCallback(async () => {
    try {
      setLoading(true);
      // Pass current language to load relevant phrase
      const data = await getRandomHomepagePhrase(currentLanguageId);
      setPhrase(data);
    } catch (error) {
      console.error('Failed to load homepage phrase:', error);
    } finally {
      setLoading(false);
    }
  }, [currentLanguageId]);

  useEffect(() => {
    loadPhrase();
  }, [loadPhrase]);

  if (loading || !phrase) {
    return (
      <Card>
        <Text style={styles.title}>Daily Phrase</Text>
        <Text style={styles.loading}>Loading...</Text>
      </Card>
    );
  }

  return (
    <View>
      <Text style={styles.title}>Daily Phrase</Text>
      <Card>
        <View style={styles.content}>
          <View style={styles.targetContainer}>
            <View style={styles.targetRow}>
              <Text
                style={[styles.targetText, {fontFamily: effectiveFontFamily}]}>
                {phrase.targetText}
              </Text>
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowSource(!showSource)}
                activeOpacity={0.7}>
                {showSource ? (
                  <Eye size={24} color={colors.text.secondary} />
                ) : (
                  <EyeOff size={24} color={colors.text.secondary} />
                )}
              </TouchableOpacity>
            </View>
            {showSource && (
              <Text style={styles.sourceText}>{phrase.sourceText}</Text>
            )}
          </View>
          {phrase.explanation && (
            <Text style={styles.explanation}>{phrase.explanation}</Text>
          )}
        </View>
      </Card>
      <TouchableOpacity onPress={loadPhrase} style={styles.refreshButton}>
        <Text style={styles.refreshText}>Show Another →</Text>
      </TouchableOpacity>
    </View>
  );
};
