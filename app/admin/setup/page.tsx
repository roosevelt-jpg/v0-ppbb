'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { verifyAdminAccessCode } from '@/lib/admin-access-code-generator'
import Link from 'next/link'
import { SiteLogo } from '@/components/site-logo'

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
    
    // Manual validation
    if (!accessCode.trim()) {
      setError('Access code is required')
      return
    }

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
      const result = await verifyAdminAccessCode(code)
      
      if (!result.valid) {
        setError(result.error || 'Invalid access code. Please try again.')
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
    
    // Manual validation
    if (!email.trim()) {
      setError('Email is required')
      return
    }
    if (!password.trim()) {
      setError('Password is required')
      return
    }

    setLoading(true)

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const firebaseUser = userCredential.user
      console.log('[v0] Firebase login successful:', firebaseUser.uid)

      // Check if user has admin role
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
      console.log('[v0] User doc exists:', userDoc.exists())
      
      if (!userDoc.exists()) {
        // Create user profile if it doesn't exist
        // Determine role - super admin for roosevelt@myflynai.com, admin for others
        const role = email === 'roosevelt@myflynai.com' ? 'super_admin' : 'admin'
        
        const adminProfile = {
          id: firebaseUser.uid,
          email: firebaseUser.email,
          firstName: email === 'roosevelt@myflynai.com' ? 'Roosevelt' : 'Admin',
          lastName: 'User',
          role: role,
          permissions: role === 'super_admin' ? [
            'admin.create_admin',
            'admin.manage_users',
            'admin.manage_permissions',
            'admin.view_all',
            'admin.create_access_codes',
            'admin.manage_access_codes',
            'admin.manage_roles',
            'admin.delete_admin'
          ] : [],
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        console.log('[v0] Creating admin profile with role:', role)
        await setDoc(doc(db, 'users', firebaseUser.uid), adminProfile)
        console.log('[v0] Admin profile created')
        router.push('/admin')
        return
      }

      const userData = userDoc.data()
      console.log('[v0] User data:', userData)

      // If user doesn't have admin role, set it
      if (userData.role !== 'admin' && userData.role !== 'super_admin') {
        const role = email === 'roosevelt@myflynai.com' ? 'super_admin' : 'admin'
        console.log('[v0] Setting admin role:', role)
        await setDoc(
          doc(db, 'users', firebaseUser.uid),
          { role: role, updatedAt: new Date() },
          { merge: true }
        )
      }

      console.log('[v0] Login successful, redirecting to /admin')
      router.push('/admin')
    } catch (err: any) {
      console.error('[v0] Login error:', err)
      console.error('[v0] Error code:', err.code)
      console.error('[v0] Error message:', err.message)
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
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
            <SiteLogo background="light" variant="primary" href="/" linked />
          </div>
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
          padding: 'clamp(20px, 5vw, 40px)',
          border: '1px solid #e0e0e0',
          boxSizing: 'border-box',
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
