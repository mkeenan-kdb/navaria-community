// Tiontu color palette - cohesive design system
export const colors = {
  tiontuRed: '#7e0f0fff',
  tiontuGold: '#c29044',
  tiontuGoldDark: '#8b6f47',
  tiontuBrown: '#6d4c41',
  tiontuGreen: '#4a7c59',
  tiontuCream: '#fcf7ea',
  tiontuTeal: '#095356',

  // Light theme - REFACTORED FOR MODERN FEEL
  light: {
    // 1. Background: Changed from Cream to "Cool Stone"
    // This makes the white cards pop much more cleanly.
    background: '#e9e9e9ff',

    // 2. Surface: Pure white for maximum contrast/cleanliness
    surface: '#ffffffff',
    surfaceElevated: '#f9f9f9ff',
    surfaceSubtle: '#f8fbfbff', // Very slight grey for inputs

    text: {
      primary: '#242424ff', // Deep Charcoal (Better for reading than pure black)
      secondary: '#4b5563', // Cool Grey
      tertiary: '#9ca3af',
      disabled: '#d1d5db',
    },

    // 3. Borders: Softened significantly
    border: '#e5e7eb',
    borderSubtle: '#f3f4f6',

    // Semantic colors
    primary: '#095356', // Brand Teal
    secondary: '#b08d57',
    accent: '#4a7c59',
    error: '#ef4444',
    success: '#10b981',
    warning: '#f97316',
    info: '#0ea5e9',

    // Explicit colors
    white: '#ffffff',
    black: '#000000',

    glow: '#000000ff',

    // 4. THE FIX: Transparent borders
    // We removed the solid gold border. Now it matches the sleekness of dark mode.
    accentBorder: 'rgba(9, 83, 86, 0.1)', // 10% Opacity Teal (Subtle definition)
    accentKnot: '#d1d5db', // Silver/Grey knot work instead of heavy brown
    appBar: '#ffffff', // White app bar looks more modern than solid color in light mode

    gradients: {
      // 5. "Morning Mist" Gradient
      // White fading to a very faint teal. Fresh, not old/yellow.
      card: ['#f7f7f7ff', '#fff6f3ff'],
      primary: ['#095356', '#0f766e'],
    },
  },

  // Dark theme
  dark: {
    background: '#0a0a0a',
    surface: '#121212',
    surfaceElevated: '#131313ff',
    surfaceSubtle: '#0f0f0f',
    text: {
      primary: '#fafaf9',
      secondary: '#a8a29e',
      tertiary: '#78716c',
      disabled: '#57534e',
    },
    border: 'transparent', // No borders by default
    borderSubtle: '#1c1917',

    // Semantic colors
    primary: '#0c7579ff',
    secondary: '#d4a574',
    accent: '#748b75',
    error: '#ef4444',
    success: '#22c55e',
    warning: '#f97316',
    info: '#0ea5e9',

    // Explicit colors for specific use cases
    white: '#ffffff',
    black: '#000000',

    glow: '#5d5d5dff',

    accentBorder: 'rgba(212, 165, 116, 0.3)', // Semi-transparent gold
    accentKnot: '#b8967c',
    appBar: '#075053ff',

    gradients: {
      // Midnight glow effect - made more subtle
      card: ['#0f0f0fff', '#161f20ff'], // Very subtle shift to deep teal
      primary: ['#095356', '#0c7579'],
      gold: ['#c29044', '#8b6f47'],
    },
  },
};

export type ThemeColors = typeof colors.light;
