// Web-specific audio implementation using Web Audio API
// This file is used instead of audio.ts when running on web platform

// Sound file paths - using require for bundler compatibility
const SOUND_PATHS = {
  success: require('@/assets/sounds/keyboard_click.mp3'),
  error: require('@/assets/sounds/keyboard_wrong_letter.mp3'),
  complete: require('@/assets/sounds/correct_sound.mp3'),
  lessonComplete: require('@/assets/sounds/exercise_complete.mp3'),
  achievement: require('@/assets/sounds/achievement_unlocked.mp3'),
};

// Audio context for Web Audio API
let audioContext: AudioContext | null = null;

// Cache for decoded audio buffers
const audioBufferCache = new Map<string, AudioBuffer>();

// Cache for remote audio elements (simpler approach for URLs)
const audioElementCache = new Map<string, HTMLAudioElement>();

// Pool of audio elements for sound effects
interface SoundPool {
  elements: HTMLAudioElement[];
  index: number;
}
const soundPools = new Map<string, SoundPool>();

const POOL_SIZE = 3;

// getAudioContext removed
export const getOrInitAudioContext = async (): Promise<AudioContext> => {
  if (!audioContext) {
    audioContext = new (
      window.AudioContext || (window as any).webkitAudioContext
    )();
  }
  // Resume if suspended (browser autoplay policy)
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }
  return audioContext;
};

/**
 * Initialize the audio system
 */
export async function initializeAudio(): Promise<void> {
  console.log('[Audio Web] Initializing web audio system...');
  try {
    await preloadAllSounds();
    console.log('[Audio Web] Audio system initialized');
  } catch (error) {
    console.warn('[Audio Web] Failed to initialize audio:', error);
  }
}

/**
 * Create an audio element pool for a sound
 */
async function createSoundPool(name: string, src: string): Promise<void> {
  const elements: HTMLAudioElement[] = [];

  for (let i = 0; i < POOL_SIZE; i++) {
    const audio = new Audio(src);
    audio.preload = 'auto';
    // Wait for it to be ready
    await new Promise<void>(resolve => {
      audio.addEventListener('canplaythrough', () => resolve(), {once: true});
      audio.load();
    });
    elements.push(audio);
  }

  soundPools.set(name, {elements, index: 0});
  console.log(`[Audio Web] Created pool for: ${name}`);
}

/**
 * Preload all sound effects
 */
export async function preloadAllSounds(): Promise<void> {
  const promises = Object.entries(SOUND_PATHS).map(async ([name, path]) => {
    try {
      // In web, require() returns the URL/path to the asset
      const src = typeof path === 'string' ? path : path.default || path;
      await createSoundPool(name, src);
    } catch (error) {
      console.warn(`[Audio Web] Failed to preload ${name}:`, error);
    }
  });

  await Promise.all(promises);
}

import {useSettingsStore} from '@/stores/settingsStore';

/**
 * Play a sound effect
 */
async function playSound(name: string, volume: number = 1.0): Promise<void> {
  if (!useSettingsStore.getState().soundEnabled) {
    return;
  }

  const pool = soundPools.get(name);
  if (!pool) {
    console.warn(`[Audio Web] Sound not found: ${name}`);
    return;
  }

  try {
    // Round-robin selection from pool
    const audio = pool.elements[pool.index];
    pool.index = (pool.index + 1) % pool.elements.length;

    // Reset and play
    audio.currentTime = 0;
    audio.volume = Math.max(0, Math.min(1, volume));

    await audio.play().catch(err => {
      // Autoplay might be blocked - this is expected on first interaction
      console.warn('[Audio Web] Play blocked (autoplay policy):', err.message);
    });
  } catch (error) {
    console.error(`[Audio Web] Error playing sound ${name}:`, error);
  }
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

  if (audioElementCache.has(url)) {
    return;
  }

  try {
    const audio = new Audio(url);
    audio.preload = 'auto';

    await new Promise<void>((resolve, reject) => {
      audio.addEventListener('canplaythrough', () => resolve(), {once: true});
      audio.addEventListener(
        'error',
        () => reject(new Error('Failed to load')),
        {once: true},
      );
      audio.load();
    });

    audioElementCache.set(url, audio);
  } catch (error) {
    console.warn(`[Audio Web] Failed to preload URL: ${url}`, error);
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
    let audio = audioElementCache.get(url);

    if (!audio) {
      audio = new Audio(url);
      audioElementCache.set(url, audio);
    }

    audio.currentTime = 0;
    audio.volume = volume;
    audio.playbackRate = playbackRate;

    await audio.play().catch(err => {
      console.warn('[Audio Web] Play blocked for URL:', err.message);
    });
  } catch (error) {
    console.error('[Audio Web] Error playing remote URL:', error);
  }
}

export async function stopAllAudio(): Promise<void> {
  // Stop all pooled sounds
  for (const pool of soundPools.values()) {
    pool.elements.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
  }

  // Stop all remote audio
  for (const audio of audioElementCache.values()) {
    audio.pause();
    audio.currentTime = 0;
  }
}

export async function cleanupAudio(): Promise<void> {
  try {
    await stopAllAudio();

    soundPools.clear();
    audioElementCache.clear();
    audioBufferCache.clear();

    if (audioContext) {
      await audioContext.close();
      audioContext = null;
    }

    console.log('[Audio Web] Audio resources cleaned up');
  } catch (error) {
    console.warn('[Audio Web] Failed to cleanup audio:', error);
  }
}
