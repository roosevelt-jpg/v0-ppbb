import { NextResponse } from 'next/server';
import { DEV_AUTH_COOKIE } from '@/lib/dev-auth';
import { isDevAuthAllowed, mintDevBearer } from '@/lib/dev-auth-server';

/**
 * Local/test-only login that does NOT use Clerk's browser OTP UI.
 * Sets a signed cookie + returns a bearer for API calls. sk_test_ only.
 */
export async function POST(request: Request) {
  const secretKey = process.env.CLERK_SECRET_KEY?.trim();
  if (!isDevAuthAllowed(secretKey)) {
    return NextResponse.json(
      { error: 'dev_login_disabled', message: 'Dev login requires a Clerk test secret (sk_test_).' },
      { status: 403 },
    );
  }

  const email = process.env.E2E_CLERK_USER_EMAIL?.trim() || 'local.reviewer@example.com';
  let clerkUserId = 'user_dev_local_reviewer';
  let name = 'Local Reviewer';

  // Prefer the real Clerk test user id when it exists (keeps identity table tidy).
  try {
    const listRes = await fetch(
      `https://api.clerk.com/v1/users?limit=5&email_address=${encodeURIComponent(email)}`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      },
    );
    if (listRes.ok) {
      const users = (await listRes.json()) as Array<{
        id: string;
        first_name?: string | null;
        last_name?: string | null;
      }>;
      if (users[0]?.id) {
        clerkUserId = users[0].id;
        name = [users[0].first_name, users[0].last_name].filter(Boolean).join(' ') || name;
      }
    }
  } catch {
    // Fall back to synthetic clerkUserId — still fine for local browse.
  }

  const bearer = mintDevBearer(secretKey!, {
    clerkUserId,
    email,
    name,
    ttlSeconds: 60 * 60 * 12,
  });

  const res = NextResponse.json({
    ok: true,
    email,
    bearer,
    redirectTo: '/dashboard',
    note: 'Clerk OTP bypass cookie set. No email code required.',
  });

  // HTTPS tunnels (cloudflared) need Secure cookies; plain localhost does not.
  const proto = request.headers.get('x-forwarded-proto') ?? new URL(request.url).protocol.replace(':', '');
  const secure = proto === 'https';

  res.cookies.set(DEV_AUTH_COOKIE, bearer, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: 60 * 60 * 12,
  });

  return res;
}
