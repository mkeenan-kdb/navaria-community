// Haptic feedback service for lesson interactions
import * as Haptics from 'expo-haptics';

/**
 * Light haptic feedback for correct letter
 */
export async function hapticCorrect(): Promise<void> {
  try {
    // Use selection feedback for subtle correct response
    await Haptics.selectionAsync();
  } catch (error) {
    // Haptics not supported on this device
  }
}

/**
 * Strong haptic feedback for incorrect letter
 */
export async function hapticIncorrect(): Promise<void> {
  try {
    // Use notification error for strong, noticeable feedback
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch (error) {
    // Haptics not supported on this device
  }
}

/**
 * Success notification haptic for word completion
 */
export async function hapticWordComplete(): Promise<void> {
  try {
    // Use success notification for satisfying feedback
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (error) {
    // Haptics not supported on this device
  }
}

/**
 * Heavy haptic feedback for lesson completion
 */
export async function hapticCompletion(): Promise<void> {
  try {
    // Use heavy impact for celebration
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    // Double tap for extra celebration
    setTimeout(async () => {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch (e) {
        // Ignore
      }
    }, 100);
  } catch (error) {
    // Haptics not supported on this device
  }
}

/**
 * Selection haptic for keyboard press
 */
export async function hapticSelection(): Promise<void> {
  try {
    // Very light feedback for keyboard
    await Haptics.selectionAsync();
  } catch (error) {
    // Haptics not supported on this device
  }
}
