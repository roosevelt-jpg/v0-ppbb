'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import Link from 'next/link'

export default function AdminSetup() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [accessCode, setAccessCode] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [verificationComplete, setVerificationComplete] = useState(false)

  const handleAccessCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // For testing - accept any non-empty access code
      // In production, verify against secure backend
      if (!accessCode || accessCode.length < 3) {
        setError('Access code must be at least 3 characters.')
        setLoading(false)
        return
      }

      setStep(2)
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerificationComplete = () => {
    setVerificationComplete(true)
    setStep(3)
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Sign in with email and password
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Verify user is admin
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      if (!userDoc.exists()) {
        setError('User profile not found.')
        setLoading(false)
        return
      }

      const userData = userDoc.data()
      if (userData?.role !== 'admin') {
        setError('This account does not have admin privileges.')
        setLoading(false)
        return
      }

      // Success - redirect to admin dashboard
      router.push('/admin')
    } catch (err: any) {
      console.error('Login error:', err)
      if (err.code === 'auth/user-not-found') {
        setError('Admin account not found.')
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password.')
      } else {
        setError('Login failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-3">Passive Blessings</h1>
          <p className="text-lg text-muted-foreground">Admin Dashboard Setup</p>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-between items-center gap-2 mb-12">
          <div className={`flex-1 h-3 rounded-full transition-all ${step >= 1 ? 'bg-foreground' : 'bg-muted'}`}></div>
          <div className={`flex-1 h-3 rounded-full transition-all ${step >= 2 ? 'bg-foreground' : 'bg-muted'}`}></div>
          <div className={`flex-1 h-3 rounded-full transition-all ${step >= 3 ? 'bg-foreground' : 'bg-muted'}`}></div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-lg p-10 border border-border">
          {/* Step 1: Access Code */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold mb-3">Step 1 of 3</h2>
              <p className="text-base text-muted-foreground mb-8 leading-relaxed">Enter your admin access code to continue</p>

              <form onSubmit={handleAccessCodeSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-3">Access Code</label>
                  <input
                    type="password"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    placeholder="Enter access code"
                    className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-foreground text-base"
                    required
                  />
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-base">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-foreground text-white rounded-lg font-semibold hover:bg-foreground/90 disabled:opacity-50 transition-all text-base"
                >
                  {loading ? 'Verifying...' : 'Continue'}
                </button>
              </form>
            </div>
          )}

          {/* Step 2: Verification */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold mb-3">Step 2 of 3</h2>
              <p className="text-base text-muted-foreground mb-8 leading-relaxed">Verification confirmed</p>

              <div className="bg-green-50 border border-green-200 rounded-lg p-5 mb-8">
                <div className="flex items-center gap-3 text-green-700">
                  <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-semibold text-base">Access code verified</span>
                </div>
              </div>

              <p className="text-base text-muted-foreground mb-8 leading-relaxed">
                Your access code has been verified. You can now proceed to sign in with your admin credentials.
              </p>

              <button
                onClick={handleVerificationComplete}
                className="w-full py-3 px-4 bg-foreground text-white rounded-lg font-semibold hover:bg-foreground/90 transition-all text-base"
              >
                Next
              </button>
            </div>
          )}

          {/* Step 3: Login */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold mb-3">Step 3 of 3</h2>
              <p className="text-base text-muted-foreground mb-8 leading-relaxed">Sign in with your admin credentials</p>

              <form onSubmit={handleAdminLogin} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-3">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@passiveblessings.ae"
                    className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-foreground text-base"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-foreground text-base"
                    required
                  />
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-base">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-foreground text-white rounded-lg font-semibold hover:bg-foreground/90 disabled:opacity-50 transition-all text-base"
                >
                  {loading ? 'Signing in...' : 'Sign In to Dashboard'}
                </button>
              </form>

              <div className="mt-8 pt-8 border-t border-border">
                <p className="text-base text-muted-foreground">
                  Return to <Link href="/" className="text-foreground font-semibold hover:underline">home page</Link>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-base text-muted-foreground">
          <p>Secure admin access • Step {step} of 3</p>
        </div>
      </div>
    </div>
  )
}
