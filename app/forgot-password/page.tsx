'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { sendPasswordReset } from '@/lib/auth'
import { AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    if (!email.trim()) {
      setError('Please enter your email address')
      setLoading(false)
      return
    }

    const { success: resetSuccess, error: resetError } = await sendPasswordReset(email)

    if (!resetSuccess) {
      setError(resetError || 'Failed to send reset email. Please try again.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setEmail('')
    setLoading(false)

    // Redirect after 3 seconds
    setTimeout(() => {
      router.push('/login')
    }, 3000)
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 py-6 md:py-8 bg-neutral-100">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-xl shadow-sm p-5 md:p-6">
          {/* Header */}
          <div className="mb-4">
            <Link href="/login" className="inline-flex items-center gap-1 text-xs font-medium text-neutral-600 hover:text-neutral-900 transition-colors mb-4">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to login
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-1">
              Reset password
            </h1>
            <p className="text-xs md:text-sm text-neutral-600">
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2 items-start">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-900">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex gap-2 items-start">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-green-900">
                <p className="font-medium mb-1">Check your email</p>
                <p>We&apos;ve sent password reset instructions to {email}. Please check your inbox and follow the link to reset your password.</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-neutral-900 mb-1">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-900 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all"
                disabled={loading || success}
              />
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-2 bg-neutral-900 text-white font-semibold text-xs rounded-lg hover:bg-neutral-800 disabled:bg-neutral-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Sending...' : success ? 'Email sent - redirecting...' : 'Send reset link'}
            </button>
          </form>

          <div className="text-center mt-4">
            <span className="text-xs text-neutral-600">
              Remember your password? <Link href="/login" className="font-semibold text-neutral-900 hover:underline">Sign in</Link>
            </span>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center text-xs text-neutral-500">
          <p>By continuing, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  )
}
