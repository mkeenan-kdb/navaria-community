// Dynamic content loading service using Supabase
// This replaces the static JSON-based content system with database-driven content

import {supabase} from '@/services/supabase';
import {createStorage} from '@/services/storage';
import type {
  Course,
  Lesson,
  Exercise,
  Sentence,
  ContentBlock,
  LessonWithContent,
  CourseWithContent,
} from '@/types';

// Initialize storage for caching
const storage = createStorage('dynamic-content-cache');

// Cache for loaded content
const contentCache = new Map<string, any>();

// Cache TTL (Time To Live) in milliseconds - 5 minutes
const CACHE_TTL = 5 * 60 * 1000;

// API Request Timeout in milliseconds - 15 seconds
const API_TIMEOUT = 15 * 1000;

/**
 * Wrap a promise or thenable with a timeout to prevent indefinite hangs
 * This is critical for handling stale sessions where Supabase may not respond
 */
async function withTimeout<T>(
  promiseLike: PromiseLike<T> | Promise<T>,
  timeoutMs: number = API_TIMEOUT,
  errorMessage: string = 'Request timed out',
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;

  // Coerce thenable (like Supabase query builders) into a native Promise
  const promise = Promise.resolve(promiseLike);

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
}

interface CacheEntry {
  data: any;
  timestamp: number;
}

/**
 * Check if cached data is still valid
 */
function isCacheValid(entry: CacheEntry): boolean {
  return Date.now() - entry.timestamp < CACHE_TTL;
}

/**
 * Get data from cache (memory first, then MMKV)
 */
function getFromCache<T>(key: string): T | null {
  // Check memory cache first
  if (contentCache.has(key)) {
    const entry = contentCache.get(key) as CacheEntry;
    if (isCacheValid(entry)) {
      return entry.data as T;
    }
    contentCache.delete(key);
  }

  // Check MMKV cache
  const cached = storage.getString(key);
  if (cached) {
    try {
      const entry = JSON.parse(cached) as CacheEntry;
      if (isCacheValid(entry)) {
        contentCache.set(key, entry);
        return entry.data as T;
      }
      // Cache expired, will be overwritten on next write
    } catch (error) {
      console.warn('Failed to parse cached data:', error);
      // Invalid cache data, will be overwritten on next write
    }
  }

  return null;
}

/**
 * Store data in cache
 */
function setCache(key: string, data: any): void {
  const entry: CacheEntry = {
    data,
    timestamp: Date.now(),
  };

  contentCache.set(key, entry);
  storage.set(key, JSON.stringify(entry));
}

// ============================================================================
// COURSE FUNCTIONS
// ============================================================================

/**
 * Load all available courses
 */
export async function loadCourses(
  languageId: string = 'irish_std',
): Promise<Course[]> {
  const cacheKey = `courses:all:${languageId}`;
  const cached = getFromCache<Course[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const {data, error} = await withTimeout(
    supabase
      .from('courses')
      .select('*')
      .eq('is_available', true)
      .eq('language_id', languageId)
      .order('display_order'),
    API_TIMEOUT,
    'Loading courses timed out - please check your connection',
  );

  if (error) {
    console.error('Failed to load courses:', error);
    throw new Error('Failed to load courses');
  }

  if (!data) {
    return [];
  }

  // Transform database fields to match interface
  const courses: Course[] = data.map((row: any) => ({
    id: row.id,
    title: row.title,
    titleTarget: row.title_target,
    description: row.description,
    iconName: row.icon_name,
    iconUrl: row.icon_url,
    color: row.color,
    displayOrder: row.display_order,
    isAvailable: row.is_available,
    languageId: row.language_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  setCache(cacheKey, courses);
  return courses;
}

/**
 * Load a single course by ID
 */
export async function loadCourse(courseId: string): Promise<Course | null> {
  const cacheKey = `course:${courseId}`;
  const cached = getFromCache<Course>(cacheKey);
  if (cached) {
    return cached;
  }

  const {data, error} = await withTimeout(
    supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .eq('is_available', true)
      .single(),
    API_TIMEOUT,
    'Loading course timed out - please check your connection',
  );

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Course not found
    }
    console.error('Failed to load course:', error);
    throw new Error('Failed to load course');
  }

  if (!data) {
    return null;
  }

  const row = data as any;
  const course: Course = {
    id: row.id,
    title: row.title,
    titleTarget: row.title_target,
    description: row.description,
    iconName: row.icon_name,
    iconUrl: row.icon_url,
    color: row.color,
    displayOrder: row.display_order,
    isAvailable: row.is_available,
    languageId: row.language_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  setCache(cacheKey, course);
  return course;
}

// ============================================================================
// LESSON FUNCTIONS
// ============================================================================

/**
 * Load all lessons for a course (lessons are acts, which contain exercises)
 */
export async function loadCourseLessons(courseId: string): Promise<Lesson[]> {
  const cacheKey = `lessons:course:${courseId}`;
  const cached = getFromCache<Lesson[]>(cacheKey);
  if (cached) {
    console.log(
      `[CACHE HIT] Returning ${cached.length} lessons for course ${courseId}`,
    );
    return cached;
  }

  console.log(`[DB QUERY] Loading lessons for course: ${courseId}`);
  const {data, error} = await withTimeout(
    supabase
      .from('lesson_summary' as any)
      .select('*')
      .eq('course_id', courseId)
      .order('display_order'),
    API_TIMEOUT,
    'Loading lessons timed out - please check your connection',
  );

  if (error) {
    console.error('Failed to load course lessons:', error);
    throw new Error('Failed to load course lessons');
  }

  if (!data) {
    return [];
  }

  const lessons: Lesson[] = data.map((row: any) => ({
    id: row.id,
    courseId: row.course_id,
    title: row.title,
    titleTarget: row.title_target,
    description: row.description,
    iconName: row.icon_name,
    iconUrl: row.icon_url,
    displayOrder: row.display_order,
    estimatedMinutes: row.estimated_minutes,
    isAvailable: row.is_available,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    exerciseCount: row.exercise_count,
    course: row.course_title
      ? {
          id: row.course_id,
          title: row.course_title,
          titleTarget: row.course_title_target, // Updated to match view
          description: undefined,
          iconName: undefined,
          iconUrl: undefined,
          color: row.course_color,
          displayOrder: row.course_display_order,
          isAvailable: true,
          createdAt: '',
          updatedAt: '',
        }
      : undefined,
    exercises: [], // Will be populated when needed
  }));

  console.log(
    `[DB RESULT] Loaded ${lessons.length} lessons for course ${courseId}:`,
    lessons.map(l => l.title).join(', '),
  );

  setCache(cacheKey, lessons);
  return lessons;
}

/**
 * Load a single lesson with all exercises
 */
export async function loadLesson(lessonId: string): Promise<Lesson | null> {
  const cacheKey = `lesson:${lessonId}`;
  const cached = getFromCache<Lesson>(cacheKey);
  if (cached) {
    return cached;
  }

  // Load lesson with course
  const {data: lessonData, error: lessonError} = await supabase
    .from('lessons')
    .select(
      `
      *,
      course:courses(*)
    `,
    )
    .eq('id', lessonId)
    .eq('is_available', true)
    .single();

  if (lessonError) {
    if (lessonError.code === 'PGRST116') {
      return null; // Lesson not found
    }
    console.error('Failed to load lesson:', lessonError);
    throw new Error('Failed to load lesson');
  }

  if (!lessonData) {
    return null;
  }

  // Load exercises for this lesson
  const exercises = await loadLessonExercises(lessonId);

  // Transform the data
  const row = lessonData as any;
  const lesson: Lesson = {
    id: row.id,
    courseId: row.course_id,
    title: row.title,
    titleTarget: row.title_target,
    description: row.description,
    iconName: row.icon_name,
    iconUrl: row.icon_url,
    displayOrder: row.display_order,
    estimatedMinutes: row.estimated_minutes,
    isAvailable: row.is_available,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    course: row.course
      ? {
          id: row.course.id,
          title: row.course.title,
          titleTarget: row.course.title_target,
          description: row.course.description,
          iconName: row.course.icon_name,
          iconUrl: row.course.icon_url,
          color: row.course.color,
          displayOrder: row.course.display_order,
          isAvailable: row.course.is_available,
          languageId: row.course.language_id,
          createdAt: row.course.created_at,
          updatedAt: row.course.updated_at,
        }
      : undefined,
    exercises,
  };

  setCache(cacheKey, lesson);
  return lesson;
}

// ============================================================================
// EXERCISE FUNCTIONS
// ============================================================================

/**
 * Load all exercises for a lesson
 */
export async function loadLessonExercises(
  lessonId: string,
): Promise<Exercise[]> {
  const cacheKey = `exercises:lesson:${lessonId}`;
  const cached = getFromCache<Exercise[]>(cacheKey);
  if (cached) {
    return cached;
  }

  // Use exercise_details view to get sentence counts
  const {data, error} = await supabase
    .from('exercise_details' as any)
    .select('*')
    .eq('lesson_id', lessonId)
    .order('display_order');

  if (error) {
    console.error('Failed to load lesson exercises:', error);
    // Fallback to exercises table if view doesn't exist or fails
    return loadLessonExercisesFallback(lessonId);
  }

  if (!data) {
    return [];
  }

  const exercises: Exercise[] = data.map((row: any) => ({
    id: row.id,
    lessonId: row.lesson_id,
    title: row.title,
    type: row.type as 'standard' | 'cloze' | 'matching_pairs',
    displayOrder: row.display_order,
    estimatedMinutes: row.estimated_minutes,
    isAvailable: row.is_available,
    isRequired: row.is_required ?? true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    sentenceCount: row.sentence_count,
  }));

  setCache(cacheKey, exercises);
  return exercises;
}

async function loadLessonExercisesFallback(
  lessonId: string,
): Promise<Exercise[]> {
  const {data, error} = await supabase
    .from('exercises')
    .select('*')
    .eq('lesson_id', lessonId)
    .eq('is_available', true)
    .order('display_order');

  if (error) {
    console.error('Failed to load lesson exercises (fallback):', error);
    throw new Error('Failed to load lesson exercises');
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    lessonId: row.lesson_id,
    title: row.title,
    type: row.type as 'standard' | 'cloze' | 'matching_pairs',
    displayOrder: row.display_order,
    estimatedMinutes: row.estimated_minutes,
    isAvailable: row.is_available,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/**
 * Load a single exercise with all related data (sentences and speakers)
 */
export async function loadExercise(
  exerciseId: string,
): Promise<Exercise | null> {
  const cacheKey = `exercise:${exerciseId}`;
  const cached = getFromCache<Exercise>(cacheKey);
  if (cached) {
    return cached;
  }

  // Load exercise with lesson and units
  const {data: exerciseData, error: exerciseError} = await supabase
    .from('exercises')
    .select(
      `
      *,
      lesson:lessons(*),
      units:exercise_units(*, audio:sentence_audio(*)),
      speakers:exercise_speakers(*)
    `,
    )
    .eq('id', exerciseId)
    .eq('is_available', true)
    .single();

  if (exerciseError) {
    if (exerciseError.code === 'PGRST116') {
      return null; // Exercise not found
    }
    console.error('Failed to load exercise:', exerciseError);
    throw new Error('Failed to load exercise');
  }

  if (!exerciseData) {
    return null;
  }

  // Transform the data
  const row = exerciseData as any;
  const exercise: Exercise = {
    id: row.id,
    lessonId: row.lesson_id,
    title: row.title,
    type: row.type as 'standard' | 'matching_pairs' | 'cloze',
    displayOrder: row.display_order,
    estimatedMinutes: row.estimated_minutes,
    isAvailable: row.is_available,
    isRequired: row.is_required ?? true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lesson: row.lesson
      ? {
          id: row.lesson.id,
          courseId: row.lesson.course_id,
          title: row.lesson.title,
          titleTarget: row.lesson.title_target,
          description: row.lesson.description,
          iconName: row.lesson.icon_name,
          iconUrl: row.lesson.icon_url,
          displayOrder: row.lesson.display_order,
          estimatedMinutes: row.lesson.estimated_minutes,
          isAvailable: row.lesson.is_available,
          createdAt: row.lesson.created_at,
          updatedAt: row.lesson.updated_at,
        }
      : undefined,
    units: row.units
      ?.map((unit: any) => {
        // Map sentence_audio to metadata.audio if available
        // The query above needs to be updated to include it: units:exercise_units(*, audio:sentence_audio(*))
        // But first let's update the query below.

        let audio = unit.metadata?.audio;

        // If we have joined audio data, map it to the expected format
        if (unit.audio && Array.isArray(unit.audio) && unit.audio.length > 0) {
          audio = unit.audio.map((a: any) => ({
            id: a.id,
            url: a.audio_url,
            speakerId: a.speaker_id,
          }));
        }

        return {
          id: unit.id,
          exerciseId: unit.exercise_id,
          unitType: unit.unit_type,
          content: unit.content,
          metadata: {
            ...unit.metadata,
            audio: audio,
          },
          displayOrder: unit.display_order,
          createdAt: unit.created_at,
          updatedAt: unit.updated_at,
          // Helper legacy props
          sourceText: unit.content?.source,
          targetText: unit.content?.target,
          wordAudioUrls: unit.metadata?.wordAudioUrls,
        };
      })
      .sort((a: any, b: any) => a.displayOrder - b.displayOrder),
    speakers: row.speakers?.map((speaker: any) => ({
      id: speaker.id,
      exerciseId: speaker.exercise_id,
      name: speaker.name,
      color: speaker.color,
      icon: speaker.icon,
      createdAt: speaker.created_at,
    })),
  };

  // Legacy support: map units to sentences if they are translation units
  // exercise.sentences = exercise.units
  //   ?.filter((u: any) => u.unitType === 'sentence')
  //   .map((u: any) => u as Sentence);

  setCache(cacheKey, exercise);
  return exercise;
}

// ============================================================================
// SENTENCE FUNCTIONS
// ============================================================================

/**
 * Load sentences for an exercise with metadata
 */
// Replaced with loadExerciseUnits
export async function loadExerciseSentences(
  exerciseId: string,
): Promise<Sentence[]> {
  const cacheKey = `units:exercise:${exerciseId}`;
  const cached = getFromCache<Sentence[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const {data, error} = await supabase
    .from('exercise_units')
    .select('*')
    .eq('exercise_id', exerciseId)
    .order('display_order');

  if (error) {
    console.error('Failed to load exercise units:', error);
    throw new Error('Failed to load exercise units');
  }

  if (!data) {
    return [];
  }

  const units: Sentence[] = data.map((row: any) => ({
    id: row.id,
    exerciseId: row.exercise_id,
    unitType: row.unit_type,
    content: row.content,
    metadata: row.metadata,
    displayOrder: row.display_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    // Map legacy Sentence props from generic content
    sourceText: row.content?.source,
    targetText: row.content?.target,
    wordAudioUrls: row.metadata?.wordAudioUrls,
  })) as any[]; // Cast to match Sentence interface return

  setCache(cacheKey, units);
  return units;
}

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

/**
 * Clear all content cache
 */
export function clearContentCache(): void {
  contentCache.clear();
  storage.clearAll();
}

/**
 * Clear cache for specific key pattern
 */
export function clearCachePattern(pattern: string): void {
  // Clear memory cache
  for (const key of contentCache.keys()) {
    if (key.includes(pattern)) {
      contentCache.delete(key);
    }
  }

  // Clear MMKV cache by clearing all (MMKV doesn't have delete in v2+)
  storage.clearAll();
}
// ============================================================================
// RICH CONTENT FUNCTIONS
// ============================================================================

/**
 * Load content blocks for a parent (course or lesson)
 */
export async function loadContentBlocks(
  parentType: 'course' | 'lesson',
  parentId: string,
  languageId: string = 'irish_std',
): Promise<ContentBlock[]> {
  const cacheKey = `content_blocks:${parentType}:${parentId}:${languageId}`;
  const cached = getFromCache<ContentBlock[]>(cacheKey);
  if (cached) {
    console.log(
      `[loadContentBlocks] Cache hit for ${parentType}:${parentId}:${languageId}`,
    );
    return cached;
  }

  console.log(
    `[loadContentBlocks] Fetching content blocks for ${parentType}:${parentId}:${languageId}`,
  );

  const {data, error} = await supabase
    .from('content_blocks' as any) // Cast to any until schema is updated
    .select('*')
    .eq('parent_type', parentType)
    .eq('parent_id', parentId)
    .eq('language_id', languageId)
    .eq('is_available', true)
    .order('display_order');

  if (error) {
    console.error('[loadContentBlocks] Failed to load content blocks:', error);
    return [];
  }

  if (!data) {
    console.log('[loadContentBlocks] No data returned');
    return [];
  }

  console.log(
    `[loadContentBlocks] Loaded ${data.length} content blocks:`,
    data.map((row: any) => ({
      id: row.id,
      type: row.block_type,
      order: row.display_order,
      contentType: typeof row.content,
    })),
  );

  const blocks: ContentBlock[] = data.map((row: any) => {
    let parsedContent = row.content;
    let parsedMetadata = row.metadata;

    // Parse JSON strings if needed
    if (typeof row.content === 'string') {
      try {
        parsedContent = JSON.parse(row.content);
        console.log(
          `[loadContentBlocks] Parsed content for block ${row.id}:`,
          parsedContent,
        );
      } catch (e) {
        console.error(
          `[loadContentBlocks] Failed to parse content for block ${row.id}:`,
          row.content,
          e,
        );
      }
    }

    if (typeof row.metadata === 'string') {
      try {
        parsedMetadata = JSON.parse(row.metadata);
      } catch (e) {
        console.error(
          `[loadContentBlocks] Failed to parse metadata for block ${row.id}:`,
          row.metadata,
          e,
        );
      }
    }

    return {
      id: row.id,
      parentType: row.parent_type,
      parentId: row.parent_id,
      blockType: row.block_type,
      displayOrder: row.display_order,
      content: parsedContent,
      languageId: row.language_id,
      metadata: parsedMetadata,
      isAvailable: row.is_available,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  });

  setCache(cacheKey, blocks);
  console.log(`[loadContentBlocks] Returning ${blocks.length} blocks`);
  return blocks;
}

/**
 * Load a lesson with its content blocks
 */
export async function loadLessonWithContent(
  lessonId: string,
  languageId: string = 'irish_std',
): Promise<LessonWithContent | null> {
  const lesson = await loadLesson(lessonId);
  if (!lesson) {
    return null;
  }

  const contentBlocks = await loadContentBlocks('lesson', lessonId, languageId);

  return {
    ...lesson,
    contentBlocks,
  };
}

/**
 * Load a course with its content blocks
 */
export async function loadCourseWithContent(
  courseId: string,
  languageId: string = 'irish_std',
): Promise<CourseWithContent | null> {
  const course = await loadCourse(courseId);
  if (!course) {
    return null;
  }

  const contentBlocks = await loadContentBlocks('course', courseId, languageId);
  // Note: We don't load all lessons with content here to avoid over-fetching
  // Lessons should be loaded separately or lazily

  return {
    ...course,
    contentBlocks,
  };
}
