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

// Button styles
export const BUTTON_BASE = 'inline-flex items-center justify-center font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
export const BUTTON_PRIMARY = `${BUTTON_BASE} bg-black text-white hover:bg-neutral-800 active:bg-neutral-900 px-4 py-2 rounded-lg`
export const BUTTON_SECONDARY = `${BUTTON_BASE} bg-neutral-200 text-neutral-900 hover:bg-neutral-300 active:bg-neutral-400 px-4 py-2 rounded-lg`
export const BUTTON_DANGER = `${BUTTON_BASE} bg-red-600 text-white hover:bg-red-700 active:bg-red-800 px-4 py-2 rounded-lg`
export const BUTTON_SUCCESS = `${BUTTON_BASE} bg-green-600 text-white hover:bg-green-700 active:bg-green-800 px-4 py-2 rounded-lg`
export const BUTTON_SMALL = 'px-3 py-1.5 text-sm'
export const BUTTON_LARGE = 'px-6 py-3 text-base'

// Form styles
export const INPUT_BASE = 'w-full px-4 py-2 border border-neutral-300 rounded-lg bg-white text-neutral-900 text-base transition-all duration-200'
export const INPUT_FOCUS = 'focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent'
export const INPUT_STYLE = `${INPUT_BASE} ${INPUT_FOCUS}`
export const TEXTAREA_STYLE = `${INPUT_BASE} ${INPUT_FOCUS} resize-vertical min-h-32`
export const SELECT_STYLE = `${INPUT_BASE} ${INPUT_FOCUS} appearance-none cursor-pointer`

// Card styles
export const CARD_BASE = 'bg-white border border-neutral-200 rounded-lg p-6 shadow-sm'
export const CARD_COMPACT = 'bg-white border border-neutral-200 rounded-lg p-4 shadow-sm'

// Grid layouts
export const GRID_RESPONSIVE = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6'
export const GRID_2COL = 'grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6'
export const GRID_3COL = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6'

// Flex utilities
export const FLEX_CENTER = 'flex items-center justify-center'
export const FLEX_BETWEEN = 'flex items-center justify-between'
export const FLEX_COLUMN = 'flex flex-col'

// Typography
export const TEXT_HEADING = 'font-playfair text-3xl md:text-4xl font-bold text-neutral-900'
export const TEXT_SUBHEADING = 'font-playfair text-2xl md:text-3xl font-bold text-neutral-900'
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
