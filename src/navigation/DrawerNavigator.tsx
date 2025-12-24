import React from 'react';
import {createDrawerNavigator} from '@react-navigation/drawer';
import {createStackNavigator} from '@react-navigation/stack';
import {DrawerContent} from '@/components/navigation/DrawerContent';
import {HomeScreen} from '@/screens/home/HomeScreen';
import {CourseSelectionScreen} from '@/screens/courses/CourseSelectionScreen';
import {CourseContentScreen} from '@/screens/courses/CourseContentScreen';
import {LessonContentScreen} from '@/screens/courses/LessonContentScreen';
import {ExerciseScreen} from '@/screens/exercise/ExerciseScreen';
import {ProfileScreen} from '@/screens/profile/ProfileScreen';
import {SeanchloTyperScreen} from '@/screens/tools/SeanchloTyperScreen';

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

// Courses stack navigator (for navigating from course selection to acts to lessons)
const CoursesStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: {flex: 1},
      }}>
      <Stack.Screen name="CourseSelection" component={CourseSelectionScreen} />
      <Stack.Screen name="CourseContent" component={CourseContentScreen} />
      <Stack.Screen name="LessonContent" component={LessonContentScreen} />
      <Stack.Screen name="Exercise" component={ExerciseScreen} />
    </Stack.Navigator>
  );
};

const renderDrawerContent = (props: any) => <DrawerContent {...props} />;

export const DrawerNavigator: React.FC = () => {
  return (
    <Drawer.Navigator
      drawerContent={renderDrawerContent}
      screenOptions={{
        headerShown: false,
      }}>
      <Drawer.Screen name="Home" component={HomeScreen} />
      <Drawer.Screen name="Courses" component={CoursesStack} />
      <Drawer.Screen name="SeanchloTyper" component={SeanchloTyperScreen} />
      <Drawer.Screen name="Profile" component={ProfileScreen} />
    </Drawer.Navigator>
  );
};
