'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { loginUser } from '@/lib/auth'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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
      // Redirect based on role
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
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-background">
      {/* Left side - Form */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <Logo size="md" className="mb-4" />
            <h1 className="text-2xl font-bold">Welcome back</h1>
            <p className="text-muted-foreground">Sign in to your Passive Blessings account</p>
          </div>

          <Card className="p-6">
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg flex gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Your password"
                  required
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Remember me</span>
                </label>
                <Link href="#" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Signing in...' : 'Sign in to dashboard'}
              </Button>
            </form>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-6">
            No account?{' '}
            <Link href="/signup" className="text-primary font-medium hover:underline">
              Join the community
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Info */}
      <div className="hidden md:flex items-center justify-center bg-primary text-primary-foreground p-8">
        <div className="text-center">
          <h2 className="text-4xl font-bold mb-4">Your community hub awaits</h2>
          <ul className="space-y-3 text-lg opacity-90">
            <li>✓ Register & track community events</li>
            <li>✓ Log volunteer hours & earn certificates</li>
            <li>✓ Request welfare support confidentially</li>
            <li>✓ Access the business marketplace</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
