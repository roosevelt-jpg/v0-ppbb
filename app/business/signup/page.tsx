'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Briefcase, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { hasBusinessAccess } from '@/lib/roles'

const BUSINESS_TYPES = [
  'Retail',
  'E-commerce',
  'Service',
  'Food & Beverage',
  'Technology',
  'Finance',
  'Healthcare',
  'Education',
  'Real Estate',
  'Manufacturing',
  'Consulting',
  'Other',
]

const BENEFITS = [
  'List your products and services in the member marketplace',
  'Post jobs and opportunities for members to apply',
  'Manage applicants and leads from a dedicated portal',
  'Build your brand within the Passive Blessings community',
]

export default function BusinessSignupPage() {
  const router = useRouter()
  const { firebaseUser, user, loading } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: '',
    businessDescription: '',
  })

  // Redirect users who aren't logged in, or who already have a business account.
  useEffect(() => {
    if (loading) return
    if (!firebaseUser) {
      router.push('/login?redirect=/business/signup')
      return
    }
    if (hasBusinessAccess(user)) {
      router.push('/business/dashboard')
    }
  }, [loading, firebaseUser, user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.businessName.trim()) {
      setError('Business name is required')
      return
    }
    if (!formData.businessType) {
      setError('Please select a business type')
      return
    }
    if (!firebaseUser) {
      setError('You must be logged in to create a business account')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/user/upgrade-to-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId: firebaseUser.uid }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create business account')
      }

      // Full reload so the auth context picks up the new business role.
      window.location.href = '/business/dashboard'
    } catch (err: any) {
      console.error('[v0] Business signup error:', err)
      setError(err.message || 'Failed to create business account')
      setIsLoading(false)
    }
  }

  if (loading || !firebaseUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </Link>

        <div className="grid md:grid-cols-5 gap-8 items-start">
          {/* Intro / benefits */}
          <div className="md:col-span-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4">
              <Briefcase className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-foreground text-balance">
              Create your business account
            </h1>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Grow your business within the community. Keep your member account &mdash; this just unlocks the Business Portal.
            </p>
            <ul className="mt-6 space-y-3">
              {BENEFITS.map((benefit) => (
                <li key={benefit} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-sm text-foreground">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Form */}
          <div className="md:col-span-3 bg-card border border-border rounded-xl p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Business name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  placeholder="e.g. Al Noor Trading LLC"
                  disabled={isLoading}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Business type <span className="text-destructive">*</span>
                </label>
                <select
                  value={formData.businessType}
                  onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                  disabled={isLoading}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                >
                  <option value="">Select a type</option>
                  {BUSINESS_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Business description
                </label>
                <textarea
                  value={formData.businessDescription}
                  onChange={(e) =>
                    setFormData({ ...formData, businessDescription: e.target.value })
                  }
                  placeholder="Tell members what your business offers"
                  rows={4}
                  disabled={isLoading}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                />
              </div>

              <p className="text-xs text-muted-foreground">
                You can add more details, products, and opportunities later from the Business Portal.
              </p>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create business account'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
