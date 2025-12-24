import React from 'react';
import {View} from 'react-native';
import type {ContentBlock, LessonProgress} from '@/types';
import {TextBlock} from './TextBlock';
import {ImageBlock} from './ImageBlock';
import {VideoBlock} from './VideoBlock';
import {AudioBlock} from './AudioBlock';
import {ExerciseBlock} from './ExerciseBlock';
import {LessonBlock} from './LessonBlock';

interface Props {
  block: ContentBlock;
  onExercisePress?: (exerciseId: string) => void;
  onLessonPress?: (lessonId: string) => void;
  exerciseProgress?: Map<string, LessonProgress>; // For Exercise Blocks
  lessonsProgress?: Map<string, LessonProgress>; // For Lesson Blocks
  unlockStatusMap?: Map<string, boolean>; // For Lesson Blocks (isUnlocked)
  lessonProgress?: LessonProgress | null; // For context (parent lesson)
  containerWidth?: number;
}

export const ContentBlockRenderer: React.FC<Props> = ({
  block,
  onExercisePress,
  onLessonPress,
  exerciseProgress,
  lessonsProgress,
  unlockStatusMap,
  lessonProgress,
  containerWidth,
}) => {
  /*console.log('[ContentBlockRenderer] Rendering block:', {
    id: block.id,
    type: block.blockType,
    isAvailable: block.isAvailable,
    content: block.content,
  });*/

  if (!block.isAvailable) {
    console.log(
      '[ContentBlockRenderer] Block not available, skipping:',
      block.id,
    );
    return null;
  }

  switch (block.blockType) {
    case 'text':
      return <TextBlock block={block} />;
    case 'image':
      return <ImageBlock block={block} containerWidth={containerWidth} />;
    case 'video':
      return <VideoBlock block={block} containerWidth={containerWidth} />;
    case 'audio':
      return <AudioBlock block={block} />;
    case 'exercise':
      // Extract exercise ID from content
      const exerciseId = (block.content as any).exerciseId;
      // Try to get specific exercise progress first, then fall back to lesson progress
      const specificProgress = exerciseProgress?.get(exerciseId);

      return (
        <ExerciseBlock
          block={block}
          onPress={onExercisePress}
          progress={specificProgress}
          lessonProgress={lessonProgress || undefined}
        />
      );
    case 'lesson':
      const lessonId = (block.content as any).lessonId;
      const specificLessonProgress = lessonsProgress?.get(lessonId);
      // If we have an unlock map, check it. If undefined, assume NOT locked (or handle gracefully)
      // Convention: unlockStatusMap.get(id) returns true if UNLOCKED.
      // isLocked should be !isUnlocked.
      // If map doesn't have it, undefined. !undefined is true. So default to locked?
      // Or default to false if map is missing entirely?
      const isUnlocked = unlockStatusMap?.get(lessonId);
      const isLocked = isUnlocked !== undefined ? !isUnlocked : undefined;

      return (
        <LessonBlock
          block={block}
          onPress={onLessonPress}
          progress={specificLessonProgress}
          isLocked={isLocked}
        />
      );
    default:
      console.warn(
        `[ContentBlockRenderer] Unknown block type: ${block.blockType}`,
      );
      return <View />;
  }
};
