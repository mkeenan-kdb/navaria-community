import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {DashboardScreen} from '@/screens/admin/DashboardScreen';
import {CourseManagerScreen} from '@/screens/admin/CourseManagerScreen';
import {LessonEditorScreen} from '@/screens/admin/LessonEditorScreen';
import {CourseContentEditorScreen} from '@/screens/admin/CourseContentEditorScreen';
import {SpeakerManagerScreen} from '@/screens/admin/SpeakerManagerScreen';
import {useAdminGuard} from '@/hooks/useAdminGuard';

const Stack = createStackNavigator();

export const AdminNavigator: React.FC = () => {
  useAdminGuard();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: {flex: 1},
      }}>
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="CourseManager" component={CourseManagerScreen} />
      <Stack.Screen name="LessonEditor" component={LessonEditorScreen} />
      <Stack.Screen
        name="CourseContentEditor"
        component={CourseContentEditorScreen}
      />
      <Stack.Screen name="SpeakerManager" component={SpeakerManagerScreen} />
    </Stack.Navigator>
  );
};
