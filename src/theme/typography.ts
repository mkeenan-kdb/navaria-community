// Typography styles
export const typography = {
  // Font families
  fonts: {
    // System fonts (Sans-Serif)
    regular: 'System',
    medium: 'System',
    bold: 'System',
    // Celtic fonts are defined in fontStore.ts AVAILABLE_FONTS
    celtic: 'MeathFLF', // Reserved for Headings and Irish text
  },

  // Font sizes - increased for better readability
  sizes: {
    xs: 14, // was 12
    sm: 16, // was 14
    base: 18, // was 16
    lg: 20, // was 18
    xl: 24, // was 20
    '2xl': 28, // was 24
    '3xl': 36, // was 30
    '4xl': 40, // was 36
    '5xl': 52, // was 48
    '6xl': 64, // was 60
  },

  // Line heights
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },

  // Font weights
  weights: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};
