// Responsive utility functions and constants for community platform

export const RESPONSIVE_BREAKPOINTS = {
  xs: '(min-width: 320px)',
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
  '2xl': '(min-width: 1536px)',
} as const

// Tailwind responsive class patterns
export const RESPONSIVE_GRID = {
  // Mobile: 1 column, Tablet: 2 columns, Desktop: 3+ columns
  default: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  // For wider content
  wide: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
  // For 2-column layouts (mobile: 1, desktop: 2)
  two: 'grid-cols-1 md:grid-cols-2',
  // For 4-column layouts
  four: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
} as const

export const RESPONSIVE_PADDING = {
  container: 'px-4 sm:px-6 lg:px-8',
  section: 'py-8 sm:py-12 lg:py-16',
  card: 'p-4 sm:p-6',
} as const

export const RESPONSIVE_TEXT = {
  heading1: 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl',
  heading2: 'text-xl sm:text-2xl md:text-3xl',
  heading3: 'text-lg sm:text-xl md:text-2xl',
  body: 'text-sm sm:text-base',
  small: 'text-xs sm:text-sm',
} as const

export const RESPONSIVE_GAP = {
  default: 'gap-4 sm:gap-6 lg:gap-8',
  compact: 'gap-2 sm:gap-3',
  loose: 'gap-6 sm:gap-8 lg:gap-10',
} as const

// Button sizing for responsive design
export const RESPONSIVE_BUTTON = {
  md: 'px-3 py-2 sm:px-4 sm:py-2 text-sm',
  lg: 'px-4 py-2 sm:px-6 sm:py-3 text-base',
} as const

// Common responsive patterns
export const RESPONSIVE_PATTERNS = {
  // Full width on mobile, centered container on desktop
  centerContainer: 'w-full max-w-6xl mx-auto',
  
  // Flex wrap for mobile, no-wrap for desktop
  flexResponsive: 'flex flex-col sm:flex-row',
  
  // Hide on mobile, show on desktop
  hideOnMobile: 'hidden md:block',
  
  // Show on mobile, hide on desktop
  showOnMobile: 'md:hidden',
  
  // Responsive overflow
  overflowResponsive: 'overflow-x-auto sm:overflow-x-visible',
} as const
