'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { DEFAULT_LOGO_ON_LIGHT_BG } from '@/lib/logo-manager'
import { useAuth } from '@/lib/auth-context'
import { logoutUser } from '@/lib/auth'
import { hasAdminAccess } from '@/lib/roles'
import { auth, db } from '@/lib/firebase'
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { recordAdminAudit } from '@/lib/admin-audit'
import { formatAdminRoleLabel } from '@/lib/audit-log-shared'
import type { User } from '@/lib/types'

function AdminLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const returnUrl = searchParams.get('returnUrl') || '/admin'
  const safeReturnUrl = returnUrl.startsWith('/admin') ? returnUrl : '/admin'

  useEffect(() => {
    if (!authLoading && user && hasAdminAccess(user)) {
      router.replace(safeReturnUrl)
    }
  }, [authLoading, user, router, safeReturnUrl])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Do NOT use loginUser() here — it auto-creates a member profile when missing,
      // which permanently blocks invited admins who still need /admin/setup redeem.
      await setPersistence(auth, browserLocalPersistence)
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password)
      await credential.user.getIdToken(true)

      const snap = await getDoc(doc(db, 'users', credential.user.uid))
      if (!snap.exists()) {
        await logoutUser()
        setError(
          'Your login works, but your admin profile was never created. Open Admin Setup, enter your access code again, and finish with this same email and password.'
        )
        setLoading(false)
        return
      }

      const profile = { id: snap.id, ...snap.data() } as User

      if (!hasAdminAccess(profile)) {
        void recordAdminAudit({
          adminId: profile.id || 'unknown',
          adminEmail: profile.email || email,
          adminName: `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || email,
          adminRole: formatAdminRoleLabel(profile.role || 'unknown'),
          actionType: 'login_failed',
          action: 'Admin login denied — not an admin account',
          entityType: 'auth',
          status: 'failed',
          failureReason: 'Account lacks admin access',
        })
        await logoutUser()
        setError('This account does not have admin access. Use the member login at /login instead.')
        setLoading(false)
        return
      }

      if (!auth.currentUser) {
        setError('Session could not be established. Please try again.')
        setLoading(false)
        return
      }

      void recordAdminAudit({
        adminId: profile.id,
        adminEmail: profile.email || email,
        adminName: `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || profile.email || email,
        adminRole: formatAdminRoleLabel(profile.role || 'admin'),
        actionType: 'login',
        action: 'Admin login successful',
        entityType: 'auth',
        status: 'success',
        route: safeReturnUrl,
      })

      router.replace(safeReturnUrl)
    } catch (err) {
      console.error('[v0] Admin login error:', err)
      const message =
        err && typeof err === 'object' && 'code' in err
          ? String((err as { code: string }).code).includes('credential') ||
            String((err as { code: string }).code).includes('password') ||
            String((err as { code: string }).code).includes('user-not-found')
            ? 'Invalid email or password.'
            : err instanceof Error
              ? err.message
              : 'An unexpected error occurred. Please try again.'
          : 'An unexpected error occurred. Please try again.'
      void recordAdminAudit({
        adminId: 'unauthenticated',
        adminEmail: email.trim().toLowerCase(),
        adminName: email.trim(),
        adminRole: 'unknown',
        actionType: 'login_failed',
        action: 'Admin login error',
        entityType: 'auth',
        status: 'failed',
        failureReason: message,
      })
      setError(message)
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              minHeight: 140,
              marginBottom: 8,
            }}
          >
            <Link
              href="/"
              style={{ display: 'inline-flex', width: '100%', maxWidth: 440, justifyContent: 'center' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={DEFAULT_LOGO_ON_LIGHT_BG}
                alt="Passive Blessings"
                style={{
                  display: 'block',
                  width: '100%',
                  height: 'auto',
                  maxHeight: 160,
                  objectFit: 'contain',
                  backgroundColor: 'transparent',
                }}
                decoding="async"
              />
            </Link>
          </div>
          <p style={{ fontSize: '15px', color: '#666', margin: 0 }}>
            Sign in with your existing admin credentials
          </p>
        </div>

        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            padding: 'clamp(20px, 5vw, 32px)',
            border: '1px solid #e0e0e0',
          }}
        >
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#000' }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="admin@example.com"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '16px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#000' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '16px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {error && (
              <div style={{ padding: '12px', backgroundColor: '#fee', border: '1px solid #fcc', borderRadius: '8px', color: '#c00', fontSize: '14px' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                minHeight: '44px',
                fontSize: '16px',
                fontWeight: 600,
                backgroundColor: '#000',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Signing in…' : 'Sign In to Admin'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '14px', color: '#666', marginTop: '20px' }}>
            New admin with an invitation code?{' '}
            <Link href="/admin/setup" style={{ color: '#000', fontWeight: 600, textDecoration: 'underline' }}>
              Complete setup
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">Loading…</p>
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  )
}
