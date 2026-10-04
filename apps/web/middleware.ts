import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { DEV_AUTH_COOKIE } from '@/lib/dev-auth';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/setup(.*)',
  '/dev-login(.*)',
  '/api/dev-login(.*)',
  '/docs(.*)',
  '/playground(.*)',
  '/coverage(.*)',
  '/models(.*)',
  '/health(.*)',
  '/use-cases(.*)',
  '/products(.*)',
  '/sitemap.xml',
  '/robots.txt',
]);

const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

function hasDevAuthCookie(request: NextRequest): boolean {
  const secret = process.env.CLERK_SECRET_KEY?.trim();
  if (!secret?.startsWith('sk_test_')) return false;
  const token = request.cookies.get(DEV_AUTH_COOKIE)?.value;
  if (!token?.startsWith('vl_dev_')) return false;
  // Lightweight structural check in Edge; full HMAC verify happens on API.
  // Cookie is httpOnly and only set by our sk_test_-gated route.
  const raw = token.slice('vl_dev_'.length);
  const dot = raw.lastIndexOf('.');
  return dot > 0 && raw.slice(dot + 1).length > 10;
}

export default clerkConfigured
  ? clerkMiddleware(async (auth, request) => {
      if (isPublicRoute(request) || hasDevAuthCookie(request)) {
        return NextResponse.next();
      }
      await auth.protect();
    })
  : function middleware() {
      return NextResponse.next();
    };

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
