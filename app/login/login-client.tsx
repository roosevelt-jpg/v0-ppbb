'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { loginUser } from '@/lib/auth'
import { verifyAccessCode } from '@/lib/access-code'
import { getCommunityStats, formatDonations, CommunityStats } from '@/lib/community-stats'
import { Logo } from '@/components/logo'
import { AlertCircle, Lock, Mail, Check } from 'lucide-react'
import { logActivity } from '@/lib/activity-logger'

export default function LoginPage() {
  const router = useRouter()
  
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
    
    logActivity('guest', 'guest@passiveblessings.com', 'LOGIN_PAGE_VISIT', 'Visited login page', { 
      timestamp: new Date().toISOString()
    })
    
    fetchStats()
  }, [])

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

    logActivity('guest', 'guest@passiveblessings.com', 'OTHER', 'Admin access code verified successfully', { 
      timestamp: new Date().toISOString()
    })
    setLoading(false)
    setLoginType('admin-verified')
  }

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
      logActivity(user.id, user.email, 'SIGNIN', 'Successfully signed in', { 
        userId: user.id,
        userRole: user.role,
        rememberMe,
        timestamp: new Date().toISOString()
      })

      if (user.role === 'admin') {
        router.push('/admin')
      } else if (user.role === 'business') {
        router.push('/business')
      } else {
        router.push('/dashboard')
      }
    }
  }

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
    <div className="min-h-screen w-full flex flex-col bg-neutral-100">
      {/* Header Navigation */}
      <div className="w-full border-b border-neutral-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="h-8">
            <Logo size="sm" href="/" />
          </div>
          <div className="hidden sm:flex items-center gap-4">
            <Link 
              href="/" 
              className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              About us
            </Link>
            <Link 
              href="/" 
              className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              Events
            </Link>
            <Link 
              href="/" 
              className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              Marketplace
            </Link>
            <Link 
              href="/" 
              className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              Partnerships
            </Link>
            <Link 
              href="/" 
              className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              Contact
            </Link>
            <Link 
              href="/login" 
              className="text-sm px-4 py-2 text-neutral-900 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              Sign in
            </Link>
            <Link 
              href="/signup" 
              className="text-sm px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors"
            >
              Join now
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 lg:py-12">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-0">
          {/* Left Column - Form */}
          <div className="flex flex-col justify-center px-6 sm:px-8 py-8 bg-white rounded-l-2xl lg:rounded-r-none">
            {/* Choose Login Type */}
            {loginType === null && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-2">
                    Welcome back
                  </h1>
                  <p className="text-base text-neutral-600">
                    Sign in to your Passive Blessings account to access your dashboard, events, and community.
                  </p>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3 items-start">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-900">{error}</p>
                  </div>
                )}

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginType('regular')
                      setError('')
                      setEmail('')
                      setPassword('')
                    }}
                    className="w-full px-4 py-3 text-left border-2 border-neutral-200 rounded-xl hover:border-neutral-900 hover:bg-neutral-50 transition-all font-medium text-neutral-900"
                  >
                    Continue with Google
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLoginType('regular')
                      setError('')
                      setEmail('')
                      setPassword('')
                    }}
                    className="w-full px-4 py-3 text-left border-2 border-neutral-200 rounded-xl hover:border-neutral-900 hover:bg-neutral-50 transition-all font-medium text-neutral-900"
                  >
                    Continue with Apple
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLoginType('regular')
                      setError('')
                      setEmail('')
                      setPassword('')
                    }}
                    className="w-full px-4 py-3 text-left border-2 border-neutral-200 rounded-xl hover:border-neutral-900 hover:bg-neutral-50 transition-all font-medium text-neutral-900"
                  >
                    Continue with Facebook
                  </button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-neutral-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-neutral-500">or sign in with email</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setLoginType('regular')
                    setError('')
                    setEmail('')
                    setPassword('')
                  }}
                  className="w-full px-4 py-3 text-left border-2 border-neutral-900 rounded-xl bg-neutral-50 hover:bg-white transition-all font-medium text-neutral-900"
                >
                  Email address
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
                  className="w-full px-4 py-3 text-left border-2 border-neutral-200 rounded-xl hover:border-neutral-900 hover:bg-neutral-50 transition-all font-medium text-neutral-900"
                >
                  Admin Portal
                </button>

                <div className="text-center text-sm">
                  <span className="text-neutral-600">No account yet? </span>
                  <Link href="/signup" className="font-semibold text-neutral-900 hover:underline">
                    Join the community
                  </Link>
                </div>
              </div>
            )}

            {/* Regular Email Login */}
            {loginType === 'regular' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-neutral-900 mb-2">Welcome back</h1>
                  <p className="text-neutral-600">Sign in to your account to continue</p>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3 items-start">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-900">{error}</p>
                  </div>
                )}

                <form onSubmit={handleRegularLogin} className="space-y-5">
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-neutral-900 mb-2">
                      Email address
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 border border-neutral-200 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-semibold text-neutral-900 mb-2">
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Your password"
                      className="w-full px-4 py-3 border border-neutral-200 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 cursor-pointer accent-neutral-900 rounded"
                      />
                      <span className="text-sm text-neutral-900">Remember me</span>
                    </label>
                    <Link href="/forgot-password" className="text-sm text-neutral-900 underline hover:no-underline">
                      Forgot password?
                    </Link>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-neutral-900 text-white font-semibold rounded-lg hover:bg-neutral-800 disabled:bg-neutral-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Signing in...' : 'Sign in to dashboard'}
                  </button>
                </form>

                <button
                  type="button"
                  onClick={() => {
                    setLoginType(null)
                    setError('')
                  }}
                  className="w-full py-2 text-neutral-600 hover:text-neutral-900 transition-colors"
                >
                  Back
                </button>
              </div>
            )}

            {/* Admin Access Code */}
            {loginType === 'admin' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-neutral-900 mb-2">Admin Portal</h1>
                  <p className="text-neutral-600">Enter your admin access code</p>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3 items-start">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-900">{error}</p>
                  </div>
                )}

                <form onSubmit={handleVerifyAccessCode} className="space-y-5">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-900">
                      Enter your admin access code to proceed.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="accessCode" className="block text-sm font-semibold text-neutral-900 mb-2">
                      Access Code
                    </label>
                    <input
                      id="accessCode"
                      type="text"
                      required
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                      placeholder="Enter access code"
                      className="w-full px-4 py-3 border border-neutral-200 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all uppercase tracking-widest font-mono text-center"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-neutral-900 text-white font-semibold rounded-lg hover:bg-neutral-800 disabled:bg-neutral-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Verifying...' : 'Verify Access Code'}
                  </button>
                </form>

                <button
                  type="button"
                  onClick={() => {
                    setLoginType(null)
                    setError('')
                  }}
                  className="w-full py-2 text-neutral-600 hover:text-neutral-900 transition-colors"
                >
                  Back
                </button>
              </div>
            )}

            {/* Admin Email & Password */}
            {loginType === 'admin-verified' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-neutral-900 mb-2">Admin Portal</h1>
                  <p className="text-neutral-600">Enter your admin credentials</p>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3 items-start">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-900">{error}</p>
                  </div>
                )}

                <form onSubmit={handleAdminLogin} className="space-y-5">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-900">
                      Access code verified. Enter your credentials to continue.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="admin-email" className="block text-sm font-semibold text-neutral-900 mb-2">
                      Email address
                    </label>
                    <input
                      id="admin-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@example.com"
                      className="w-full px-4 py-3 border border-neutral-200 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label htmlFor="admin-password" className="block text-sm font-semibold text-neutral-900 mb-2">
                      Password
                    </label>
                    <input
                      id="admin-password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Your password"
                      className="w-full px-4 py-3 border border-neutral-200 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-neutral-900 text-white font-semibold rounded-lg hover:bg-neutral-800 disabled:bg-neutral-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Signing in...' : 'Access Admin Portal'}
                  </button>
                </form>

                <button
                  type="button"
                  onClick={() => {
                    setLoginType('admin')
                    setError('')
                    setEmail('')
                    setPassword('')
                    setAccessCode('')
                  }}
                  className="w-full py-2 text-neutral-600 hover:text-neutral-900 transition-colors"
                >
                  Back
                </button>
              </div>
            )}
          </div>

          {/* Right Column - Community Benefits (Dark Background) */}
          <div className="hidden lg:flex flex-col justify-between px-8 py-12 bg-neutral-900 rounded-r-2xl text-white">
            <div>
              <div className="h-8 mb-8">
                <Logo size="sm" href="/" variant="light" />
              </div>
              <h2 className="text-4xl font-bold mb-3">
                Your community hub <span className="italic font-light">awaits</span>
              </h2>
              <p className="text-neutral-300 mb-8 leading-relaxed">
                Access your dashboard, track volunteer hours, register for events, manage donations, and connect with 3,400+ community members across the UAE.
              </p>

              <div className="space-y-4">
                <div className="flex gap-3 items-start">
                  <Check className="w-5 h-5 text-white flex-shrink-0 mt-1" />
                  <span className="text-neutral-200">Register and track community events</span>
                </div>
                <div className="flex gap-3 items-start">
                  <Check className="w-5 h-5 text-white flex-shrink-0 mt-1" />
                  <span className="text-neutral-200">Log volunteer hours and earn certificates</span>
                </div>
                <div className="flex gap-3 items-start">
                  <Check className="w-5 h-5 text-white flex-shrink-0 mt-1" />
                  <span className="text-neutral-200">Request welfare support confidentially</span>
                </div>
                <div className="flex gap-3 items-start">
                  <Check className="w-5 h-5 text-white flex-shrink-0 mt-1" />
                  <span className="text-neutral-200">Access the business marketplace</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-3xl font-bold text-white mb-1">
                  {statsLoading ? '-' : stats.totalMembers.toLocaleString()}
                </div>
                <div className="text-sm text-neutral-400">Community members</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white mb-1">
                  {statsLoading ? '-' : stats.volunteerHours.toLocaleString()}
                </div>
                <div className="text-sm text-neutral-400">Volunteer hours</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white mb-1">
                  {statsLoading ? '-' : stats.businessPartners}
                </div>
                <div className="text-sm text-neutral-400">Business partners</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white mb-1">
                  {statsLoading ? '-' : formatDonations(stats.totalDonations)}
                </div>
                <div className="text-sm text-neutral-400">Donations tracked</div>
              </div>
            </div>

            <div className="text-xs text-neutral-500 pt-6 border-t border-neutral-800">
              TRUSTED BY 3,400+ MEMBERS • ESTD 2025 • DUBAI, UAE
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
