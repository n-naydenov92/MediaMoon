'use client'

import { createTheme, type ThemeOptions } from '@mui/material/styles'

// ─── Design tokens (synced with skills/frontend-design/SKILL.md) ─────────────

const FONT_HEADING = '"Syne", "Inter", system-ui, sans-serif'
const FONT_BODY = '"DM Sans", "Inter", system-ui, sans-serif'
const FONT_MONO = '"JetBrains Mono", ui-monospace, monospace'

const RADIUS_SM = 4
const RADIUS_MD = 8
const RADIUS_LG = 12

const COLORS_DARK = {
  bgBase: '#0A0A0F',
  bgSurface: '#12121A',
  bgElevated: '#1A1A24',
  borderSubtle: '#22222E',
  borderStrong: '#2E2E3E',
  textPrimary: '#F5F5F7',
  textSecondary: '#9A9AA8',
  textMuted: '#5A5A6A',
  accent: '#6C63FF',
  accentHover: '#7D75FF',
  viral: '#F59E0B',
  hot: '#F97316',
  normal: '#64748B',
  success: '#10B981',
  error: '#EF4444',
  warning: '#EAB308',
} as const

const COLORS_LIGHT = {
  bgBase: '#FAFAFB',
  bgSurface: '#FFFFFF',
  bgElevated: '#F4F4F6',
  borderSubtle: '#E4E4EA',
  borderStrong: '#D1D1DA',
  textPrimary: '#0A0A0F',
  textSecondary: '#4A4A58',
  textMuted: '#8A8A98',
  accent: '#5B52E5',
  accentHover: '#6C63FF',
  viral: '#D97706',
  hot: '#EA580C',
  normal: '#475569',
  success: '#059669',
  error: '#DC2626',
  warning: '#CA8A04',
} as const

// ─── Typography ──────────────────────────────────────────────────────────────

const typography: ThemeOptions['typography'] = {
  fontFamily: FONT_BODY,
  fontSize: 14,
  htmlFontSize: 16,
  h1: { fontFamily: FONT_HEADING, fontSize: 24, fontWeight: 600, letterSpacing: '-0.01em' },
  h2: { fontFamily: FONT_HEADING, fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em' },
  h3: { fontFamily: FONT_BODY, fontSize: 16, fontWeight: 600 },
  h4: { fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600 },
  body1: { fontSize: 14, fontWeight: 400, lineHeight: 1.55 },
  body2: { fontSize: 13, fontWeight: 400, lineHeight: 1.5 },
  caption: { fontSize: 12, fontWeight: 500, letterSpacing: '0.02em' },
  overline: {
    fontFamily: FONT_HEADING,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.08em',
    lineHeight: 1.4,
    textTransform: 'uppercase',
  },
  button: { fontFamily: FONT_BODY, fontWeight: 500, textTransform: 'none', letterSpacing: 0 },
}

// ─── Theme factory (intent: one source of truth, two modes) ──────────────────

type Mode = 'dark' | 'light'

function buildPalette(mode: Mode): ThemeOptions['palette'] {
  const c = mode === 'dark' ? COLORS_DARK : COLORS_LIGHT
  return {
    mode,
    primary: { main: c.accent, dark: c.accent, light: c.accentHover, contrastText: '#FFFFFF' },
    error: { main: c.error },
    warning: { main: c.warning },
    success: { main: c.success },
    background: { default: c.bgBase, paper: c.bgSurface },
    text: { primary: c.textPrimary, secondary: c.textSecondary, disabled: c.textMuted },
    divider: c.borderSubtle,
  }
}

function buildComponents(mode: Mode): ThemeOptions['components'] {
  const c = mode === 'dark' ? COLORS_DARK : COLORS_LIGHT
  return {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          fontFeatureSettings: '"tnum" on, "lnum" on',
          backgroundColor: c.bgBase,
          color: c.textPrimary,
        },
        '*:focus-visible': {
          outline: `2px solid ${c.accent}`,
          outlineOffset: 2,
        },
      },
    },
    MuiPaper: { defaultProps: { elevation: 0 } },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundColor: c.bgSurface,
          border: `1px solid ${c.borderSubtle}`,
          borderRadius: RADIUS_LG,
          transition: 'border-color 80ms ease-out, background-color 80ms ease-out',
          '&:hover': { borderColor: c.borderStrong },
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: { padding: 20, '&:last-child': { paddingBottom: 20 } },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true, disableRipple: false },
      styleOverrides: {
        root: { borderRadius: RADIUS_SM, height: 36, paddingInline: 14 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: RADIUS_SM, fontWeight: 500, height: 24 },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: { minHeight: 40, borderBottom: `1px solid ${c.borderSubtle}` },
        indicator: { height: 2, backgroundColor: c.accent },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 40,
          textTransform: 'none',
          fontSize: 14,
          fontWeight: 500,
          color: c.textSecondary,
          '&.Mui-selected': { color: c.textPrimary },
        },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0, color: 'transparent' },
      styleOverrides: {
        root: {
          backgroundColor: c.bgBase,
          borderBottom: `1px solid ${c.borderSubtle}`,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: c.bgSurface,
          borderRight: `1px solid ${c.borderSubtle}`,
        },
      },
    },
    MuiAlert: {
      styleOverrides: { root: { borderRadius: RADIUS_MD } },
    },
    MuiInputBase: {
      styleOverrides: {
        input: {
          // iOS Safari zooms the viewport when a focused field renders below 16px.
          '@media (max-width:1023px)': { fontSize: 16 },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          fontFamily: FONT_BODY,
          color: c.textPrimary,
          backgroundColor: 'transparent',
          borderRadius: 10,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: c.borderSubtle,
            borderRadius: 10,
          },
          '&:hover:not(.Mui-disabled):not(.Mui-focused) .MuiOutlinedInput-notchedOutline': {
            borderColor: c.accentHover,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: c.accent,
            borderWidth: 1.5,
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          // Density: dense form input (CopyForm) — opt in with className="density-form"
          '&.density-form .MuiOutlinedInput-root': {
            fontSize: 13,
            minHeight: 40,
          },
          '&.density-form .MuiOutlinedInput-input': {
            padding: '10px 12px',
            color: c.textPrimary,
          },
          '&.density-form .MuiInputBase-multiline': {
            alignItems: 'flex-start',
          },
          '&.density-form .MuiInputBase-multiline .MuiOutlinedInput-input': {
            padding: '10px 12px',
            fontFamily: 'inherit',
            resize: 'vertical',
            minHeight: 48,
          },
          '&.density-form .MuiSelect-select': {
            display: 'flex',
            alignItems: 'center',
            padding: '10px 32px 10px 12px',
            minHeight: 0,
          },
          // Density: dialog input (AdSetEditor) — opt in with className="density-dialog"
          '&.density-dialog .MuiOutlinedInput-root': {
            minHeight: 44,
            fontSize: 14,
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        icon: { color: c.textSecondary },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          minHeight: 38,
          padding: '8px 12px',
          margin: '2px 0',
          fontFamily: FONT_BODY,
          fontSize: 13,
          color: c.textPrimary,
          borderRadius: 8,
          '&:hover, &.Mui-focusVisible': {
            backgroundColor: `color-mix(in srgb, ${c.accent} 8%, ${c.bgElevated})`,
          },
          '&.Mui-selected': {
            backgroundColor: `color-mix(in srgb, ${c.accent} 14%, ${c.bgElevated})`,
            color: c.accent,
            fontWeight: 600,
            '&:hover, &.Mui-focusVisible': {
              backgroundColor: `color-mix(in srgb, ${c.accent} 14%, ${c.bgElevated})`,
            },
          },
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        input: {
          '&::placeholder': {
            color: c.textPrimary,
            opacity: 1,
          },
        },
      },
    },
  }
}

export function buildTheme(mode: Mode) {
  return createTheme({
    palette: buildPalette(mode),
    typography,
    shape: { borderRadius: RADIUS_MD },
    spacing: 4, // base unit; use multiples: 1=4px, 2=8px, 3=12px, 4=16px...
    components: buildComponents(mode),
  })
}

export const darkTheme = buildTheme('dark')
export const lightTheme = buildTheme('light')

// ─── Semantic tokens exported for non-MUI styling (e.g., CSS modules) ────────

export const SEMANTIC_COLORS = {
  dark: COLORS_DARK,
  light: COLORS_LIGHT,
} as const

export const FONTS = { heading: FONT_HEADING, body: FONT_BODY, mono: FONT_MONO } as const
