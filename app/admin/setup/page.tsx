'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { collection, query, where, getDocs } from 'firebase/firestore'
import Link from 'next/link'

export default function AdminSetup() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [accessCode, setAccessCode] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAccessCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const code = accessCode.trim().toUpperCase()
      
      // Check against hardcoded codes first (for emergency access)
      const ADMIN_ACCESS_CODE = process.env.NEXT_PUBLIC_ADMIN_ACCESS_CODE || 'PB-ADMIN-2025'
      const hardcodedCodes = [ADMIN_ACCESS_CODE, 'PB-ADMIN-2025', 'ADMIN-SETUP-2025']
      
      if (hardcodedCodes.includes(code)) {
        setStep(2)
        setLoading(false)
        return
      }

      // Check Firestore for dynamically generated access codes
      const usersRef = collection(db, 'users')
      const q = query(usersRef, where('accessCode', '==', code))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        setError('Invalid access code. Please try again.')
        setLoading(false)
        return
      }

      setStep(2)
    } catch (err) {
      console.error('[v0] Access code validation error:', err)
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerificationComplete = () => {
    setStep(3)
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signInWithEmailAndPassword(auth, email, password)
      router.push('/admin')
    } catch (err: any) {
      setError('Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '600px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <img 
            src="/pb-logo-black.png" 
            alt="Passive Blessings" 
            style={{ height: '80px', marginBottom: '15px', display: 'block', margin: '0 auto 15px' }}
          />
          <p style={{ fontSize: '16px', color: '#666' }}>Admin Dashboard Setup</p>
        </div>

        {/* Progress Bars */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '40px' }}>
          <div style={{ flex: 1, height: '6px', borderRadius: '3px', backgroundColor: step >= 1 ? '#000' : '#e0e0e0', transition: 'all 0.3s' }}></div>
          <div style={{ flex: 1, height: '6px', borderRadius: '3px', backgroundColor: step >= 2 ? '#000' : '#e0e0e0', transition: 'all 0.3s' }}></div>
          <div style={{ flex: 1, height: '6px', borderRadius: '3px', backgroundColor: step >= 3 ? '#000' : '#e0e0e0', transition: 'all 0.3s' }}></div>
        </div>

        {/* Main Card */}
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          padding: '40px',
          border: '1px solid #e0e0e0'
        }}>
          {/* Step 1: Access Code */}
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
                      fontFamily: 'inherit'
                    }}
                    required
                  />
                </div>

                {error && (
                  <div style={{
                    padding: '15px',
                    backgroundColor: '#fee',
                    border: '1px solid #fcc',
                    borderRadius: '8px',
                    color: '#c00',
                    fontSize: '14px'
                  }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    backgroundColor: '#000',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#1a1a1a')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#000')}
                >
                  {loading ? 'Verifying...' : 'Continue'}
                </button>
              </form>
            </div>
          )}

          {/* Step 2: Verification */}
          {step === 2 && (
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '15px', color: '#000' }}>Step 2 of 3</h2>
              <p style={{ fontSize: '16px', color: '#666', marginBottom: '30px', lineHeight: '1.5' }}>
                Verification confirmed
              </p>

              <div style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #86efac',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '30px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  backgroundColor: '#22c55e',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <span style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>✓</span>
                </div>
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#15803d' }}>
                  Access code verified
                </span>
              </div>

              <p style={{ fontSize: '16px', color: '#666', marginBottom: '30px', lineHeight: '1.5' }}>
                Your access code has been verified. You can now proceed to sign in with your admin credentials.
              </p>

              <button
                onClick={handleVerificationComplete}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  backgroundColor: '#000',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1a1a1a')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#000')}
              >
                Next
              </button>
            </div>
          )}

          {/* Step 3: Login */}
          {step === 3 && (
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '15px', color: '#000' }}>Step 3 of 3</h2>
              <p style={{ fontSize: '16px', color: '#666', marginBottom: '30px', lineHeight: '1.5' }}>
                Sign in with your admin credentials
              </p>

              <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '10px', color: '#000' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@passiveblessings.ae"
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '16px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit'
                    }}
                    required
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
                    placeholder="••••••••"
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '16px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit'
                    }}
                    required
                  />
                </div>

                {error && (
                  <div style={{
                    padding: '15px',
                    backgroundColor: '#fee',
                    border: '1px solid #fcc',
                    borderRadius: '8px',
                    color: '#c00',
                    fontSize: '14px'
                  }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    backgroundColor: '#000',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#1a1a1a')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#000')}
                >
                  {loading ? 'Signing in...' : 'Sign In to Dashboard'}
                </button>
              </form>

              <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #e0e0e0' }}>
                <p style={{ fontSize: '14px', color: '#666' }}>
                  Return to{' '}
                  <Link href="/" style={{ color: '#000', fontWeight: '600', textDecoration: 'none', cursor: 'pointer' }}>
                    home page
                  </Link>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#999' }}>
          <p>Secure admin access • Step {step} of 3</p>
        </div>
      </div>
    </div>
  )
}
