// CareGrid Desktop Design Tokens (High-density, professional, high-contrast)

export const Colors = {
  primary: '#0B6477',
  primaryDark: '#07485B',
  primaryLight: '#219EBC',
  primarySurface: '#E8F4F8',

  secondary: '#1D3557',
  secondaryLight: '#457B9D',

  background: '#F8F9FA',
  sidebarBg: '#0F172A',
  sidebarText: '#94A3B8',
  sidebarTextActive: '#FFFFFF',
  sidebarActiveBg: '#1E293B',

  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceSubtle: '#F1F5F9',

  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',
  textInverse: '#FFFFFF',

  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  borderFocus: '#0B6477',

  status: {
    available: { text: '#065F46', bg: '#D1FAE5', border: '#6EE7B7' },
    lowStock: { text: '#92400E', bg: '#FEF3C7', border: '#FCD34D' },
    outOfStock: { text: '#991B1B', bg: '#FEE2E2', border: '#FCA5A5' },
    pending: { text: '#854D0E', bg: '#FEF9C3', border: '#FDE047' },
    confirmed: { text: '#166534', bg: '#DCFCE7', border: '#86EFAC' },
    rejected: { text: '#991B1B', bg: '#FEE2E2', border: '#FCA5A5' },
    timedOut: { text: '#4C1D95', bg: '#EDE9FE', border: '#C4B5FD' },
  },

  freshness: {
    current: { text: '#065F46', bg: '#ECFDF5', border: '#A7F3D0' },
    stale: { text: '#9A3412', bg: '#FFF7ED', border: '#FDBA74' },
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    full: 9999,
  },
};

export const Typography = {
  fontSizes: {
    xs: '12px',
    sm: '13px',
    md: '14px',
    lg: '16px',
    xl: '20px',
    xxl: '24px',
  },
  fontWeights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};
