'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { loginUser, loginWithGoogle, loginWithFacebook } from '@/lib/auth'
import { auth } from '@/lib/firebase'
import { getCommunityStats, formatDonations, CommunityStats } from '@/lib/community-stats'
import { Logo } from '@/components/logo'
import { AlertCircle, Check } from 'lucide-react'
import { logActivity } from '@/lib/activity-logger'
import { hasBusinessAccess } from '@/lib/roles'
import { User } from '@/lib/types'

export default function LoginPage() {
  const router = useRouter()
  
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [rememberMe, setRememberMe] = React.useState(false)
  const [stats, setStats] = React.useState<CommunityStats>({ totalMembers: 0, volunteerHours: 0, businessPartners: 0, totalDonations: 0 })
  const [statsLoading, setStatsLoading] = React.useState(true)

  // Route the user after a successful login. Honor returnUrl or redirect query params first.
  const routeAfterLogin = (user: User) => {
    const params = new URLSearchParams(window.location.search)
    const returnUrl = params.get('returnUrl') || params.get('redirect')
    if (returnUrl && returnUrl.startsWith('/')) {
      router.push(returnUrl)
      return
    }

    if (!user.role) {
      router.push('/')
      return
    }

    if (user.role === 'admin' || user.role === 'super_admin') {
      router.push('/admin')
    } else if (hasBusinessAccess(user)) {
      router.push('/business/dashboard')
    } else if (user.role === 'sponsor') {
      router.push('/sponsor')
    } else {
      router.push('/dashboard')
    }
  }

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
    
    // Load saved email if remember me was checked
    const savedEmail = localStorage.getItem('pb_remember_email')
    if (savedEmail) {
      setEmail(savedEmail)
      setRememberMe(true)
    }
    
    logActivity('', 'guest@passiveblessings.com', 'LOGIN_PAGE_VISIT', 'Visited login page', { 
      timestamp: new Date().toISOString()
    })
    
    fetchStats()
  }, [])

  // Save email to localStorage when rememberMe changes
  React.useEffect(() => {
    if (rememberMe && email) {
      localStorage.setItem('pb_remember_email', email)
    } else {
      localStorage.removeItem('pb_remember_email')
    }
  }, [rememberMe, email])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    logActivity('', email, 'OTHER', 'Attempting sign in', { 
      timestamp: new Date().toISOString()
    })

    const { user, error: loginError } = await loginUser(email, password)

    if (loginError) {
      let displayError = loginError
      try {
        const res = await fetch(`/api/auth/check-email?email=${encodeURIComponent(email.trim())}`)
        const data = await res.json()
        if (data.success) {
          if (data.authExists && data.hasGoogle && !data.hasPassword) {
            displayError =
              'This email is registered with Google. Click Continue with Google instead of using a password.'
          } else if (!data.authExists && data.firestoreExists) {
            displayError =
              'Your profile exists but Firebase sign-in is not set up for this email. Use Forgot password to create a password, or contact support.'
          } else if (!data.authExists) {
            displayError = 'No account found for this email. Please sign up first.'
          }
        }
      } catch {
        /* keep original error */
      }
      setError(displayError)
      logActivity('', email, 'SIGNIN_FAILED', 'Sign in failed', { 
        error: displayError,
        timestamp: new Date().toISOString()
      })
      setLoading(false)
      return
    }

    if (user) {
      const userId = user.id || auth.currentUser?.uid || 'guest'
      logActivity(userId, user.email || email, 'SIGNIN', 'Successfully signed in', { 
        userRole: user.role,
        rememberMe,
        timestamp: new Date().toISOString()
      })

      setLoading(false)
      routeAfterLogin(user)
    } else {
      setError('Sign in succeeded but no user profile was returned.')
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError('')
    setLoading(true)

    const { user, error: loginError } = await loginWithGoogle()

    if (loginError) {
      setError(loginError)
      setLoading(false)
      return
    }

    if (user) {
      const userId = user.id || auth.currentUser?.uid || 'guest'
      logActivity(userId, user.email || '', 'SIGNIN_GOOGLE', 'Signed in with Google', { 
        timestamp: new Date().toISOString()
      })

      routeAfterLogin(user)
    }
  }

  const handleFacebookLogin = async () => {
    setError('')
    setLoading(true)

    const { user, error: loginError } = await loginWithFacebook()

    if (loginError) {
      setError(loginError)
      setLoading(false)
      return
    }

    if (user) {
      const userId = user.id || auth.currentUser?.uid || 'guest'
      logActivity(userId, user.email || '', 'SIGNIN_FACEBOOK', 'Signed in with Facebook', { 
        timestamp: new Date().toISOString()
      })

      routeAfterLogin(user)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 py-4 md:py-6 bg-neutral-100">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-0 rounded-lg overflow-hidden shadow-md">
        {/* Left Column - Form */}
        <div className="flex flex-col justify-center px-5 py-6 md:px-6 bg-white">
          <div className="mb-4">
            <h1 className="text-2.5xl md:text-3xl font-bold text-neutral-900 mb-1">
              Welcome back
            </h1>
            <p className="text-xs md:text-sm text-neutral-600">
              Sign in to access your dashboard, events, and community.
            </p>
          </div>

          {error && (
            <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-lg flex gap-2 items-start">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-900">{error}</p>
            </div>
          )}

          <div className="space-y-2 mb-3">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full px-3 py-2 bg-white text-center border border-neutral-200 rounded-lg hover:border-neutral-900 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-xs text-neutral-900"
            >
              {loading ? 'Signing in...' : 'Continue with Google'}
            </button>

            <button
              type="button"
              onClick={handleFacebookLogin}
              disabled={loading}
              className="w-full px-3 py-2 bg-white text-center border border-neutral-200 rounded-lg hover:border-neutral-900 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-xs text-neutral-900"
            >
              {loading ? 'Signing in...' : 'Continue with Facebook'}
            </button>
          </div>

          <div className="relative mb-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white text-neutral-400">or sign in with email</span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-2">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-neutral-900 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-900 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-neutral-900 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-900 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 cursor-pointer accent-neutral-900 rounded"
                />
                <span className="text-xs text-neutral-900">Remember me</span>
              </label>
              <Link href="/forgot-password" className="text-xs text-neutral-900 hover:underline font-medium">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-neutral-900 text-white font-semibold text-xs rounded-lg hover:bg-neutral-800 disabled:bg-neutral-400 disabled:cursor-not-allowed transition-colors mt-3"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="text-center mt-3">
            <span className="text-xs text-neutral-600">New here? </span>
            <Link href="/signup" className="text-xs font-semibold text-neutral-900 hover:underline">
              Create account
            </Link>
          </div>
        </div>

        {/* Right Column - Community Benefits */}
        <div className="hidden md:flex flex-col justify-between px-6 py-6 bg-neutral-900 text-white">
          <div>
            <div className="mb-4 h-8 flex items-center justify-center">
              <img 
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/PB%20ORIGINAL%20LOGO%20%5Bwhite%5D-kynXCNIfTNVyEpS4pVpqQsl2Pxf9yq.png" 
                alt="Passive Blessings" 
                className="h-8 w-auto"
              />
            </div>
            <h2 className="text-2xl font-bold mb-2">
              Your community hub <span className="italic font-light">awaits</span>
            </h2>
            <p className="text-sm text-neutral-300 mb-4 leading-relaxed">
              Access dashboard, track hours, register events, manage donations, and connect with 3,400+ members.
            </p>

            <div className="space-y-2">
              <div className="flex gap-2 items-start">
                <div className="w-3.5 h-3.5 rounded border border-neutral-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-2.5 h-2.5 text-neutral-300" />
                </div>
                <span className="text-xs text-neutral-300">Register and track community events</span>
              </div>
              <div className="flex gap-2 items-start">
                <div className="w-3.5 h-3.5 rounded border border-neutral-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-2.5 h-2.5 text-neutral-300" />
                </div>
                <span className="text-xs text-neutral-300">Log volunteer hours and earn certificates</span>
              </div>
              <div className="flex gap-2 items-start">
                <div className="w-3.5 h-3.5 rounded border border-neutral-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-2.5 h-2.5 text-neutral-300" />
                </div>
                <span className="text-xs text-neutral-300">Request welfare support confidentially</span>
              </div>
              <div className="flex gap-2 items-start">
                <div className="w-3.5 h-3.5 rounded border border-neutral-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-2.5 h-2.5 text-neutral-300" />
                </div>
                <span className="text-xs text-neutral-300">Access the business marketplace</span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="border border-neutral-700 rounded-lg p-2.5">
                <div className="text-xl font-bold text-white mb-0.5">
                  {statsLoading ? '-' : stats.totalMembers.toLocaleString()}
                </div>
                <div className="text-xs text-neutral-400">Community members</div>
              </div>
              <div className="border border-neutral-700 rounded-lg p-2.5">
                <div className="text-xl font-bold text-white mb-0.5">
                  {statsLoading ? '-' : stats.volunteerHours.toLocaleString()}
                </div>
                <div className="text-xs text-neutral-400">Volunteer hours</div>
              </div>
              <div className="border border-neutral-700 rounded-lg p-2.5">
                <div className="text-xl font-bold text-white mb-0.5">
                  {statsLoading ? '-' : stats.businessPartners}
                </div>
                <div className="text-xs text-neutral-400">Business partners</div>
              </div>
              <div className="border border-neutral-700 rounded-lg p-2.5">
                <div className="text-xl font-bold text-white mb-0.5">
                  {statsLoading ? '-' : formatDonations(stats.totalDonations)}
                </div>
                <div className="text-xs text-neutral-400">Donations</div>
              </div>
            </div>

            <div className="text-xs text-neutral-500 pt-2 border-t border-neutral-800">
              TRUSTED BY 3,400+ MEMBERS • ESTD 2025 • DUBAI, UAE
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
