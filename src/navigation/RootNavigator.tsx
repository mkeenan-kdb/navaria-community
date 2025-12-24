import React, {useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import * as Linking from 'expo-linking';
import {DrawerNavigator} from './DrawerNavigator';
import {AdminNavigator} from './AdminNavigator';
import {LoginScreen} from '@/screens/auth/LoginScreen';
import {SignupScreen} from '@/screens/auth/SignupScreen';
import {OnboardingScreen} from '@/screens/onboarding/OnboardingScreen';
import {useUserStore} from '@/stores/userStore';
import {AppLoadingSpinner} from '@/components/shared';
import {Platform} from 'react-native';

const Stack = createStackNavigator();

const linking = {
  prefixes: [
    Linking.createURL('/'),
    'https://navaria.app/app',
    'http://localhost:8081', // For local dev
  ],
  config: {
    screens: {
      Main: {
        path: '',
      },
      Admin: {
        path: 'admin',
        screens: {
          Dashboard: '',
        },
      },
      Login: 'login',
      Signup: 'signup',
    },
  },
};

export const RootNavigator: React.FC = () => {
  const {user, profile, isLoading, isInitialized, initialize} = useUserStore();

  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  if (isLoading || !isInitialized) {
    return <AppLoadingSpinner message="Loading Navaria..." />;
  }

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: {flex: 1},
        }}>
        {user ? (
          // Authenticated stack
          <>
            {!profile ? (
              // User is authenticated but hasn't created a profile yet
              <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            ) : (
              // User has profile and is fully onboarded
              <>
                <Stack.Screen name="Main" component={DrawerNavigator} />
                {/* Only show Admin routes if user has admin role or we are in dev/web to allow testing */}
                {(profile?.role === 'admin' || Platform.OS === 'web') && (
                  <Stack.Screen name="Admin" component={AdminNavigator} />
                )}
              </>
            )}
          </>
        ) : (
          // Auth stack
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
