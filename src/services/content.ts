// Content loading and parsing service for React Native
// This service uses the dynamic content system (Supabase database)

import {createStorage} from '@/services/storage';
import * as DynamicContent from '@/services/dynamicContent';
import type {HomepagePhrase} from '@/types';

// Initialize storage for caching
const storage = createStorage('content-cache');

// Cache for loaded content
const contentCache = new Map<string, unknown>();

// Static imports for non-course data (homepage phrases)
const dataFiles: Record<string, unknown> = {
  // Homepage Phrases (formerly Seanfhocail)
  'homepage_phrases/irish_std': require('@/assets/data/homepage_phrases/irish_std.json'),
  'homepage_phrases/irish_mun': require('@/assets/data/homepage_phrases/irish_mun.json'),
  'homepage_phrases/irish_con': require('@/assets/data/homepage_phrases/irish_con.json'),
  'homepage_phrases/irish_ul': require('@/assets/data/homepage_phrases/irish_ul.json'),
  'homepage_phrases/navajo': require('@/assets/data/homepage_phrases/navajo.json'),
  'homepage_phrases/maori': require('@/assets/data/homepage_phrases/maori.json'),
};

/**
 * Load and parse a JSON file from assets
 */
async function loadJSON<T>(path: string): Promise<T> {
  // Check memory cache first
  if (contentCache.has(path)) {
    return contentCache.get(path) as T;
  }

  // Check MMKV cache
  const cached = storage.getString(path);
  if (cached) {
    try {
      const data = JSON.parse(cached);
      contentCache.set(path, data);
      return data as T;
    } catch (error) {
      console.warn('Failed to parse cached data:', error);
    }
  }

  // Normalize path for lookup
  const normalizedPath = path.replace('/data/', '').replace('.json', '');

  // Get data from static imports
  const data = dataFiles[normalizedPath];

  if (!data) {
    throw new Error(`Data file not found: ${path}`);
  }

  // Cache the result
  storage.set(path, JSON.stringify(data));
  contentCache.set(path, data);

  return data as T;
}

/**
 * Load homepage phrases (formerly seanfhocail)
 */
export async function loadHomepagePhrases(
  languageId = 'irish_std',
): Promise<HomepagePhrase[]> {
  try {
    // Map language ID to file path if needed, or assume standard naming
    // e.g., 'irish_std' -> 'homepage_phrases/irish_std'
    // Default fallback to irish_std if no specific file found is not handled here yet,
    // but we could check if the key exists in dataFiles.

    const fileKey = `homepage_phrases/${languageId}`;
    let data;

    try {
      data = await loadJSON<any>(fileKey);
    } catch (e) {
      console.warn(
        `No homepage phrases found for ${languageId}, falling back to irish_std`,
      );
      data = await loadJSON<any>('homepage_phrases/irish_std');
    }

    // Handle the format { [targetLang]: string[], english: string[] }
    // Determine the target language key based on the language ID
    // For Irish dialects, the key is 'irish'. For others, it matches the language ID (e.g. 'navajo')
    const targetKey = languageId.startsWith('irish') ? 'irish' : languageId;

    if (Array.isArray(data[targetKey]) && Array.isArray(data.english)) {
      const target = data[targetKey];
      const english = data.english;
      const count = Math.min(target.length, english.length);

      const phrases: HomepagePhrase[] = [];
      for (let i = 0; i < count; i++) {
        // Skip empty entries
        if (target[i] && english[i]) {
          phrases.push({
            targetText: target[i],
            sourceText: english[i],
          });
        }
      }
      return phrases;
    }

    // Handle legacy format { seanfhocail: Seanfhocal[] }
    if (Array.isArray(data.seanfhocail)) {
      return data.seanfhocail.map((s: any) => ({
        ...s,
        targetText: s.irish || s.targetText,
        sourceText: s.english || s.sourceText,
        irish: undefined,
        english: undefined,
      }));
    }

    // Handle if the file itself is an array
    if (Array.isArray(data)) {
      return data.map((s: any) => ({
        ...s,
        targetText: s.irish || s.targetText,
        sourceText: s.english || s.sourceText,
        irish: undefined,
        english: undefined,
      }));
    }

    console.warn('Unknown homepage phrase data format');
    return [];
  } catch (error) {
    console.error('Error loading homepage phrases:', error);
    return [];
  }
}

/**
 * Get a random homepage phrase
 */
export async function getRandomHomepagePhrase(
  languageId?: string,
): Promise<HomepagePhrase | null> {
  const phrases = await loadHomepagePhrases(languageId);
  if (phrases.length === 0) {
    return null;
  }
  return phrases[Math.floor(Math.random() * phrases.length)];
}

/**
 * Clear content cache
 */
export function clearContentCache(): void {
  contentCache.clear();
  storage.clearAll();

  // Also clear dynamic content cache
  DynamicContent.clearContentCache();
}

// ============================================================================
// DYNAMIC CONTENT FUNCTIONS (Course/Lesson/Exercise/Sentence)
// ============================================================================

/**
 * Load all courses
 */
export async function loadCourses() {
  return await DynamicContent.loadCourses();
}

/**
 * Load a single course by ID
 */
export async function loadCourse(courseId: string) {
  return await DynamicContent.loadCourse(courseId);
}

/**
 * Load all lessons for a course
 */
export async function loadCourseLessons(courseId: string) {
  return await DynamicContent.loadCourseLessons(courseId);
}

/**
 * Load a single lesson with exercises
 */
export async function loadLesson(lessonId: string) {
  return await DynamicContent.loadLesson(lessonId);
}

/**
 * Load all exercises for a lesson
 */
export async function loadLessonExercises(lessonId: string) {
  return await DynamicContent.loadLessonExercises(lessonId);
}

/**
 * Load a single exercise with sentences and speakers
 */
export async function loadExercise(exerciseId: string) {
  return await DynamicContent.loadExercise(exerciseId);
}

/**
 * Load sentences for an exercise with metadata
 */
export async function loadExerciseSentences(exerciseId: string) {
  return await DynamicContent.loadExerciseSentences(exerciseId);
}
