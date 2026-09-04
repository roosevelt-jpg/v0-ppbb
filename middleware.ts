import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  getUserAgent,
  isBlockedBot,
  isSensitiveRoute,
  ROBOTS_NOINDEX_HEADER,
} from '@/lib/bot-protection'

const DEPRECATED_HOSTS = new Set(['test.myflynai.com'])

export function middleware(request: NextRequest) {
  const host = request.headers.get('host')?.split(':')[0]?.toLowerCase() ?? ''

  if (DEPRECATED_HOSTS.has(host)) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.protocol = 'https:'
    redirectUrl.host = 'www.passive-blessings.com'
    return NextResponse.redirect(redirectUrl, 308)
  }

  const { pathname } = request.nextUrl
  const userAgent = getUserAgent(request)

  // Local health checks / crons use curl; do not block loopback or readiness.
  const isLoopback =
    request.headers.get('x-forwarded-for') == null &&
    (host === '127.0.0.1' || host === 'localhost' || host === '::1')
  const isInternalProbe =
    pathname === '/api/health' || pathname.startsWith('/api/cron/')

  // Block AI trainers & automated scrapers site-wide (except local probes)
  if (!isLoopback && !isInternalProbe && isBlockedBot(userAgent)) {
    return new NextResponse('Access denied — automated crawling is not permitted.', {
      status: 403,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Robots-Tag': ROBOTS_NOINDEX_HEADER,
      },
    })
  }

  const response = NextResponse.next()

  // Tell search engines & compliant crawlers not to index private portals
  if (isSensitiveRoute(pathname)) {
    response.headers.set('X-Robots-Tag', ROBOTS_NOINDEX_HEADER)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Run on all routes except static assets and Next internals.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)',
  ],
}
