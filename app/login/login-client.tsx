'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { loginUser } from '@/lib/auth'
import { getCommunityStats, formatDonations, CommunityStats } from '@/lib/community-stats'
import { Logo } from '@/components/logo'
import { AlertCircle, Check } from 'lucide-react'
import { logActivity } from '@/lib/activity-logger'

export default function LoginPage() {
  const router = useRouter()
  
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    logActivity('guest', email, 'OTHER', 'Attempting sign in', { 
      timestamp: new Date().toISOString()
    })

    const { user, error: loginError } = await loginUser(email, password)

    if (loginError) {
      setError(loginError)
      logActivity('guest', email, 'SIGNIN_FAILED', 'Sign in failed', { 
        error: loginError,
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
      } else if (user.role === 'sponsor') {
        router.push('/sponsor')
      } else {
        router.push('/dashboard')
      }
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 py-8 md:py-12 bg-neutral-100">
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-0 rounded-2xl overflow-hidden shadow-lg">
        {/* Left Column - Form */}
        <div className="flex flex-col justify-center px-8 py-12 bg-white">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-neutral-900 mb-3">
              Welcome back
            </h1>
            <p className="text-base text-neutral-600">
              Sign in to your Passive Blessings account to access your dashboard, events, and community.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3 items-start">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-900">{error}</p>
            </div>
          )}

          <div className="space-y-3 mb-6">
            <button
              type="button"
              className="w-full px-4 py-3 bg-white text-center border-2 border-neutral-200 rounded-lg hover:border-neutral-900 hover:bg-neutral-50 transition-all font-medium text-neutral-900"
            >
              Continue with Google
            </button>

            <button
              type="button"
              className="w-full px-4 py-3 bg-white text-center border-2 border-neutral-200 rounded-lg hover:border-neutral-900 hover:bg-neutral-50 transition-all font-medium text-neutral-900"
            >
              Continue with Facebook
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-neutral-400">or sign in with email</span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-900 mb-2">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-lg text-neutral-900 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-900 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-lg text-neutral-900 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all"
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
              <Link href="/forgot-password" className="text-sm text-neutral-900 hover:underline font-medium">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-neutral-900 text-white font-semibold rounded-lg hover:bg-neutral-800 disabled:bg-neutral-400 disabled:cursor-not-allowed transition-colors mt-6"
            >
              {loading ? 'Signing in...' : 'Sign in to dashboard'}
            </button>
          </form>

          <div className="text-center mt-6">
            <span className="text-sm text-neutral-600">No account yet? </span>
            <Link href="/signup" className="text-sm font-semibold text-neutral-900 hover:underline">
              Join the community
            </Link>
          </div>
        </div>

        {/* Right Column - Community Benefits */}
        <div className="hidden md:flex flex-col justify-between px-8 py-12 bg-neutral-900 text-white">
          <div>
            <div className="mb-8 h-12 flex items-center justify-center">
              <img 
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/PB%20ORIGINAL%20LOGO%20%5Bwhite%5D-kynXCNIfTNVyEpS4pVpqQsl2Pxf9yq.png" 
                alt="Passive Blessings" 
                className="h-12 w-auto"
              />
            </div>
            <h2 className="text-4xl font-bold mb-2">
              Your community hub <span className="italic font-light">awaits</span>
            </h2>
            <p className="text-neutral-300 mb-8 leading-relaxed">
              Access your dashboard, track volunteer hours, register for events, manage donations, and connect with 3,400+ community members across the UAE.
            </p>

            <div className="space-y-4">
              <div className="flex gap-3 items-start">
                <div className="w-5 h-5 rounded border border-neutral-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-4 h-4 text-neutral-300" />
                </div>
                <span className="text-neutral-300">Register and track community events</span>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-5 h-5 rounded border border-neutral-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-4 h-4 text-neutral-300" />
                </div>
                <span className="text-neutral-300">Log volunteer hours and earn certificates</span>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-5 h-5 rounded border border-neutral-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-4 h-4 text-neutral-300" />
                </div>
                <span className="text-neutral-300">Request welfare support confidentially</span>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-5 h-5 rounded border border-neutral-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-4 h-4 text-neutral-300" />
                </div>
                <span className="text-neutral-300">Access the business marketplace</span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-neutral-700 rounded-lg p-4">
                <div className="text-3xl font-bold text-white mb-1">
                  {statsLoading ? '-' : stats.totalMembers.toLocaleString()}
                </div>
                <div className="text-sm text-neutral-400">Community members</div>
              </div>
              <div className="border border-neutral-700 rounded-lg p-4">
                <div className="text-3xl font-bold text-white mb-1">
                  {statsLoading ? '-' : stats.volunteerHours.toLocaleString()}
                </div>
                <div className="text-sm text-neutral-400">Volunteer hours</div>
              </div>
              <div className="border border-neutral-700 rounded-lg p-4">
                <div className="text-3xl font-bold text-white mb-1">
                  {statsLoading ? '-' : stats.businessPartners}
                </div>
                <div className="text-sm text-neutral-400">Business partners</div>
              </div>
              <div className="border border-neutral-700 rounded-lg p-4">
                <div className="text-3xl font-bold text-white mb-1">
                  {statsLoading ? '-' : formatDonations(stats.totalDonations)}
                </div>
                <div className="text-sm text-neutral-400">Donations tracked</div>
              </div>
            </div>

            <div className="text-xs text-neutral-500 pt-4 border-t border-neutral-800">
              TRUSTED BY 3,400+ MEMBERS • ESTD 2025 • DUBAI, UAE
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
