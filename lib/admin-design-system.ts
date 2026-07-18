// Admin Design System - Consistent styling across all admin pages
// Follows PB Brand Guidelines

export const ADMIN_COLORS = {
  primary: '#111111', // Black
  secondary: '#6B7280', // Gray
  accent: '#D4A574', // Warm accent
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  background: '#FFFFFF',
  border: '#E5E7EB',
  hover: '#1F2937',
  white: '#FFFFFF',
  lightGray: '#F3F4F6',
  darkGray: '#374151',
}

// Spacing system (4px base unit)
export const ADMIN_SPACING = {
  xs: '0.25rem', // 4px
  sm: '0.5rem', // 8px
  md: '1rem', // 16px
  lg: '1.5rem', // 24px
  xl: '2rem', // 32px
  xxl: '3rem', // 48px
}

// Border radius
export const ADMIN_RADIUS = {
  sm: '6px',
  md: '8px',
  lg: '12px',
  full: '9999px',
}

// Button styles — compact by default (black / white)
export const BUTTON_BASE = 'inline-flex items-center justify-center font-semibold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
export const BUTTON_PRIMARY = `${BUTTON_BASE} pb-compact-btn h-7 min-h-0 px-2.5 text-xs rounded-md bg-black !text-white hover:bg-neutral-800 active:bg-neutral-900 border-0 shadow-none [&_svg]:h-4 [&_svg]:w-4 [&_svg]:text-white`
/** White outline secondary CTA */
export const BUTTON_OUTLINE = `${BUTTON_BASE} pb-outline-btn h-7 min-h-0 px-2.5 text-xs rounded-md`
/** Same black / white treatment — no white secondary CTAs in admin */
export const BUTTON_SECONDARY = BUTTON_PRIMARY
export const BUTTON_DANGER = BUTTON_PRIMARY
/** Icon-only table actions — black primary (compact) */
export const BUTTON_ICON_PRIMARY = `${BUTTON_BASE} pb-compact-btn inline-flex items-center justify-center h-7 w-7 min-h-0 min-w-0 p-0 rounded-md bg-black !text-white hover:bg-neutral-800 active:bg-neutral-900 border-0 shadow-none [&_svg]:text-white [&_svg]:h-4 [&_svg]:w-4`
/** Icon-only table actions — same black style (delete/archive included) */
export const BUTTON_ICON_DANGER = BUTTON_ICON_PRIMARY
/** Compact icon actions for table rows (Edit / Archive / Delete on one line) */
export const BUTTON_ICON_COMPACT = BUTTON_ICON_PRIMARY
/** Compact text actions for table rows */
export const BUTTON_ROW_COMPACT = `${BUTTON_BASE} pb-compact-btn inline-flex items-center justify-center gap-1 h-7 min-h-0 px-2 text-xs font-semibold rounded-md bg-black !text-white hover:bg-neutral-800 active:bg-neutral-900 border-0 shadow-none whitespace-nowrap shrink-0 [&_svg]:text-white [&_svg]:h-4 [&_svg]:w-4`
/** Keep Edit/Archive/Delete on one horizontal line */
export const ACTION_ROW = 'flex flex-wrap items-center gap-0.5'
/** Compact back / navigation control */
export const BUTTON_BACK = `${BUTTON_BASE} pb-compact-btn inline-flex items-center gap-1.5 h-7 min-h-0 px-2.5 text-xs font-semibold rounded-md bg-black !text-white hover:bg-neutral-800 active:bg-neutral-900 border-0 shadow-none [&_svg]:text-white [&_svg]:h-4 [&_svg]:w-4`
/** Filter / tab pills — compact; inactive uses outline (not black-forced compact) */
export const FILTER_PILL_ACTIVE = `${BUTTON_BASE} pb-compact-btn h-7 min-h-0 px-2.5 text-xs rounded-md bg-black !text-white border border-black shadow-none`
export const FILTER_PILL_INACTIVE = `${BUTTON_BASE} pb-outline-btn h-7 min-h-0 px-2.5 text-xs rounded-md`
/** Up/down reorder controls — black square with white icon */
export const BUTTON_REORDER = `${BUTTON_BASE} pb-compact-btn min-h-0 min-w-0 h-7 w-7 p-0 rounded bg-black text-white hover:bg-neutral-800 active:bg-neutral-900 disabled:opacity-40 shadow-none border-0 [&_svg]:h-4 [&_svg]:w-4`
/** @deprecated Use BUTTON_PRIMARY — success actions use black per design system */
export const BUTTON_SUCCESS = BUTTON_PRIMARY
export const BUTTON_SMALL = BUTTON_ROW_COMPACT
export const BUTTON_LARGE = BUTTON_PRIMARY
/** Label styled as compact upload / file button */
export const BUTTON_LABEL_COMPACT = `${BUTTON_BASE} pb-compact-btn h-7 min-h-0 px-2.5 text-xs rounded-md bg-black !text-white hover:bg-neutral-800 border-0 shadow-none cursor-pointer [&_svg]:h-4 [&_svg]:w-4 [&_svg]:text-white`

/** Compact admin detail modal shell (profile popups, review dialogs) */
export const ADMIN_DETAIL_MODAL_OVERLAY =
  'fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-2'
export const ADMIN_DETAIL_MODAL_BACKDROP = 'absolute inset-0 bg-black/50'
export const ADMIN_DETAIL_MODAL_PANEL =
  'relative bg-white rounded-t-lg sm:rounded-lg shadow-xl w-full max-w-[18rem] sm:max-w-xs max-h-[85vh] overflow-hidden flex flex-col'
export const ADMIN_DETAIL_MODAL_CLOSE =
  'shrink-0 min-h-[26px] min-w-[26px] inline-flex items-center justify-center rounded-md text-neutral-600 hover:bg-neutral-100'

/** Compact metric tile (Reporting / overview stats) */
export const STAT_CARD =
  'pb-stat-card bg-white border border-[#e4e1da] rounded-lg p-3 min-w-0'
export const STAT_CARD_LABEL =
  'pb-stat-label text-[10px] text-neutral-500 uppercase tracking-wide font-medium'
export const STAT_CARD_VALUE =
  'pb-stat-value text-xl font-bold text-neutral-900 mt-1 font-headline truncate'

/** Compact report / action panel card */
export const ACTION_CARD =
  'pb-action-card bg-white border border-[#e4e1da] rounded-lg p-3 flex flex-col min-w-0'

// Form styles
export const INPUT_BASE = 'w-full px-4 py-2 border border-neutral-300 rounded-lg bg-white text-neutral-900 text-base transition-all duration-200'
export const INPUT_FOCUS = 'focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent'
export const INPUT_STYLE = `${INPUT_BASE} ${INPUT_FOCUS}`
export const TEXTAREA_STYLE = `${INPUT_BASE} ${INPUT_FOCUS} resize-vertical min-h-32`
export const SELECT_STYLE = `${INPUT_BASE} ${INPUT_FOCUS} appearance-none cursor-pointer`
/** Reset global button styles when using <button> as a select/combobox trigger */
export const FIELD_TRIGGER_RESET =
  '!min-h-0 !px-4 !py-2 !rounded-lg !font-normal !font-body !shadow-none hover:!shadow-none !bg-white !text-neutral-900 hover:!bg-white active:!bg-white'

// Card styles
export const CARD_BASE = 'bg-white border border-neutral-200 rounded-lg p-3 shadow-none'
export const CARD_COMPACT = 'bg-white border border-neutral-200 rounded-lg p-2.5 shadow-none'

// Grid layouts
export const GRID_RESPONSIVE = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6'
export const GRID_2COL = 'grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6'
export const GRID_3COL = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6'

// Flex utilities
export const FLEX_CENTER = 'flex items-center justify-center'
export const FLEX_BETWEEN = 'flex items-center justify-between'
export const FLEX_COLUMN = 'flex flex-col'

// Typography
export const TEXT_HEADING = 'font-headline text-3xl md:text-4xl font-bold text-neutral-900'
export const TEXT_SUBHEADING = 'font-headline text-2xl md:text-3xl font-bold text-neutral-900'
export const TEXT_SECTION = 'font-bold text-lg md:text-xl text-neutral-900'
export const TEXT_LABEL = 'text-sm font-medium text-neutral-700'
export const TEXT_SMALL = 'text-xs md:text-sm text-neutral-600'
export const TEXT_MUTED = 'text-neutral-500'

// Status badges
export const STATUS_BADGE_ACTIVE = 'px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold'
export const STATUS_BADGE_INACTIVE = 'px-3 py-1 bg-neutral-100 text-neutral-800 rounded-full text-xs font-semibold'
export const STATUS_BADGE_PENDING = 'px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold'
export const STATUS_BADGE_ERROR = 'px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold'

// Page container
export const PAGE_CONTAINER = 'min-h-screen bg-neutral-50'
export const CONTENT_CONTAINER = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8'
