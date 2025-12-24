// Content types for lessons, vocabulary, grammar, etc.

// ============================================================================
// DYNAMIC COURSE SYSTEM TYPES (Database-backed)
// ============================================================================

export interface Course {
  id: string;
  title: string;
  titleTarget?: string; // Renamed from titleIrish
  description?: string;
  iconName?: string; // Local asset icon name
  iconUrl?: string; // Remote icon URL
  color: string;
  displayOrder: number;
  isAvailable: boolean;
  languageId?: string; // Added for multilingual support
  createdAt: string;
  updatedAt: string;
}

export interface ExerciseSpeaker {
  id: string;
  exerciseId: string;
  name: string;
  color: string;
  icon: string;
  createdAt: string;
}

export interface Speaker {
  id: string;
  name: string; // internal name
  displayName: string;
  dialect?: string;
  gender?: string;
  profileImageUrl?: string;
  createdAt: string;
}

// Replaced Sentence with ExerciseUnit Discriminated Union
export type ExerciseUnitType =
  | 'sentence'
  | 'matching_group'
  | 'cloze'
  | 'content';

export interface ExerciseUnitBase {
  id: string;
  exerciseId: string;
  unitType: ExerciseUnitType;
  displayOrder: number;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface TranslationUnit extends ExerciseUnitBase {
  unitType: 'sentence'; // Maps to legacy "sentence"
  content: {
    source: string;
    target: string;
  };
  // Helper for backward compat
  sourceText?: string;
  targetText?: string;
}

export interface MatchingPair {
  id: string; // usually just a temporary UUID or index
  source: string;
  target: string;
  audioUrl?: string;
}

export interface MatchingGroupUnit extends ExerciseUnitBase {
  unitType: 'matching_group';
  content: {
    pairs: MatchingPair[];
  };
}

export interface ClozeUnit extends ExerciseUnitBase {
  unitType: 'cloze';
  content: {
    source: string;
    target: string;
  };
  // Helper for backward compat
  sourceText?: string;
  targetText?: string;
}

export type ExerciseUnit = TranslationUnit | MatchingGroupUnit | ClozeUnit;

// Legacy alias for gradual migration if needed, but preferably use ExerciseUnit
export type Sentence = TranslationUnit;

export type ExerciseType = 'standard' | 'matching_pairs' | 'cloze';

export interface Exercise {
  id: string;
  lessonId: string;
  title: string;
  type: ExerciseType;
  displayOrder: number;
  estimatedMinutes: number;
  isAvailable: boolean;
  isRequired?: boolean; // For marking exercises as optional
  createdAt: string;
  updatedAt: string;
  // Populated from joins or views
  units?: ExerciseUnit[]; // Preferred new property
  sentences?: Sentence[]; // Legacy support (computed or mapped)

  sentenceCount?: number;
  speakers?: ExerciseSpeaker[];
  lesson?: Lesson;
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  titleTarget?: string;
  description?: string;
  iconName?: string;
  iconUrl?: string;
  displayOrder: number;
  estimatedMinutes: number;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
  // Populated from joins or views
  exercises?: Exercise[];
  exerciseCount?: number;
  course?: Course;
  requiresPrerequisites?: boolean;
  unlockDescription?: string;
  type?: LessonType;
}

export interface GrammarCategory {
  id: string;
  categoryName: string;
  subcategoryName: string;
  description?: string;
  createdAt: string;
}

export type ContentBlockType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'exercise'
  | 'lesson';
export type ParentType = 'course' | 'lesson';

export interface TextBlockContent {
  text: string;
  markdown?: boolean;
  align?: 'left' | 'center' | 'right';
  style?: {
    fontSize?: number;
    color?: string;
    fontWeight?: 'normal' | 'bold' | 'semibold';
  };
}

export interface ImageBlockContent {
  url: string;
  caption?: string;
  alt?: string;
  aspectRatio?: number;
  fullWidth?: boolean;
}

export interface VideoBlockContent {
  url: string;
  caption?: string;
  thumbnail?: string;
  duration?: number;
  autoplay?: boolean;
  controls?: boolean;
}

export interface AudioBlockContent {
  url: string;
  title?: string;
  description?: string;
}

export interface ExerciseBlockContent {
  exerciseId: string;
  title?: string; // Custom exercise title (admin-defined)
  type?: ExerciseType;
  description?: string;
  showPreview?: boolean;
  isRequired?: boolean; // For marking exercises as optional
  units?: DraftExerciseUnit[];
}

export type DraftExerciseUnit =
  | {
      unitType: 'sentence';
      content: {source: string; target: string};
      metadata?: {
        speakerId?: string;
        audioUrl?: string; // Legacy/Single Sentence audio
        audio?: Array<{url: string; speakerId?: string}>; // Multiple audio support
        wordAudioUrls?: Record<string, any>;
        distractors?: string[];
        _rawDistractors?: string; // UI helper
      };
      // Audio metadata for the unit itself (like sentence audio) can be in metadata
      // But we often handle audio upload separately in editor.
    }
  | {
      unitType: 'matching_group';
      content: {
        pairs: Array<{
          source: string;
          target: string;
          audioUrl?: string;
        }>;
      };
      metadata?: any;
    }
  | {
      unitType: 'cloze';
      content: {
        source: string; // "The cat sat on the mat"
        target: string; // "Bhí an [cat]..."
      };
      metadata?: {
        distractors?: string[];
        _rawDistractors?: string;
        audioUrl?: string;
        audio?: Array<{url: string; speakerId?: string}>;
      };
    };

export interface LessonBlockContent {
  lessonId: string;
  showPreview?: boolean;
}

export interface ContentBlock {
  id: string;
  parentType: ParentType;
  parentId: string;
  blockType: ContentBlockType;
  displayOrder: number;
  content:
    | TextBlockContent
    | ImageBlockContent
    | VideoBlockContent
    | TextBlockContent
    | ImageBlockContent
    | VideoBlockContent
    | AudioBlockContent
    | ExerciseBlockContent
    | LessonBlockContent;
  languageId?: string | null;
  metadata?: Record<string, any>;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LessonPrerequisite {
  id: string;
  lessonId: string;
  prerequisiteLessonId: string;
  requiredCompletionCount: number;
  createdAt: string;
  prerequisiteLesson?: Lesson;
}

export interface UnlockStatus {
  isUnlocked: boolean;
  reason?: string;
  missingPrerequisites?: Array<{
    lessonId: string;
    lessonTitle: string;
    currentCompletion: number;
    requiredCompletion: number;
  }>;
}

export interface LessonWithContent extends Lesson {
  contentBlocks?: ContentBlock[];
  prerequisites?: LessonPrerequisite[];
  unlockStatus?: UnlockStatus;
}

export interface CourseWithContent extends Course {
  contentBlocks?: ContentBlock[];
  lessons?: LessonWithContent[];
}

// Legacy type alias for backward compatibility
export type LessonType = ExerciseType;

export interface LessonSpeaker {
  id: string;
  lessonId: string;
  name: string;
  color: string;
  icon: string;
  createdAt: string;
}

// ============================================================================
// LEGACY TYPES (for backward compatibility during migration)
// ============================================================================

export interface Act {
  id: string;
  title: string;
  description: string;
  lessons: Exercise[]; // Note: "lessons" in Act actually refers to exercises for backward compatibility
  order: number;
  // Raw sentences from the JSON file
  sentences?: LegacySentence[];
}

export interface LegacySentence {
  id: number;
  irish: string;
  english: string;
  irish_unmutated: string;
  speaker?: string;
  speaker_color?: string;
  speaker_icon?: string;
}

export interface ActData {
  [key: string]: Sentence[];
}

// Homepage Phrase (formerly Seanfhocal/Proverb) types
export interface HomepagePhrase {
  targetText: string;
  sourceText: string;
  explanation?: string;
  theme?: string;
}
