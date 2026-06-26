'use client'

import React, { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { BusinessOpportunity } from '@/lib/types'
import { applyToOpportunity } from '@/lib/business-queries'
import { useAuth } from '@/lib/auth-context'

export function OpportunityApplyModal({
  opportunity,
  open,
  onClose,
  onApplied,
}: {
  opportunity: BusinessOpportunity | null
  open: boolean
  onClose: () => void
  onApplied: () => void
}) {
  const { user } = useAuth()
  const [coverLetter, setCoverLetter] = useState('')
  const [resumeUrl, setResumeUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!open || !opportunity) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setError('You must be signed in to apply.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const fullName =
        `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
      await applyToOpportunity(
        opportunity,
        {
          id: user.id,
          name: fullName,
          email: user.email,
          phone: user.phone,
          avatarUrl: user.avatarUrl,
        },
        coverLetter,
        resumeUrl
      )
      setCoverLetter('')
      setResumeUrl('')
      onApplied()
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Failed to submit application. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">Apply for {opportunity.title}</h2>
            <p className="text-sm text-muted-foreground">{opportunity.businessName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-secondary text-muted-foreground"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label htmlFor="coverLetter" className="block text-sm font-medium text-foreground mb-1">
              Cover letter / Message
            </label>
            <textarea
              id="coverLetter"
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={5}
              required
              placeholder="Tell the business why you're a great fit..."
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label htmlFor="resumeUrl" className="block text-sm font-medium text-foreground mb-1">
              Resume / Portfolio link <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              id="resumeUrl"
              type="url"
              value={resumeUrl}
              onChange={(e) => setResumeUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-border text-foreground hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
