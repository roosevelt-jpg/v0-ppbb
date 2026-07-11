/**
 * Site-wide typography & color theme (admin-configurable).
 * Stored on platformConfig/globalSettings.theme
 */

export type SiteFontRole = 'heading' | 'title' | 'subheading' | 'content' | 'button'

export interface SiteThemeFonts {
  heading: string
  title: string
  subheading: string
  content: string
  button: string
}

export interface SiteThemeColors {
  primary: string
  secondary: string
  accent: string
  background: string
  foreground: string
  muted: string
  border: string
  buttonBg: string
  buttonText: string
  buttonHover: string
}

export interface SiteTheme {
  fonts: SiteThemeFonts
  colors: SiteThemeColors
}

export type FontOption = {
  id: string
  label: string
  /** CSS font-family stack */
  stack: string
  /** Google Fonts family name, or null for system */
  googleFamily: string | null
  category: 'serif' | 'sans' | 'system'
}

export const SITE_FONT_OPTIONS: FontOption[] = [
  {
    id: 'cormorant-garamond',
    label: 'Cormorant Garamond',
    stack: "'Cormorant Garamond', Georgia, serif",
    googleFamily: 'Cormorant Garamond',
    category: 'serif',
  },
  {
    id: 'playfair-display',
    label: 'Playfair Display',
    stack: "'Playfair Display', Georgia, serif",
    googleFamily: 'Playfair Display',
    category: 'serif',
  },
  {
    id: 'lora',
    label: 'Lora',
    stack: "'Lora', Georgia, serif",
    googleFamily: 'Lora',
    category: 'serif',
  },
  {
    id: 'libre-baskerville',
    label: 'Libre Baskerville',
    stack: "'Libre Baskerville', Georgia, serif",
    googleFamily: 'Libre Baskerville',
    category: 'serif',
  },
  {
    id: 'merriweather',
    label: 'Merriweather',
    stack: "'Merriweather', Georgia, serif",
    googleFamily: 'Merriweather',
    category: 'serif',
  },
  {
    id: 'source-serif-4',
    label: 'Source Serif 4',
    stack: "'Source Serif 4', Georgia, serif",
    googleFamily: 'Source Serif 4',
    category: 'serif',
  },
  {
    id: 'inter',
    label: 'Inter',
    stack: "'Inter', system-ui, sans-serif",
    googleFamily: 'Inter',
    category: 'sans',
  },
  {
    id: 'dm-sans',
    label: 'DM Sans',
    stack: "'DM Sans', system-ui, sans-serif",
    googleFamily: 'DM Sans',
    category: 'sans',
  },
  {
    id: 'manrope',
    label: 'Manrope',
    stack: "'Manrope', system-ui, sans-serif",
    googleFamily: 'Manrope',
    category: 'sans',
  },
  {
    id: 'outfit',
    label: 'Outfit',
    stack: "'Outfit', system-ui, sans-serif",
    googleFamily: 'Outfit',
    category: 'sans',
  },
  {
    id: 'space-grotesk',
    label: 'Space Grotesk',
    stack: "'Space Grotesk', system-ui, sans-serif",
    googleFamily: 'Space Grotesk',
    category: 'sans',
  },
  {
    id: 'montserrat',
    label: 'Montserrat',
    stack: "'Montserrat', system-ui, sans-serif",
    googleFamily: 'Montserrat',
    category: 'sans',
  },
  {
    id: 'poppins',
    label: 'Poppins',
    stack: "'Poppins', system-ui, sans-serif",
    googleFamily: 'Poppins',
    category: 'sans',
  },
  {
    id: 'nunito-sans',
    label: 'Nunito Sans',
    stack: "'Nunito Sans', system-ui, sans-serif",
    googleFamily: 'Nunito Sans',
    category: 'sans',
  },
  {
    id: 'open-sans',
    label: 'Open Sans',
    stack: "'Open Sans', system-ui, sans-serif",
    googleFamily: 'Open Sans',
    category: 'sans',
  },
  {
    id: 'ibm-plex-sans',
    label: 'IBM Plex Sans',
    stack: "'IBM Plex Sans', system-ui, sans-serif",
    googleFamily: 'IBM Plex Sans',
    category: 'sans',
  },
  {
    id: 'system-ui',
    label: 'System UI',
    stack: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    googleFamily: null,
    category: 'system',
  },
]

export const DEFAULT_SITE_THEME: SiteTheme = {
  fonts: {
    heading: 'cormorant-garamond',
    title: 'cormorant-garamond',
    subheading: 'inter',
    content: 'inter',
    button: 'inter',
  },
  colors: {
    primary: '#111111',
    secondary: '#333333',
    accent: '#b8860b',
    background: '#f7f6f2',
    foreground: '#111111',
    muted: '#888888',
    border: '#e4e1da',
    buttonBg: '#111111',
    buttonText: '#ffffff',
    buttonHover: '#333333',
  },
}

const FONT_IDS = new Set(SITE_FONT_OPTIONS.map((f) => f.id))

function asFontId(value: unknown, fallback: string): string {
  const id = typeof value === 'string' ? value.trim() : ''
  return FONT_IDS.has(id) ? id : fallback
}

function asHexColor(value: unknown, fallback: string): string {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(raw)) return raw
  return fallback
}

export function getFontOption(id: string): FontOption {
  return SITE_FONT_OPTIONS.find((f) => f.id === id) || SITE_FONT_OPTIONS.find((f) => f.id === 'inter')!
}

export function mergeSiteTheme(raw: unknown): SiteTheme {
  const d = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const fonts = d.fonts && typeof d.fonts === 'object' ? (d.fonts as Record<string, unknown>) : {}
  const colors = d.colors && typeof d.colors === 'object' ? (d.colors as Record<string, unknown>) : {}
  const def = DEFAULT_SITE_THEME

  return {
    fonts: {
      heading: asFontId(fonts.heading, def.fonts.heading),
      title: asFontId(fonts.title, def.fonts.title),
      subheading: asFontId(fonts.subheading, def.fonts.subheading),
      content: asFontId(fonts.content, def.fonts.content),
      button: asFontId(fonts.button, def.fonts.button),
    },
    colors: {
      primary: asHexColor(colors.primary, def.colors.primary),
      secondary: asHexColor(colors.secondary, def.colors.secondary),
      accent: asHexColor(colors.accent, def.colors.accent),
      background: asHexColor(colors.background, def.colors.background),
      foreground: asHexColor(colors.foreground, def.colors.foreground),
      muted: asHexColor(colors.muted, def.colors.muted),
      border: asHexColor(colors.border, def.colors.border),
      buttonBg: asHexColor(colors.buttonBg, def.colors.buttonBg),
      buttonText: asHexColor(colors.buttonText, def.colors.buttonText),
      buttonHover: asHexColor(colors.buttonHover, def.colors.buttonHover),
    },
  }
}

export function buildGoogleFontsHref(theme: SiteTheme): string | null {
  const families = new Set<string>()
  const roles: SiteFontRole[] = ['heading', 'title', 'subheading', 'content', 'button']
  for (const role of roles) {
    const opt = getFontOption(theme.fonts[role])
    if (opt.googleFamily) families.add(opt.googleFamily)
  }
  if (families.size === 0) return null

  const params = Array.from(families)
    .map((name) => {
      const encoded = name.replace(/ /g, '+')
      // Broad weight coverage for headings + UI
      return `family=${encoded}:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400`
    })
    .join('&')

  return `https://fonts.googleapis.com/css2?${params}&display=swap`
}

export function themeToCssVariables(theme: SiteTheme): Record<string, string> {
  const heading = getFontOption(theme.fonts.heading).stack
  const title = getFontOption(theme.fonts.title).stack
  const subheading = getFontOption(theme.fonts.subheading).stack
  const content = getFontOption(theme.fonts.content).stack
  const button = getFontOption(theme.fonts.button).stack
  const c = theme.colors

  return {
    '--pb-font-heading': heading,
    '--pb-font-title': title,
    '--pb-font-subheading': subheading,
    '--pb-font-content': content,
    '--pb-font-button': button,
    '--font-headline': heading,
    '--font-body': content,
    '--pb-color-primary': c.primary,
    '--pb-color-secondary': c.secondary,
    '--pb-color-accent': c.accent,
    '--pb-color-background': c.background,
    '--pb-color-foreground': c.foreground,
    '--pb-color-muted': c.muted,
    '--pb-color-border': c.border,
    '--pb-color-button-bg': c.buttonBg,
    '--pb-color-button-text': c.buttonText,
    '--pb-color-button-hover': c.buttonHover,
    '--background': c.background,
    '--foreground': c.foreground,
    '--card': '#ffffff',
    '--card-foreground': c.foreground,
    '--primary': c.primary,
    '--primary-foreground': c.buttonText,
    '--secondary': c.secondary,
    '--secondary-foreground': '#ffffff',
    '--muted': c.background,
    '--muted-foreground': c.muted,
    '--accent': c.accent,
    '--accent-foreground': '#ffffff',
    '--border': c.border,
    '--input': c.border,
    '--ring': c.primary,
    '--color-ink-black': c.primary,
    '--color-charcoal': c.secondary,
    '--color-warm-grey': c.muted,
    '--color-sand-border': c.border,
    '--color-warm-white': c.background,
    '--color-gold': c.accent,
  }
}

export const FONT_ROLE_LABELS: Record<SiteFontRole, { label: string; hint: string }> = {
  heading: { label: 'Heading (H1)', hint: 'Hero and main page headings' },
  title: { label: 'Title (H2)', hint: 'Section titles' },
  subheading: { label: 'Subheading (H3–H4)', hint: 'Smaller titles and labels' },
  content: { label: 'Content / body', hint: 'Paragraphs and general text' },
  button: { label: 'Buttons', hint: 'Primary and secondary buttons' },
}

export const COLOR_FIELD_LABELS: Array<{ key: keyof SiteThemeColors; label: string; hint: string }> = [
  { key: 'primary', label: 'Primary', hint: 'Brand / ink' },
  { key: 'secondary', label: 'Secondary', hint: 'Hover and secondary text weight' },
  { key: 'accent', label: 'Accent', hint: 'Highlights and gold accents' },
  { key: 'background', label: 'Background', hint: 'Page background' },
  { key: 'foreground', label: 'Text', hint: 'Main text color' },
  { key: 'muted', label: 'Muted text', hint: 'Secondary / helper text' },
  { key: 'border', label: 'Border', hint: 'Dividers and input borders' },
  { key: 'buttonBg', label: 'Button background', hint: 'Default button fill' },
  { key: 'buttonText', label: 'Button text', hint: 'Default button label' },
  { key: 'buttonHover', label: 'Button hover', hint: 'Button hover fill' },
]
