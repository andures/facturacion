export const COLORS = {
  primary:       '#60A5FA',   // Blue 400
  primaryLight:  '#1D3461',   // dark blue tint for fills

  background:    '#09090B',   // Zinc 950 — screen bg
  surface:       '#18181B',   // Zinc 900 — cards, sheets
  surfaceRaised: '#27272A',   // Zinc 800 — inputs, elevated rows

  text:          '#FAFAFA',
  textSecondary: '#A1A1AA',   // Zinc 400
  textTertiary:  '#71717A',   // Zinc 500

  border:      '#3F3F46',     // Zinc 700
  borderFocus: '#60A5FA',

  danger:  '#F87171',
  success: '#4ADE80',
  warning: '#FBBF24',

  estadoBorrador: '#71717A',
  estadoEnviada:  '#FBBF24',
  estadoPagada:   '#4ADE80',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
};

export const FONT = {
  regular:  '400' as const,
  medium:   '500' as const,
  semibold: '600' as const,
  bold:     '700' as const,
};
