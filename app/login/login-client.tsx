'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { loginUser } from '@/lib/auth'
import { verifyAccessCode } from '@/lib/access-code'
import { getCommunityStats, formatDonations, CommunityStats } from '@/lib/community-stats'
import { Logo } from '@/components/logo'
import { AlertCircle } from 'lucide-react'
import { logActivity } from '@/lib/activity-logger'

export default function LoginPage() {
  const router = useRouter()
  
  // Login flow state
  const [loginType, setLoginType] = React.useState<'regular' | 'admin' | null>(null)
  const [accessCode, setAccessCode] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [rememberMe, setRememberMe] = React.useState(false)
  const [stats, setStats] = React.useState<CommunityStats>({ totalMembers: 0, volunteerHours: 0, businessPartners: 0, totalDonations: 0 })
  const [statsLoading, setStatsLoading] = React.useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getCommunityStats()
        setStats(data)
      } catch (err) {
        console.error('[v0] Error fetching stats:', err)
      } finally {
        setStatsLoading(false)
      }
    }
    
    // Log login page visit
    logActivity('guest', 'guest@passiveblessings.com', 'LOGIN_PAGE_VISIT', 'Visited login page', { 
      timestamp: new Date().toISOString()
    })
    
    fetchStats()
  }, [])

  // Verify access code for admin login
  const handleVerifyAccessCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    logActivity('guest', 'guest@passiveblessings.com', 'OTHER', 'Attempting admin access code verification', { 
      timestamp: new Date().toISOString()
    })

    const result = await verifyAccessCode(accessCode)

    if (!result.valid) {
      const errorMsg = result.error || 'Invalid access code'
      setError(errorMsg)
      logActivity('guest', 'guest@passiveblessings.com', 'OTHER', 'Admin access code verification failed', { 
        error: errorMsg,
        timestamp: new Date().toISOString()
      })
      setLoading(false)
      return
    }

    // Access code is valid, move to email/password step
    logActivity('guest', 'guest@passiveblessings.com', 'OTHER', 'Admin access code verified successfully', { 
      timestamp: new Date().toISOString()
    })
    setLoading(false)
    setLoginType('admin-verified')
  }

  // Handle regular user login
  const handleRegularLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    logActivity('guest', email, 'OTHER', 'Attempting sign in', { 
      loginType: 'regular',
      timestamp: new Date().toISOString()
    })

    const { user, error: loginError } = await loginUser(email, password)

    if (loginError) {
      setError(loginError)
      logActivity('guest', email, 'SIGNIN_FAILED', 'Sign in failed', { 
        error: loginError,
        reason: 'Authentication error',
        timestamp: new Date().toISOString()
      })
      setLoading(false)
      return
    }

    if (user) {
      // Log successful signin
      logActivity(user.id, user.email, 'SIGNIN', 'Successfully signed in', { 
        userId: user.id,
        userRole: user.role,
        rememberMe,
        timestamp: new Date().toISOString()
      })

      if (user.role === 'admin') {
        // Shouldn't reach here for admins - they should use admin login
        router.push('/admin')
      } else if (user.role === 'business') {
        router.push('/business')
      } else {
        router.push('/dashboard')
      }
    }
  }

  // Handle admin login (with verified access code)
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    logActivity('guest', email, 'OTHER', 'Attempting admin sign in', { 
      loginType: 'admin',
      timestamp: new Date().toISOString()
    })

    const { user, error: loginError } = await loginUser(email, password)

    if (loginError) {
      setError(loginError)
      logActivity('guest', email, 'SIGNIN_FAILED', 'Admin sign in failed', { 
        error: loginError,
        reason: 'Authentication error',
        loginType: 'admin',
        timestamp: new Date().toISOString()
      })
      setLoading(false)
      return
    }

    if (user && user.role === 'admin') {
      logActivity(user.id, user.email, 'SIGNIN', 'Successfully signed in as admin', { 
        userId: user.id,
        userRole: 'admin',
        timestamp: new Date().toISOString()
      })
      router.push('/admin')
    } else {
      setError('This email is not associated with an admin account')
      setLoading(false)
    }
  }

  return (
    <div style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff' }}>
      {/* Header Navigation */}
      <div style={{ width: '100%', padding: '1rem', borderBottom: '1px solid #e4e1da' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: '1rem', paddingRight: '1rem' }}>
          <div style={{ height: '32px' }}>
            <Logo size="sm" href="/" />
          </div>
          <Link href="/signup" style={{ fontSize: '1rem', fontWeight: 500, color: '#111111', textDecoration: 'none' }}>
            Create Account
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', width: '100%' }}>
        <div style={{ width: '100%', maxWidth: '448px' }}>
          {/* Heading */}
          <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <h1 style={{ fontSize: 'clamp(1.875rem, 5vw, 3rem)', fontWeight: 700, marginBottom: '0.75rem', fontFamily: 'Playfair Display', lineHeight: 1.2, color: '#111111' }}>
              Welcome Back
            </h1>
            <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.125rem)', color: '#888888', lineHeight: 1.6 }}>
              Sign in to continue
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div style={{ padding: '1rem', marginBottom: '1.5rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <AlertCircle style={{ width: '1.25rem', height: '1.25rem', color: '#dc2626', flexShrink: 0, marginTop: '0.125rem' }} />
              <p style={{ fontSize: '1rem', color: '#991b1b' }}>{error}</p>
            </div>
          )}

          {/* Step 0: Choose Login Type */}
          {loginType === null && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button
                type="button"
                onClick={() => {
                  setLoginType('regular')
                  setError('')
                  setEmail('')
                  setPassword('')
                }}
                style={{
                  padding: '1.25rem',
                  backgroundColor: '#f7f6f2',
                  border: '2px solid #e4e1da',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#111111'
                  e.currentTarget.style.backgroundColor = '#ffffff'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e4e1da'
                  e.currentTarget.style.backgroundColor = '#f7f6f2'
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '1rem', color: '#111111', marginBottom: '0.25rem' }}>
                  Community Member
                </div>
                <div style={{ fontSize: '0.875rem', color: '#888888' }}>
                  Join as a volunteer or donor
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLoginType('admin')
                  setError('')
                  setAccessCode('')
                  setEmail('')
                  setPassword('')
                }}
                style={{
                  padding: '1.25rem',
                  backgroundColor: '#f7f6f2',
                  border: '2px solid #e4e1da',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#111111'
                  e.currentTarget.style.backgroundColor = '#ffffff'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e4e1da'
                  e.currentTarget.style.backgroundColor = '#f7f6f2'
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '1rem', color: '#111111', marginBottom: '0.25rem' }}>
                  Admin Portal
                </div>
                <div style={{ fontSize: '0.875rem', color: '#888888' }}>
                  Access management tools
                </div>
              </button>
            </div>
          )}

          {/* Step 1: Regular User Login */}
          {loginType === 'regular' && (
            <>
              <form onSubmit={handleRegularLogin} style={{ marginBottom: '1.5rem' }}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label htmlFor="email" style={{ display: 'block', fontSize: '1rem', fontWeight: 500, marginBottom: '0.5rem', color: '#111111' }}>
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    style={{ width: '100%', padding: '0.875rem 1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem', backgroundColor: '#ffffff', color: '#111111', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label htmlFor="password" style={{ display: 'block', fontSize: '1rem', fontWeight: 500, marginBottom: '0.5rem', color: '#111111' }}>
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{ width: '100%', padding: '0.875rem 1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem', backgroundColor: '#ffffff', color: '#111111', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', color: '#111111' }}>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      style={{ width: '1rem', height: '1rem', cursor: 'pointer' }}
                    />
                    Remember me
                  </label>
                  <Link href="/forgot-password" style={{ fontSize: '0.875rem', color: '#111111', textDecoration: 'underline', fontWeight: 500 }}>
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{ width: '100%', padding: '1rem', backgroundColor: loading ? '#cccccc' : '#111111', color: '#ffffff', border: 'none', borderRadius: '0.5rem', fontWeight: 600, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '1rem' }}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLoginType(null)
                    setError('')
                  }}
                  style={{ width: '100%', padding: '0.75rem', backgroundColor: 'transparent', color: '#111111', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontWeight: 500, fontSize: '0.875rem', cursor: 'pointer' }}
                >
                  Back
                </button>
              </form>
            </>
          )}

          {/* Step 1: Admin Access Code */}
          {loginType === 'admin' && (
            <>
              <form onSubmit={handleVerifyAccessCode} style={{ marginBottom: '1.5rem' }}>
                <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f0f9ff', border: '1px solid #bfdbfe', borderRadius: '0.5rem' }}>
                  <p style={{ fontSize: '0.875rem', color: '#1e40af', margin: 0 }}>
                    Enter your admin access code to proceed
                  </p>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label htmlFor="accessCode" style={{ display: 'block', fontSize: '1rem', fontWeight: 500, marginBottom: '0.5rem', color: '#111111' }}>
                    Access Code
                  </label>
                  <input
                    id="accessCode"
                    type="text"
                    required
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                    placeholder="Enter your access code"
                    style={{ width: '100%', padding: '0.875rem 1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem', backgroundColor: '#ffffff', color: '#111111', boxSizing: 'border-box', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{ width: '100%', padding: '1rem', backgroundColor: loading ? '#cccccc' : '#111111', color: '#ffffff', border: 'none', borderRadius: '0.5rem', fontWeight: 600, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '1rem' }}
                >
                  {loading ? 'Verifying...' : 'Verify Access Code'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLoginType(null)
                    setError('')
                    setAccessCode('')
                  }}
                  style={{ width: '100%', padding: '0.75rem', backgroundColor: 'transparent', color: '#111111', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontWeight: 500, fontSize: '0.875rem', cursor: 'pointer' }}
                >
                  Back
                </button>
              </form>
            </>
          )}

          {/* Step 2: Admin Email & Password */}
          {loginType === 'admin-verified' && (
            <>
              <form onSubmit={handleAdminLogin} style={{ marginBottom: '1.5rem' }}>
                <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '0.5rem' }}>
                  <p style={{ fontSize: '0.875rem', color: '#166534', margin: 0 }}>
                    Access code verified. Enter your credentials to continue.
                  </p>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label htmlFor="admin-email" style={{ display: 'block', fontSize: '1rem', fontWeight: 500, marginBottom: '0.5rem', color: '#111111' }}>
                    Email Address
                  </label>
                  <input
                    id="admin-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    style={{ width: '100%', padding: '0.875rem 1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem', backgroundColor: '#ffffff', color: '#111111', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label htmlFor="admin-password" style={{ display: 'block', fontSize: '1rem', fontWeight: 500, marginBottom: '0.5rem', color: '#111111' }}>
                    Password
                  </label>
                  <input
                    id="admin-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{ width: '100%', padding: '0.875rem 1rem', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontSize: '1rem', backgroundColor: '#ffffff', color: '#111111', boxSizing: 'border-box' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{ width: '100%', padding: '1rem', backgroundColor: loading ? '#cccccc' : '#111111', color: '#ffffff', border: 'none', borderRadius: '0.5rem', fontWeight: 600, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '1rem' }}
                >
                  {loading ? 'Signing in...' : 'Access Admin Portal'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLoginType('admin')
                    setError('')
                    setEmail('')
                    setPassword('')
                    setAccessCode('')
                  }}
                  style={{ width: '100%', padding: '0.75rem', backgroundColor: 'transparent', color: '#111111', border: '1px solid #e4e1da', borderRadius: '0.5rem', fontWeight: 500, fontSize: '0.875rem', cursor: 'pointer' }}
                >
                  Back
                </button>
              </form>
            </>
          )}

          {/* Divider */}
          {loginType === null && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#e4e1da' }}></div>
                <span style={{ fontSize: '0.875rem', color: '#888888' }}>or</span>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#e4e1da' }}></div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '1rem', color: '#111111', marginBottom: '1rem' }}>
                  Don&apos;t have an account?{' '}
                  <Link href="/signup" style={{ fontWeight: 600, color: '#111111', textDecoration: 'underline' }}>
                    Sign up now
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
