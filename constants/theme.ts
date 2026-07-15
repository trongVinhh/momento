export const LIGHT_COLORS = {
  background: '#f4f4f7',
  cardBackground: 'rgba(255, 255, 255, 0.8)',
  white: '#ffffff',
  textActive: '#1a1a24',
  textInactive: 'rgba(26, 26, 36, 0.5)',
  textMuted: 'rgba(26, 26, 36, 0.4)',
  textSubtle: 'rgba(26, 26, 36, 0.6)',
  borderGlass: 'rgba(0, 0, 0, 0.08)',
  borderGlassHeavy: 'rgba(0, 0, 0, 0.15)',
  blurTint: 'light' as 'light' | 'dark',
  shadowLight: 'rgba(0, 0, 0, 0.05)',
  accentRed: '#ef4444',
  accentPrimary: '#dc2626',
  accentPrimaryGlass: 'rgba(220, 38, 38, 0.85)',
  accentPrimarySubtle: 'rgba(220, 38, 38, 0.08)',
  accentPrimaryBorder: 'rgba(220, 38, 38, 0.2)',
} as const

export const DARK_COLORS = {
  background: '#0a0a0c',
  cardBackground: '#16161a',
  white: '#ffffff',
  textActive: '#ffffff',
  textInactive: 'rgba(255, 255, 255, 0.5)',
  textMuted: 'rgba(255, 255, 255, 0.4)',
  textSubtle: 'rgba(255, 255, 255, 0.6)',
  borderGlass: 'rgba(255, 255, 255, 0.15)',
  borderGlassHeavy: 'rgba(255, 255, 255, 0.25)',
  blurTint: 'dark' as 'light' | 'dark',
  shadowLight: 'rgba(255, 255, 255, 0.45)',
  accentRed: '#ef4444',
  accentPrimary: '#ef4444',
  accentPrimaryGlass: 'rgba(239, 68, 68, 0.75)',
  accentPrimarySubtle: 'rgba(239, 68, 68, 0.15)',
  accentPrimaryBorder: 'rgba(239, 68, 68, 0.3)',
} as const

// Tương thích ngược với các file chưa kịp chuyển đổi
export const COLORS = DARK_COLORS

export const FONTS = {
  regular: 'System',
  semibold: 'System',
  bold: 'System',
} as const

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const

export const GLASS_STYLES = {
  pillIntensity: 4,
  headerIntensity: 60,
  navIntensity: 20,
} as const
