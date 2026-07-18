'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/firebase'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import Link from 'next/link'
import { SiteLogo } from '@/components/site-logo'
import { useAuth } from '@/lib/auth-context'
import { hasAdminAccess } from '@/lib/roles'

interface InviteData {
  id: string
  code: string
  adminEmail: string
  adminName: string
  adminRole: string
  permissions: string[]
  recovery?: boolean
}

const INVITE_STORAGE_KEY = 'pb_admin_invite_setup'

function loadStoredInvite(): InviteData | null {
  try {
    const raw = sessionStorage.getItem(INVITE_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as InviteData
  } catch {
    return null
  }
}

function storeInvite(data: InviteData | null) {
  try {
    if (!data) sessionStorage.removeItem(INVITE_STORAGE_KEY)
    else sessionStorage.setItem(INVITE_STORAGE_KEY, JSON.stringify(data))
  } catch {
    // ignore
  }
}

export default function AdminSetup() {
  const router = useRouter()
  const { user, loading: authLoading, refreshUser } = useAuth()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [accessCode, setAccessCode] = useState('')
  const [inviteData, setInviteData] = useState<InviteData | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isEmergencyCode, setIsEmergencyCode] = useState(false)

  useEffect(() => {
    const stored = loadStoredInvite()
    if (stored?.id) {
      setInviteData(stored)
      setAccessCode(stored.code || '')
      setEmail(stored.adminEmail || '')
      setIsEmergencyCode(false)
      setStep(2)
    }
  }, [])

  useEffect(() => {
    if (!authLoading && user && hasAdminAccess(user)) {
      storeInvite(null)
      router.replace('/admin')
    }
  }, [authLoading, user, router])

  const adminLoginHref = `/admin/login?returnUrl=${encodeURIComponent('/admin')}`

  const handleAccessCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!accessCode.trim()) {
      setError('Access code is required')
      return
    }

    setLoading(true)

    try {
      const code = accessCode.trim().toUpperCase()
      const ADMIN_ACCESS_CODE = process.env.NEXT_PUBLIC_ADMIN_ACCESS_CODE || 'PB-ADMIN-2025'
      const hardcodedCodes = [ADMIN_ACCESS_CODE, 'PB-ADMIN-2025', 'ADMIN-SETUP-2025'].map((c) =>
        String(c).toUpperCase()
      )

      if (hardcodedCodes.includes(code)) {
        setIsEmergencyCode(true)
        setInviteData(null)
        storeInvite(null)
        setStep(2)
        return
      }

      const res = await fetch('/api/admin/access-codes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const json = await res.json()

      if (!res.ok || !json.success) {
        setError(json.error || 'Invalid access code. Please try again.')
        return
      }

      const data: InviteData = {
        id: json.data.id,
        code: json.data.code || code,
        adminEmail: json.data.adminEmail || '',
        adminName: json.data.adminName || '',
        adminRole: json.data.adminRole || 'admin',
        permissions: Array.isArray(json.data.permissions)
          ? json.data.permissions
          : ['full_access'],
        recovery: Boolean(json.data.recovery),
      }

      setIsEmergencyCode(false)
      setInviteData(data)
      storeInvite(data)
      setEmail(data.adminEmail)
      setStep(2)
      if (data.recovery) {
        setError('')
      }
    } catch (err) {
      console.error('[v0] Access code validation error:', err)
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const finalizeInviteProfile = async (
    firebaseUser: { uid: string; getIdToken: (force?: boolean) => Promise<string> },
    accountEmail: string,
    role: string,
    permissions: string[],
    firstName: string,
    lastName: string
  ) => {
    if (!inviteData?.id) {
      throw new Error('Missing invitation data. Go back to Step 1 and re-enter your access code.')
    }

    const token = await firebaseUser.getIdToken(true)
    const redeemRes = await fetch('/api/admin/access-codes/redeem', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        codeId: inviteData.id,
        code: inviteData.code || accessCode.trim().toUpperCase(),
        email: accountEmail,
        userId: firebaseUser.uid,
        firstName,
        lastName,
        role,
        permissions,
      }),
    })

    let redeemJson: { success?: boolean; error?: string } = {}
    try {
      redeemJson = await redeemRes.json()
    } catch {
      throw new Error('Server returned an invalid response while creating your admin profile.')
    }

    if (!redeemRes.ok || !redeemJson.success) {
      throw new Error(redeemJson.error || 'Failed to finalize admin profile')
    }
  }

  const finalizeEmergencyProfile = async (
    firebaseUser: { uid: string; getIdToken: (force?: boolean) => Promise<string> },
    accountEmail: string,
    role: string,
    permissions: string[],
    firstName: string,
    lastName: string
  ) => {
    const token = await firebaseUser.getIdToken(true)
    const res = await fetch('/api/admin/access-codes/bootstrap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        bootstrapKey: accessCode.trim().toUpperCase(),
        email: accountEmail,
        role,
        permissions,
        firstName,
        lastName,
      }),
    })
    const json = await res.json()
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to bootstrap admin profile')
    }
  }

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const accountEmail = (isEmergencyCode ? email : inviteData?.adminEmail || email)
      .trim()
      .toLowerCase()

    if (!accountEmail) {
      setError('Email is required')
      return
    }
    if (!password.trim()) {
      setError('Password is required')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (!isEmergencyCode && !inviteData?.id) {
      setError('Access code invitation is missing. Go back to Step 1.')
      return
    }

    setLoading(true)

    try {
      const role = isEmergencyCode
        ? accountEmail === 'roosevelt@myflynai.com'
          ? 'super_admin'
          : 'admin'
        : inviteData?.adminRole || 'admin'

      const permissions = isEmergencyCode
        ? ['full_access']
        : inviteData?.permissions || ['full_access']

      const nameParts = (inviteData?.adminName || 'Admin User').trim().split(/\s+/)
      const firstName = nameParts[0] || 'Admin'
      const lastName = nameParts.slice(1).join(' ') || 'User'

      // Prefer sign-in first: invited users often already have Auth from a failed earlier attempt
      let firebaseUser = auth.currentUser
      const authCode = (err: unknown) =>
        err && typeof err === 'object' && 'code' in err ? String((err as { code: string }).code) : ''

      if (firebaseUser?.email?.toLowerCase() === accountEmail) {
        // Already signed in as this invitee
      } else {
        try {
          const signedIn = await signInWithEmailAndPassword(auth, accountEmail, password)
          firebaseUser = signedIn.user
        } catch (signInErr: unknown) {
          const signInCode = authCode(signInErr)
          if (
            signInCode === 'auth/user-not-found' ||
            signInCode === 'auth/invalid-credential' ||
            signInCode === 'auth/wrong-password' ||
            signInCode === 'auth/invalid-login-credentials'
          ) {
            // If credentials invalid, try create (new account) — unless email clearly exists
            try {
              const created = await createUserWithEmailAndPassword(auth, accountEmail, password)
              firebaseUser = created.user
            } catch (createErr: unknown) {
              const createCode = authCode(createErr)
              if (createCode === 'auth/email-already-in-use') {
                // Auth may already exist from an early password-reset; sync password via invite
                if (!inviteData?.id) {
                  throw new Error(
                    'This email already has a password account. Enter the same password you used the first time, or ask a super admin to send a password reset from Admin → Management.'
                  )
                }
                const claimRes = await fetch('/api/admin/access-codes/claim-password', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    codeId: inviteData.id,
                    code: inviteData.code || accessCode.trim().toUpperCase(),
                    email: accountEmail,
                    password,
                  }),
                })
                const claimJson = await claimRes.json().catch(() => ({}))
                if (!claimRes.ok || !claimJson.success) {
                  throw new Error(
                    (claimJson as { error?: string }).error ||
                      'This email already has an account. Ask a super admin to send a password reset from Admin → Management.'
                  )
                }
                const signedIn = await signInWithEmailAndPassword(auth, accountEmail, password)
                firebaseUser = signedIn.user
              } else if (
                signInCode === 'auth/wrong-password' ||
                signInCode === 'auth/invalid-credential' ||
                signInCode === 'auth/invalid-login-credentials'
              ) {
                throw new Error(
                  'This email already has an account, but that password is incorrect. Use the password from your first setup attempt, or ask a super admin to send a password reset from Admin → Management.'
                )
              } else {
                throw createErr
              }
          } else {
            throw signInErr
          }
        }
      }

      if (!firebaseUser) {
        throw new Error('Could not sign in or create the account. Please try again.')
      }

      if (isEmergencyCode) {
        await finalizeEmergencyProfile(
          firebaseUser,
          accountEmail,
          role,
          permissions,
          firstName,
          lastName
        )
      } else {
        await finalizeInviteProfile(
          firebaseUser,
          accountEmail,
          role,
          permissions,
          firstName,
          lastName
        )
      }

      await refreshUser()
      storeInvite(null)
      setStep(3)
      setTimeout(() => router.push('/admin'), 1500)
    } catch (err: unknown) {
      console.error('[v0] Account creation error:', err)
      const code =
        err && typeof err === 'object' && 'code' in err ? String((err as { code: string }).code) : ''
      if (
        code === 'auth/wrong-password' ||
        code === 'auth/invalid-credential' ||
        code === 'auth/invalid-login-credentials'
      ) {
        setError(
          'This email already has an account, but that password is incorrect. Use the password from your first setup attempt, or ask a super admin to send a password reset from Admin → Management.'
        )
      } else if (err instanceof Error && err.message) {
        setError(err.message)
      } else {
        setError('Failed to finish admin setup. Please try again.')
      }
    } finally {
      setLoading(false)
    }
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
      <div style={{ width: '100%', maxWidth: '600px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
            <SiteLogo background="light" variant="primary" href="/" linked />
          </div>
          <p style={{ fontSize: '16px', color: '#666' }}>Admin Dashboard Setup</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '40px' }}>
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              style={{
                flex: 1,
                height: '6px',
                borderRadius: '3px',
                backgroundColor: step >= n ? '#000' : '#e0e0e0',
                transition: 'all 0.3s',
              }}
            />
          ))}
        </div>

        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            padding: 'clamp(20px, 5vw, 40px)',
            border: '1px solid #e0e0e0',
            boxSizing: 'border-box',
          }}
        >
          {step === 1 && (
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '15px', color: '#000' }}>
                Step 1 of 3
              </h2>
              <p style={{ fontSize: '16px', color: '#666', marginBottom: '30px', lineHeight: '1.5' }}>
                Enter the 6-digit access code from your invitation email
              </p>

              <form
                onSubmit={handleAccessCodeSubmit}
                style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      marginBottom: '10px',
                      color: '#000',
                    }}
                  >
                    6-digit Access Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value.replace(/\s+/g, '').toUpperCase())}
                    placeholder="123456"
                    maxLength={16}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '20px',
                      letterSpacing: '0.2em',
                      fontFamily: 'ui-monospace, monospace',
                      boxSizing: 'border-box',
                      textAlign: 'center',
                    }}
                    required
                  />
                </div>

                {error && (
                  <div
                    style={{
                      padding: '15px',
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

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '14px 12px',
                    minHeight: '44px',
                    fontSize: '16px',
                    fontWeight: '600',
                    backgroundColor: '#000',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  {loading ? 'Verifying...' : 'Continue'}
                </button>

                <p style={{ textAlign: 'center', fontSize: '14px', color: '#666', marginTop: '4px' }}>
                  Already have an admin account?{' '}
                  <Link
                    href={adminLoginHref}
                    style={{ color: '#000', fontWeight: 600, textDecoration: 'underline' }}
                  >
                    Sign in here
                  </Link>
                </p>
              </form>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '15px', color: '#000' }}>
                Step 2 of 3
              </h2>
              <p style={{ fontSize: '16px', color: '#666', marginBottom: '30px', lineHeight: '1.5' }}>
                {inviteData?.recovery
                  ? 'Your login already exists from an earlier attempt. Enter the same password and finish setup — we will create your admin profile.'
                  : 'Create your admin account password. If you already tried once, use the same password and continue.'}
              </p>

              <form
                onSubmit={handleCreateAccount}
                style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      marginBottom: '10px',
                      color: '#000',
                    }}
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    readOnly={!isEmergencyCode}
                    placeholder="admin@passiveblessings.ae"
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '16px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                      backgroundColor: isEmergencyCode ? '#fff' : '#f5f5f5',
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      marginBottom: '10px',
                      color: '#000',
                    }}
                  >
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '16px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      marginBottom: '10px',
                      color: '#000',
                    }}
                  >
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '16px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>

                {error && (
                  <div
                    style={{
                      padding: '15px',
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

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '14px 12px',
                    minHeight: '44px',
                    fontSize: '16px',
                    fontWeight: '600',
                    backgroundColor: '#000',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  {loading
                    ? 'Finishing setup…'
                    : inviteData?.recovery
                      ? 'Finish setup'
                      : 'Create account & finish setup'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep(1)
                    setError('')
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '14px',
                    backgroundColor: '#000',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    minHeight: '44px',
                  }}
                >
                  Back to access code
                </button>
              </form>
            </div>
          )}

          {step === 3 && (
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '15px', color: '#000' }}>
                Step 3 of 3
              </h2>
              <p style={{ fontSize: '16px', color: '#666', marginBottom: '20px', lineHeight: '1.5' }}>
                Your admin account is ready. Redirecting to the dashboard…
              </p>
              <Link href="/admin" style={{ color: '#000', fontWeight: '600', textDecoration: 'none' }}>
                Go to dashboard now
              </Link>
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#999' }}>
          <p>Secure admin access • Step {step} of 3</p>
        </div>
      </div>
    </div>
  )
}
