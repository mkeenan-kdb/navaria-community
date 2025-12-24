// Navigation type definitions for React Navigation

import type {NavigatorScreenParams} from '@react-navigation/native';

// Root Stack Navigator (Auth + Main)
export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Main: NavigatorScreenParams<DrawerParamList>;
};

// Drawer Navigator
export type DrawerParamList = {
  Home: undefined;
  Courses: NavigatorScreenParams<CoursesStackParamList>;
  SeanchloTyper: undefined; // Assuming this stays? It wasn't explicitly asked to be removed, but "grammar and vocabulary sections" were. SeanchloTyper is a tool. I'll keep it for now unless I see reason not to.
  Profile: undefined;
};

// Courses Stack Navigator
export type CoursesStackParamList = {
  CourseSelection: undefined;
  CourseContent: {courseId: string};
  LessonContent: {lessonId: string; courseId: string};
  Exercise: {lessonId: string; exerciseId: string; totalLessonUnits?: number};
};

// Combine all param lists for useNavigation hook
export type RootNavigationProp =
  import('@react-navigation/native').NavigationProp<RootStackParamList>;
export type CoursesNavigationProp =
  import('@react-navigation/native').NavigationProp<CoursesStackParamList>;
export type DrawerNavigationProp =
  import('@react-navigation/native').NavigationProp<DrawerParamList>;
