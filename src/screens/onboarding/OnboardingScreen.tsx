import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from 'react-native';
import {useUserStore} from '@/stores/userStore';
import {useTheme, Button} from '@/components/shared';
import {useThemedStyles} from '@/hooks/useThemedStyles';
import {createCommonStyles} from '@/theme/commonStyles';
import {spacing, typography, borderRadius} from '@/theme';
import {MediaUploader} from '@/components/admin/MediaUploader';
import {supabase} from '@/services/supabase';
import {Tables} from '@/types/database';

export const OnboardingScreen: React.FC = () => {
  const {createProfileAndLoad} = useUserStore();
  const {colors, isDark} = useTheme();
  const common = createCommonStyles(colors);

  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('irish_std');
  const [availableLanguages, setAvailableLanguages] = useState<
    Tables<'languages'>[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const styles = useThemedStyles(themeColors => {
    const common = createCommonStyles(themeColors);
    return {
      ...common,
      containerExtra: {
        flexGrow: 1,
        padding: spacing.lg,
        backgroundColor: themeColors.background,
      },
      headerExtra: {
        marginBottom: spacing.xl,
      },
      title: {
        fontSize: typography.sizes['3xl'],
        fontWeight: typography.weights.bold,
        color: themeColors.text.primary,
        marginBottom: spacing.sm,
        textAlign: 'center',
      },
      subtitle: {
        fontSize: typography.sizes.base,
        color: themeColors.text.secondary,
        textAlign: 'center',
      },
      section: {
        marginBottom: spacing.xl,
      },
      sectionTitle: {
        fontSize: typography.sizes.lg,
        fontWeight: typography.weights.semibold,
        color: themeColors.text.primary,
        marginBottom: spacing.md,
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
      avatarContainerExtra: {
        marginBottom: spacing.lg,
      },
      avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: themeColors.surface,
        marginBottom: spacing.md,
        borderWidth: 2,
        borderColor: themeColors.border,
      },

      placeholderText: {
        fontSize: typography.sizes['4xl'],
        color: themeColors.text.secondary,
      },
      languageOptionExtra: {
        padding: spacing.md,
        borderWidth: 1,
        borderColor: themeColors.border,
        borderRadius: borderRadius.md,
        marginBottom: spacing.sm,
        backgroundColor: themeColors.surface,
      },
      orText: {
        marginTop: spacing.md,
        marginBottom: spacing.sm,
      } as TextStyle,
      iconContainerExtra: {
        gap: spacing.md,
        flexWrap: 'wrap',
      } as ViewStyle,
      iconButton: {
        borderRadius: 30,
        padding: 2,
      } as ViewStyle,
      iconImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: themeColors.surface,
      } as ImageStyle,
      selectedLanguage: {
        borderColor: themeColors.primary,
        backgroundColor: isDark
          ? themeColors.primary + '20'
          : themeColors.primary + '10',
      },
      languageName: {
        fontSize: typography.sizes.base,
        fontWeight: typography.weights.medium,
        color: themeColors.text.primary,
      },
      errorText: {
        color: themeColors.error,
        marginBottom: spacing.md,
        textAlign: 'center',
      },
      submitButton: {
        marginTop: spacing.xl,
      },
    };
  });

  useEffect(() => {
    loadLanguages();
  }, []);

  const loadLanguages = async () => {
    try {
      const {data, error: supabaseError} = await supabase
        .from('languages')
        .select('*')
        .order('name');

      if (supabaseError) {
        throw supabaseError;
      }
      setAvailableLanguages(data || []);
      if (data && data.length > 0) {
        setSelectedLanguage(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load languages:', err);
      // Fallback if languages fail to load
      setAvailableLanguages([
        {
          id: 'irish_std',
          name: 'Irish (Standard)',
          code: 'ga',
          voice_prefix: null,
          created_at: null,
        },
      ]);
    }
  };

  const handleSubmit = async () => {
    if (!displayName.trim()) {
      setError('Please enter a display name');
      return;
    }

    if (!selectedLanguage) {
      setError('Please select a language');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await createProfileAndLoad(
        displayName,
        avatarUrl || undefined,
        selectedLanguage,
      );
      // Navigation will handle the redirect once profile is loaded
    } catch (err: any) {
      console.error('Onboarding error:', err);
      setError(err.message || 'Failed to create profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={common.flex1}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.containerExtra}
        showsVerticalScrollIndicator={false}>
        <View style={[common.centered, styles.headerExtra]}>
          <Text style={styles.title}>Welcome to Navaria!</Text>
          <Text style={styles.subtitle}>Let's set up your profile.</Text>
        </View>

        {/* Profile Picture */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Picture</Text>
          <View style={[common.centered, styles.avatarContainerExtra]}>
            {avatarUrl ? (
              <Image source={{uri: avatarUrl}} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, common.centered]}>
                <Text style={styles.placeholderText}>
                  {displayName ? displayName.charAt(0).toUpperCase() : '?'}
                </Text>
              </View>
            )}

            <MediaUploader
              mediaType="image"
              bucketName="profile-images"
              onUploadComplete={url => setAvatarUrl(url)}
              compact
            />

            <Text style={[styles.subtitle, styles.orText]}>
              Or choose a default icon:
            </Text>
            <View style={[common.rowCentered, styles.iconContainerExtra]}>
              {[
                'https://api.dicebear.com/9.x/identicon/png?seed=Felix',
                'https://api.dicebear.com/9.x/identicon/png?seed=Aneka',
                'https://api.dicebear.com/9.x/identicon/png?seed=Zoe',
                'https://api.dicebear.com/9.x/identicon/png?seed=Ethan',
                'https://api.dicebear.com/9.x/identicon/png?seed=Bubba',
              ].map((url, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setAvatarUrl(url)}
                  style={[
                    styles.iconButton,
                    {
                      borderWidth: avatarUrl === url ? 3 : 0,
                      borderColor: colors.primary,
                    },
                  ]}>
                  <Image source={{uri: url}} style={styles.iconImage} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Display Name */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Display Name</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={text => setDisplayName(text)}
            placeholder="How should we call you?"
            placeholderTextColor={colors.text.tertiary}
            autoCapitalize="words"
            editable={!loading}
          />
        </View>

        {/* Language Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Which language are you learning?
          </Text>
          {availableLanguages.map(lang => (
            <TouchableOpacity
              key={lang.id}
              style={[
                common.rowCentered,
                styles.languageOptionExtra,
                selectedLanguage === lang.id && styles.selectedLanguage,
              ]}
              onPress={() => setSelectedLanguage(lang.id)}
              disabled={loading}>
              <Text style={styles.languageName}>{lang.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Button
          title={loading ? 'Setting up...' : "Let's Go!"}
          onPress={handleSubmit}
          disabled={loading}
          loading={loading}
          style={styles.submitButton}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
