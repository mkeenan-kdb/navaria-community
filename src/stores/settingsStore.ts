import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import {createStorage} from '@/services/storage';

interface SettingsState {
  soundEnabled: boolean;
  animationsEnabled: boolean;
  autoProgress: boolean;

  toggleSound: () => void;
  toggleAnimations: () => void;
  toggleAutoProgress: () => void;

  setSoundEnabled: (enabled: boolean) => void;
  setAnimationsEnabled: (enabled: boolean) => void;
  setAutoProgress: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    set => ({
      soundEnabled: true,
      animationsEnabled: true,
      autoProgress: true, // Default to true as per current behavior

      toggleSound: () => set(state => ({soundEnabled: !state.soundEnabled})),
      toggleAnimations: () =>
        set(state => ({animationsEnabled: !state.animationsEnabled})),
      toggleAutoProgress: () =>
        set(state => ({autoProgress: !state.autoProgress})),

      setSoundEnabled: enabled => set({soundEnabled: enabled}),
      setAnimationsEnabled: enabled => set({animationsEnabled: enabled}),
      setAutoProgress: enabled => set({autoProgress: enabled}),
    }),
    {
      name: 'app-settings',
      storage: createJSONStorage(() => createStorage('app-settings')),
    },
  ),
);
