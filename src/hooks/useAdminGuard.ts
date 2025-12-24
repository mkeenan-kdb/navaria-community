import {useEffect} from 'react';
import {Alert} from 'react-native';
import {useUserStore} from '@/stores/userStore';

export const useAdminGuard = () => {
  const {profile, isLoading, signOut} = useUserStore();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!profile || profile.role !== 'admin') {
      console.log(
        'AdminGuard: Unauthorized access attempt detected. Signing out.',
      );

      // Sign out directly - this will trigger RootNavigator to switch to Auth stack
      signOut();

      Alert.alert(
        'Unauthorized',
        'You do not have permission to access the admin area.',
      );
    }
  }, [profile, isLoading, signOut]);
};
