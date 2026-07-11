/**
 * Bot / scraper protection for Passive Blessings.
 * Used by middleware and robots.ts.
 */

/** Known AI training & aggressive scraper user-agents (lowercase substrings). */
export const BLOCKED_AI_AND_SCRAPER_AGENTS = [
  'gptbot',
  'chatgpt-user',
  'oai-searchbot',
  'claudebot',
  'claude-web',
  'anthropic-ai',
  'google-extended',
  'bytespider',
  'ccbot',
  'cohere-ai',
  // Keep Meta/WhatsApp/Facebook link-preview crawlers allowed (not listed here):
  // facebookexternalhit, facebot, whatsapp
  'meta-externalagent',
  'amazonbot',
  'applebot-extended',
  'diffbot',
  'omgili',
  'petalbot',
  'scrapy',
  'httrack',
  'wget',
  'curl/',
  'python-requests',
  'go-http-client',
  'semrushbot',
  'ahrefsbot',
  'dotbot',
  'mj12bot',
  'blexbot',
  'dataforseo',
] as const

/** Routes that must never be indexed or scraped by bots. */
export const NOINDEX_ROUTE_PREFIXES = [
  '/admin',
  '/dashboard',
  '/business',
  '/sponsor',
  '/api',
] as const

export function getUserAgent(request: Request): string {
  return (request.headers.get('user-agent') || '').toLowerCase()
}

export function isBlockedBot(userAgent: string): boolean {
  if (!userAgent) return false
  return BLOCKED_AI_AND_SCRAPER_AGENTS.some((token) => userAgent.includes(token))
}

export function isSensitiveRoute(pathname: string): boolean {
  return NOINDEX_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

export const ROBOTS_NOINDEX_HEADER = 'noindex, nofollow, noarchive, nosnippet, noimageindex'
