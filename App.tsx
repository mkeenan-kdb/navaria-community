import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  View,
  StyleSheet,
  Text,
  Platform,
} from 'react-native';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import {
  ThemeProvider,
  ErrorBoundary,
  GlobalAchievementNotification,
  ThemedStatusBar,
} from '@/components/shared';
import { RootNavigator } from '@/navigation/RootNavigator';
import { initializeAudio, cleanupAudio } from '@/services/audio';

export default function App() {
  const [appReady, setAppReady] = React.useState(false);

  // Load fonts using useFonts hook (works on both native and web)
  const [fontsLoaded] = useFonts({
    MeathFLF: require('./assets/fonts/MeathFLF.ttf'),
    'Ardchlo GC': require('./assets/fonts/ardchlo.otf'),
    'Bunchlo GC': require('./assets/fonts/bungc.otf'),
    'Gearchlo GC': require('./assets/fonts/gear.otf'),
    'Glanchlo GC': require('./assets/fonts/glangc.otf'),
    'Mearchlo GC': require('./assets/fonts/mearchlo.otf'),
    'Mionchlo GC': require('./assets/fonts/mionchlo.otf'),
    'Sraidchlo GC': require('./assets/fonts/SraidchloGC-Regular.otf'),
  });

  // Initialize app
  useEffect(() => {
    async function initializeApp() {
      try {
        console.log('[APP] Initializing app...');
        console.log('[APP] Platform:', Platform.OS);
        console.log('[APP] Fonts loaded:', fontsLoaded);

        // Small delay to ensure everything is ready
        await new Promise(resolve => setTimeout(resolve, 100));

        setAppReady(true);
        console.log('[APP] App ready');
      } catch (error) {
        console.error('[APP] App initialization error:', error);
        setAppReady(true);
      }
    }

    if (fontsLoaded) {
      initializeApp();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    // Initialize audio system on app mount
    (async () => {
      try {
        await initializeAudio();
      } catch (error) {
        console.warn('Failed to initialize audio on app startup:', error);
      }
    })();

    // Cleanup on unmount
    return () => {
      cleanupAudio().catch(error => {
        console.warn('Failed to cleanup audio on app shutdown:', error);
      });
    };
  }, []);

  if (!appReady || !fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text>Loading app...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <ErrorBoundary>
        <ThemeProvider>
          <RootNavigator />
          <GlobalAchievementNotification />
          <ThemedStatusBar />
        </ThemeProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
