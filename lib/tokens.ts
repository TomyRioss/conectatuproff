export const colors = {
  text: {
    primary:   '#3D322E',
    secondary: '#847071',
    onDark:    '#F2EDE8',
  },
  rose: {
    dark:    '#AB737B',
    DEFAULT: '#B4898F',
    soft:    '#BF9EA1',
  },
  sage: {
    dark:    '#82987F',
    DEFAULT: '#97AC94',
  },
  sand:        '#AA9468',
  wheat:       '#BCA67D',
  border:      '#CEC6C3',
  surface:     '#E3DDD9',
  background:  '#F2EDE8',
} as const

export type ColorToken = typeof colors

export const semantic = {
  primary:        colors.rose.dark,
  primaryHover:   colors.text.secondary,
  success:        colors.sage.dark,
  successLight:   colors.sage.DEFAULT,
  accent:         colors.sand,
  textPrimary:    colors.text.primary,
  textSecondary:  colors.text.secondary,
  border:         colors.border,
  surface:        colors.surface,
  background:     colors.background,
} as const
