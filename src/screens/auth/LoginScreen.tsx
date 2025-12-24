import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useTheme, Button, Card, ErrorMessage} from '@/components/shared';
import {useUserStore} from '@/stores/userStore';
import {spacing, typography, borderRadius} from '@/theme';
import {useThemedStyles} from '@/hooks/useThemedStyles';
import {createCommonStyles} from '@/theme/commonStyles';
import type {RootStackParamList} from '@/navigation/types';

export const LoginScreen: React.FC = () => {
  const {colors, isDark} = useTheme();
  const navigation =
    useNavigation<
      import('@react-navigation/native').NavigationProp<RootStackParamList>
    >();
  const {signIn, error: authError, clearError} = useUserStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const styles = useThemedStyles(themeColors => {
    const common = createCommonStyles(themeColors);
    return {
      ...common,
      keyboardView: {
        flex: 1,
      },
      container: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: spacing.lg,
        backgroundColor: themeColors.background,
      },
      header: {
        alignItems: 'center',
        marginBottom: spacing.xl,
      },
      logoContainer: {
        marginBottom: spacing.md,
      },
      logo: {
        width: 150,
        height: 150,
      },
      title: {
        fontSize: typography.sizes['4xl'],
        fontWeight: typography.weights.bold,
        marginBottom: spacing.xs,
        color: themeColors.primary,
        fontFamily: typography.fonts.celtic,
      },
      subtitle: {
        fontSize: typography.sizes.base,
        color: themeColors.text.secondary,
      },
      card: {
        maxWidth: 500,
        width: '100%',
        alignSelf: 'center',
      },
      cardTitle: {
        fontSize: typography.sizes['2xl'],
        fontWeight: typography.weights.bold,
        marginBottom: spacing.lg,
        color: themeColors.tiontuBrown,
      },
      form: {
        gap: spacing.md,
      },
      inputGroup: {
        gap: spacing.sm,
      },
      label: {
        fontSize: typography.sizes.sm,
        fontWeight: typography.weights.medium,
        color: themeColors.text.primary,
      },
      input: {
        borderWidth: 1,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        fontSize: typography.sizes.base,
        backgroundColor: themeColors.surface,
        borderColor: themeColors.border,
        color: themeColors.text.primary,
      },
      button: {
        marginTop: spacing.md,
      },
      footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: spacing.lg,
      },
      footerText: {
        fontSize: typography.sizes.sm,
        color: themeColors.text.secondary,
      },
      link: {
        fontSize: typography.sizes.sm,
        fontWeight: typography.weights.medium,
        color: themeColors.primary,
      },
    };
  });

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    clearError();

    try {
      await signIn(email, password);
      // Navigation will happen automatically via RootNavigator
    } catch (err: any) {
      console.error('Login error:', err);
      setError(
        err.message?.includes('Invalid login credentials')
          ? 'Invalid email or password'
          : err.message || 'Failed to sign in',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled">
        {/* Logo and Brand */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={
                isDark
                  ? require('../../../assets/images/app_logo_circular_original_darkmode.png')
                  : require('../../../assets/images/app_logo_circular_original_lightmode.png')
              }
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>Navaria</Text>
          <Text style={styles.subtitle}>
            Minority languages, Made accessible
          </Text>
        </View>

        {/* Login Form */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Sign In</Text>

          {(error || authError) && (
            <ErrorMessage message={error || authError || ''} />
          )}

          {/* Form Wrapper for Accessibility and Web Semantics */}
          <View
            // @ts-ignore - 'form' role is valid on Web but typed incorrectly in some RN versions
            accessibilityRole={Platform.OS === 'web' ? 'form' : 'none'}
            style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={colors.text.tertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.text.tertiary}
                secureTextEntry
                editable={!loading}
              />
            </View>

            <Button
              title={loading ? 'Signing in...' : 'Sign In'}
              onPress={handleLogin}
              disabled={loading}
              loading={loading}
              style={styles.button}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text style={styles.link}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
