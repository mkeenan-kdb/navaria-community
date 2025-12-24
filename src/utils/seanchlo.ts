// Seanchló conversion utilities
// Ported from gaelify.js

// Define the mapping of letters to replacements (Poncs)
const replacements: Record<string, string> = {
  b: '\u1E03',
  B: '\u1E02',
  c: '\u010B',
  C: '\u010A',
  d: '\u1E0B',
  D: '\u1E0A',
  f: '\u1E1F',
  F: '\u1E1E',
  g: '\u0121',
  G: '\u0120',
  m: '\u1E41',
  M: '\u1E40',
  p: '\u1E57',
  P: '\u1E56',
  s: '\u1E9B',
  S: '\u1E60',
  t: '\u1E6B',
  T: '\u1E6A',
};

// Define the mapping of lenited letters to original letters with 'h'
const reverseReplacements: Record<string, string> = {
  '\u1E03': 'bh',
  '\u1E02': 'Bh',
  '\u010B': 'ch',
  '\u010A': 'Ch',
  '\u1E0B': 'dh',
  '\u1E0A': 'Dh',
  '\u1E1F': 'fh',
  '\u1E1E': 'Fh',
  '\u0121': 'gh',
  '\u0120': 'Gh',
  '\u1E41': 'mh',
  '\u1E40': 'Mh',
  '\u1E57': 'ph',
  '\u1E56': 'Ph',
  '\u1E9B': 'sh',
  '\u1E60': 'Sh',
  '\u1E6B': 'th',
  '\u1E6A': 'Th',
};

// Insular characters mapping
const insularChars: Record<string, string> = {
  D: '\uA779',
  d: '\uA77A',
  F: '\uA77B',
  f: '\uA77C',
  G: '\uA77D',
  g: '\u1D79',
  R: '\uA782',
  r: '\uA783',
  S: '\uA784',
  s: '\uA785',
  T: '\uA786',
  t: '\uA787',
};

export const replaceWithOriginal = (input: string): string => {
  // Regex to match any of the lenited characters
  const regex = new RegExp(Object.keys(reverseReplacements).join('|'), 'g');

  // Replace matched lenited characters with their corresponding original form
  return input.replace(regex, match => reverseReplacements[match] || match);
};

export const replaceWithLenition = (input: string): string => {
  // Regex to match a valid pair of letters and h (case insensitive)
  const regex = /([BCDFGMPSTbcdfgmpst])(H|h)/g;

  // Replace matched patterns with their replacements
  return input.replace(regex, (match, letter, _h) => {
    const replacement = replacements[letter];
    return replacement || match; // Use replacement if available, otherwise leave it unchanged
  });
};

export const replaceWithInsular = (input: string): string => {
  // Regex to match a valid pair of letters (case insensitive)
  const regex = /([BCDFGMPSTbcdfgmpst])/g;
  // Replace matched patterns with their replacements
  return input.replace(regex, (match, letter) => {
    const replacement = insularChars[letter];
    return replacement || match; // Use replacement if available, otherwise leave it unchanged
  });
};

export const processSeanchloText = (
  text: string,
  useInsular: boolean = false,
): string => {
  if (!text) {
    return '';
  }

  let processed = replaceWithLenition(text);

  if (useInsular) {
    // Note: The original logic for "copy insular" did:
    // 1. Original -> 2. Replace 'agus' -> 3. Insular -> 4. Lenition
    // But for display, we usually just want Lenition.
    // If the user wants "Insular" style, we might need to apply that too.
    // However, standard Seanchló fonts usually handle the shape.
    // The "Insular" copy feature in the reference was for copying special unicode chars.
    // For now, let's just support the standard lenition (ponc).
    // If we want to support the specific insular unicode chars:
    processed = replaceWithInsular(processed);
  }

  return processed;
};

export const convertForClipboard = (text: string): string => {
  // Logic from parseCopyText in reference
  // 1. Convert back to original (if it was already processed? - input is usually raw)
  // Assuming input is raw text here.
  let processed = text;

  // Replace 'agus'
  const regex = /\bagus\b/gi;
  processed = processed.replace(regex, '\u204A');

  processed = replaceWithInsular(processed);
  processed = replaceWithLenition(processed);

  return processed;
};
