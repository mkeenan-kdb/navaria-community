/**
 * Opacity constants for consistent interactive states
 * Use these values instead of hard-coding opacity numbers
 */
export const opacity = {
  /** Disabled state - buttons, inputs, etc. */
  disabled: 0.4,
  /** Hover state - web platform */
  hover: 0.8,
  /** Pressed/active state */
  pressed: 0.6,
  /** Modal/overlay backgrounds */
  overlay: 0.5,
  /** Subtle backgrounds (e.g., tinted containers) */
  subtle: 0.1,
  /** Very light accents */
  faint: 0.05,
  /** 5% opacity tint */
  tint05: 0.05,
  /** 10% opacity tint */
  tint10: 0.1,
  /** 15% opacity tint */
  tint15: 0.15,
  /** 20% opacity tint */
  tint20: 0.2,
  /** 30% opacity tint */
  tint30: 0.3,
} as const;

export type OpacityKey = keyof typeof opacity;

/**
 * Helper to apply opacity to a hex color
 * @param color Hex color (e.g. #FF0000)
 * @param opacityValue Opacity value (0-1)
 * @returns Hex color with alpha channel (e.g. #FF000080)
 */
export const withOpacity = (color: string, opacityValue: number): string => {
  // If it's already an rgba string, just return it (or handle it if we wanted to be more robust)
  if (color.startsWith('rgba')) return color;

  // Clean hex
  const hex = color.replace('#', '');

  // Calculate alpha
  const alpha = Math.round(opacityValue * 255)
    .toString(16)
    .padStart(2, '0')
    .toUpperCase();

  return `#${hex}${alpha}`;
};
