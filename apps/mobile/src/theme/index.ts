// CareGrid Theme — Design Tokens for Rural Healthcare Coordination Platform
// Prioritizes: High contrast, outdoor sunlight readability, 48px minimum touch targets, low cognitive load.

export const Colors = {
  // Primary & Brand (Trustworthy Healthcare Teal / Blue)
  primary: '#0B6477',
  primaryDark: '#07485B',
  primaryLight: '#219EBC',
  primarySurface: '#E8F4F8',

  // Secondary & Accents
  secondary: '#1D3557',
  secondaryLight: '#457B9D',

  // Backgrounds & Surfaces
  background: '#F8F9FA',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceSubtle: '#F1F3F5',

  // Text & Content (High Contrast for Devanagari & English)
  textPrimary: '#111827',
  textSecondary: '#4B5563',
  textMuted: '#6B7280',
  textInverse: '#FFFFFF',

  // Borders & Dividers
  border: '#D1D5DB',
  borderLight: '#E5E7EB',
  borderFocus: '#0B6477',

  // Status Colors (Always paired with clear text + icon)
  status: {
    available: {
      text: '#065F46',
      bg: '#D1FAE5',
      border: '#6EE7B7',
    },
    lowStock: {
      text: '#92400E',
      bg: '#FEF3C7',
      border: '#FCD34D',
    },
    outOfStock: {
      text: '#991B1B',
      bg: '#FEE2E2',
      border: '#FCA5A5',
    },
    pending: {
      text: '#854D0E',
      bg: '#FEF9C3',
      border: '#FDE047',
    },
    confirmed: {
      text: '#166534',
      bg: '#DCFCE7',
      border: '#86EFAC',
    },
    rejected: {
      text: '#991B1B',
      bg: '#FEE2E2',
      border: '#FCA5A5',
    },
    timedOut: {
      text: '#4C1D95',
      bg: '#EDE9FE',
      border: '#C4B5FD',
    },
  },

  // Freshness & Staleness (Critical CareGrid UX)
  freshness: {
    current: {
      text: '#065F46',
      bg: '#ECFDF5',
      border: '#A7F3D0',
      icon: '#059669',
    },
    stale: {
      text: '#9A3412',
      bg: '#FFF7ED',
      border: '#FDBA74',
      icon: '#EA580C',
    },
    unknown: {
      text: '#374151',
      bg: '#F3F4F6',
      border: '#D1D5DB',
      icon: '#6B7280',
    },
  },

  // Connectivity & Sync States
  connectivity: {
    online: {
      text: '#065F46',
      bg: '#ECFDF5',
      indicator: '#10B981',
    },
    offline: {
      text: '#991B1B',
      bg: '#FEF2F2',
      indicator: '#EF4444',
    },
    syncing: {
      text: '#1E40AF',
      bg: '#EFF6FF',
      indicator: '#3B82F6',
    },
    syncFailed: {
      text: '#B45309',
      bg: '#FFFBEB',
      indicator: '#F59E0B',
    },
  },

  // Emergency Mode (High Attention)
  emergency: {
    background: '#7F1D1D',
    surface: '#991B1B',
    text: '#FFFFFF',
    border: '#EF4444',
    accent: '#FCA5A5',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  minTouchTarget: 48, // 48px minimum touch target for accessibility
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    full: 9999,
  },
};

export const Typography = {
  fontSizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 30,
  },
  fontWeights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  } as const,
  lineHeights: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const Theme = {
  colors: Colors,
  spacing: Spacing,
  typography: Typography,
};
