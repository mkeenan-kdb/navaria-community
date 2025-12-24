import React, {useState} from 'react';
import {View} from 'react-native';
import {
  Sparkles,
  Volume2,
  FastForward,
  Moon,
  Languages,
  Type,
} from 'lucide-react-native';
import {useTheme} from './ThemeProvider';
import {SettingsMenuModal} from './SettingsMenuModal';
import {SettingsMenuItem} from './SettingsMenuModal';
import {FontSelectionModal} from './FontSelectionModal';
import {LanguageSelectionModal} from './LanguageSelectionModal';
import {useSettingsStore} from '@/stores/settingsStore';
import {useUserStore} from '@/stores/userStore';
import {LANGUAGES} from '@/constants';
import {spacing} from '@/theme';

interface AppBarSettingsMenuProps {
  visible: boolean;
  onClose: () => void;
  showExerciseSettings?: boolean; // Show animations, sound, auto-progress
}

export const AppBarSettingsMenu: React.FC<AppBarSettingsMenuProps> = ({
  visible,
  onClose,
  showExerciseSettings = false,
}) => {
  const {colors, isDark, toggleTheme} = useTheme();
  const [showFontModal, setShowFontModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  // Exercise-specific settings
  const {
    animationsEnabled,
    soundEnabled,
    autoProgress,
    toggleAnimations,
    toggleSound,
    toggleAutoProgress,
  } = useSettingsStore();

  const {currentLanguageId} = useUserStore();
  const currentLanguageName =
    LANGUAGES.find(l => l.id === currentLanguageId)?.name || 'Language';

  return (
    <>
      <SettingsMenuModal visible={visible} onClose={onClose} title="Settings">
        {/* Exercise-specific settings */}
        {showExerciseSettings && (
          <>
            <SettingsMenuItem
              label="Animations"
              icon={Sparkles}
              type="toggle"
              value={animationsEnabled}
              onPress={toggleAnimations}
            />
            <SettingsMenuItem
              label="Sound Effects"
              icon={Volume2}
              type="toggle"
              value={soundEnabled}
              onPress={toggleSound}
            />
            <SettingsMenuItem
              label="Auto-Progress"
              icon={FastForward}
              type="toggle"
              value={autoProgress}
              onPress={toggleAutoProgress}
            />
            <View
              style={{
                height: 1,
                backgroundColor: colors.border,
                marginVertical: spacing.xs,
              }}
            />
          </>
        )}

        {/* Global settings */}
        <SettingsMenuItem
          label="Dark Mode"
          icon={Moon}
          type="toggle"
          value={isDark}
          onPress={toggleTheme}
        />
        <View
          style={{
            height: 1,
            backgroundColor: colors.border,
            marginVertical: spacing.xs,
          }}
        />
        <SettingsMenuItem
          label="Language"
          value={currentLanguageName}
          icon={Languages}
          onPress={() => {
            onClose();
            setShowLanguageModal(true);
          }}
        />
        <SettingsMenuItem
          label="Font Selection"
          icon={Type}
          onPress={() => {
            onClose();
            setShowFontModal(true);
          }}
        />
      </SettingsMenuModal>

      {/* Font Selection Modal */}
      <FontSelectionModal
        visible={showFontModal}
        onClose={() => setShowFontModal(false)}
      />

      {/* Language Selection Modal */}
      <LanguageSelectionModal
        visible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
      />
    </>
  );
};
