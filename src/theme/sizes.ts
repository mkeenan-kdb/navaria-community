/**
 * Size constants for consistent component dimensions
 * Use these values instead of hard-coding pixel values
 */
export const sizes = {
  /** Icon size scale */
  icon: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 32,
    xl: 48,
  },
  /** Avatar size scale */
  avatar: {
    xs: 24,
    sm: 32,
    md: 48,
    lg: 64,
    xl: 96,
  },
  /** Input/button height scale */
  input: {
    sm: 36,
    md: 44,
    lg: 52,
  },
  /** Touch target minimum (accessibility) */
  touchTarget: 44,
} as const;

export type IconSize = keyof typeof sizes.icon;
export type AvatarSize = keyof typeof sizes.avatar;
export type InputSize = keyof typeof sizes.input;
