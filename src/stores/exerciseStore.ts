// Lesson state store using Zustand

import {create} from 'zustand';
import {ExerciseState} from './exercise/types';
import {createLessonSlice} from './exercise/lessonSlice';
import {createInputSlice} from './exercise/inputSlice';
import {createNavigationSlice} from './exercise/navigationSlice';
import {createStatsSlice} from './exercise/statsSlice';

export const useExerciseStore = create<ExerciseState>((...a) => ({
  ...createLessonSlice(...a),
  ...createInputSlice(...a),
  ...createNavigationSlice(...a),
  ...createStatsSlice(...a),
}));
