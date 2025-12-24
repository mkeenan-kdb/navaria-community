-- ============================================================================
-- Navaria Database Setup
-- ============================================================================
-- This script initializes a complete Navaria database instance
-- Run this in your Supabase SQL Editor to set up everything
--
-- What this includes:
-- - Storage buckets (created FIRST)
-- - All database tables and schemas
-- - Row Level Security (RLS) policies  
-- - Storage policies
-- - Functions and triggers
-- - Indexes for performance
--
-- Usage:
-- 1. Create a new Supabase project
-- 2. Go to SQL Editor
-- 3. Copy and paste this entire file
-- 4. Click "Run"
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- STORAGE BUCKETS (CREATE FIRST!)
-- ============================================================================
-- Buckets must exist before policies can reference them

-- Bucket 1: Course media (audio files, images)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course_media',
  'course_media',
  true,
  10485760, -- 10 MB
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Bucket 2: Profile images  
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-images',
  'profile-images',
  true,
  2097152, -- 2 MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Bucket 3: Content drafts (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'content_drafts',
  'content_drafts',
  false, -- Private
  5242880, -- 5 MB
  ARRAY['application/json']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================================
-- TABLES, POLICIES, AND FUNCTIONS
-- ============================================================================

drop extension if exists "pg_net";


  create table "public"."content_blocks" (
    "id" uuid not null default gen_random_uuid(),
    "parent_type" text not null,
    "parent_id" uuid not null,
    "block_type" text not null,
    "display_order" integer not null default 0,
    "content" jsonb not null,
    "language_id" text default 'irish_std'::text,
    "metadata" jsonb default '{}'::jsonb,
    "is_available" boolean not null default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."content_blocks" enable row level security;


  create table "public"."course_progress" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "course_id" uuid not null,
    "completed_lesson_ids" uuid[] default '{}'::uuid[],
    "total_lessons" integer default 0,
    "completion_percentage" numeric(5,2) default 0,
    "last_accessed_at" timestamp with time zone default now(),
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."course_progress" enable row level security;


  create table "public"."courses" (
    "id" uuid not null default gen_random_uuid(),
    "title" text not null,
    "title_target" text,
    "description" text,
    "icon_name" text,
    "icon_url" text,
    "color" text not null default '#2196F3'::text,
    "display_order" integer not null default 0,
    "is_available" boolean not null default true,
    "language_id" text default 'irish_std'::text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."courses" enable row level security;


  create table "public"."exercise_dependencies" (
    "id" uuid not null default gen_random_uuid(),
    "exercise_id" uuid not null,
    "required_exercise_id" uuid not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."exercise_dependencies" enable row level security;


  create table "public"."exercise_speakers" (
    "id" uuid not null default gen_random_uuid(),
    "exercise_id" uuid not null,
    "name" text not null,
    "color" text not null default '#2196F3'::text,
    "icon" text not null default 'account'::text,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."exercise_speakers" enable row level security;


  create table "public"."exercise_units" (
    "id" uuid not null default gen_random_uuid(),
    "exercise_id" uuid not null,
    "unit_type" text not null,
    "content" jsonb not null default '{}'::jsonb,
    "metadata" jsonb default '{}'::jsonb,
    "display_order" integer not null default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."exercise_units" enable row level security;


  create table "public"."exercises" (
    "id" uuid not null default gen_random_uuid(),
    "lesson_id" uuid not null,
    "title" text not null,
    "type" text not null,
    "display_order" integer not null default 0,
    "estimated_minutes" integer not null default 5,
    "is_available" boolean not null default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "is_required" boolean not null default true
      );


alter table "public"."exercises" enable row level security;


  create table "public"."languages" (
    "id" text not null,
    "name" text not null,
    "code" text not null,
    "voice_prefix" text,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."lesson_prerequisites" (
    "id" uuid not null default gen_random_uuid(),
    "lesson_id" uuid not null,
    "prerequisite_lesson_id" uuid not null,
    "required_completion_count" integer default 1,
    "required_tree_level" integer default 0,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."lesson_prerequisites" enable row level security;


  create table "public"."lesson_progress" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "lesson_id" uuid not null,
    "course_id" uuid not null,
    "tree_level" integer default 0,
    "completion_count" integer default 0,
    "completed_sentence_ids" uuid[] default '{}'::uuid[],
    "total_sentences" integer default 0,
    "attempt_history" jsonb default '[]'::jsonb,
    "last_completed_at" timestamp with time zone,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "completed_exercise_ids" uuid[] default '{}'::uuid[],
    "is_completed" boolean not null default false
      );


alter table "public"."lesson_progress" enable row level security;


  create table "public"."lessons" (
    "id" uuid not null default gen_random_uuid(),
    "course_id" uuid not null,
    "title" text not null,
    "title_target" text,
    "description" text,
    "icon_name" text,
    "icon_url" text,
    "display_order" integer not null default 0,
    "estimated_minutes" integer not null default 5,
    "is_available" boolean not null default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "requires_prerequisites" boolean default false,
    "unlock_description" text
      );


alter table "public"."lessons" enable row level security;


  create table "public"."media_assets" (
    "id" uuid not null default gen_random_uuid(),
    "filename" text not null,
    "url" text not null,
    "storage_path" text,
    "mime_type" text not null,
    "file_size_bytes" integer,
    "asset_type" text not null,
    "metadata" jsonb default '{}'::jsonb,
    "language_id" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."media_assets" enable row level security;


  create table "public"."profiles" (
    "id" uuid not null,
    "email" text not null,
    "display_name" text,
    "total_xp" integer default 0,
    "current_streak" integer default 0,
    "longest_streak" integer default 0,
    "learning_dialect" text default 'munster'::text,
    "learning_language_id" text default 'irish_std'::text,
    "theme_mode" text default 'system'::text,
    "last_activity_date" timestamp with time zone,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "role" text default 'user'::text
      );


alter table "public"."profiles" enable row level security;


  create table "public"."sentence_audio" (
    "id" uuid not null default gen_random_uuid(),
    "sentence_id" uuid,
    "speaker_id" uuid,
    "audio_url" text not null,
    "created_by" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."sentence_audio" enable row level security;


  create table "public"."speakers" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "display_name" text not null,
    "dialect" text,
    "gender" text,
    "profile_image_url" text,
    "is_active" boolean default true,
    "created_by" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."speakers" enable row level security;


  create table "public"."user_achievements" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "achievement_id" text not null,
    "unlocked_at" timestamp with time zone default now(),
    "metadata" jsonb,
    "language_id" text
      );


alter table "public"."user_achievements" enable row level security;


  create table "public"."user_language_stats" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "language_id" text not null,
    "total_xp" integer default 0,
    "total_lessons_completed" integer default 0,
    "total_sentences_completed" integer default 0,
    "total_time_spent_minutes" integer default 0,
    "total_mistakes" integer default 0,
    "average_score" numeric(5,2) default 0,
    "current_streak" integer default 0,
    "longest_streak" integer default 0,
    "last_activity_date" timestamp with time zone,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."user_language_stats" enable row level security;


  create table "public"."user_stats" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "total_lessons_completed" integer default 0,
    "total_sentences_completed" integer default 0,
    "total_time_spent_minutes" integer default 0,
    "total_mistakes" integer default 0,
    "average_score" numeric(5,2) default 0,
    "lessons_completed_today" integer default 0,
    "sentences_completed_today" integer default 0,
    "last_stats_reset_date" date default CURRENT_DATE,
    "best_streak_date" date,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."user_stats" enable row level security;


  create table "public"."word_audio" (
    "id" uuid not null default gen_random_uuid(),
    "sentence_id" uuid,
    "word" text not null,
    "speaker_id" uuid,
    "audio_url" text not null,
    "created_by" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."word_audio" enable row level security;

CREATE UNIQUE INDEX content_blocks_parent_order ON public.content_blocks USING btree (parent_type, parent_id, display_order, language_id);

CREATE UNIQUE INDEX content_blocks_pkey ON public.content_blocks USING btree (id);

CREATE UNIQUE INDEX course_progress_pkey ON public.course_progress USING btree (id);

CREATE UNIQUE INDEX course_progress_user_id_course_id_key ON public.course_progress USING btree (user_id, course_id);

CREATE UNIQUE INDEX courses_pkey ON public.courses USING btree (id);

CREATE UNIQUE INDEX courses_title_key ON public.courses USING btree (title);

CREATE UNIQUE INDEX exercise_dependencies_pkey ON public.exercise_dependencies USING btree (id);

CREATE UNIQUE INDEX exercise_speakers_pkey ON public.exercise_speakers USING btree (id);

CREATE UNIQUE INDEX exercise_units_pkey ON public.exercise_units USING btree (id);

CREATE UNIQUE INDEX exercises_pkey ON public.exercises USING btree (id);

CREATE INDEX idx_content_blocks_parent ON public.content_blocks USING btree (parent_type, parent_id, language_id);

CREATE INDEX idx_course_progress_course ON public.course_progress USING btree (course_id);

CREATE INDEX idx_course_progress_last_accessed ON public.course_progress USING btree (last_accessed_at DESC);

CREATE INDEX idx_course_progress_user ON public.course_progress USING btree (user_id);

CREATE INDEX idx_courses_availability ON public.courses USING btree (is_available);

CREATE INDEX idx_courses_display_order ON public.courses USING btree (display_order) WHERE (is_available = true);

CREATE INDEX idx_courses_language ON public.courses USING btree (language_id);

CREATE INDEX idx_exercise_dependencies_exercise_id ON public.exercise_dependencies USING btree (exercise_id);

CREATE INDEX idx_exercise_dependencies_required_exercise_id ON public.exercise_dependencies USING btree (required_exercise_id);

CREATE INDEX idx_exercise_speakers_exercise_id ON public.exercise_speakers USING btree (exercise_id);

CREATE INDEX idx_exercises_lesson_id ON public.exercises USING btree (lesson_id);

CREATE INDEX idx_exercises_lesson_order ON public.exercises USING btree (lesson_id, display_order) WHERE (is_available = true);

CREATE INDEX idx_exercises_type ON public.exercises USING btree (type);

CREATE INDEX idx_lesson_prereqs ON public.lesson_prerequisites USING btree (lesson_id);

CREATE INDEX idx_lesson_progress_course ON public.lesson_progress USING btree (course_id);

CREATE INDEX idx_lesson_progress_last_completed ON public.lesson_progress USING btree (last_completed_at DESC);

CREATE INDEX idx_lesson_progress_lesson ON public.lesson_progress USING btree (lesson_id);

CREATE INDEX idx_lesson_progress_user ON public.lesson_progress USING btree (user_id);

CREATE INDEX idx_lesson_progress_user_course ON public.lesson_progress USING btree (user_id, course_id);

CREATE INDEX idx_lessons_course_id ON public.lessons USING btree (course_id);

CREATE INDEX idx_lessons_course_order ON public.lessons USING btree (course_id, display_order) WHERE (is_available = true);

CREATE INDEX idx_profiles_email ON public.profiles USING btree (email);

CREATE INDEX idx_profiles_last_activity ON public.profiles USING btree (last_activity_date DESC);

CREATE INDEX idx_user_achievements_user ON public.user_achievements USING btree (user_id);

CREATE INDEX idx_user_language_stats_language ON public.user_language_stats USING btree (language_id);

CREATE INDEX idx_user_language_stats_user ON public.user_language_stats USING btree (user_id);

CREATE INDEX idx_user_stats_reset_date ON public.user_stats USING btree (last_stats_reset_date);

CREATE INDEX idx_user_stats_user ON public.user_stats USING btree (user_id);

CREATE UNIQUE INDEX languages_pkey ON public.languages USING btree (id);

CREATE UNIQUE INDEX lesson_prerequisites_pkey ON public.lesson_prerequisites USING btree (id);

CREATE UNIQUE INDEX lesson_progress_pkey ON public.lesson_progress USING btree (id);

CREATE UNIQUE INDEX lesson_progress_user_id_lesson_id_key ON public.lesson_progress USING btree (user_id, lesson_id);

CREATE UNIQUE INDEX lessons_pkey ON public.lessons USING btree (id);

CREATE UNIQUE INDEX media_assets_pkey ON public.media_assets USING btree (id);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX sentence_audio_pkey ON public.sentence_audio USING btree (id);

CREATE UNIQUE INDEX sentence_audio_sentence_id_speaker_id_key ON public.sentence_audio USING btree (sentence_id, speaker_id);

CREATE UNIQUE INDEX speakers_pkey ON public.speakers USING btree (id);

CREATE UNIQUE INDEX unique_exercise_dependency ON public.exercise_dependencies USING btree (exercise_id, required_exercise_id);

CREATE UNIQUE INDEX unique_prerequisite ON public.lesson_prerequisites USING btree (lesson_id, prerequisite_lesson_id);

CREATE UNIQUE INDEX user_achievements_pkey ON public.user_achievements USING btree (id);

CREATE UNIQUE INDEX user_achievements_user_id_achievement_id_language_id_key ON public.user_achievements USING btree (user_id, achievement_id, language_id);

CREATE UNIQUE INDEX user_language_stats_pkey ON public.user_language_stats USING btree (id);

CREATE UNIQUE INDEX user_language_stats_user_id_language_id_key ON public.user_language_stats USING btree (user_id, language_id);

CREATE UNIQUE INDEX user_stats_pkey ON public.user_stats USING btree (id);

CREATE UNIQUE INDEX user_stats_user_id_key ON public.user_stats USING btree (user_id);

CREATE UNIQUE INDEX word_audio_pkey ON public.word_audio USING btree (id);

CREATE UNIQUE INDEX word_audio_sentence_id_word_speaker_id_key ON public.word_audio USING btree (sentence_id, word, speaker_id);

alter table "public"."content_blocks" add constraint "content_blocks_pkey" PRIMARY KEY using index "content_blocks_pkey";

alter table "public"."course_progress" add constraint "course_progress_pkey" PRIMARY KEY using index "course_progress_pkey";

alter table "public"."courses" add constraint "courses_pkey" PRIMARY KEY using index "courses_pkey";

alter table "public"."exercise_dependencies" add constraint "exercise_dependencies_pkey" PRIMARY KEY using index "exercise_dependencies_pkey";

alter table "public"."exercise_speakers" add constraint "exercise_speakers_pkey" PRIMARY KEY using index "exercise_speakers_pkey";

alter table "public"."exercise_units" add constraint "exercise_units_pkey" PRIMARY KEY using index "exercise_units_pkey";

alter table "public"."exercises" add constraint "exercises_pkey" PRIMARY KEY using index "exercises_pkey";

alter table "public"."languages" add constraint "languages_pkey" PRIMARY KEY using index "languages_pkey";

alter table "public"."lesson_prerequisites" add constraint "lesson_prerequisites_pkey" PRIMARY KEY using index "lesson_prerequisites_pkey";

alter table "public"."lesson_progress" add constraint "lesson_progress_pkey" PRIMARY KEY using index "lesson_progress_pkey";

alter table "public"."lessons" add constraint "lessons_pkey" PRIMARY KEY using index "lessons_pkey";

alter table "public"."media_assets" add constraint "media_assets_pkey" PRIMARY KEY using index "media_assets_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."sentence_audio" add constraint "sentence_audio_pkey" PRIMARY KEY using index "sentence_audio_pkey";

alter table "public"."speakers" add constraint "speakers_pkey" PRIMARY KEY using index "speakers_pkey";

alter table "public"."user_achievements" add constraint "user_achievements_pkey" PRIMARY KEY using index "user_achievements_pkey";

alter table "public"."user_language_stats" add constraint "user_language_stats_pkey" PRIMARY KEY using index "user_language_stats_pkey";

alter table "public"."user_stats" add constraint "user_stats_pkey" PRIMARY KEY using index "user_stats_pkey";

alter table "public"."word_audio" add constraint "word_audio_pkey" PRIMARY KEY using index "word_audio_pkey";

alter table "public"."content_blocks" add constraint "content_blocks_block_type_check" CHECK ((block_type = ANY (ARRAY['text'::text, 'image'::text, 'video'::text, 'exercise'::text, 'audio'::text, 'lesson'::text]))) not valid;

alter table "public"."content_blocks" validate constraint "content_blocks_block_type_check";

alter table "public"."content_blocks" add constraint "content_blocks_language_id_fkey" FOREIGN KEY (language_id) REFERENCES public.languages(id) not valid;

alter table "public"."content_blocks" validate constraint "content_blocks_language_id_fkey";

alter table "public"."content_blocks" add constraint "content_blocks_parent_order" UNIQUE using index "content_blocks_parent_order";

alter table "public"."content_blocks" add constraint "content_blocks_parent_type_check" CHECK ((parent_type = ANY (ARRAY['course'::text, 'lesson'::text]))) not valid;

alter table "public"."content_blocks" validate constraint "content_blocks_parent_type_check";

alter table "public"."course_progress" add constraint "course_progress_completion_percentage_check" CHECK (((completion_percentage >= (0)::numeric) AND (completion_percentage <= (100)::numeric))) not valid;

alter table "public"."course_progress" validate constraint "course_progress_completion_percentage_check";

alter table "public"."course_progress" add constraint "course_progress_course_id_fkey" FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE not valid;

alter table "public"."course_progress" validate constraint "course_progress_course_id_fkey";

alter table "public"."course_progress" add constraint "course_progress_total_lessons_check" CHECK ((total_lessons >= 0)) not valid;

alter table "public"."course_progress" validate constraint "course_progress_total_lessons_check";

alter table "public"."course_progress" add constraint "course_progress_user_id_course_id_key" UNIQUE using index "course_progress_user_id_course_id_key";

alter table "public"."course_progress" add constraint "course_progress_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."course_progress" validate constraint "course_progress_user_id_fkey";

alter table "public"."courses" add constraint "courses_language_id_fkey" FOREIGN KEY (language_id) REFERENCES public.languages(id) not valid;

alter table "public"."courses" validate constraint "courses_language_id_fkey";

alter table "public"."courses" add constraint "courses_title_key" UNIQUE using index "courses_title_key";

alter table "public"."exercise_dependencies" add constraint "exercise_dependencies_exercise_id_fkey" FOREIGN KEY (exercise_id) REFERENCES public.exercises(id) ON DELETE CASCADE not valid;

alter table "public"."exercise_dependencies" validate constraint "exercise_dependencies_exercise_id_fkey";

alter table "public"."exercise_dependencies" add constraint "exercise_dependencies_required_exercise_id_fkey" FOREIGN KEY (required_exercise_id) REFERENCES public.exercises(id) ON DELETE CASCADE not valid;

alter table "public"."exercise_dependencies" validate constraint "exercise_dependencies_required_exercise_id_fkey";

alter table "public"."exercise_dependencies" add constraint "no_self_dependency" CHECK ((exercise_id <> required_exercise_id)) not valid;

alter table "public"."exercise_dependencies" validate constraint "no_self_dependency";

alter table "public"."exercise_dependencies" add constraint "unique_exercise_dependency" UNIQUE using index "unique_exercise_dependency";

alter table "public"."exercise_speakers" add constraint "exercise_speakers_exercise_id_fkey" FOREIGN KEY (exercise_id) REFERENCES public.exercises(id) ON DELETE CASCADE not valid;

alter table "public"."exercise_speakers" validate constraint "exercise_speakers_exercise_id_fkey";

alter table "public"."exercise_units" add constraint "exercise_units_exercise_id_fkey" FOREIGN KEY (exercise_id) REFERENCES public.exercises(id) ON DELETE CASCADE not valid;

alter table "public"."exercise_units" validate constraint "exercise_units_exercise_id_fkey";

alter table "public"."exercises" add constraint "exercises_lesson_id_fkey" FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE not valid;

alter table "public"."exercises" validate constraint "exercises_lesson_id_fkey";

alter table "public"."exercises" add constraint "exercises_type_check" CHECK ((type = ANY (ARRAY['standard'::text, 'matching_pairs'::text, 'cloze'::text]))) not valid;

alter table "public"."exercises" validate constraint "exercises_type_check";

alter table "public"."lesson_prerequisites" add constraint "lesson_prerequisites_lesson_id_fkey" FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE not valid;

alter table "public"."lesson_prerequisites" validate constraint "lesson_prerequisites_lesson_id_fkey";

alter table "public"."lesson_prerequisites" add constraint "lesson_prerequisites_prerequisite_lesson_id_fkey" FOREIGN KEY (prerequisite_lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE not valid;

alter table "public"."lesson_prerequisites" validate constraint "lesson_prerequisites_prerequisite_lesson_id_fkey";

alter table "public"."lesson_prerequisites" add constraint "lesson_prerequisites_required_completion_count_check" CHECK ((required_completion_count > 0)) not valid;

alter table "public"."lesson_prerequisites" validate constraint "lesson_prerequisites_required_completion_count_check";

alter table "public"."lesson_prerequisites" add constraint "lesson_prerequisites_required_tree_level_check" CHECK (((required_tree_level >= 0) AND (required_tree_level <= 10))) not valid;

alter table "public"."lesson_prerequisites" validate constraint "lesson_prerequisites_required_tree_level_check";

alter table "public"."lesson_prerequisites" add constraint "no_self_reference" CHECK ((lesson_id <> prerequisite_lesson_id)) not valid;

alter table "public"."lesson_prerequisites" validate constraint "no_self_reference";

alter table "public"."lesson_prerequisites" add constraint "unique_prerequisite" UNIQUE using index "unique_prerequisite";

alter table "public"."lesson_progress" add constraint "lesson_progress_completion_count_check" CHECK ((completion_count >= 0)) not valid;

alter table "public"."lesson_progress" validate constraint "lesson_progress_completion_count_check";

alter table "public"."lesson_progress" add constraint "lesson_progress_course_id_fkey" FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE not valid;

alter table "public"."lesson_progress" validate constraint "lesson_progress_course_id_fkey";

alter table "public"."lesson_progress" add constraint "lesson_progress_lesson_id_fkey" FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE not valid;

alter table "public"."lesson_progress" validate constraint "lesson_progress_lesson_id_fkey";

alter table "public"."lesson_progress" add constraint "lesson_progress_total_sentences_check" CHECK ((total_sentences >= 0)) not valid;

alter table "public"."lesson_progress" validate constraint "lesson_progress_total_sentences_check";

alter table "public"."lesson_progress" add constraint "lesson_progress_tree_level_check" CHECK (((tree_level >= 0) AND (tree_level <= 10))) not valid;

alter table "public"."lesson_progress" validate constraint "lesson_progress_tree_level_check";

alter table "public"."lesson_progress" add constraint "lesson_progress_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."lesson_progress" validate constraint "lesson_progress_user_id_fkey";

alter table "public"."lesson_progress" add constraint "lesson_progress_user_id_lesson_id_key" UNIQUE using index "lesson_progress_user_id_lesson_id_key";

alter table "public"."lessons" add constraint "lessons_course_id_fkey" FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE not valid;

alter table "public"."lessons" validate constraint "lessons_course_id_fkey";

alter table "public"."media_assets" add constraint "media_assets_asset_type_check" CHECK ((asset_type = ANY (ARRAY['image'::text, 'video'::text, 'audio'::text, 'document'::text]))) not valid;

alter table "public"."media_assets" validate constraint "media_assets_asset_type_check";

alter table "public"."media_assets" add constraint "media_assets_language_id_fkey" FOREIGN KEY (language_id) REFERENCES public.languages(id) not valid;

alter table "public"."media_assets" validate constraint "media_assets_language_id_fkey";

alter table "public"."profiles" add constraint "profiles_current_streak_check" CHECK ((current_streak >= 0)) not valid;

alter table "public"."profiles" validate constraint "profiles_current_streak_check";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."profiles" add constraint "profiles_learning_dialect_check" CHECK ((learning_dialect = ANY (ARRAY['munster'::text, 'connacht'::text, 'ulster'::text]))) not valid;

alter table "public"."profiles" validate constraint "profiles_learning_dialect_check";

alter table "public"."profiles" add constraint "profiles_learning_language_id_fkey" FOREIGN KEY (learning_language_id) REFERENCES public.languages(id) not valid;

alter table "public"."profiles" validate constraint "profiles_learning_language_id_fkey";

alter table "public"."profiles" add constraint "profiles_longest_streak_check" CHECK ((longest_streak >= 0)) not valid;

alter table "public"."profiles" validate constraint "profiles_longest_streak_check";

alter table "public"."profiles" add constraint "profiles_role_check" CHECK ((role = ANY (ARRAY['user'::text, 'admin'::text, 'contributor'::text]))) not valid;

alter table "public"."profiles" validate constraint "profiles_role_check";

alter table "public"."profiles" add constraint "profiles_theme_mode_check" CHECK ((theme_mode = ANY (ARRAY['light'::text, 'dark'::text, 'system'::text]))) not valid;

alter table "public"."profiles" validate constraint "profiles_theme_mode_check";

alter table "public"."profiles" add constraint "profiles_total_xp_check" CHECK ((total_xp >= 0)) not valid;

alter table "public"."profiles" validate constraint "profiles_total_xp_check";

alter table "public"."sentence_audio" add constraint "sentence_audio_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."sentence_audio" validate constraint "sentence_audio_created_by_fkey";

alter table "public"."sentence_audio" add constraint "sentence_audio_sentence_id_speaker_id_key" UNIQUE using index "sentence_audio_sentence_id_speaker_id_key";

alter table "public"."sentence_audio" add constraint "sentence_audio_speaker_id_fkey" FOREIGN KEY (speaker_id) REFERENCES public.speakers(id) ON DELETE SET NULL not valid;

alter table "public"."sentence_audio" validate constraint "sentence_audio_speaker_id_fkey";

alter table "public"."sentence_audio" add constraint "sentence_audio_unit_id_fkey" FOREIGN KEY (sentence_id) REFERENCES public.exercise_units(id) ON DELETE CASCADE not valid;

alter table "public"."sentence_audio" validate constraint "sentence_audio_unit_id_fkey";

alter table "public"."speakers" add constraint "speakers_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."speakers" validate constraint "speakers_created_by_fkey";

alter table "public"."speakers" add constraint "speakers_gender_check" CHECK ((gender = ANY (ARRAY['male'::text, 'female'::text, 'other'::text]))) not valid;

alter table "public"."speakers" validate constraint "speakers_gender_check";

alter table "public"."user_achievements" add constraint "user_achievements_language_id_fkey" FOREIGN KEY (language_id) REFERENCES public.languages(id) not valid;

alter table "public"."user_achievements" validate constraint "user_achievements_language_id_fkey";

alter table "public"."user_achievements" add constraint "user_achievements_user_id_achievement_id_language_id_key" UNIQUE using index "user_achievements_user_id_achievement_id_language_id_key";

alter table "public"."user_achievements" add constraint "user_achievements_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_achievements" validate constraint "user_achievements_user_id_fkey";

alter table "public"."user_language_stats" add constraint "user_language_stats_average_score_check" CHECK (((average_score >= (0)::numeric) AND (average_score <= (100)::numeric))) not valid;

alter table "public"."user_language_stats" validate constraint "user_language_stats_average_score_check";

alter table "public"."user_language_stats" add constraint "user_language_stats_current_streak_check" CHECK ((current_streak >= 0)) not valid;

alter table "public"."user_language_stats" validate constraint "user_language_stats_current_streak_check";

alter table "public"."user_language_stats" add constraint "user_language_stats_language_id_fkey" FOREIGN KEY (language_id) REFERENCES public.languages(id) not valid;

alter table "public"."user_language_stats" validate constraint "user_language_stats_language_id_fkey";

alter table "public"."user_language_stats" add constraint "user_language_stats_longest_streak_check" CHECK ((longest_streak >= 0)) not valid;

alter table "public"."user_language_stats" validate constraint "user_language_stats_longest_streak_check";

alter table "public"."user_language_stats" add constraint "user_language_stats_total_lessons_completed_check" CHECK ((total_lessons_completed >= 0)) not valid;

alter table "public"."user_language_stats" validate constraint "user_language_stats_total_lessons_completed_check";

alter table "public"."user_language_stats" add constraint "user_language_stats_total_mistakes_check" CHECK ((total_mistakes >= 0)) not valid;

alter table "public"."user_language_stats" validate constraint "user_language_stats_total_mistakes_check";

alter table "public"."user_language_stats" add constraint "user_language_stats_total_sentences_completed_check" CHECK ((total_sentences_completed >= 0)) not valid;

alter table "public"."user_language_stats" validate constraint "user_language_stats_total_sentences_completed_check";

alter table "public"."user_language_stats" add constraint "user_language_stats_total_time_spent_minutes_check" CHECK ((total_time_spent_minutes >= 0)) not valid;

alter table "public"."user_language_stats" validate constraint "user_language_stats_total_time_spent_minutes_check";

alter table "public"."user_language_stats" add constraint "user_language_stats_total_xp_check" CHECK ((total_xp >= 0)) not valid;

alter table "public"."user_language_stats" validate constraint "user_language_stats_total_xp_check";

alter table "public"."user_language_stats" add constraint "user_language_stats_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_language_stats" validate constraint "user_language_stats_user_id_fkey";

alter table "public"."user_language_stats" add constraint "user_language_stats_user_id_language_id_key" UNIQUE using index "user_language_stats_user_id_language_id_key";

alter table "public"."user_stats" add constraint "user_stats_average_score_check" CHECK (((average_score >= (0)::numeric) AND (average_score <= (100)::numeric))) not valid;

alter table "public"."user_stats" validate constraint "user_stats_average_score_check";

alter table "public"."user_stats" add constraint "user_stats_lessons_completed_today_check" CHECK ((lessons_completed_today >= 0)) not valid;

alter table "public"."user_stats" validate constraint "user_stats_lessons_completed_today_check";

alter table "public"."user_stats" add constraint "user_stats_sentences_completed_today_check" CHECK ((sentences_completed_today >= 0)) not valid;

alter table "public"."user_stats" validate constraint "user_stats_sentences_completed_today_check";

alter table "public"."user_stats" add constraint "user_stats_total_lessons_completed_check" CHECK ((total_lessons_completed >= 0)) not valid;

alter table "public"."user_stats" validate constraint "user_stats_total_lessons_completed_check";

alter table "public"."user_stats" add constraint "user_stats_total_mistakes_check" CHECK ((total_mistakes >= 0)) not valid;

alter table "public"."user_stats" validate constraint "user_stats_total_mistakes_check";

alter table "public"."user_stats" add constraint "user_stats_total_sentences_completed_check" CHECK ((total_sentences_completed >= 0)) not valid;

alter table "public"."user_stats" validate constraint "user_stats_total_sentences_completed_check";

alter table "public"."user_stats" add constraint "user_stats_total_time_spent_minutes_check" CHECK ((total_time_spent_minutes >= 0)) not valid;

alter table "public"."user_stats" validate constraint "user_stats_total_time_spent_minutes_check";

alter table "public"."user_stats" add constraint "user_stats_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_stats" validate constraint "user_stats_user_id_fkey";

alter table "public"."user_stats" add constraint "user_stats_user_id_key" UNIQUE using index "user_stats_user_id_key";

alter table "public"."word_audio" add constraint "word_audio_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."word_audio" validate constraint "word_audio_created_by_fkey";

alter table "public"."word_audio" add constraint "word_audio_sentence_id_word_speaker_id_key" UNIQUE using index "word_audio_sentence_id_word_speaker_id_key";

alter table "public"."word_audio" add constraint "word_audio_speaker_id_fkey" FOREIGN KEY (speaker_id) REFERENCES public.speakers(id) ON DELETE SET NULL not valid;

alter table "public"."word_audio" validate constraint "word_audio_speaker_id_fkey";

alter table "public"."word_audio" add constraint "word_audio_unit_id_fkey" FOREIGN KEY (sentence_id) REFERENCES public.exercise_units(id) ON DELETE CASCADE not valid;

alter table "public"."word_audio" validate constraint "word_audio_unit_id_fkey";

set check_function_bodies = off;

create or replace view "public"."course_completion_stats" as  SELECT cp.user_id,
    cp.course_id,
    c.title AS course_title,
    cp.completion_percentage,
    count(lp.id) AS lessons_in_progress,
    sum(lp.completion_count) AS total_lesson_completions,
    avg(lp.tree_level) AS average_tree_level,
    cp.last_accessed_at
   FROM ((public.course_progress cp
     JOIN public.courses c ON ((cp.course_id = c.id)))
     LEFT JOIN public.lesson_progress lp ON (((cp.user_id = lp.user_id) AND (cp.course_id = lp.course_id))))
  GROUP BY cp.user_id, cp.course_id, c.title, cp.completion_percentage, cp.last_accessed_at;


create or replace view "public"."exercise_details" as  SELECT e.id,
    e.lesson_id,
    e.title,
    e.type,
    e.display_order,
    e.estimated_minutes,
    e.is_available,
    e.created_at,
    e.updated_at,
    l.title AS lesson_title,
    l.title_target AS lesson_title_target,
    l.display_order AS lesson_display_order,
    c.title AS course_title,
    c.color AS course_color,
    c.display_order AS course_display_order,
    count(u.id) AS unit_count
   FROM (((public.exercises e
     JOIN public.lessons l ON ((e.lesson_id = l.id)))
     JOIN public.courses c ON ((l.course_id = c.id)))
     LEFT JOIN public.exercise_units u ON ((e.id = u.exercise_id)))
  GROUP BY e.id, l.id, c.id;


CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT role FROM profiles WHERE id = user_id;
$function$
;

create or replace view "public"."lesson_summary" as  SELECT l.id,
    l.course_id,
    l.title,
    l.title_target,
    l.description,
    l.icon_name,
    l.icon_url,
    l.display_order,
    l.estimated_minutes,
    l.is_available,
    l.created_at,
    l.updated_at,
    c.title AS course_title,
    c.color AS course_color,
    c.display_order AS course_display_order,
    count(e.id) AS exercise_count
   FROM ((public.lessons l
     JOIN public.courses c ON ((l.course_id = c.id)))
     LEFT JOIN public.exercises e ON ((l.id = e.lesson_id)))
  GROUP BY l.id, c.id;


create or replace view "public"."unit_details" as  SELECT u.id,
    u.exercise_id,
    u.unit_type,
    u.content,
    u.metadata,
    u.display_order,
    u.created_at,
    u.updated_at,
    e.title AS exercise_title,
    e.type AS exercise_type,
    l.title AS lesson_title,
    c.title AS course_title
   FROM (((public.exercise_units u
     JOIN public.exercises e ON ((u.exercise_id = e.id)))
     JOIN public.lessons l ON ((e.lesson_id = l.id)))
     JOIN public.courses c ON ((l.course_id = c.id)));


CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

create or replace view "public"."user_progress_summary" as  SELECT p.id AS user_id,
    p.display_name,
    p.total_xp,
    p.current_streak,
    p.longest_streak,
    us.total_lessons_completed,
    us.total_sentences_completed,
    us.total_time_spent_minutes,
    us.average_score,
    us.lessons_completed_today,
    us.sentences_completed_today,
    count(DISTINCT cp.course_id) AS courses_started,
    count(DISTINCT lp.lesson_id) AS lessons_started,
    p.last_activity_date
   FROM (((public.profiles p
     LEFT JOIN public.user_stats us ON ((p.id = us.user_id)))
     LEFT JOIN public.course_progress cp ON ((p.id = cp.user_id)))
     LEFT JOIN public.lesson_progress lp ON ((p.id = lp.user_id)))
  GROUP BY p.id, p.display_name, p.total_xp, p.current_streak, p.longest_streak, us.total_lessons_completed, us.total_sentences_completed, us.total_time_spent_minutes, us.average_score, us.lessons_completed_today, us.sentences_completed_today, p.last_activity_date;


grant delete on table "public"."content_blocks" to "anon";

grant insert on table "public"."content_blocks" to "anon";

grant references on table "public"."content_blocks" to "anon";

grant select on table "public"."content_blocks" to "anon";

grant trigger on table "public"."content_blocks" to "anon";

grant truncate on table "public"."content_blocks" to "anon";

grant update on table "public"."content_blocks" to "anon";

grant delete on table "public"."content_blocks" to "authenticated";

grant insert on table "public"."content_blocks" to "authenticated";

grant references on table "public"."content_blocks" to "authenticated";

grant select on table "public"."content_blocks" to "authenticated";

grant trigger on table "public"."content_blocks" to "authenticated";

grant truncate on table "public"."content_blocks" to "authenticated";

grant update on table "public"."content_blocks" to "authenticated";

grant delete on table "public"."content_blocks" to "service_role";

grant insert on table "public"."content_blocks" to "service_role";

grant references on table "public"."content_blocks" to "service_role";

grant select on table "public"."content_blocks" to "service_role";

grant trigger on table "public"."content_blocks" to "service_role";

grant truncate on table "public"."content_blocks" to "service_role";

grant update on table "public"."content_blocks" to "service_role";

grant delete on table "public"."course_progress" to "anon";

grant insert on table "public"."course_progress" to "anon";

grant references on table "public"."course_progress" to "anon";

grant select on table "public"."course_progress" to "anon";

grant trigger on table "public"."course_progress" to "anon";

grant truncate on table "public"."course_progress" to "anon";

grant update on table "public"."course_progress" to "anon";

grant delete on table "public"."course_progress" to "authenticated";

grant insert on table "public"."course_progress" to "authenticated";

grant references on table "public"."course_progress" to "authenticated";

grant select on table "public"."course_progress" to "authenticated";

grant trigger on table "public"."course_progress" to "authenticated";

grant truncate on table "public"."course_progress" to "authenticated";

grant update on table "public"."course_progress" to "authenticated";

grant delete on table "public"."course_progress" to "service_role";

grant insert on table "public"."course_progress" to "service_role";

grant references on table "public"."course_progress" to "service_role";

grant select on table "public"."course_progress" to "service_role";

grant trigger on table "public"."course_progress" to "service_role";

grant truncate on table "public"."course_progress" to "service_role";

grant update on table "public"."course_progress" to "service_role";

grant delete on table "public"."courses" to "anon";

grant insert on table "public"."courses" to "anon";

grant references on table "public"."courses" to "anon";

grant select on table "public"."courses" to "anon";

grant trigger on table "public"."courses" to "anon";

grant truncate on table "public"."courses" to "anon";

grant update on table "public"."courses" to "anon";

grant delete on table "public"."courses" to "authenticated";

grant insert on table "public"."courses" to "authenticated";

grant references on table "public"."courses" to "authenticated";

grant select on table "public"."courses" to "authenticated";

grant trigger on table "public"."courses" to "authenticated";

grant truncate on table "public"."courses" to "authenticated";

grant update on table "public"."courses" to "authenticated";

grant delete on table "public"."courses" to "service_role";

grant insert on table "public"."courses" to "service_role";

grant references on table "public"."courses" to "service_role";

grant select on table "public"."courses" to "service_role";

grant trigger on table "public"."courses" to "service_role";

grant truncate on table "public"."courses" to "service_role";

grant update on table "public"."courses" to "service_role";

grant delete on table "public"."exercise_dependencies" to "anon";

grant insert on table "public"."exercise_dependencies" to "anon";

grant references on table "public"."exercise_dependencies" to "anon";

grant select on table "public"."exercise_dependencies" to "anon";

grant trigger on table "public"."exercise_dependencies" to "anon";

grant truncate on table "public"."exercise_dependencies" to "anon";

grant update on table "public"."exercise_dependencies" to "anon";

grant delete on table "public"."exercise_dependencies" to "authenticated";

grant insert on table "public"."exercise_dependencies" to "authenticated";

grant references on table "public"."exercise_dependencies" to "authenticated";

grant select on table "public"."exercise_dependencies" to "authenticated";

grant trigger on table "public"."exercise_dependencies" to "authenticated";

grant truncate on table "public"."exercise_dependencies" to "authenticated";

grant update on table "public"."exercise_dependencies" to "authenticated";

grant delete on table "public"."exercise_dependencies" to "service_role";

grant insert on table "public"."exercise_dependencies" to "service_role";

grant references on table "public"."exercise_dependencies" to "service_role";

grant select on table "public"."exercise_dependencies" to "service_role";

grant trigger on table "public"."exercise_dependencies" to "service_role";

grant truncate on table "public"."exercise_dependencies" to "service_role";

grant update on table "public"."exercise_dependencies" to "service_role";

grant delete on table "public"."exercise_speakers" to "anon";

grant insert on table "public"."exercise_speakers" to "anon";

grant references on table "public"."exercise_speakers" to "anon";

grant select on table "public"."exercise_speakers" to "anon";

grant trigger on table "public"."exercise_speakers" to "anon";

grant truncate on table "public"."exercise_speakers" to "anon";

grant update on table "public"."exercise_speakers" to "anon";

grant delete on table "public"."exercise_speakers" to "authenticated";

grant insert on table "public"."exercise_speakers" to "authenticated";

grant references on table "public"."exercise_speakers" to "authenticated";

grant select on table "public"."exercise_speakers" to "authenticated";

grant trigger on table "public"."exercise_speakers" to "authenticated";

grant truncate on table "public"."exercise_speakers" to "authenticated";

grant update on table "public"."exercise_speakers" to "authenticated";

grant delete on table "public"."exercise_speakers" to "service_role";

grant insert on table "public"."exercise_speakers" to "service_role";

grant references on table "public"."exercise_speakers" to "service_role";

grant select on table "public"."exercise_speakers" to "service_role";

grant trigger on table "public"."exercise_speakers" to "service_role";

grant truncate on table "public"."exercise_speakers" to "service_role";

grant update on table "public"."exercise_speakers" to "service_role";

grant delete on table "public"."exercise_units" to "anon";

grant insert on table "public"."exercise_units" to "anon";

grant references on table "public"."exercise_units" to "anon";

grant select on table "public"."exercise_units" to "anon";

grant trigger on table "public"."exercise_units" to "anon";

grant truncate on table "public"."exercise_units" to "anon";

grant update on table "public"."exercise_units" to "anon";

grant delete on table "public"."exercise_units" to "authenticated";

grant insert on table "public"."exercise_units" to "authenticated";

grant references on table "public"."exercise_units" to "authenticated";

grant select on table "public"."exercise_units" to "authenticated";

grant trigger on table "public"."exercise_units" to "authenticated";

grant truncate on table "public"."exercise_units" to "authenticated";

grant update on table "public"."exercise_units" to "authenticated";

grant delete on table "public"."exercise_units" to "service_role";

grant insert on table "public"."exercise_units" to "service_role";

grant references on table "public"."exercise_units" to "service_role";

grant select on table "public"."exercise_units" to "service_role";

grant trigger on table "public"."exercise_units" to "service_role";

grant truncate on table "public"."exercise_units" to "service_role";

grant update on table "public"."exercise_units" to "service_role";

grant delete on table "public"."exercises" to "anon";

grant insert on table "public"."exercises" to "anon";

grant references on table "public"."exercises" to "anon";

grant select on table "public"."exercises" to "anon";

grant trigger on table "public"."exercises" to "anon";

grant truncate on table "public"."exercises" to "anon";

grant update on table "public"."exercises" to "anon";

grant delete on table "public"."exercises" to "authenticated";

grant insert on table "public"."exercises" to "authenticated";

grant references on table "public"."exercises" to "authenticated";

grant select on table "public"."exercises" to "authenticated";

grant trigger on table "public"."exercises" to "authenticated";

grant truncate on table "public"."exercises" to "authenticated";

grant update on table "public"."exercises" to "authenticated";

grant delete on table "public"."exercises" to "service_role";

grant insert on table "public"."exercises" to "service_role";

grant references on table "public"."exercises" to "service_role";

grant select on table "public"."exercises" to "service_role";

grant trigger on table "public"."exercises" to "service_role";

grant truncate on table "public"."exercises" to "service_role";

grant update on table "public"."exercises" to "service_role";

grant delete on table "public"."languages" to "anon";

grant insert on table "public"."languages" to "anon";

grant references on table "public"."languages" to "anon";

grant select on table "public"."languages" to "anon";

grant trigger on table "public"."languages" to "anon";

grant truncate on table "public"."languages" to "anon";

grant update on table "public"."languages" to "anon";

grant delete on table "public"."languages" to "authenticated";

grant insert on table "public"."languages" to "authenticated";

grant references on table "public"."languages" to "authenticated";

grant select on table "public"."languages" to "authenticated";

grant trigger on table "public"."languages" to "authenticated";

grant truncate on table "public"."languages" to "authenticated";

grant update on table "public"."languages" to "authenticated";

grant delete on table "public"."languages" to "service_role";

grant insert on table "public"."languages" to "service_role";

grant references on table "public"."languages" to "service_role";

grant select on table "public"."languages" to "service_role";

grant trigger on table "public"."languages" to "service_role";

grant truncate on table "public"."languages" to "service_role";

grant update on table "public"."languages" to "service_role";

grant delete on table "public"."lesson_prerequisites" to "anon";

grant insert on table "public"."lesson_prerequisites" to "anon";

grant references on table "public"."lesson_prerequisites" to "anon";

grant select on table "public"."lesson_prerequisites" to "anon";

grant trigger on table "public"."lesson_prerequisites" to "anon";

grant truncate on table "public"."lesson_prerequisites" to "anon";

grant update on table "public"."lesson_prerequisites" to "anon";

grant delete on table "public"."lesson_prerequisites" to "authenticated";

grant insert on table "public"."lesson_prerequisites" to "authenticated";

grant references on table "public"."lesson_prerequisites" to "authenticated";

grant select on table "public"."lesson_prerequisites" to "authenticated";

grant trigger on table "public"."lesson_prerequisites" to "authenticated";

grant truncate on table "public"."lesson_prerequisites" to "authenticated";

grant update on table "public"."lesson_prerequisites" to "authenticated";

grant delete on table "public"."lesson_prerequisites" to "service_role";

grant insert on table "public"."lesson_prerequisites" to "service_role";

grant references on table "public"."lesson_prerequisites" to "service_role";

grant select on table "public"."lesson_prerequisites" to "service_role";

grant trigger on table "public"."lesson_prerequisites" to "service_role";

grant truncate on table "public"."lesson_prerequisites" to "service_role";

grant update on table "public"."lesson_prerequisites" to "service_role";

grant delete on table "public"."lesson_progress" to "anon";

grant insert on table "public"."lesson_progress" to "anon";

grant references on table "public"."lesson_progress" to "anon";

grant select on table "public"."lesson_progress" to "anon";

grant trigger on table "public"."lesson_progress" to "anon";

grant truncate on table "public"."lesson_progress" to "anon";

grant update on table "public"."lesson_progress" to "anon";

grant delete on table "public"."lesson_progress" to "authenticated";

grant insert on table "public"."lesson_progress" to "authenticated";

grant references on table "public"."lesson_progress" to "authenticated";

grant select on table "public"."lesson_progress" to "authenticated";

grant trigger on table "public"."lesson_progress" to "authenticated";

grant truncate on table "public"."lesson_progress" to "authenticated";

grant update on table "public"."lesson_progress" to "authenticated";

grant delete on table "public"."lesson_progress" to "service_role";

grant insert on table "public"."lesson_progress" to "service_role";

grant references on table "public"."lesson_progress" to "service_role";

grant select on table "public"."lesson_progress" to "service_role";

grant trigger on table "public"."lesson_progress" to "service_role";

grant truncate on table "public"."lesson_progress" to "service_role";

grant update on table "public"."lesson_progress" to "service_role";

grant delete on table "public"."lessons" to "anon";

grant insert on table "public"."lessons" to "anon";

grant references on table "public"."lessons" to "anon";

grant select on table "public"."lessons" to "anon";

grant trigger on table "public"."lessons" to "anon";

grant truncate on table "public"."lessons" to "anon";

grant update on table "public"."lessons" to "anon";

grant delete on table "public"."lessons" to "authenticated";

grant insert on table "public"."lessons" to "authenticated";

grant references on table "public"."lessons" to "authenticated";

grant select on table "public"."lessons" to "authenticated";

grant trigger on table "public"."lessons" to "authenticated";

grant truncate on table "public"."lessons" to "authenticated";

grant update on table "public"."lessons" to "authenticated";

grant delete on table "public"."lessons" to "service_role";

grant insert on table "public"."lessons" to "service_role";

grant references on table "public"."lessons" to "service_role";

grant select on table "public"."lessons" to "service_role";

grant trigger on table "public"."lessons" to "service_role";

grant truncate on table "public"."lessons" to "service_role";

grant update on table "public"."lessons" to "service_role";

grant delete on table "public"."media_assets" to "anon";

grant insert on table "public"."media_assets" to "anon";

grant references on table "public"."media_assets" to "anon";

grant select on table "public"."media_assets" to "anon";

grant trigger on table "public"."media_assets" to "anon";

grant truncate on table "public"."media_assets" to "anon";

grant update on table "public"."media_assets" to "anon";

grant delete on table "public"."media_assets" to "authenticated";

grant insert on table "public"."media_assets" to "authenticated";

grant references on table "public"."media_assets" to "authenticated";

grant select on table "public"."media_assets" to "authenticated";

grant trigger on table "public"."media_assets" to "authenticated";

grant truncate on table "public"."media_assets" to "authenticated";

grant update on table "public"."media_assets" to "authenticated";

grant delete on table "public"."media_assets" to "service_role";

grant insert on table "public"."media_assets" to "service_role";

grant references on table "public"."media_assets" to "service_role";

grant select on table "public"."media_assets" to "service_role";

grant trigger on table "public"."media_assets" to "service_role";

grant truncate on table "public"."media_assets" to "service_role";

grant update on table "public"."media_assets" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."sentence_audio" to "anon";

grant insert on table "public"."sentence_audio" to "anon";

grant references on table "public"."sentence_audio" to "anon";

grant select on table "public"."sentence_audio" to "anon";

grant trigger on table "public"."sentence_audio" to "anon";

grant truncate on table "public"."sentence_audio" to "anon";

grant update on table "public"."sentence_audio" to "anon";

grant delete on table "public"."sentence_audio" to "authenticated";

grant insert on table "public"."sentence_audio" to "authenticated";

grant references on table "public"."sentence_audio" to "authenticated";

grant select on table "public"."sentence_audio" to "authenticated";

grant trigger on table "public"."sentence_audio" to "authenticated";

grant truncate on table "public"."sentence_audio" to "authenticated";

grant update on table "public"."sentence_audio" to "authenticated";

grant delete on table "public"."sentence_audio" to "service_role";

grant insert on table "public"."sentence_audio" to "service_role";

grant references on table "public"."sentence_audio" to "service_role";

grant select on table "public"."sentence_audio" to "service_role";

grant trigger on table "public"."sentence_audio" to "service_role";

grant truncate on table "public"."sentence_audio" to "service_role";

grant update on table "public"."sentence_audio" to "service_role";

grant delete on table "public"."speakers" to "anon";

grant insert on table "public"."speakers" to "anon";

grant references on table "public"."speakers" to "anon";

grant select on table "public"."speakers" to "anon";

grant trigger on table "public"."speakers" to "anon";

grant truncate on table "public"."speakers" to "anon";

grant update on table "public"."speakers" to "anon";

grant delete on table "public"."speakers" to "authenticated";

grant insert on table "public"."speakers" to "authenticated";

grant references on table "public"."speakers" to "authenticated";

grant select on table "public"."speakers" to "authenticated";

grant trigger on table "public"."speakers" to "authenticated";

grant truncate on table "public"."speakers" to "authenticated";

grant update on table "public"."speakers" to "authenticated";

grant delete on table "public"."speakers" to "service_role";

grant insert on table "public"."speakers" to "service_role";

grant references on table "public"."speakers" to "service_role";

grant select on table "public"."speakers" to "service_role";

grant trigger on table "public"."speakers" to "service_role";

grant truncate on table "public"."speakers" to "service_role";

grant update on table "public"."speakers" to "service_role";

grant delete on table "public"."user_achievements" to "anon";

grant insert on table "public"."user_achievements" to "anon";

grant references on table "public"."user_achievements" to "anon";

grant select on table "public"."user_achievements" to "anon";

grant trigger on table "public"."user_achievements" to "anon";

grant truncate on table "public"."user_achievements" to "anon";

grant update on table "public"."user_achievements" to "anon";

grant delete on table "public"."user_achievements" to "authenticated";

grant insert on table "public"."user_achievements" to "authenticated";

grant references on table "public"."user_achievements" to "authenticated";

grant select on table "public"."user_achievements" to "authenticated";

grant trigger on table "public"."user_achievements" to "authenticated";

grant truncate on table "public"."user_achievements" to "authenticated";

grant update on table "public"."user_achievements" to "authenticated";

grant delete on table "public"."user_achievements" to "service_role";

grant insert on table "public"."user_achievements" to "service_role";

grant references on table "public"."user_achievements" to "service_role";

grant select on table "public"."user_achievements" to "service_role";

grant trigger on table "public"."user_achievements" to "service_role";

grant truncate on table "public"."user_achievements" to "service_role";

grant update on table "public"."user_achievements" to "service_role";

grant delete on table "public"."user_language_stats" to "anon";

grant insert on table "public"."user_language_stats" to "anon";

grant references on table "public"."user_language_stats" to "anon";

grant select on table "public"."user_language_stats" to "anon";

grant trigger on table "public"."user_language_stats" to "anon";

grant truncate on table "public"."user_language_stats" to "anon";

grant update on table "public"."user_language_stats" to "anon";

grant delete on table "public"."user_language_stats" to "authenticated";

grant insert on table "public"."user_language_stats" to "authenticated";

grant references on table "public"."user_language_stats" to "authenticated";

grant select on table "public"."user_language_stats" to "authenticated";

grant trigger on table "public"."user_language_stats" to "authenticated";

grant truncate on table "public"."user_language_stats" to "authenticated";

grant update on table "public"."user_language_stats" to "authenticated";

grant delete on table "public"."user_language_stats" to "service_role";

grant insert on table "public"."user_language_stats" to "service_role";

grant references on table "public"."user_language_stats" to "service_role";

grant select on table "public"."user_language_stats" to "service_role";

grant trigger on table "public"."user_language_stats" to "service_role";

grant truncate on table "public"."user_language_stats" to "service_role";

grant update on table "public"."user_language_stats" to "service_role";

grant delete on table "public"."user_stats" to "anon";

grant insert on table "public"."user_stats" to "anon";

grant references on table "public"."user_stats" to "anon";

grant select on table "public"."user_stats" to "anon";

grant trigger on table "public"."user_stats" to "anon";

grant truncate on table "public"."user_stats" to "anon";

grant update on table "public"."user_stats" to "anon";

grant delete on table "public"."user_stats" to "authenticated";

grant insert on table "public"."user_stats" to "authenticated";

grant references on table "public"."user_stats" to "authenticated";

grant select on table "public"."user_stats" to "authenticated";

grant trigger on table "public"."user_stats" to "authenticated";

grant truncate on table "public"."user_stats" to "authenticated";

grant update on table "public"."user_stats" to "authenticated";

grant delete on table "public"."user_stats" to "service_role";

grant insert on table "public"."user_stats" to "service_role";

grant references on table "public"."user_stats" to "service_role";

grant select on table "public"."user_stats" to "service_role";

grant trigger on table "public"."user_stats" to "service_role";

grant truncate on table "public"."user_stats" to "service_role";

grant update on table "public"."user_stats" to "service_role";

grant delete on table "public"."word_audio" to "anon";

grant insert on table "public"."word_audio" to "anon";

grant references on table "public"."word_audio" to "anon";

grant select on table "public"."word_audio" to "anon";

grant trigger on table "public"."word_audio" to "anon";

grant truncate on table "public"."word_audio" to "anon";

grant update on table "public"."word_audio" to "anon";

grant delete on table "public"."word_audio" to "authenticated";

grant insert on table "public"."word_audio" to "authenticated";

grant references on table "public"."word_audio" to "authenticated";

grant select on table "public"."word_audio" to "authenticated";

grant trigger on table "public"."word_audio" to "authenticated";

grant truncate on table "public"."word_audio" to "authenticated";

grant update on table "public"."word_audio" to "authenticated";

grant delete on table "public"."word_audio" to "service_role";

grant insert on table "public"."word_audio" to "service_role";

grant references on table "public"."word_audio" to "service_role";

grant select on table "public"."word_audio" to "service_role";

grant trigger on table "public"."word_audio" to "service_role";

grant truncate on table "public"."word_audio" to "service_role";

grant update on table "public"."word_audio" to "service_role";


  create policy "Admins can delete content_blocks"
  on "public"."content_blocks"
  as permissive
  for delete
  to public
using ((public.get_user_role(auth.uid()) = 'admin'::text));



  create policy "Admins can insert content_blocks"
  on "public"."content_blocks"
  as permissive
  for insert
  to public
with check ((public.get_user_role(auth.uid()) = 'admin'::text));



  create policy "Admins can select content_blocks"
  on "public"."content_blocks"
  as permissive
  for select
  to public
using ((public.get_user_role(auth.uid()) = 'admin'::text));



  create policy "Admins can update content_blocks"
  on "public"."content_blocks"
  as permissive
  for update
  to public
using ((public.get_user_role(auth.uid()) = 'admin'::text));



  create policy "Public read access"
  on "public"."content_blocks"
  as permissive
  for select
  to public
using (true);



  create policy "Users can delete their own course progress"
  on "public"."course_progress"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "Users can insert their own course progress"
  on "public"."course_progress"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can update their own course progress"
  on "public"."course_progress"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "Users can view their own course progress"
  on "public"."course_progress"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Admins can delete courses"
  on "public"."courses"
  as permissive
  for delete
  to public
using ((public.get_user_role(auth.uid()) = 'admin'::text));



  create policy "Admins can insert courses"
  on "public"."courses"
  as permissive
  for insert
  to public
with check ((public.get_user_role(auth.uid()) = 'admin'::text));



  create policy "Admins can select courses"
  on "public"."courses"
  as permissive
  for select
  to public
using ((public.get_user_role(auth.uid()) = 'admin'::text));



  create policy "Admins can update courses"
  on "public"."courses"
  as permissive
  for update
  to public
using ((public.get_user_role(auth.uid()) = 'admin'::text));



  create policy "Public read access"
  on "public"."courses"
  as permissive
  for select
  to public
using (true);



  create policy "Admins can manage exercise dependencies"
  on "public"."exercise_dependencies"
  as permissive
  for all
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));



  create policy "Anyone can read exercise dependencies"
  on "public"."exercise_dependencies"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Admins can delete exercise_speakers"
  on "public"."exercise_speakers"
  as permissive
  for delete
  to public
using ((public.get_user_role(auth.uid()) = 'admin'::text));



  create policy "Admins can insert exercise_speakers"
  on "public"."exercise_speakers"
  as permissive
  for insert
  to public
with check ((public.get_user_role(auth.uid()) = 'admin'::text));



  create policy "Admins can select exercise_speakers"
  on "public"."exercise_speakers"
  as permissive
  for select
  to public
using ((public.get_user_role(auth.uid()) = 'admin'::text));



  create policy "Admins can update exercise_speakers"
  on "public"."exercise_speakers"
  as permissive
  for update
  to public
using ((public.get_user_role(auth.uid()) = 'admin'::text));



  create policy "Public read access"
  on "public"."exercise_speakers"
  as permissive
  for select
  to public
using (true);



  create policy "Admins can delete exercise_units"
  on "public"."exercise_units"
  as permissive
  for delete
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));



  create policy "Admins can insert exercise_units"
  on "public"."exercise_units"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));



  create policy "Admins can update exercise_units"
  on "public"."exercise_units"
  as permissive
  for update
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));



  create policy "Public read access"
  on "public"."exercise_units"
  as permissive
  for select
  to public
using (true);



  create policy "Admins can delete exercises"
  on "public"."exercises"
  as permissive
  for delete
  to public
using ((public.get_user_role(auth.uid()) = 'admin'::text));



  create policy "Admins can insert exercises"
  on "public"."exercises"
  as permissive
  for insert
  to public
with check ((public.get_user_role(auth.uid()) = 'admin'::text));



  create policy "Admins can select exercises"
  on "public"."exercises"
  as permissive
  for select
  to public
using ((public.get_user_role(auth.uid()) = 'admin'::text));



  create policy "Admins can update exercises"
  on "public"."exercises"
  as permissive
  for update
  to public
using ((public.get_user_role(auth.uid()) = 'admin'::text));



  create policy "Public read access"
  on "public"."exercises"
  as permissive
  for select
  to public
using (true);



  create policy "Admins can delete lesson_prerequisites"
  on "public"."lesson_prerequisites"
  as permissive
  for delete
  to public
using ((public.get_user_role(auth.uid()) = 'admin'::text));



  create policy "Admins can insert lesson_prerequisites"
  on "public"."lesson_prerequisites"
  as permissive
  for insert
  to public
with check ((public.get_user_role(auth.uid()) = 'admin'::text));



  create policy "Admins can update lesson_prerequisites"
  on "public"."lesson_prerequisites"
  as permissive
  for update
  to public
using ((public.get_user_role(auth.uid()) = 'admin'::text));



  create policy "Public read access"
  on "public"."lesson_prerequisites"
  as permissive
  for select
  to public
using (true);



  create policy "Users can delete their own lesson progress"
  on "public"."lesson_progress"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "Users can insert their own lesson progress"
  on "public"."lesson_progress"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can update their own lesson progress"
  on "public"."lesson_progress"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "Users can view their own lesson progress"
  on "public"."lesson_progress"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Admins can delete lessons"
  on "public"."lessons"
  as permissive
  for delete
  to public
using ((public.get_user_role(auth.uid()) = 'admin'::text));



  create policy "Admins can insert lessons"
  on "public"."lessons"
  as permissive
  for insert
  to public
with check ((public.get_user_role(auth.uid()) = 'admin'::text));



  create policy "Admins can select lessons"
  on "public"."lessons"
  as permissive
  for select
  to public
using ((public.get_user_role(auth.uid()) = 'admin'::text));



  create policy "Admins can update lessons"
  on "public"."lessons"
  as permissive
  for update
  to public
using ((public.get_user_role(auth.uid()) = 'admin'::text));



  create policy "Public read access"
  on "public"."lessons"
  as permissive
  for select
  to public
using (true);



  create policy "Admins can delete media_assets"
  on "public"."media_assets"
  as permissive
  for delete
  to public
using ((public.get_user_role(auth.uid()) = 'admin'::text));



  create policy "Admins can insert media_assets"
  on "public"."media_assets"
  as permissive
  for insert
  to public
with check ((public.get_user_role(auth.uid()) = 'admin'::text));



  create policy "Admins can update media_assets"
  on "public"."media_assets"
  as permissive
  for update
  to public
using ((public.get_user_role(auth.uid()) = 'admin'::text));



  create policy "Public read access"
  on "public"."media_assets"
  as permissive
  for select
  to public
using (true);



  create policy "Users can insert their own profile"
  on "public"."profiles"
  as permissive
  for insert
  to public
with check ((auth.uid() = id));



  create policy "Users can update their own profile"
  on "public"."profiles"
  as permissive
  for update
  to public
using ((auth.uid() = id));



  create policy "Users can view their own profile"
  on "public"."profiles"
  as permissive
  for select
  to public
using (((auth.uid() = id) OR (public.get_user_role(auth.uid()) = 'admin'::text)));



  create policy "Sentence audio is deletable by admins"
  on "public"."sentence_audio"
  as permissive
  for delete
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));



  create policy "Sentence audio is insertable by admins"
  on "public"."sentence_audio"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));



  create policy "Sentence audio is updatable by admins"
  on "public"."sentence_audio"
  as permissive
  for update
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));



  create policy "Sentence audio is viewable by everyone"
  on "public"."sentence_audio"
  as permissive
  for select
  to public
using (true);



  create policy "Speakers are insertable by admins"
  on "public"."speakers"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));



  create policy "Speakers are updatable by admins"
  on "public"."speakers"
  as permissive
  for update
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));



  create policy "Speakers are viewable by everyone"
  on "public"."speakers"
  as permissive
  for select
  to public
using (true);



  create policy "Users can delete their own achievements"
  on "public"."user_achievements"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "Users can insert their own achievements"
  on "public"."user_achievements"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can view their own achievements"
  on "public"."user_achievements"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Users can delete their own language stats"
  on "public"."user_language_stats"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "Users can insert their own language stats"
  on "public"."user_language_stats"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can update their own language stats"
  on "public"."user_language_stats"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "Users can view their own language stats"
  on "public"."user_language_stats"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Users can delete their own stats"
  on "public"."user_stats"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "Users can insert their own stats"
  on "public"."user_stats"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can update their own stats"
  on "public"."user_stats"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "Users can view their own stats"
  on "public"."user_stats"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Word audio is deletable by admins"
  on "public"."word_audio"
  as permissive
  for delete
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));



  create policy "Word audio is insertable by admins"
  on "public"."word_audio"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));



  create policy "Word audio is updatable by admins"
  on "public"."word_audio"
  as permissive
  for update
  to public
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));



  create policy "Word audio is viewable by everyone"
  on "public"."word_audio"
  as permissive
  for select
  to public
using (true);


CREATE TRIGGER update_course_progress_updated_at BEFORE UPDATE ON public.course_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exercise_units_updated_at BEFORE UPDATE ON public.exercise_units FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exercises_updated_at BEFORE UPDATE ON public.exercises FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lesson_progress_updated_at BEFORE UPDATE ON public.lesson_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_language_stats_updated_at BEFORE UPDATE ON public.user_language_stats FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_stats_updated_at BEFORE UPDATE ON public.user_stats FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- STORAGE POLICIES
-- ============================================================================
-- Drop existing policies first to allow re-running this script

DROP POLICY IF EXISTS "Admins and content creators can delete course media" ON storage.objects;
DROP POLICY IF EXISTS "Admins and content creators can update course media" ON storage.objects;
DROP POLICY IF EXISTS "Admins and content creators can upload course media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage drafts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read course media" ON storage.objects;

  create policy "Admins and content creators can delete course media"
  on "storage"."objects"
  as permissive
  for delete
  to public
using (((bucket_id = 'course_media'::text) AND (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'content_creator'::text])))))));



  create policy "Admins and content creators can update course media"
  on "storage"."objects"
  as permissive
  for update
  to public
using (((bucket_id = 'course_media'::text) AND (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'content_creator'::text])))))))
with check (((bucket_id = 'course_media'::text) AND (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'content_creator'::text])))))));



  create policy "Admins and content creators can upload course media"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'course_media'::text) AND (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'content_creator'::text])))))));



  create policy "Admins can manage drafts"
  on "storage"."objects"
  as permissive
  for all
  to public
using (((bucket_id = 'content_drafts'::text) AND (public.get_user_role(auth.uid()) = 'admin'::text)))
with check (((bucket_id = 'content_drafts'::text) AND (public.get_user_role(auth.uid()) = 'admin'::text)));



  create policy "Authenticated users can read course media"
  on "storage"."objects"
  as permissive
  for select
  to public
using (((bucket_id = 'course_media'::text) AND (auth.role() = 'authenticated'::text)));




-- ============================================================================
-- PROFILE AVATARS UPDATE
-- ============================================================================

drop policy if exists "Users can insert their own profile" on "public"."profiles";

alter table "public"."profiles" add column if not exists "avatar_url" text;

-- Drop existing profile-images storage policies to allow re-running
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Insert Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update Access" ON storage.objects;

  create policy "Users can insert their own profile"
  on "public"."profiles"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = id));



  create policy "Allow authenticated uploads"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'profile-images'::text));



  create policy "Allow public read access"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'profile-images'::text));



  create policy "Authenticated Insert Access"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'profile-images'::text));



  create policy "Authenticated Update Access"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using ((bucket_id = 'profile-images'::text));




-- ============================================================================
-- DEFAULT DATA
-- ============================================================================
-- Insert default languages so users can create profiles and courses immediately

INSERT INTO public.languages (id, name, code, voice_prefix) VALUES
  ('irish_std', 'Irish (Gaeilge) - Standard', 'ga', 'ga_std'),
  ('irish_mun', 'Irish (Gaeilge) - Munster', 'ga-munster', 'ga_munster'),
  ('irish_con', 'Irish (Gaeilge) - Connacht', 'ga-connacht', 'ga_connacht'),
  ('irish_ul', 'Irish (Gaeilge) - Ulster', 'ga-ulster', 'ga_ulster'),
  ('navajo', 'Navajo (Diné bizaad)', 'nv', 'nv'),
  ('maori', 'Māori (Te Reo Māori)', 'mi', 'mi')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  voice_prefix = EXCLUDED.voice_prefix;

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================
-- Your Navaria database is now ready!
--
-- ✅ Storage buckets created (course_media, profile-images, content_drafts)
-- ✅ Database tables and schema created
-- ✅ Row Level Security (RLS) policies configured
-- ✅ Storage policies configured
-- ✅ Functions and triggers ready
-- ✅ Default languages added (Irish, Navajo, Māori)
--
-- Next steps:
-- 1. Verify buckets in Storage tab
-- 2. Create your first admin user (see COMMUNITY_SETUP.md)
-- 3. Start adding course content!
-- ============================================================================
