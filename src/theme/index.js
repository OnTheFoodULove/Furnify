// Theme tokens for Furnify
// All colors, typography, spacing, and shadows are defined here

export const Colors = {
  primary: '#C17F5E',        // warm terracotta accent
  primaryDark: '#A3633E',
  primaryLight: '#D9A882',
  primarySurface: '#FDF0E8',

  background: '#FAF8F5',     // off-white warm
  surface: '#FFFFFF',
  surfaceElevated: '#F5F1EC',

  text: '#2C2522',           // near-black warm
  textSecondary: '#8A7F7A',
  textMuted: '#B5ADA8',
  textInverse: '#FFFFFF',

  border: '#EDE5DC',
  borderFocus: '#C17F5E',
  divider: '#F0EAE3',

  success: '#5A8A5A',
  successSurface: '#EEF6EE',
  error: '#C0392B',
  errorSurface: '#FDECEA',
  warning: '#D97706',
  warningSurface: '#FEF3C7',
  info: '#2563EB',
  infoSurface: '#EEF2FF',

  // Category colors
  categories: {
    living: '#C17F5E',
    bedroom: '#8B6B8B',
    dining: '#6B8B6B',
    office: '#5B7B9B',
  },

  // Admin badge colors
  badge: {
    add: '#5A8A5A',
    edit: '#2563EB',
    delete: '#C0392B',
  },

  // Overlay / shadow
  overlay: 'rgba(44, 37, 34, 0.5)',
  shadow: 'rgba(44, 37, 34, 0.12)',
};

export const Typography = {
  // Font families (system fonts that work on both platforms)
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semiBold: 'System',
    bold: 'System',
  },

  // Font sizes
  size: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    xxl: 28,
    xxxl: 34,
    display: 42,
  },

  // Font weights
  weight: {
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
    extraBold: '800',
  },

  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  section: 64,
};

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  xxl: 28,
  full: 999,
};

// Cross-platform shadow helper
// On web: uses boxShadow. On native: uses shadow* props.
import { Platform } from 'react-native';

function makeShadow(x, y, blur, spread, color) {
  if (Platform.OS === 'web') {
    return {
      boxShadow: `${x}px ${y}px ${blur}px ${spread}px ${color}`,
    };
  }
  return {
    shadowColor: color,
    shadowOffset: { width: x, height: y },
    shadowOpacity: 1,
    shadowRadius: blur,
    elevation: Math.round(blur / 2),
  };
}

export const Shadows = {
  sm: makeShadow(0, 1, 4, 0, 'rgba(44,37,34,0.10)'),
  md: makeShadow(0, 4, 12, 0, 'rgba(44,37,34,0.12)'),
  lg: makeShadow(0, 8, 24, 0, 'rgba(44,37,34,0.14)'),
};

export const Layout = {
  screenPadding: Spacing.base,
  cardPadding: Spacing.base,
  headerHeight: 60,
  tabBarHeight: 64,
  inputHeight: 52,
  buttonHeight: 52,
  imageAspectRatio: 4 / 3,
};
