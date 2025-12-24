// Audio conversion utility for web using FFmpeg.wasm
import {FFmpeg} from '@ffmpeg/ffmpeg';
import {fetchFile, toBlobURL} from '@ffmpeg/util';

let ffmpegInstance: FFmpeg | null = null;
let ffmpegLoaded = false;

/**
 * Initialize FFmpeg instance (lazy loading)
 */
async function getFFmpeg(): Promise<FFmpeg> {
  console.log(
    '[AudioConverter] getFFmpeg called, instance exists:',
    !!ffmpegInstance,
    'loaded:',
    ffmpegLoaded,
  );

  if (ffmpegInstance && ffmpegLoaded) {
    console.log('[AudioConverter] Returning existing FFmpeg instance');
    return ffmpegInstance;
  }

  if (!ffmpegInstance) {
    console.log('[AudioConverter] Creating new FFmpeg instance');
    ffmpegInstance = new FFmpeg();
  }

  if (!ffmpegLoaded) {
    console.log('[AudioConverter] Loading FFmpeg...');
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

    try {
      console.log('[AudioConverter] Fetching core URLs...');
      const coreURL = await toBlobURL(
        `${baseURL}/ffmpeg-core.js`,
        'text/javascript',
      );
      const wasmURL = await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        'application/wasm',
      );
      console.log('[AudioConverter] URLs fetched, loading FFmpeg...');

      await ffmpegInstance.load({
        coreURL,
        wasmURL,
      });

      ffmpegLoaded = true;
      console.log('[AudioConverter] FFmpeg loaded successfully');
    } catch (error) {
      console.error('[AudioConverter] Failed to load FFmpeg:', error);
      throw error;
    }
  }

  return ffmpegInstance;
}

/**
 * Convert WebM audio to a mobile-compatible format using Web Audio API
 * @param webmBlob - The WebM audio blob to convert
 * @param onProgress - Optional progress callback (0-1)
 * @returns Audio blob in a mobile-compatible format
 */
export async function convertWebmToM4a(
  webmBlob: Blob,
  onProgress?: (progress: number) => void,
): Promise<Blob> {
  // Check if FFmpeg is supported (requires SharedArrayBuffer)
  const hasSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';

  if (hasSharedArrayBuffer) {
    console.log('[AudioConverter] Using FFmpeg conversion');
    return convertWebmToM4aFFmpeg(webmBlob, onProgress);
  } else {
    console.log('[AudioConverter] Using Web Audio API fallback conversion');
    return convertWebmToWavWebAudio(webmBlob, onProgress);
  }
}

/**
 * Convert WebM audio to M4A format using FFmpeg.wasm (requires SharedArrayBuffer)
 */
async function convertWebmToM4aFFmpeg(
  webmBlob: Blob,
  onProgress?: (progress: number) => void,
): Promise<Blob> {
  try {
    console.log('[AudioConverter] Starting conversion from WebM to M4A');
    console.log(
      '[AudioConverter] Input blob size:',
      webmBlob.size,
      'type:',
      webmBlob.type,
    );

    // Check browser support
    if (!isConversionSupported()) {
      throw new Error(
        'Browser does not support required features for audio conversion',
      );
    }

    const ffmpeg = await getFFmpeg();
    console.log('[AudioConverter] FFmpeg instance ready');

    // Set up progress handler with debugging
    let progressCallback = (progress: number) => {
      console.log(
        '[AudioConverter] Progress:',
        Math.round(progress * 100) + '%',
      );
      onProgress?.(progress);
    };

    // FFmpeg progress events might not fire reliably, so we'll use manual progress updates
    // But keep the listener in case it does work in some cases
    if (onProgress) {
      ffmpeg.on('progress', ({progress}) => {
        console.log(
          '[AudioConverter] FFmpeg progress event:',
          Math.round(progress * 100) + '%',
        );
        progressCallback(progress);
      });
    }

    // Start with 10% progress to show it's working
    progressCallback(0.1);

    // Write input file to FFmpeg virtual file system
    const inputFileName = 'input.webm';
    const outputFileName = 'output.m4a';

    progressCallback(0.2);
    await ffmpeg.writeFile(inputFileName, await fetchFile(webmBlob));
    progressCallback(0.4);

    console.log('[AudioConverter] Input file written, starting conversion...');

    // Convert WebM to M4A with AAC codec
    // -i: input file
    // -c:a aac: use AAC codec for audio
    // -b:a 128k: set audio bitrate to 128kbps (good quality for speech)
    // -movflags +faststart: optimize for streaming
    progressCallback(0.5);

    console.log('[AudioConverter] Executing FFmpeg command...');
    const command = [
      '-i',
      inputFileName,
      '-c:a',
      'aac',
      '-b:a',
      '128k',
      '-movflags',
      '+faststart',
      outputFileName,
    ];
    console.log('[AudioConverter] Command:', command.join(' '));

    try {
      // Add timeout to prevent hanging
      const execPromise = ffmpeg.exec(command);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () =>
            reject(new Error('FFmpeg conversion timed out after 30 seconds')),
          30000,
        );
      });

      await Promise.race([execPromise, timeoutPromise]);
      console.log('[AudioConverter] FFmpeg exec completed successfully');
    } catch (execError) {
      console.error('[AudioConverter] FFmpeg exec failed:', execError);
      throw execError;
    }

    progressCallback(0.8);

    console.log('[AudioConverter] Conversion complete, reading output file...');

    // Read the output file
    const data = await ffmpeg.readFile(outputFileName);
    progressCallback(0.9);

    // Clean up
    await ffmpeg.deleteFile(inputFileName);
    await ffmpeg.deleteFile(outputFileName);

    // Create blob from the data - FFmpeg returns Uint8Array for binary files
    const m4aBlob = new Blob([data as any], {type: 'audio/mp4'});

    progressCallback(1.0); // 100% complete

    console.log('[AudioConverter] Conversion successful:', {
      inputSize: webmBlob.size,
      outputSize: m4aBlob.size,
      compression: ((1 - m4aBlob.size / webmBlob.size) * 100).toFixed(1) + '%',
    });

    return m4aBlob;
  } catch (error) {
    console.error('[AudioConverter] FFmpeg conversion failed:', error);
    throw new Error(
      `Failed to convert audio: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * Convert WebM audio to WAV using Web Audio API (fallback when SharedArrayBuffer not available)
 */
async function convertWebmToWavWebAudio(
  webmBlob: Blob,
  onProgress?: (progress: number) => void,
): Promise<Blob> {
  try {
    console.log('[AudioConverter] Starting Web Audio API conversion');

    // Set up progress handler
    let progressCallback = (progress: number) => {
      console.log(
        '[AudioConverter] Progress:',
        Math.round(progress * 100) + '%',
      );
      onProgress?.(progress);
    };

    progressCallback(0.1);

    // Check if Web Audio API is available
    if (!window.AudioContext && !(window as any).webkitAudioContext) {
      throw new Error('Web Audio API not supported');
    }

    progressCallback(0.2);

    // Create audio context
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContextClass();

    progressCallback(0.3);

    // Decode the WebM audio
    console.log('[AudioConverter] Decoding WebM audio...');
    const arrayBuffer = await webmBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    progressCallback(0.6);

    // Convert to WAV format
    console.log('[AudioConverter] Encoding to WAV...');
    const wavBlob = audioBufferToWav(audioBuffer);

    progressCallback(0.9);

    // Clean up
    audioContext.close();

    progressCallback(1.0);

    console.log('[AudioConverter] Web Audio conversion successful:', {
      inputSize: webmBlob.size,
      outputSize: wavBlob.size,
      compression: ((1 - wavBlob.size / webmBlob.size) * 100).toFixed(1) + '%',
      duration: audioBuffer.duration.toFixed(2) + 's',
    });

    return wavBlob;
  } catch (error) {
    console.error('[AudioConverter] Web Audio conversion failed:', error);
    throw new Error(
      `Failed to convert audio: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * Convert AudioBuffer to WAV Blob
 */
function audioBufferToWav(audioBuffer: AudioBuffer): Blob {
  const length = audioBuffer.length;
  const numberOfChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;

  // WAV file format constants
  const blockAlign = numberOfChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = length * blockAlign;
  const bufferSize = 44 + dataSize;

  // Create buffer for WAV file
  const buffer = new ArrayBuffer(bufferSize);
  const view = new DataView(buffer);

  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, bufferSize - 8, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, 1, true); // AudioFormat (PCM)
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // Convert float samples to 16-bit PCM
  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = Math.max(
        -1,
        Math.min(1, audioBuffer.getChannelData(channel)[i]),
      );
      view.setInt16(offset, sample * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([buffer], {type: 'audio/wav'});
}

/**
 * Check if FFmpeg is supported in current browser
 */
export function isConversionSupported(): boolean {
  // Check for required browser features for audio conversion
  const hasSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';
  const hasWebAssembly = typeof WebAssembly !== 'undefined';
  const hasWorker = typeof Worker !== 'undefined';
  const hasWebAudio =
    !!window.AudioContext || !!(window as any).webkitAudioContext;

  console.log('[AudioConverter] Browser support check:', {
    SharedArrayBuffer: hasSharedArrayBuffer,
    WebAssembly: hasWebAssembly,
    Worker: hasWorker,
    WebAudio: hasWebAudio,
  });

  // We support conversion if we have either FFmpeg requirements OR Web Audio API
  return (hasSharedArrayBuffer && hasWebAssembly && hasWorker) || hasWebAudio;
}
