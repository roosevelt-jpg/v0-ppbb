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
    <div className="w-full min-h-screen bg-background flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8">
          <Logo size="md" href="/" className="mx-auto mb-4" />
          <h1 className="text-2xl sm:text-3xl font-bold text-center font-playfair mb-2">Welcome Back</h1>
          <p className="text-sm sm:text-base text-center text-muted-foreground">Sign in to your account to continue</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 sm:p-5 rounded-lg bg-red-50 border border-red-200 flex gap-3">
            <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm sm:text-base text-red-800">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 sm:py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#111111] focus:border-transparent text-base sm:text-sm"
            />
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 sm:py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#111111] focus:border-transparent text-base sm:text-sm"
            />
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-border cursor-pointer"
              />
              <span className="text-xs sm:text-sm text-foreground">Remember me</span>
            </label>
            <Link href="#" className="text-xs sm:text-sm text-[#111111] hover:underline font-medium">
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full py-3 sm:py-2.5 bg-[#111111] hover:bg-[#333333] text-white font-medium text-base sm:text-sm rounded-lg"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-border"></div>
          <span className="text-xs sm:text-sm text-muted-foreground">or</span>
          <div className="flex-1 h-px bg-border"></div>
        </div>

        {/* Sign Up Link */}
        <p className="text-center text-sm sm:text-base text-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-bold text-[#111111] hover:underline">
            Sign up now
          </Link>
        </p>

        {/* Demo Info */}
        <div className="mt-8 p-4 sm:p-5 rounded-lg bg-[#f7f6f2] border border-[#e4e1da] text-center">
          <p className="text-xs sm:text-sm text-muted-foreground">
            <span className="font-medium">Demo Mode:</span> Use any email and password
          </p>
        </div>
      </div>
    </div>
  )
}
