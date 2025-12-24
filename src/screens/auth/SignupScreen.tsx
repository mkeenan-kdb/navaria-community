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
import {ProgressBar} from '@/components/shared/ProgressBar';
import {useUserStore} from '@/stores/userStore';
import {spacing, typography, borderRadius} from '@/theme';
import {useThemedStyles} from '@/hooks/useThemedStyles';
import {createCommonStyles} from '@/theme/commonStyles';
import type {RootStackParamList} from '@/navigation/types';

export const SignupScreen: React.FC = () => {
  const {colors, isDark} = useTheme();
  const navigation =
    useNavigation<
      import('@react-navigation/native').NavigationProp<RootStackParamList>
    >();
  const {signUp, clearError} = useUserStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [success, setSuccess] = useState(false);

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
      successContent: {
        alignItems: 'center',
        padding: spacing.lg,
        gap: spacing.md,
      },
      successTitle: {
        fontSize: typography.sizes.xl,
        fontWeight: typography.weights.bold,
        color: themeColors.primary,
        textAlign: 'center',
      },
      successText: {
        fontSize: typography.sizes.base,
        color: themeColors.text.primary,
        textAlign: 'center',
        lineHeight: 24,
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
      strengthContainer: {
        gap: spacing.xs,
      },
      strengthText: {
        fontSize: typography.sizes.xs,
        fontWeight: typography.weights.medium,
      },
      dialectOptions: {
        gap: spacing.sm,
      },
      dialectOption: {
        borderWidth: 2,
        borderRadius: borderRadius.md,
        padding: spacing.md,
      },
      dialectLabel: {
        fontSize: typography.sizes.base,
        fontWeight: typography.weights.semibold,
        marginBottom: spacing.xs,
      },
      dialectDescription: {
        fontSize: typography.sizes.sm,
        color: themeColors.text.secondary,
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
        color: themeColors.tiontuRed,
      },
    };
  });

  const calculatePasswordStrength = (pwd: string): number => {
    let score = 0;
    if (pwd.length >= 8) {
      score += 20;
    }
    if (pwd.length >= 12) {
      score += 20;
    }
    if (/[a-z]/.test(pwd)) {
      score += 20;
    }
    if (/[A-Z]/.test(pwd)) {
      score += 20;
    }
    if (/[0-9]/.test(pwd)) {
      score += 10;
    }
    if (/[^a-zA-Z0-9]/.test(pwd)) {
      score += 10;
    }
    return Math.min(100, score);
  };

  const passwordStrength = calculatePasswordStrength(password);
  const getStrengthColor = () => {
    if (passwordStrength < 40) {
      return colors.error;
    }
    if (passwordStrength < 70) {
      return colors.warning;
    }
    return colors.success;
  };

  const handleSignup = async () => {
    // Validation
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (passwordStrength < 60) {
      setError('Password is too weak. Use uppercase, lowercase, and numbers.');
      return;
    }

    setLoading(true);
    setError('');
    clearError();

    try {
      await signUp(email, password);
      setSuccess(true);
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.container}>
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
          </View>

          <Card style={styles.card}>
            <View style={styles.successContent}>
              <Text style={styles.successTitle}>Check your email!</Text>
              <Text style={styles.successText}>
                Thanks for signing up! We've sent a confirmation link to {email}
                . Please verify your email address to continue.
              </Text>
              <Button
                title="Back to Sign In"
                onPress={() => navigation.navigate('Login')}
                style={styles.button}
              />
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

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

        {/* Signup Form */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Create Account</Text>

          {error ? <ErrorMessage message={error} /> : null}

          <View style={styles.form}>
            {/* Email */}
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

            {/* Password */}
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
              {password.length > 0 && (
                <View style={styles.strengthContainer}>
                  <ProgressBar
                    progress={passwordStrength}
                    height={4}
                    color={getStrengthColor()}
                  />
                  <Text
                    style={[styles.strengthText, {color: getStrengthColor()}]}>
                    {passwordStrength < 40
                      ? 'Weak'
                      : passwordStrength < 70
                        ? 'Medium'
                        : 'Strong'}
                  </Text>
                </View>
              )}
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.text.tertiary}
                secureTextEntry
                editable={!loading}
              />
            </View>

            <Button
              title={loading ? 'Creating account...' : 'Sign Up'}
              onPress={handleSignup}
              disabled={loading}
              loading={loading}
              style={styles.button}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.link}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
