// Supabase client configuration for React Native
import {createClient} from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import {Platform} from 'react-native';
import * as Linking from 'expo-linking';
import type {Database} from '@/types/database';

// Get environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials not found. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file',
  );
}

// Platform-specific storage adapter
// Use localStorage on web, SecureStore on native
const createStorageAdapter = () => {
  if (Platform.OS === 'web') {
    // Web: use localStorage
    return {
      getItem: async (key: string) => {
        try {
          if (typeof window !== 'undefined') {
            return window.localStorage.getItem(key);
          }
          return null;
        } catch (error) {
          console.error('Error getting item from localStorage:', error);
          return null;
        }
      },
      setItem: async (key: string, value: string) => {
        try {
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(key, value);
          }
        } catch (error) {
          console.error('Error setting item in localStorage:', error);
        }
      },
      removeItem: async (key: string) => {
        try {
          if (typeof window !== 'undefined') {
            window.localStorage.removeItem(key);
          }
        } catch (error) {
          console.error('Error removing item from localStorage:', error);
        }
      },
    };
  } else {
    // Native: use SecureStore
    return {
      getItem: async (key: string) => {
        try {
          return await SecureStore.getItemAsync(key);
        } catch (error) {
          console.error('Error getting item from SecureStore:', error);
          return null;
        }
      },
      setItem: async (key: string, value: string) => {
        try {
          await SecureStore.setItemAsync(key, value);
        } catch (error) {
          console.error('Error setting item in SecureStore:', error);
        }
      },
      removeItem: async (key: string) => {
        try {
          await SecureStore.deleteItemAsync(key);
        } catch (error) {
          console.error('Error removing item from SecureStore:', error);
        }
      },
    };
  }
};

export const ExpoSecureStoreAdapter = createStorageAdapter();

export const zustandStorage = {
  getItem: (name: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      return window.localStorage.getItem(name);
    }
    return SecureStore.getItem(name);
  },
  setItem: (name: string, value: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.localStorage.setItem(name, value);
    } else {
      SecureStore.setItem(name, value);
    }
  },
  removeItem: (name: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.localStorage.removeItem(name);
    } else {
      SecureStore.deleteItemAsync(name);
    }
  },
};

const SUPABASE_AUTH_STORAGE_KEY = 'navaria-auth-session';

// Create Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    storageKey: SUPABASE_AUTH_STORAGE_KEY,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'x-client-info': 'navaria-app',
    },
  },
  db: {
    schema: 'public',
  },
  // Add timeout to prevent infinite hangs
  realtime: {
    timeout: 10000, // 10 seconds
  },
});

// Helper functions for profile operations
export const profiles = {
  async getProfile(userId: string) {
    const {data, error} = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      throw error;
    }
    return data;
  },

  async createProfile(
    userId: string,
    email: string,
    displayName?: string,
    avatarUrl?: string,
    languageId?: string,
  ) {
    const {data, error} = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: email,
        display_name: displayName || email.split('@')[0],
        avatar_url: avatarUrl,
        total_xp: 0,
        current_streak: 0,
        longest_streak: 0,
        learning_dialect: 'connacht', // Default, can be updated later
        learning_language_id: languageId || 'irish_std',
        theme_mode: 'system',
        last_activity_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        role: 'user',
      } as any) // Cast to any because avatar_url might not be in generated types yet
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data;
  },

  async updateProfile(
    userId: string,
    updates: Partial<Database['public']['Tables']['profiles']['Update']>,
  ) {
    const {data, error} = await (supabase as any)
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data;
  },

  async updateStreak(userId: string) {
    const {data: profile, error: fetchError} = await (supabase as any)
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    const today = new Date().toISOString().split('T')[0];
    const rawLastActivity = profile.last_activity_date;
    const lastActivity = rawLastActivity ? rawLastActivity.split('T')[0] : null;

    let newStreak = profile.current_streak;
    let newLongest = profile.longest_streak;

    if (!lastActivity || lastActivity !== today) {
      // Check if yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastActivity === yesterdayStr) {
        // Consecutive day
        newStreak = profile.current_streak + 1;
      } else {
        // Streak broken
        newStreak = 1;
      }

      newLongest = Math.max(newStreak, profile.longest_streak);

      const {data, error} = await (supabase as any)
        .from('profiles')
        .update({
          current_streak: newStreak,
          longest_streak: newLongest,
          last_activity_date: today,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw error;
      }
      return data;
    }

    return profile;
  },

  async getUserStats(userId: string) {
    const {data, error} = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw error;
    }
    return data;
  },

  async getUserLanguageStats(userId: string, languageId: string) {
    const {data, error} = await supabase
      .from('user_language_stats')
      .select('*')
      .eq('user_id', userId)
      .eq('language_id', languageId)
      .maybeSingle();

    if (error) {
      throw error;
    }
    return data;
  },

  async resetStreak(userId: string) {
    const {data, error} = await (supabase as any)
      .from('profiles')
      .update({
        current_streak: 0,
        // Don't update last_activity_date or updated_at to strictly preserve
        // the fact that no activity happened today
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data;
  },
};

// Auth helper functions
export const auth = {
  async signIn(email: string, password: string) {
    const {data, error} = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }
    return data;
  },

  async signUp(email: string, password: string) {
    // Use current origin for web (works for any deployment), or deep link for native
    const redirectTo =
      Platform.OS === 'web' && typeof window !== 'undefined'
        ? `${window.location.origin}/app/auth/callback`
        : Linking.createURL('/auth/callback');
    const {data, error} = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      throw error;
    }

    return data;
  },

  async signOut() {
    try {
      const {error} = await supabase.auth.signOut();
      if (error) {
        // Ignore "Auth session missing" error if it happens during sign out logic
        if (error.message && error.message.includes('Auth session missing')) {
          console.warn('Auth session missing during sign out (harmless)');
        } else {
          throw error;
        }
      }
    } finally {
      // ALWAYS force clear the session from storage to prevent "zombie" sessions
      // This ensures that even if Supabase thinks we're signed out but storage isn't,
      // we kill the storage persistence.
      await ExpoSecureStoreAdapter.removeItem(SUPABASE_AUTH_STORAGE_KEY);
    }
  },

  async getSession() {
    const {data, error} = await supabase.auth.getSession();
    if (error) {
      throw error;
    }
    return data.session;
  },

  async getUser() {
    const {data, error} = await supabase.auth.getUser();
    if (error) {
      throw error;
    }
    return data.user;
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },
};

// Add this to your supabase.ts file or create a new utility function
export const schema = {
  async getAllTables() {
    const {data, error} = await (supabase as any)
      .from('information_schema.tables')
      .select('table_name, table_schema')
      .eq('table_schema', 'public')
      .order('table_name');

    if (error) {
      throw error;
    }
    return data;
  },

  async getTableSchema(tableName: string) {
    const {data, error} = await (supabase as any)
      .from('information_schema.columns')
      .select(
        `
        column_name,
        data_type,
        is_nullable,
        column_default,
        ordinal_position
      `,
      )
      .eq('table_schema', 'public')
      .eq('table_name', tableName)
      .order('ordinal_position');

    if (error) {
      throw error;
    }
    return data;
  },

  async getAllTablesWithSchemas() {
    const {data: tables, error: tablesError} = await (supabase as any)
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');

    if (tablesError) {
      throw tablesError;
    }

    const tablesWithSchemas = await Promise.all(
      tables.map(async (table: any) => {
        const {data: columns, error: columnsError} = await (supabase as any)
          .from('information_schema.columns')
          .select(
            `
            column_name,
            data_type,
            is_nullable,
            column_default,
            ordinal_position
          `,
          )
          .eq('table_schema', 'public')
          .eq('table_name', table.table_name)
          .order('ordinal_position');

        if (columnsError) {
          throw columnsError;
        }

        return {
          table_name: table.table_name,
          columns,
        };
      }),
    );

    return tablesWithSchemas;
  },
};
