'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { clearAdminMfaSession } from '@/lib/admin-mfa-session'

/** Log out any signed-in user after this much inactivity. */
export const SESSION_IDLE_MS = 60 * 60 * 1000

function idleLogoutPath(pathname: string | null): string {
  if (pathname?.startsWith('/admin')) {
    return '/admin/login?reason=idle'
  }
  if (pathname?.startsWith('/business')) {
    return '/login?reason=idle&next=/business/dashboard'
  }
  return '/login?reason=idle'
}

/**
 * Global idle session guard for admin, member, and business accounts.
 * Resets on pointer/keyboard/scroll activity; signs out after 1 hour silent.
 * Also enforces 30-day Remember me expiry.
 */
export function SessionIdleTimeout() {
  const { firebaseUser, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const lastActivityRef = useRef(Date.now())
  const pathnameRef = useRef(pathname)
  const loggingOutRef = useRef(false)

  useEffect(() => {
    pathnameRef.current = pathname
  }, [pathname])

  useEffect(() => {
    if (!firebaseUser) {
      lastActivityRef.current = Date.now()
      loggingOutRef.current = false
      return
    }

    // Expire Remember-me sessions after 30 days.
    try {
      const until = Number(localStorage.getItem('pb_remember_until') || 0)
      if (until > 0 && Date.now() > until) {
        localStorage.removeItem('pb_remember_until')
        localStorage.removeItem('pb_remember_email')
        void logout().then(() => router.replace('/login?reason=session_expired'))
        return
      }
    } catch {
      /* ignore */
    }

    lastActivityRef.current = Date.now()
    loggingOutRef.current = false

    let throttleUntil = 0
    const onActivity = () => {
      const now = Date.now()
      if (now < throttleUntil) return
      throttleUntil = now + 1000
      lastActivityRef.current = now
    }

    const events: Array<keyof WindowEventMap> = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'click',
      'wheel',
    ]
    for (const event of events) {
      window.addEventListener(event, onActivity, { passive: true })
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') onActivity()
    }
    document.addEventListener('visibilitychange', onVisibility)

    const timer = window.setInterval(() => {
      if (loggingOutRef.current || !firebaseUser) return
      if (Date.now() - lastActivityRef.current < SESSION_IDLE_MS) return

      loggingOutRef.current = true
      const target = idleLogoutPath(pathnameRef.current)
      void (async () => {
        try {
          clearAdminMfaSession()
          await logout()
        } catch (error) {
          console.error('[session-idle] logout failed:', error)
        } finally {
          router.replace(target)
        }
      })()
    }, 10_000)

    return () => {
      for (const event of events) {
        window.removeEventListener(event, onActivity)
      }
      document.removeEventListener('visibilitychange', onVisibility)
      window.clearInterval(timer)
    }
  }, [firebaseUser, logout, router])

  return null
}
