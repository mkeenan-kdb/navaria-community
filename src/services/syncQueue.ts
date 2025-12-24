import {createStorage} from '@/services/storage';
import * as ProgressService from './progress';
import * as AchievementService from './achievements';

// Initialize storage
const storage = createStorage('sync-queue');
const QUEUE_KEY = 'mutation_queue';

export type MutationType =
  | 'MARK_UNIT_COMPLETE'
  | 'SUBMIT_EXERCISE'
  | 'COMPLETE_LESSON'
  | 'UNLOCK_ACHIEVEMENT';

export interface Mutation {
  id: string;
  type: MutationType;
  payload: any;
  createdAt: number;
  retryCount: number;
}

let isSyncing = false;

/**
 * Get current queue from storage
 */
function getQueue(): Mutation[] {
  const json = storage.getString(QUEUE_KEY);
  return json ? JSON.parse(json) : [];
}

/**
 * Save queue to storage
 */
function saveQueue(queue: Mutation[]) {
  storage.set(QUEUE_KEY, JSON.stringify(queue));
}

/**
 * Add a mutation to the queue
 */
export async function addToQueue(
  type: MutationType,
  payload: any,
  onComplete?: () => void,
) {
  const queue = getQueue();
  const mutation: Mutation = {
    id: Date.now().toString() + Math.random().toString(36).substring(7),
    type,
    payload,
    createdAt: Date.now(),
    retryCount: 0,
  };

  queue.push(mutation);
  saveQueue(queue);

  // Try to process immediately and call callback when done
  await processQueue();
  onComplete?.();
}

/**
 * Process the queue
 */
export async function processQueue() {
  if (isSyncing) {
    return;
  }

  const queue = getQueue();
  if (queue.length === 0) {
    return;
  }

  isSyncing = true;
  const remainingMutations: Mutation[] = [];
  let failed = false;

  try {
    for (const mutation of queue) {
      console.log(
        `[Sync] Processing mutation: ${mutation.type}`,
        mutation.payload,
      );
      if (failed) {
        remainingMutations.push(mutation);
        continue;
      }

      try {
        await processMutation(mutation);
      } catch (error: any) {
        // Check for fatal errors that shouldn't be retried
        const isFatalError =
          error?.code === '23503' || // Foreign key violation
          error?.code === '23505' || // Unique violation
          error?.code === '42P01' || // Undefined table
          error?.message?.includes('violates foreign key constraint');

        if (isFatalError) {
          console.log(
            `[Sync] Discarding invalid mutation ${mutation.id} (non-recoverable error):`,
            error.message,
          );
          // Don't retry, just log and continue to next
          continue;
        }

        console.warn(
          `[Sync] Failed to process mutation ${mutation.id}:`,
          error,
        );
        mutation.retryCount++;
        remainingMutations.push(mutation);
        // If we hit an error, stop processing subsequent items to preserve order dependencies
        // unless it's a non-network error that won't be fixed by waiting
        failed = true;
      }
    }
  } finally {
    // Handle race condition: items might have been added to the queue while we were syncing
    const currentQueue = getQueue();
    const processedIds = new Set(queue.map(m => m.id));
    const newItems = currentQueue.filter(m => !processedIds.has(m.id));

    saveQueue([...remainingMutations, ...newItems]);
    isSyncing = false;
  }
}

/**
 * Process a single mutation
 */
async function processMutation(mutation: Mutation) {
  switch (mutation.type) {
    case 'MARK_UNIT_COMPLETE': {
      const {userId, lessonId, courseId, unitId, totalUnits} = mutation.payload;
      await ProgressService.markUnitComplete(
        userId,
        lessonId,
        courseId,
        unitId,
        totalUnits,
      );
      break;
    }
    case 'SUBMIT_EXERCISE': {
      const {userId, lessonId, courseId, exerciseId, totalUnits, stats} =
        mutation.payload;
      await ProgressService.submitExercise(
        userId,
        lessonId,
        courseId,
        exerciseId,
        totalUnits,
        stats,
      );
      break;
    }
    case 'COMPLETE_LESSON': {
      const {userId, lessonId, courseId, totalUnits, stats} = mutation.payload;
      await ProgressService.completeLesson(
        userId,
        lessonId,
        courseId,
        totalUnits,
        stats,
      );
      break;
    }

    case 'UNLOCK_ACHIEVEMENT': {
      const {userId, achievementType, languageId} = mutation.payload;
      await AchievementService.unlockAchievement(
        userId,
        achievementType,
        languageId,
      );
      break;
    }
    default:
      console.warn(`[Sync] Unknown mutation type: ${mutation.type}`);
  }
}

/**
 * Get queue status
 */
export function getQueueStatus() {
  const queue = getQueue();
  return {
    pendingCount: queue.length,
    isSyncing,
  };
}
