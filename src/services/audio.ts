// Low-latency audio feedback service using react-native-sound with priority system
import Sound from 'react-native-sound';
import {Asset} from 'expo-asset';

// Enable playback in silence mode
Sound.setCategory('Playback', true);

// Sound file paths
const SOUND_PATHS = {
  success: require('@/assets/sounds/keyboard_click.mp3'),
  error: require('@/assets/sounds/keyboard_wrong_letter.mp3'),
  complete: require('@/assets/sounds/correct_sound.mp3'),
  lessonComplete: require('@/assets/sounds/exercise_complete.mp3'),
  achievement: require('@/assets/sounds/achievement_unlocked.mp3'),
};

// Audio priority levels - lower numbers have higher priority
enum AudioPriority {
  achievement = 1, // Achievement unlocked - highest priority
  lessonComplete = 1, // Lesson completion sounds - highest priority
  complete = 2, // Item completion ping - high priority
  typing = 4, // Key press sounds - should never be interrupted
}

interface SoundEffect {
  name: string;
  sound: Sound | null; // Template sound (not used directly for playback if pooled)
  priority: AudioPriority;
  pool: Sound[]; // Pool of ready-to-play instances
  poolIndex: number; // Round-robin index
}

// Sound effects registry
const soundEffects = new Map<string, SoundEffect>();

// Active sounds tracking for cleanup and priority management
// We map the Sound instance to its priority
const activeSounds = new Map<Sound, AudioPriority>();

// Cache for remote URL players to reduce latency
// react-native-sound doesn't support streaming nicely for short clips without loading,
// but we can load them into Sound objects.
const remoteSoundCache = new Map<string, Sound>();

// Pool size for high-frequency sounds (typing)
const TYPING_POOL_SIZE = 5;
// Pool size for other sounds
const DEFAULT_POOL_SIZE = 2;

/**
 * Initialize the audio system
 */
export async function initializeAudio(): Promise<void> {
  console.log('[Audio] Initializing audio system (react-native-sound)...');
  try {
    // Preload sounds with priorities
    await preloadAllSounds();
    console.log('[Audio] Audio system initialized');
  } catch (error) {
    console.warn('[Audio] Failed to initialize audio:', error);
  }
}

/**
 * Helper to promise-ify Sound loading
 */
function loadSound(path: string): Promise<Sound> {
  return new Promise((resolve, reject) => {
    const sound = new Sound(path, '', error => {
      if (error) {
        console.warn(`[Audio] Failed to load sound ${path}:`, error);
        reject(error);
        return;
      }
      resolve(sound);
    });
  });
}

function loadRemoteSound(url: string): Promise<Sound> {
  return new Promise((resolve, reject) => {
    const sound = new Sound(url, undefined, error => {
      if (error) {
        reject(error);
        return;
      }
      resolve(sound);
    });
  });
}

/**
 * Initialize a sound effect with priority and pool
 */
async function initializeSound(
  name: string,
  priority: AudioPriority,
): Promise<void> {
  if (soundEffects.has(name)) {
    return;
  }

  const soundResource = SOUND_PATHS[name as keyof typeof SOUND_PATHS];
  if (!soundResource) {
    console.warn(`[Audio] Sound path not found for: ${name}`);
    return;
  }

  try {
    // Resolve asset to URI
    const asset = Asset.fromModule(soundResource);
    await asset.downloadAsync();
    const uri = asset.uri;

    // Create pool of players
    const poolSize =
      priority === AudioPriority.typing ? TYPING_POOL_SIZE : DEFAULT_POOL_SIZE;
    const pool: Sound[] = [];

    // Create players in parallel
    const playerPromises = [];
    for (let i = 0; i < poolSize; i++) {
      playerPromises.push(loadSound(uri));
    }

    const players = await Promise.all(playerPromises);
    pool.push(...players);

    // Keep one as a "template" or metadata holder if needed, or just use the first one
    const template = players[0];

    soundEffects.set(name, {
      name,
      sound: template,
      priority,
      pool,
      poolIndex: 0,
    });

    console.log(
      `[Audio] Initialized sound: ${name} (priority: ${priority}, pool: ${poolSize})`,
    );
  } catch (error) {
    console.error(`[Audio] Failed to initialize sound ${name}:`, error);
  }
}

/**
 * Preload all sound effects with their priorities
 */
export async function preloadAllSounds(): Promise<void> {
  const soundPromises = [
    initializeSound('success', AudioPriority.typing),
    initializeSound('error', AudioPriority.typing),
    initializeSound('complete', AudioPriority.complete),
    initializeSound('lessonComplete', AudioPriority.lessonComplete),
    initializeSound('achievement', AudioPriority.achievement),
  ];

  await Promise.all(soundPromises);
}

/**
 * Direct sound playback using react-native-sound
 */
async function playSoundDirect(name: string, volume: number): Promise<void> {
  const effect = soundEffects.get(name);
  if (!effect || effect.pool.length === 0) {
    console.warn(`[Audio] Sound not found or pool empty: ${name}`);
    return;
  }

  try {
    // Priority management
    const currentPriority = effect.priority;

    if (currentPriority !== AudioPriority.typing) {
      // Stop lower priority sounds
      for (const [sound, soundPriority] of activeSounds.entries()) {
        if (
          soundPriority > currentPriority &&
          soundPriority !== AudioPriority.typing
        ) {
          try {
            sound.stop();
            activeSounds.delete(sound);
          } catch (e) {
            /* ignore */
          }
        }
      }
    }

    // Round-robin selection
    const playerIndex = effect.poolIndex;
    const player = effect.pool[playerIndex];
    effect.poolIndex = (playerIndex + 1) % effect.pool.length;

    // Reset and configure
    player.stop(); // Ensure it's ready to start from beginning
    player.setCurrentTime(0);
    player.setVolume(Math.max(0, Math.min(1, volume)));

    // Track active
    activeSounds.set(player, currentPriority);

    // Play
    player.play(success => {
      // On finish (success=true) or decoding error (success=false)
      activeSounds.delete(player);
      if (!success) {
        console.warn(`[Audio] Playback failed for ${name}`);
      }
    });

    // Safety cleanup is handled by onEnd callback in react-native-sound generally,
    // but explicit stop() calls from priority system will also clean up.

    console.log(`[Audio] Playing: ${name} (vol: ${volume})`);
  } catch (error) {
    console.error(`[Audio] Error playing sound ${name}:`, error);
  }
}

import {useSettingsStore} from '@/stores/settingsStore';

async function playSound(name: string, volume: number = 1.0): Promise<void> {
  if (!useSettingsStore.getState().soundEnabled) {
    return;
  }
  playSoundDirect(name, volume).catch(err =>
    console.warn(`[Audio] Error playing ${name}:`, err),
  );
}

// Exported standard sound functions
export async function playSuccess(volume: number = 1.0): Promise<void> {
  await playSound('success', volume);
}

export async function playError(volume: number = 0.7): Promise<void> {
  await playSound('error', volume);
}

export async function playComplete(volume: number = 0.8): Promise<void> {
  await playSound('complete', volume);
}

export async function playLessonComplete(volume: number = 1.0): Promise<void> {
  await playSound('lessonComplete', volume);
}

export async function playAchievement(volume: number = 1.0): Promise<void> {
  await playSound('achievement', volume);
}

// Remote Audio Handling

export async function preloadAudio(url: string): Promise<void> {
  if (!useSettingsStore.getState().soundEnabled) {
    return;
  }

  try {
    if (remoteSoundCache.has(url)) {
      return;
    }

    // console.log(`[Audio] Preloading remote URL: ${url}`);
    // Load and cache
    const sound = await loadRemoteSound(url);
    remoteSoundCache.set(url, sound);
  } catch (error) {
    console.warn(`[Audio] Failed to preload URL: ${url}`, error);
  }
}

export async function playUrl(
  url: string,
  volume: number = 1.0,
  playbackRate: number = 1.0,
): Promise<void> {
  if (!useSettingsStore.getState().soundEnabled) {
    return;
  }

  try {
    console.log(`[Audio] Playing remote URL: ${url}`);

    let sound = remoteSoundCache.get(url);

    if (!sound) {
      sound = await loadRemoteSound(url);
      remoteSoundCache.set(url, sound);
    } else {
      sound.stop();
      sound.setCurrentTime(0);
    }

    sound.setVolume(volume);

    // Note: setSpeed is Android only in some versions of rnsound, or requires specific setup.
    // Checking if method exists safety.
    if (typeof sound.setSpeed === 'function') {
      sound.setSpeed(playbackRate);
    }

    sound.play(success => {
      if (!success) {
        console.warn(`[Audio] Failed to play URL: ${url}`);
      }
    });
  } catch (error) {
    console.error('[Audio] Error playing remote URL:', error);
  }
}

export async function stopAllAudio(): Promise<void> {
  // Stop all tracked active sounds
  for (const [sound] of activeSounds.entries()) {
    try {
      sound.stop();
    } catch (e) {}
  }
  activeSounds.clear();

  // Stop remote sounds
  for (const sound of remoteSoundCache.values()) {
    try {
      sound.stop();
    } catch (e) {}
  }
}

export async function cleanupAudio(): Promise<void> {
  try {
    stopAllAudio();

    // Release native resources for all pools
    for (const effect of soundEffects.values()) {
      effect.pool.forEach(s => s.release());
    }
    soundEffects.clear();

    // Release remote sounds
    for (const sound of remoteSoundCache.values()) {
      sound.release();
    }
    remoteSoundCache.clear();

    console.log('[Audio] Audio resources cleaned up');
  } catch (error) {
    console.warn('[Audio] Failed to cleanup audio:', error);
  }
}
