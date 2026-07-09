import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  getUserAgent,
  isBlockedBot,
  isSensitiveRoute,
  ROBOTS_NOINDEX_HEADER,
} from '@/lib/bot-protection'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const userAgent = getUserAgent(request)

  // Block AI trainers & automated scrapers site-wide
  if (isBlockedBot(userAgent)) {
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
