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
import {
  clearAdminMfaSession,
  hasValidAdminMfaSession,
  setAdminMfaSession,
} from '@/lib/admin-mfa-session'

type LoginStep = 1 | 2 | 3

function AdminLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const [step, setStep] = useState<LoginStep>(1)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [maskedEmail, setMaskedEmail] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const autoOtpRequested = React.useRef(false)

  const returnUrl = searchParams.get('returnUrl') || '/admin'
  const safeReturnUrl = returnUrl.startsWith('/admin') ? returnUrl : '/admin'

  useEffect(() => {
    if (authLoading) return
    if (user && hasAdminAccess(user) && hasValidAdminMfaSession(user.id)) {
      router.replace(safeReturnUrl)
      return
    }
    // Already signed in as admin but MFA not done — jump to code step and resend once
    if (user && hasAdminAccess(user) && !hasValidAdminMfaSession(user.id) && step !== 3) {
      setEmail(user.email || '')
      setMaskedEmail(maskEmail(user.email || ''))
      setStep(3)
      if (!autoOtpRequested.current) {
        autoOtpRequested.current = true
        void requestOtpForCurrentUser()
      }
    }
  }, [authLoading, user, router, safeReturnUrl, step])

  function maskEmail(value: string) {
    const [local, domain] = value.split('@')
    if (!local || !domain) return value
    const visible = local.slice(0, Math.min(2, local.length))
    return `${visible}${'*'.repeat(Math.max(1, local.length - visible.length))}@${domain}`
  }

  async function requestOtpForCurrentUser() {
    try {
      const token = await auth.currentUser?.getIdToken(true)
      if (!token) return
      setLoading(true)
      setError('')
      const res = await fetch('/api/admin/login/request-otp', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json.success) {
        setError(json.error || 'Failed to send login code. Please try again.')
        return
      }
      if (json.email) setMaskedEmail(maskEmail(String(json.email)))
      setInfo('We sent a 6-digit code to your email.')
    } catch (err) {
      console.error('[admin login] request otp', err)
      setError('Failed to send login code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const completeLoginAudit = (profile: User) => {
    void recordAdminAudit({
      adminId: profile.id,
      adminEmail: profile.email || email,
      adminName:
        `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || profile.email || email,
      adminRole: formatAdminRoleLabel(profile.role || 'admin'),
      actionType: 'login',
      action: 'Admin login successful (email OTP verified)',
      entityType: 'auth',
      status: 'success',
      route: safeReturnUrl,
    })
  }

  const handleEmailContinue = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const trimmed = email.trim()
    if (!trimmed.includes('@')) {
      setError('Enter a valid admin email address.')
      return
    }
    setEmail(trimmed)
    setStep(2)
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)

    try {
      await setPersistence(auth, browserLocalPersistence)
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password)
      await credential.user.getIdToken(true)

      const snap = await getDoc(doc(db, 'users', credential.user.uid))
      if (!snap.exists()) {
        await logoutUser()
        clearAdminMfaSession()
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
        clearAdminMfaSession()
        setError('This account does not have admin access. Use the member login at /login instead.')
        setLoading(false)
        return
      }

      const token = await credential.user.getIdToken()
      const otpRes = await fetch('/api/admin/login/request-otp', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      })
      const otpJson = await otpRes.json().catch(() => ({}))
      if (!otpRes.ok || !otpJson.success) {
        await logoutUser()
        clearAdminMfaSession()
        setError(otpJson.error || 'Could not send login code. Please try again.')
        setLoading(false)
        return
      }

      setMaskedEmail(maskEmail(String(otpJson.email || email)))
      setInfo('We sent a 6-digit code to your email.')
      setOtpCode('')
      setStep(3)
      setLoading(false)
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

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const token = await auth.currentUser?.getIdToken(true)
      if (!token || !auth.currentUser) {
        setError('Session expired. Please sign in again.')
        setStep(1)
        setPassword('')
        setLoading(false)
        return
      }

      const res = await fetch('/api/admin/login/verify-otp', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: otpCode.trim() }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json.success) {
        setError(json.error || 'Invalid code. Please try again.')
        setLoading(false)
        return
      }

      const uid = auth.currentUser.uid
      setAdminMfaSession(uid)

      const snap = await getDoc(doc(db, 'users', uid))
      if (snap.exists()) {
        completeLoginAudit({ id: snap.id, ...snap.data() } as User)
      }

      router.replace(safeReturnUrl)
    } catch (err) {
      console.error('[admin login] verify otp', err)
      setError('Could not verify code. Please try again.')
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    boxSizing: 'border-box',
  }

  const buttonStyle: React.CSSProperties = {
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
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
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
            Admin sign-in · Step {step} of 3
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
          {step === 1 && (
            <form
              onSubmit={handleEmailContinue}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 500,
                    marginBottom: '8px',
                    color: '#000',
                  }}
                >
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="admin@example.com"
                  style={inputStyle}
                />
              </div>
              {error && (
                <div
                  style={{
                    padding: '12px',
                    backgroundColor: '#fee',
                    border: '1px solid #fcc',
                    borderRadius: '8px',
                    color: '#c00',
                    fontSize: '14px',
                  }}
                >
                  {error}
                </div>
              )}
              <button type="submit" style={buttonStyle}>
                Continue
              </button>
            </form>
          )}

          {step === 2 && (
            <form
              onSubmit={handlePasswordSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <p style={{ margin: 0, fontSize: '14px', color: '#555' }}>
                Signing in as <strong>{email}</strong>
              </p>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 500,
                    marginBottom: '8px',
                    color: '#000',
                  }}
                >
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  style={inputStyle}
                />
              </div>
              {error && (
                <div
                  style={{
                    padding: '12px',
                    backgroundColor: '#fee',
                    border: '1px solid #fcc',
                    borderRadius: '8px',
                    color: '#c00',
                    fontSize: '14px',
                  }}
                >
                  {error}
                </div>
              )}
              <button type="submit" disabled={loading} style={buttonStyle}>
                {loading ? 'Checking…' : 'Continue'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep(1)
                  setPassword('')
                  setError('')
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#666',
                  fontSize: '14px',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Use a different email
              </button>
            </form>
          )}

          {step === 3 && (
            <form
              onSubmit={handleOtpSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <p style={{ margin: 0, fontSize: '14px', color: '#555' }}>
                Enter the 6-digit code we emailed to{' '}
                <strong>{maskedEmail || email}</strong>.
              </p>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 500,
                    marginBottom: '8px',
                    color: '#000',
                  }}
                >
                  Login code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  autoComplete="one-time-code"
                  placeholder="000000"
                  style={{ ...inputStyle, letterSpacing: '0.35em', fontWeight: 700 }}
                />
              </div>
              {info && !error && (
                <div
                  style={{
                    padding: '12px',
                    backgroundColor: '#f5f5f5',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    color: '#333',
                    fontSize: '14px',
                  }}
                >
                  {info}
                </div>
              )}
              {error && (
                <div
                  style={{
                    padding: '12px',
                    backgroundColor: '#fee',
                    border: '1px solid #fcc',
                    borderRadius: '8px',
                    color: '#c00',
                    fontSize: '14px',
                  }}
                >
                  {error}
                </div>
              )}
              <button type="submit" disabled={loading || otpCode.length !== 6} style={buttonStyle}>
                {loading ? 'Verifying…' : 'Verify & enter admin'}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => void requestOtpForCurrentUser()}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#666',
                  fontSize: '14px',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Resend code
              </button>
              <button
                type="button"
                onClick={async () => {
                  await logoutUser()
                  clearAdminMfaSession()
                  setStep(1)
                  setPassword('')
                  setOtpCode('')
                  setError('')
                  setInfo('')
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#666',
                  fontSize: '14px',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Start over
              </button>
            </form>
          )}

          <p style={{ textAlign: 'center', fontSize: '14px', color: '#666', marginTop: '20px' }}>
            New admin with an invitation code?{' '}
            <Link
              href="/admin/setup"
              style={{ color: '#000', fontWeight: 600, textDecoration: 'underline' }}
            >
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
