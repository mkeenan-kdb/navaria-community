import React, {useEffect} from 'react';
import {useAchievementStore} from '@/stores/achievementStore';
import {AchievementUnlockModal} from './AchievementUnlockModal';
import {playAchievement} from '@/services/audio';

/**
 * Global achievement notification manager
 * Renders at app level to show achievement notifications regardless of current screen
 */
export const GlobalAchievementNotification: React.FC = () => {
  const {notificationQueue, showNotification, dismissNotification} =
    useAchievementStore();

  // Get the current notification (first in queue)
  const currentNotification =
    notificationQueue.length > 0 ? notificationQueue[0] : null;

  useEffect(() => {
    if (showNotification && currentNotification) {
      console.log(
        '[GLOBAL_ACHIEVEMENT] Showing notification for:',
        currentNotification.title,
      );
      // Play achievement sound
      playAchievement();
    }
  }, [showNotification, currentNotification]);

  return (
    <AchievementUnlockModal
      visible={showNotification}
      achievement={currentNotification}
      onClose={dismissNotification}
    />
  );
};
