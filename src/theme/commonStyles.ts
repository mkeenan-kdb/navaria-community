import {ViewStyle, TextStyle} from 'react-native';
import {ThemeColors} from './colors';
import {spacing, borderRadius} from './spacing';
import {typography} from './typography';
import {opacity} from './opacity';

export const createCommonStyles = (colors: ThemeColors) => ({
  // ============================================
  // LAYOUTS
  // ============================================
  container: {
    flex: 1,
    backgroundColor: colors.background,
  } as ViewStyle,

  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,

  row: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,

  column: {
    flexDirection: 'column',
  } as ViewStyle,

  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as ViewStyle,

  rowCentered: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  flex1: {
    flex: 1,
  } as ViewStyle,
  // ============================================
  // LAYOUT HELPERS
  // ============================================
  fullWidth: {
    width: '100%',
  } as ViewStyle,

  absoluteFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  } as ViewStyle,
  // ============================================
  // SPACING
  // ============================================
  padding: {
    padding: spacing.md,
  } as ViewStyle,

  paddingLg: {
    padding: spacing.lg,
  } as ViewStyle,

  // ============================================
  // SPACERS (use instead of inline margin/width)
  // ============================================
  spacerXs: {
    width: spacing.xs,
    height: spacing.xs,
  } as ViewStyle,

  spacerSm: {
    width: spacing.sm,
    height: spacing.sm,
  } as ViewStyle,

  spacerMd: {
    width: spacing.md,
    height: spacing.md,
  } as ViewStyle,

  spacerLg: {
    width: spacing.lg,
    height: spacing.lg,
  } as ViewStyle,

  // ============================================
  // DIVIDERS
  // ============================================
  divider: {
    height: 1,
    backgroundColor: colors.border,
  } as ViewStyle,

  dividerVertical: {
    width: 1,
    backgroundColor: colors.border,
  } as ViewStyle,

  // ============================================
  // TYPOGRAPHY
  // ============================================
  title: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
    fontFamily: typography.fonts.celtic,
  } as TextStyle,

  subtitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    fontFamily: typography.fonts.regular,
  } as TextStyle,

  text: {
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    fontFamily: typography.fonts.regular,
  } as TextStyle,

  textSecondary: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    fontFamily: typography.fonts.regular,
  } as TextStyle,

  // ============================================
  // SHADOWS & ELEVATION
  // ============================================
  shadow: {
    shadowColor: colors.black,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    backgroundColor: colors.surface,
  } as ViewStyle,

  shadowSm: {
    shadowColor: colors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    backgroundColor: colors.surface,
  } as ViewStyle,

  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    shadowColor: colors.black,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  } as ViewStyle,

  // ============================================
  // LOADING STATES
  // ============================================
  loadingSkeleton: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: borderRadius.md,
  } as ViewStyle,

  loadingShimmer: {
    backgroundColor: colors.surfaceElevated,
  } as ViewStyle,

  // ============================================
  // ERROR STATES
  // ============================================
  errorContainer: {
    backgroundColor: colors.error + '15', // 15% opacity
    borderColor: colors.error,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  } as ViewStyle,

  errorText: {
    color: colors.error,
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
  } as TextStyle,

  // ============================================
  // INTERACTIVE STATES
  // ============================================
  pressable: {
    opacity: 1,
  } as ViewStyle,

  pressablePressed: {
    opacity: opacity.pressed,
  } as ViewStyle,

  disabled: {
    opacity: opacity.disabled,
  } as ViewStyle,

  // ============================================
  // OVERLAYS
  // ============================================
  overlay: {
    ...({
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    } as ViewStyle),
    backgroundColor: `rgba(0, 0, 0, ${opacity.overlay})`,
  } as ViewStyle,
});
