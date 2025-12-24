import {Platform} from 'react-native';
import {StateStorage} from 'zustand/middleware';

/**
 * Extended storage interface that includes both Zustand StateStorage methods
 * and MMKV-compatible methods for direct usage in services
 */
export interface ExtendedStorage extends StateStorage {
  getString: (key: string) => string | null;
  set: (key: string, value: string) => void;
  clearAll: () => void | Promise<void>; // clearAll can be async for AsyncStorage
}

/**
 * Creates a storage adapter that uses MMKV on native platforms (if available)
 * and falls back to AsyncStorage or localStorage (web).
 *
 * This adapter is compatible with Zustand's persist middleware and also provides
 * MMKV-compatible methods for direct usage.
 */
export const createStorage = (id: string): ExtendedStorage => {
  if (Platform.OS === 'web') {
    return {
      getItem: (name: string) => {
        if (typeof window !== 'undefined') {
          return window.localStorage.getItem(name);
        }
        return null;
      },
      setItem: (name: string, value: string) => {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(name, value);
        }
      },
      removeItem: (name: string) => {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(name);
        }
      },
      getString: (key: string) => {
        if (typeof window !== 'undefined') {
          return window.localStorage.getItem(key);
        }
        return null;
      },
      set: (key: string, value: string) => {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, value);
        }
      },
      clearAll: () => {
        if (typeof window !== 'undefined') {
          window.localStorage.clear();
        }
      },
    };
  }

  // Native: try MMKV, fallback to AsyncStorage
  try {
    console.log(`[STORAGE] Attempting to initialize MMKV for ${id}...`);
    const {createMMKV} = require('react-native-mmkv');

    if (!createMMKV) {
      throw new Error('createMMKV function not found');
    }

    // In react-native-mmkv v4+, use createMMKV() instead of new MMKV()
    const storage = createMMKV({
      id: id,
    });

    console.log(`[STORAGE] Using MMKV storage for ${id}`);
    return {
      getItem: (name: string) => {
        const value = storage.getString(name);
        return value ?? null;
      },
      setItem: (name: string, value: string) => {
        storage.set(name, value);
      },
      removeItem: (name: string) => {
        storage.delete(name);
      },
      getString: (key: string) => {
        const value = storage.getString(key);
        return value ?? null;
      },
      set: (key: string, value: string) => {
        storage.set(key, value);
      },
      clearAll: () => {
        storage.clearAll();
      },
    };
  } catch (error: any) {
    console.warn(
      `[STORAGE] MMKV not available for ${id}, falling back to AsyncStorage:`,
      error.message,
    );

    // Check for common issues
    if (error.message.includes('The native MMKV module could not be found')) {
      console.warn(
        "[STORAGE] This usually means you are running in Expo Go or a dev client that hasn't been rebuilt. MMKV requires a development build.",
      );
    }

    const AsyncStorage =
      require('@react-native-async-storage/async-storage').default;

    return {
      getItem: (name: string) => {
        return AsyncStorage.getItem(name);
      },
      setItem: (name: string, value: string) => {
        return AsyncStorage.setItem(name, value);
      },
      removeItem: (name: string) => {
        return AsyncStorage.removeItem(name);
      },
      getString: (key: string) => {
        return AsyncStorage.getItem(key);
      },
      set: (key: string, value: string) => {
        return AsyncStorage.setItem(key, value);
      },
      clearAll: async () => {
        try {
          await AsyncStorage.clear();
        } catch (e) {
          console.warn('[STORAGE] Failed to clear AsyncStorage:', e);
        }
      },
    };
  }
};

// Default shared storage instance
export const storage = createStorage('app-storage');
