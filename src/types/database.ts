export type Json =
  | string
  | number
  | boolean
  | null
  | {[key: string]: Json | undefined}
  | Json[];

export type Database = {
  public: {
    Tables: {
      content_blocks: {
        Row: {
          id: string;
          parent_type: string;
          parent_id: string;
          block_type: string;
          display_order: number;
          content: Json;
          language_id: string | null;
          metadata: Json | null;
          is_available: boolean;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          parent_type: string;
          parent_id: string;
          block_type: string;
          display_order?: number;
          content: Json;
          language_id?: string | null;
          metadata?: Json | null;
          is_available?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          parent_type?: string;
          parent_id?: string;
          block_type?: string;
          display_order?: number;
          content?: Json;
          language_id?: string | null;
          metadata?: Json | null;
          is_available?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      course_progress: {
        Row: {
          id: string;
          user_id: string;
          course_id: string;
          completed_lesson_ids: string[] | null;
          total_lessons: number | null;
          completion_percentage: number | null;
          last_accessed_at: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          course_id: string;
          completed_lesson_ids?: string[] | null;
          total_lessons?: number | null;
          completion_percentage?: number | null;
          last_accessed_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          course_id?: string;
          completed_lesson_ids?: string[] | null;
          total_lessons?: number | null;
          completion_percentage?: number | null;
          last_accessed_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      courses: {
        Row: {
          id: string;
          title: string;
          title_target: string | null;
          description: string | null;
          icon_name: string | null;
          icon_url: string | null;
          color: string;
          display_order: number;
          is_available: boolean;
          language_id: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          title_target?: string | null;
          description?: string | null;
          icon_name?: string | null;
          icon_url?: string | null;
          color?: string;
          display_order?: number;
          is_available?: boolean;
          language_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          title_target?: string | null;
          description?: string | null;
          icon_name?: string | null;
          icon_url?: string | null;
          color?: string;
          display_order?: number;
          is_available?: boolean;
          language_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      exercise_dependencies: {
        Row: {
          id: string;
          exercise_id: string;
          required_exercise_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          exercise_id: string;
          required_exercise_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          exercise_id?: string;
          required_exercise_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      exercise_speakers: {
        Row: {
          id: string;
          exercise_id: string;
          name: string;
          color: string;
          icon: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          exercise_id: string;
          name: string;
          color?: string;
          icon?: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          exercise_id?: string;
          name?: string;
          color?: string;
          icon?: string;
          created_at?: string | null;
        };
        Relationships: [];
      };
      exercise_units: {
        Row: {
          id: string;
          exercise_id: string;
          unit_type: string;
          content: Json;
          metadata: Json | null;
          display_order: number;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          exercise_id: string;
          unit_type: string;
          content?: Json;
          metadata?: Json | null;
          display_order?: number;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          exercise_id?: string;
          unit_type?: string;
          content?: Json;
          metadata?: Json | null;
          display_order?: number;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      exercises: {
        Row: {
          id: string;
          lesson_id: string;
          title: string;
          type: string;
          display_order: number;
          estimated_minutes: number;
          is_available: boolean;
          is_required: boolean;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          lesson_id: string;
          title: string;
          type: string;
          display_order?: number;
          estimated_minutes?: number;
          is_available?: boolean;
          is_required?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          lesson_id?: string;
          title?: string;
          type?: string;
          display_order?: number;
          estimated_minutes?: number;
          is_available?: boolean;
          is_required?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      languages: {
        Row: {
          id: string;
          name: string;
          code: string;
          voice_prefix: string | null;
          created_at: string | null;
        };
        Insert: {
          id: string;
          name: string;
          code: string;
          voice_prefix?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          voice_prefix?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      lesson_prerequisites: {
        Row: {
          id: string;
          lesson_id: string;
          prerequisite_lesson_id: string;
          required_completion_count: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          lesson_id: string;
          prerequisite_lesson_id: string;
          required_completion_count?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          lesson_id?: string;
          prerequisite_lesson_id?: string;
          required_completion_count?: number | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      lesson_progress: {
        Row: {
          id: string;
          user_id: string;
          lesson_id: string;
          course_id: string;
          completion_count: number | null;
          completed_sentence_ids: string[] | null;
          completed_exercise_ids: string[] | null;
          total_sentences: number | null;
          attempt_history: Json | null;
          last_completed_at: string | null;
          is_completed: boolean;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          lesson_id: string;
          course_id: string;
          completion_count?: number | null;
          completed_sentence_ids?: string[] | null;
          completed_exercise_ids?: string[] | null;
          total_sentences?: number | null;
          attempt_history?: Json | null;
          last_completed_at?: string | null;
          is_completed?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          lesson_id?: string;
          course_id?: string;
          completion_count?: number | null;
          completed_sentence_ids?: string[] | null;
          completed_exercise_ids?: string[] | null;
          total_sentences?: number | null;
          attempt_history?: Json | null;
          last_completed_at?: string | null;
          is_completed?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      lessons: {
        Row: {
          id: string;
          course_id: string;
          title: string;
          title_target: string | null;
          description: string | null;
          icon_name: string | null;
          icon_url: string | null;
          display_order: number;
          estimated_minutes: number;
          is_available: boolean;
          requires_prerequisites: boolean | null;
          unlock_description: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          course_id: string;
          title: string;
          title_target?: string | null;
          description?: string | null;
          icon_name?: string | null;
          icon_url?: string | null;
          display_order?: number;
          estimated_minutes?: number;
          is_available?: boolean;
          requires_prerequisites?: boolean | null;
          unlock_description?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          course_id?: string;
          title?: string;
          title_target?: string | null;
          description?: string | null;
          icon_name?: string | null;
          icon_url?: string | null;
          display_order?: number;
          estimated_minutes?: number;
          is_available?: boolean;
          requires_prerequisites?: boolean | null;
          unlock_description?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      media_assets: {
        Row: {
          id: string;
          filename: string;
          url: string;
          storage_path: string | null;
          mime_type: string;
          file_size_bytes: number | null;
          asset_type: string;
          metadata: Json | null;
          language_id: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          filename: string;
          url: string;
          storage_path?: string | null;
          mime_type: string;
          file_size_bytes?: number | null;
          asset_type: string;
          metadata?: Json | null;
          language_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          filename?: string;
          url?: string;
          storage_path?: string | null;
          mime_type?: string;
          file_size_bytes?: number | null;
          asset_type?: string;
          metadata?: Json | null;
          language_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          total_xp: number | null;
          current_streak: number | null;
          longest_streak: number | null;
          learning_dialect: string | null;
          learning_language_id: string | null;
          theme_mode: string | null;
          last_activity_date: string | null;
          role: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          total_xp?: number | null;
          current_streak?: number | null;
          longest_streak?: number | null;
          learning_dialect?: string | null;
          learning_language_id?: string | null;
          theme_mode?: string | null;
          last_activity_date?: string | null;
          role?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          total_xp?: number | null;
          current_streak?: number | null;
          longest_streak?: number | null;
          learning_dialect?: string | null;
          learning_language_id?: string | null;
          theme_mode?: string | null;
          last_activity_date?: string | null;
          role?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      sentence_audio: {
        Row: {
          id: string;
          sentence_id: string | null;
          speaker_id: string | null;
          audio_url: string;
          created_by: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          sentence_id?: string | null;
          speaker_id?: string | null;
          audio_url: string;
          created_by?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          sentence_id?: string | null;
          speaker_id?: string | null;
          audio_url?: string;
          created_by?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      speakers: {
        Row: {
          id: string;
          name: string;
          display_name: string;
          dialect: string | null;
          gender: string | null;
          profile_image_url: string | null;
          is_active: boolean | null;
          created_by: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          display_name: string;
          dialect?: string | null;
          gender?: string | null;
          profile_image_url?: string | null;
          is_active?: boolean | null;
          created_by?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          display_name?: string;
          dialect?: string | null;
          gender?: string | null;
          profile_image_url?: string | null;
          is_active?: boolean | null;
          created_by?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      user_achievements: {
        Row: {
          id: string;
          user_id: string;
          achievement_id: string;
          unlocked_at: string | null;
          metadata: Json | null;
          language_id: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          achievement_id: string;
          unlocked_at?: string | null;
          metadata?: Json | null;
          language_id?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          achievement_id?: string;
          unlocked_at?: string | null;
          metadata?: Json | null;
          language_id?: string | null;
        };
        Relationships: [];
      };
      user_language_stats: {
        Row: {
          id: string;
          user_id: string;
          language_id: string;
          total_xp: number | null;
          total_lessons_completed: number | null;
          total_sentences_completed: number | null;
          total_time_spent_minutes: number | null;
          total_mistakes: number | null;
          average_score: number | null;
          current_streak: number | null;
          longest_streak: number | null;
          last_activity_date: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          language_id: string;
          total_xp?: number | null;
          total_lessons_completed?: number | null;
          total_sentences_completed?: number | null;
          total_time_spent_minutes?: number | null;
          total_mistakes?: number | null;
          average_score?: number | null;
          current_streak?: number | null;
          longest_streak?: number | null;
          last_activity_date?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          language_id?: string;
          total_xp?: number | null;
          total_lessons_completed?: number | null;
          total_sentences_completed?: number | null;
          total_time_spent_minutes?: number | null;
          total_mistakes?: number | null;
          average_score?: number | null;
          current_streak?: number | null;
          longest_streak?: number | null;
          last_activity_date?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      user_stats: {
        Row: {
          id: string;
          user_id: string;
          total_lessons_completed: number | null;
          total_sentences_completed: number | null;
          total_time_spent_minutes: number | null;
          total_mistakes: number | null;
          average_score: number | null;
          lessons_completed_today: number | null;
          sentences_completed_today: number | null;
          last_stats_reset_date: string | null;
          best_streak_date: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          total_lessons_completed?: number | null;
          total_sentences_completed?: number | null;
          total_time_spent_minutes?: number | null;
          total_mistakes?: number | null;
          average_score?: number | null;
          lessons_completed_today?: number | null;
          sentences_completed_today?: number | null;
          last_stats_reset_date?: string | null;
          best_streak_date?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          total_lessons_completed?: number | null;
          total_sentences_completed?: number | null;
          total_time_spent_minutes?: number | null;
          total_mistakes?: number | null;
          average_score?: number | null;
          lessons_completed_today?: number | null;
          sentences_completed_today?: number | null;
          last_stats_reset_date?: string | null;
          best_streak_date?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      word_audio: {
        Row: {
          id: string;
          sentence_id: string | null;
          word: string;
          speaker_id: string | null;
          audio_url: string;
          created_by: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          sentence_id?: string | null;
          word: string;
          speaker_id?: string | null;
          audio_url: string;
          created_by?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          sentence_id?: string | null;
          word?: string;
          speaker_id?: string | null;
          audio_url?: string;
          created_by?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T];
// Helper for Views
export type Views<T extends keyof Database['public']['Views']> =
  Database['public']['Views'][T]['Row'];
