import {useWindowDimensions} from 'react-native';

/**
 * Breakpoint definitions for responsive design
 * Based on common device widths
 */
export const breakpoints = {
  /** Mobile devices (phones) */
  mobile: 0,
  /** Tablet devices (iPad, Android tablets) */
  tablet: 600,
  /** Desktop/large screens */
  desktop: 1024,
} as const;

export type Breakpoint = keyof typeof breakpoints;

/**
 * Hook for responsive design utilities
 * Returns current device category and useful responsive values
 */
export const useResponsive = () => {
  const {width, height} = useWindowDimensions();

  const isMobile = width < breakpoints.tablet;
  const isTablet = width >= breakpoints.tablet && width < breakpoints.desktop;
  const isDesktop = width >= breakpoints.desktop;

  // Grid columns based on screen size
  const columns = isMobile ? 1 : isTablet ? 2 : 3;

  // Padding scale based on screen size
  const containerPadding = isMobile ? 16 : isTablet ? 24 : 32;

  return {
    /** Screen width */
    width,
    /** Screen height */
    height,
    /** Is mobile phone size */
    isMobile,
    /** Is tablet size */
    isTablet,
    /** Is desktop/large size */
    isDesktop,
    /** Recommended grid columns for current size */
    columns,
    /** Recommended container padding for current size */
    containerPadding,
    /** Is landscape orientation */
    isLandscape: width > height,
  };
};
