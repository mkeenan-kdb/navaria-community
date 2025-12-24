import {ExerciseSlice} from './types';

export const createStatsSlice: ExerciseSlice<any> = (set, get) => ({
  sessionStartTime: Date.now(),
  mistakes: 0,
  sessionXP: 0,
  lastClickPosition: null as {x: number; y: number} | null,

  getSessionStats: () => {
    const state = get();
    const timeSpentMs = Date.now() - state.sessionStartTime;
    const timeSpentMinutes = Math.round(timeSpentMs / 60000);
    return {
      timeSpentMinutes: Math.max(1, timeSpentMinutes),
      mistakes: state.mistakes,
      sessionXP: state.sessionXP,
    };
  },

  addSessionXP: (amount: number) => {
    set((state: any) => ({sessionXP: state.sessionXP + amount}));
  },

  setLastClickPosition: (position: {x: number; y: number} | null) => {
    set({lastClickPosition: position});
  },
});
