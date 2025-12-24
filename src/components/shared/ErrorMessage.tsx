import React from 'react';
import {View, Text} from 'react-native';
import {spacing, borderRadius} from '@/theme';
import {Button} from './Button';
import {useThemedStyles} from '@/hooks/useThemedStyles';
import {createCommonStyles} from '@/theme/commonStyles';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = React.memo(
  ({message, onRetry}) => {
    const styles = useThemedStyles(themeColors => {
      const common = createCommonStyles(themeColors);
      return {
        ...common,
        container: {
          padding: spacing.lg,
          borderRadius: borderRadius.md,
          borderWidth: 1,
          margin: spacing.md,
          backgroundColor: themeColors.error + '10',
          borderColor: themeColors.error + '30',
        },
        message: {
          fontSize: 14,
          textAlign: 'center',
          marginBottom: spacing.md,
          color: themeColors.error,
        },
        button: {
          alignSelf: 'center',
        },
      };
    });

    return (
      <View style={styles.container}>
        <Text style={styles.message}>{message}</Text>
        {onRetry && (
          <Button
            title="Retry"
            onPress={onRetry}
            variant="outline"
            size="sm"
            style={styles.button}
          />
        )}
      </View>
    );
  },
);
