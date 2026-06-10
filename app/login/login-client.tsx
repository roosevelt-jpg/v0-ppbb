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
    <div style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff' }}>
      {/* Header Navigation */}
      <div style={{ width: '100%', padding: '1rem', borderBottom: '1px solid #e4e1da' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: '1rem', paddingRight: '1rem' }}>
          <Logo size="sm" href="/" />
          <Link href="/signup" style={{ fontSize: '1rem', fontWeight: 500, color: '#111111', textDecoration: 'none' }}>
            Create Account
          </Link>
        </div>
      </div>

      {/* Main Content - Single Column Centered */}
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

          {/* Login Form */}
          <form onSubmit={handleLogin} style={{ marginBottom: '1.5rem' }}>
            {/* Email Input */}
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

            {/* Password Input */}
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

            {/* Remember Me & Forgot Password */}
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '1rem', backgroundColor: loading ? '#cccccc' : '#111111', color: '#ffffff', border: 'none', borderRadius: '0.5rem', fontWeight: 600, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '1.5rem' }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e4e1da' }}></div>
            <span style={{ fontSize: '0.875rem', color: '#888888' }}>or</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e4e1da' }}></div>
          </div>

          {/* Sign Up CTA */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '1rem', color: '#111111', marginBottom: '1rem' }}>
              Don&apos;t have an account?{' '}
              <Link href="/signup" style={{ fontWeight: 600, color: '#111111', textDecoration: 'underline' }}>
                Sign up now
              </Link>
            </p>

            {/* Demo Info Box */}
            <div style={{ padding: '1rem', backgroundColor: '#f7f6f2', border: '1px solid #e4e1da', borderRadius: '0.5rem' }}>
              <p style={{ fontSize: '0.875rem', color: '#666666' }}>
                <span style={{ fontWeight: 600, color: '#111111' }}>Demo Mode:</span> Use any email and password to test
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
