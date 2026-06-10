'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { registerUser } from '@/lib/auth'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AlertCircle, ChevronRight } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = React.useState(1)
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  // Step 1: User type selection
  const [userType, setUserType] = React.useState<'member' | 'volunteer' | 'business' | null>(null)

  // Step 2: Basic info
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [firstName, setFirstName] = React.useState('')
  const [lastName, setLastName] = React.useState('')

  const handleContinue = () => {
    if (step === 1 && userType) {
      setStep(2)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    const { user, error: signupError } = await registerUser(
      email,
      password,
      firstName,
      lastName,
      userType || 'member'
    )

    if (signupError) {
      setError(signupError)
      setLoading(false)
      return
    }

    if (user) {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-background">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <Logo size="lg" className="mx-auto mb-4" />
          <h1 className="text-3xl font-bold">Create your account</h1>
          <p className="text-muted-foreground mt-2">Join the Passive Blessings community – it only takes a few minutes</p>
        </div>

        {/* Step 1: User Type */}
        {step === 1 && (
          <Card className="p-8">
            <h2 className="text-xl font-bold mb-6">I want to join as a:</h2>

            <div className="space-y-3 mb-8">
              {[
                { value: 'member', label: 'General Member', desc: 'Community events, charity' },
                { value: 'volunteer', label: 'Volunteer', desc: 'Contribute your time & skills' },
                { value: 'business', label: 'Member + Volunteer', desc: 'Full access & post back' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setUserType(option.value as any)}
                  className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                    userType === option.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <p className="font-medium">{option.label}</p>
                  <p className="text-sm text-muted-foreground">{option.desc}</p>
                </button>
              ))}
            </div>

            <Button onClick={handleContinue} disabled={!userType} className="w-full">
              Continue <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </Card>
        )}

        {/* Step 2: Registration */}
        {step === 2 && (
          <Card className="p-8">
            <div className="mb-6">
              <button
                onClick={() => setStep(1)}
                className="text-sm text-primary hover:underline"
              >
                ← Change user type
              </button>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg flex gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
                  placeholder="Min. 6 characters, 1 number, 1 symbol"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" required className="mt-1" />
                <span>
                  I agree to the{' '}
                  <Link href="#" className="text-primary hover:underline">
                    Terms & Conditions
                  </Link>
                  {' '}and{' '}
                  <Link href="#" className="text-primary hover:underline">
                    Community Code of Conduct
                  </Link>
                </span>
              </label>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Creating account...' : 'Create account & continue'}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Already have an account?{' '}
              <Link href="/login" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}
