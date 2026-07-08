'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import Link from 'next/link'
import { SiteLogo } from '@/components/site-logo'

interface InviteData {
  id: string
  adminEmail: string
  adminName: string
  adminRole: string
  permissions: string[]
}

export default function AdminSetup() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [accessCode, setAccessCode] = useState('')
  const [inviteData, setInviteData] = useState<InviteData | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isEmergencyCode, setIsEmergencyCode] = useState(false)

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
      const hardcodedCodes = [ADMIN_ACCESS_CODE, 'PB-ADMIN-2025', 'ADMIN-SETUP-2025']

      if (hardcodedCodes.includes(code)) {
        setIsEmergencyCode(true)
        setInviteData(null)
        setStep(2)
        setLoading(false)
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
        setLoading(false)
        return
      }

      setIsEmergencyCode(false)
      setInviteData(json.data)
      setEmail(json.data.adminEmail || '')
      setStep(2)
    } catch (err) {
      console.error('[v0] Access code validation error:', err)
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const accountEmail = (isEmergencyCode ? email : inviteData?.adminEmail || email).trim().toLowerCase()

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

    setLoading(true)

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, accountEmail, password)
      const firebaseUser = userCredential.user

      const role = isEmergencyCode
        ? accountEmail === 'roosevelt@myflynai.com'
          ? 'super_admin'
          : 'admin'
        : inviteData?.adminRole || 'admin'

      const permissions = isEmergencyCode
        ? role === 'super_admin'
          ? ['full_access']
          : ['full_access']
        : inviteData?.permissions || ['full_access']

      const nameParts = (inviteData?.adminName || 'Admin User').trim().split(/\s+/)
      const firstName = nameParts[0] || 'Admin'
      const lastName = nameParts.slice(1).join(' ') || 'User'

      await setDoc(doc(db, 'users', firebaseUser.uid), {
        id: firebaseUser.uid,
        email: accountEmail,
        firstName,
        lastName,
        role,
        permissions,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      if (inviteData?.id) {
        await fetch('/api/admin/access-codes/redeem', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            codeId: inviteData.id,
            email: accountEmail,
            userId: firebaseUser.uid,
          }),
        })
      }

      setStep(3)
      setTimeout(() => router.push('/admin'), 2000)
    } catch (err: unknown) {
      console.error('[v0] Account creation error:', err)
      const code = err && typeof err === 'object' && 'code' in err ? String((err as { code: string }).code) : ''
      if (code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Sign in instead.')
      } else {
        setError('Failed to create account. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
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
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '15px', color: '#000' }}>Step 1 of 3</h2>
              <p style={{ fontSize: '16px', color: '#666', marginBottom: '30px', lineHeight: '1.5' }}>
                Enter your admin access code to continue
              </p>

              <form onSubmit={handleAccessCodeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '10px', color: '#000' }}>
                    Access Code
                  </label>
                  <input
                    type="password"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    placeholder="Enter access code"
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
                  <div style={{ padding: '15px', backgroundColor: '#fee', border: '1px solid #fcc', borderRadius: '8px', color: '#c00', fontSize: '14px' }}>
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
              </form>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '15px', color: '#000' }}>Step 2 of 3</h2>
              <p style={{ fontSize: '16px', color: '#666', marginBottom: '30px', lineHeight: '1.5' }}>
                Create your admin account password
              </p>

              <form onSubmit={handleCreateAccount} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '10px', color: '#000' }}>
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
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '10px', color: '#000' }}>
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
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '10px', color: '#000' }}>
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
                  <div style={{ padding: '15px', backgroundColor: '#fee', border: '1px solid #fcc', borderRadius: '8px', color: '#c00', fontSize: '14px' }}>
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
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </form>
            </div>
          )}

          {step === 3 && (
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '15px', color: '#000' }}>Step 3 of 3</h2>
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
