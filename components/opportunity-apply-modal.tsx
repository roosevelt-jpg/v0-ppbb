'use client'

import React, { useState } from 'react'
import { X, Loader2, Upload } from 'lucide-react'
import { BusinessOpportunity } from '@/lib/types'
import { applyToOpportunity } from '@/lib/business-queries'
import { useAuth } from '@/lib/auth-context'
import { auth } from '@/lib/firebase'
import { hasBusinessAccess } from '@/lib/roles'
import { uploadFileToFirebase } from '@/lib/upload-utils'

import {
  opportunityGenderBlocksUser,
  opportunityMemberBlocksUser,
} from '@/lib/opportunity-utils'

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
  const [uploadingCv, setUploadingCv] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!open || !opportunity) return null

  const isBusiness = hasBusinessAccess(user)
  const genderBlock = user ? opportunityGenderBlocksUser(opportunity, user.gender) : null
  const isMemberOnly = Boolean(opportunity.isMemberOnly)
  const memberBlock =
    isMemberOnly && user && user.role !== 'member' && !hasBusinessAccess(user)
      ? 'This opportunity is for platform members only.'
      : opportunityMemberBlocksUser(opportunity, user?.role, hasBusinessAccess(user))
  const applicationProcess = opportunity.applicationProcess
  const applicationURL = opportunity.applicationURL
  const needsCv =
    applicationProcess === 'cv_upload' ||
    applicationProcess === 'both' ||
    !applicationProcess
  const externalOnly = applicationProcess === 'external_link' && applicationURL

  const handleCvUpload = async (file: File) => {
    if (!user) return
    setUploadingCv(true)
    setError('')
    try {
      const url = await uploadFileToFirebase(
        file,
        `applications/${opportunity.id}/${user.id}`,
        `applications/${opportunity.id}/${user.id}/cv-${Date.now()}.${file.name.split('.').pop() || 'pdf'}`
      )
      setResumeUrl(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'CV upload failed')
    } finally {
      setUploadingCv(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setError('You must be signed in to apply.')
      return
    }
    if (genderBlock || memberBlock) {
      setError(genderBlock || memberBlock || 'Cannot apply.')
      return
    }
    if (needsCv && !resumeUrl && !coverLetter.trim()) {
      setError('Please upload a CV or add a cover letter.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const fullName =
        `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
      const profile = user as {
        jobTitle?: string
        title?: string
        locationLabel?: string
        location?: { city?: string; formattedAddress?: string } | string
        education?: string
        experience?: string
        volunteeredHours?: number
        volunteerHours?: number
      }
      const locationLabel =
        profile.locationLabel ||
        (typeof profile.location === 'string'
          ? profile.location
          : profile.location?.formattedAddress || profile.location?.city || '')
      await applyToOpportunity(
        opportunity,
        {
          id: user.id,
          name: fullName,
          email: user.email,
          phone: user.phone,
          avatarUrl: user.avatarUrl,
          title: profile.jobTitle || profile.title || '',
          location: locationLabel,
          education: profile.education || '',
          experience: profile.experience || '',
          volunteerHours: Number(profile.volunteeredHours ?? profile.volunteerHours ?? 0) || 0,
        },
        coverLetter,
        resumeUrl
      )
      try {
        const token = await auth.currentUser?.getIdToken()
        if (token && opportunity.businessId) {
          void fetch('/api/notifications/business-event', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              businessId: opportunity.businessId,
              type: 'job_application',
              title: 'New job application',
              message: `${fullName} applied for "${opportunity.title}"`,
              clickAction: '/business/opportunities/applicants',
            }),
          })
        }
      } catch {
        /* non-blocking */
      }
      setCoverLetter('')
      setResumeUrl('')
      onApplied()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit application. Please try again.')
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
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-secondary text-muted-foreground"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!user ? (
          <div className="p-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">Sign in to apply for this opportunity.</p>
            <a
              href={`/login?returnUrl=/opportunities`}
              className="inline-flex !bg-black !text-white px-6 py-2 rounded-lg text-sm font-semibold"
            >
              Sign in to Apply
            </a>
          </div>
        ) : isBusiness ? (
          <div className="p-6 text-sm text-muted-foreground">Business accounts cannot apply to jobs.</div>
        ) : externalOnly ? (
          <div className="p-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              Applications are handled on the company website.
            </p>
            <a
              href={applicationURL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex !bg-black !text-white px-6 py-2 rounded-lg text-sm font-semibold"
            >
              Apply on Company Website →
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {(genderBlock || memberBlock) && (
              <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                {genderBlock || memberBlock}
              </p>
            )}

            <div>
              <label htmlFor="coverLetter" className="block text-sm font-medium text-foreground mb-1">
                Cover letter / Message
              </label>
              <textarea
                id="coverLetter"
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={5}
                placeholder="Tell the business why you're a great fit..."
                disabled={Boolean(genderBlock || memberBlock)}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {needsCv && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  CV / Resume upload
                </label>
                <label className="inline-flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded-lg cursor-pointer text-sm">
                  {uploadingCv ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {uploadingCv ? 'Uploading…' : resumeUrl ? 'Replace CV' : 'Upload CV (PDF, DOC)'}
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf"
                    className="sr-only"
                    disabled={uploadingCv || Boolean(genderBlock || memberBlock)}
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) void handleCvUpload(f)
                      e.target.value = ''
                    }}
                  />
                </label>
                {resumeUrl && (
                  <p className="text-xs text-green-700 mt-2">CV uploaded successfully.</p>
                )}
              </div>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || uploadingCv || Boolean(genderBlock || memberBlock)}
                className="!bg-black !text-white px-6 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
              >
                {submitting ? 'Submitting…' : 'Submit Application'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
