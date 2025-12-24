// Audio converter stub for native platforms
// Native platforms already record in m4a format, no conversion needed

/**
 * Convert WebM audio to M4A format (not needed on native)
 */
export const convertWebmToM4a = async (
  webmBlob: Blob,
  _onProgress?: (progress: number) => void,
): Promise<Blob> => {
  // Native platforms don't produce WebM, so this should never be called
  console.warn('[AudioConverter] Conversion not needed on native platforms');
  return webmBlob;
};

/**
 * Check if FFmpeg is supported (always false on native)
 */
export function isConversionSupported(): boolean {
  return false;
}
