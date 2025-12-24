import React from 'react';
import {StyleSheet, View, Text} from 'react-native';
import Markdown from 'react-native-markdown-display';
import {useTheme} from '@/components/shared';
import {typography, spacing} from '@/theme';
import type {ContentBlock, TextBlockContent} from '@/types/content';

interface Props {
  block: ContentBlock;
}

export const TextBlock: React.FC<Props> = ({block}) => {
  const {colors} = useTheme();
  const content = block.content as TextBlockContent;

  const styles = StyleSheet.create({
    container: {
      marginBottom: spacing.md,
      paddingHorizontal: spacing.md,
    },
    text: {
      fontSize: content.style?.fontSize || typography.sizes.base,
      color: content.style?.color || colors.text.primary,
      textAlign: content.align || 'left',
      fontWeight: content.style?.fontWeight || 'normal',
      lineHeight: (content.style?.fontSize || typography.sizes.base) * 1.5,
    },
  });

  if (content.markdown) {
    return (
      <View style={styles.container}>
        <Markdown
          style={{
            body: {
              color: content.style?.color || colors.text.primary,
              fontSize: content.style?.fontSize || typography.sizes.base,
              textAlign: content.align || 'left',
            },
            heading1: {
              color: colors.text.primary,
              fontSize: typography.sizes.xl,
              fontWeight: 'bold',
              marginBottom: spacing.sm,
            },
            heading2: {
              color: colors.text.primary,
              fontSize: typography.sizes.lg,
              fontWeight: 'bold',
              marginBottom: spacing.sm,
            },
            paragraph: {
              marginBottom: spacing.sm,
            },
            strong: {
              fontWeight: 'bold',
              color: colors.text.primary,
            },
            em: {
              fontStyle: 'italic',
            },
            // Code blocks - inline code
            code_inline: {
              backgroundColor: colors.surface,
              color: colors.text.primary,
              paddingHorizontal: 4,
              paddingVertical: 2,
              borderRadius: 4,
              fontFamily: 'monospace',
              fontSize: typography.sizes.sm,
            },
            // Code blocks - block code
            code_block: {
              backgroundColor: colors.surface,
              color: colors.text.primary,
              padding: spacing.sm,
              borderRadius: 8,
              fontFamily: 'monospace',
              fontSize: typography.sizes.sm,
              marginBottom: spacing.sm,
            },
            // Code blocks - fenced code
            fence: {
              backgroundColor: colors.surface,
              color: colors.text.primary,
              padding: spacing.sm,
              borderRadius: 8,
              fontFamily: 'monospace',
              fontSize: typography.sizes.sm,
              marginBottom: spacing.sm,
            },
            // Blockquotes
            blockquote: {
              backgroundColor: colors.surface,
              borderLeftWidth: 4,
              borderLeftColor: colors.primary,
              paddingLeft: spacing.md,
              paddingVertical: spacing.sm,
              marginBottom: spacing.sm,
              fontStyle: 'italic',
            },
            // Links
            link: {
              color: colors.primary,
              textDecorationLine: 'underline',
            },
          }}>
          {content.text}
        </Markdown>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{content.text}</Text>
    </View>
  );
};
