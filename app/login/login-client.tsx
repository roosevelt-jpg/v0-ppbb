'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { loginUser } from '@/lib/auth'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [rememberMe, setRememberMe] = React.useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { user, error: loginError } = await loginUser(email, password)

    if (loginError) {
      setError(loginError)
      setLoading(false)
      return
    }

    if (user) {
      if (user.role === 'admin') {
        router.push('/admin')
      } else if (user.role === 'business') {
        router.push('/business')
      } else {
        router.push('/dashboard')
      }
    }
  }

  return (
    <div className="w-full min-h-screen bg-background flex flex-col">
      {/* Header Navigation */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Logo size="sm" href="/" />
          <Link href="/signup" className="text-sm sm:text-base font-medium text-foreground hover:text-[#111111] transition">
            Create Account
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="w-full max-w-md space-y-8">
          {/* Logo & Heading */}
          <div className="space-y-3 sm:space-y-4 text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-playfair leading-tight text-foreground">
              Welcome Back
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Sign in to continue
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="w-full p-4 sm:p-5 rounded-lg bg-red-50 border border-red-200 flex gap-3 sm:gap-4">
              <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm sm:text-base text-red-800 leading-relaxed">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5 sm:space-y-6">
            {/* Email Input */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm sm:text-base font-medium text-foreground">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 sm:py-3.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#111111] focus:border-transparent text-sm sm:text-base transition"
              />
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm sm:text-base font-medium text-foreground">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 sm:py-3.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#111111] focus:border-transparent text-sm sm:text-base transition"
              />
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-border cursor-pointer"
                />
                <span className="text-xs sm:text-sm text-foreground">Remember me</span>
              </label>
              <Link href="/forgot-password" className="text-xs sm:text-sm text-[#111111] hover:underline font-medium transition">
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full py-3 sm:py-3.5 bg-[#111111] hover:bg-[#333333] text-white font-semibold text-base sm:text-base rounded-lg transition disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex-1 h-px bg-border"></div>
            <span className="text-xs sm:text-sm text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border"></div>
          </div>

          {/* Sign Up CTA */}
          <div className="space-y-4 text-center">
            <p className="text-sm sm:text-base text-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-semibold text-[#111111] hover:underline transition">
                Sign up now
              </Link>
            </p>

            {/* Demo Info Box */}
            <div className="p-4 sm:p-5 rounded-lg bg-[#f7f6f2] border border-[#e4e1da]">
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground">Demo Mode:</span> Use any email and password to test
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
