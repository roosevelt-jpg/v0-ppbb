'use client'
export const dynamic = 'force-dynamic'

import React from 'react'
import { useAuth } from '@/lib/auth-context'
import { hasBusinessAccess } from '@/lib/roles'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { auth } from '@/lib/firebase'
import { RichTextEditor } from '@/components/rich-text-editor'

const UAE_EMIRATES = [
  'Abu Dhabi',
  'Dubai',
  'Sharjah',
  'Ajman',
  'Umm Al Quwain',
  'Ras Al Khaimah',
  'Fujairah',
]

const ROLE_TYPES = [
  { value: 'freelance', label: 'Freelance' },
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'internship', label: 'Internship' },
  { value: 'training', label: 'Training' },
  { value: 'volunteer', label: 'Volunteer' },
  { value: 'contract', label: 'Contract' },
]

const WORK_TYPES = [
  { value: 'onsite', label: 'Onsite' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
]

const SUITABILITY = [
  'Ladies Only',
  'Men Only',
  'Fresh Graduates',
  'Experienced 5yrs+',
]

const fieldStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  border: '1px solid #e4e1da',
  borderRadius: '8px',
  backgroundColor: '#ffffff',
  color: '#111111',
}

const labelStyle: React.CSSProperties = {
  color: '#111111',
  fontWeight: 600,
  display: 'block',
  marginBottom: '8px',
}

export default function NewOpportunity() {
  const { user } = useAuth()
  const router = useRouter()
  const [isSaving, setIsSaving] = React.useState(false)
  const [formData, setFormData] = React.useState({
    title: '',
    companyName: '',
    roleType: 'full_time',
    locationType: 'onsite',
    locationCity: '',
    locationLink: '',
    responsibilities: '',
    requirements: '',
    compensation: '',
    category: '',
    suitableFor: [] as string[],
    deadline: '',
    hiringBy: '',
    description: '',
    applicationProcess: 'cv_upload' as 'cv_upload' | 'external_link' | 'both',
    applicationURL: '',
    isMemberOnly: false,
  })

  React.useEffect(() => {
    if (user?.businessProfile?.businessName) {
      setFormData((prev) => ({
        ...prev,
        companyName: prev.companyName || user.businessProfile?.businessName || '',
      }))
    }
  }, [user?.businessProfile?.businessName])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const toggleSuitableFor = (label: string) => {
    setFormData((prev) => {
      const next = prev.suitableFor.includes(label)
        ? prev.suitableFor.filter((s) => s !== label)
        : [...prev.suitableFor, label]
      return { ...prev, suitableFor: next }
    })
  }

  const submitOpportunity = async (isDraft: boolean) => {
    if (!user) return

    try {
      setIsSaving(true)
      const token = await auth.currentUser?.getIdToken()
      if (!token) {
        alert('Please sign in again to post a job.')
        return
      }

      const locationValue =
        formData.locationType === 'remote'
          ? 'Remote'
          : formData.locationCity || formData.locationLink || ''

      const res = await fetch('/api/business/opportunities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          companyName: formData.companyName || user.businessProfile?.businessName || 'Unknown',
          businessName: user.businessProfile?.businessName || formData.companyName || 'Unknown',
          roleType: formData.roleType,
          category: formData.category,
          type: formData.roleType === 'internship' || formData.roleType === 'volunteer'
            ? formData.roleType
            : formData.roleType === 'freelance' || formData.roleType === 'contract'
              ? 'gig'
              : 'job',
          locationType: formData.locationType,
          remote: formData.locationType === 'remote',
          locationCity: locationValue,
          location: locationValue,
          responsibilities: formData.responsibilities,
          requirements: formData.requirements.split('\n').filter((r) => r.trim()),
          compensation: formData.compensation,
          suitableFor: formData.suitableFor,
          deadline: formData.deadline || null,
          hiringBy: formData.hiringBy || null,
          description: formData.description || formData.responsibilities,
          applicationProcess: formData.applicationProcess,
          applicationURL: formData.applicationURL || null,
          isMemberOnly: formData.isMemberOnly,
          status: isDraft ? 'draft' : 'pending_approval',
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        alert(json.error || 'Error posting opportunity. Please try again.')
        return
      }
      alert(
        isDraft
          ? 'Draft saved.'
          : 'Job submitted for admin approval. It will appear publicly once approved.'
      )
      router.push('/business/opportunities')
    } catch (error) {
      console.error('[v0] Error posting opportunity:', error)
      alert('Error posting opportunity. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await submitOpportunity(false)
  }

  if (!user || (!hasBusinessAccess(user))) {
    return <div className="text-center py-8">Access Denied</div>
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#faf9f7' }}>
      <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e4e1da', padding: '32px' }}>
        <div className="max-w-2xl mx-auto">
          <h1
            style={{ color: '#111111', fontSize: '32px', fontWeight: 700, fontFamily: 'Cormorant Garamond, serif' }}
          >
            Post Work Opportunity
          </h1>
          <p style={{ color: '#888888', marginTop: '8px', fontFamily: 'Inter, sans-serif' }}>
            Fill in the details below — submitted for admin approval before it goes live
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px' }}>
        <Card style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da', padding: '24px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <label style={labelStyle}>1. Job Title / Opportunity Name *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="e.g., Community Outreach Coordinator"
                style={fieldStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>2. Company / Organization Name</label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="Defaults to your organization"
                style={fieldStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>3. Role Type *</label>
              <select
                name="roleType"
                value={formData.roleType}
                onChange={handleChange}
                required
                style={fieldStyle}
              >
                {ROLE_TYPES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>4. Work Type *</label>
              <select
                name="locationType"
                value={formData.locationType}
                onChange={handleChange}
                required
                style={fieldStyle}
              >
                {WORK_TYPES.map((w) => (
                  <option key={w.value} value={w.value}>
                    {w.label}
                  </option>
                ))}
              </select>
            </div>

            {formData.locationType !== 'remote' && (
              <div className="space-y-3">
                <label style={labelStyle}>5. Location</label>
                <select
                  name="emirateSelect"
                  value={UAE_EMIRATES.includes(formData.locationCity) ? formData.locationCity : ''}
                  onChange={(e) => {
                    if (!e.target.value) return
                    setFormData((p) => ({ ...p, locationCity: e.target.value, locationLink: '' }))
                  }}
                  style={fieldStyle}
                >
                  <option value="">Select UAE emirate…</option>
                  {UAE_EMIRATES.map((em) => (
                    <option key={em} value={em}>
                      {em}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  name="locationCity"
                  value={formData.locationCity}
                  onChange={handleChange}
                  placeholder="Or type area / Google Maps link"
                  style={fieldStyle}
                />
              </div>
            )}

            <div>
              <label style={labelStyle}>6. Key Responsibilities (brief)</label>
              <textarea
                name="responsibilities"
                value={formData.responsibilities}
                onChange={handleChange}
                rows={4}
                placeholder="Summarize the main responsibilities…"
                style={{ ...fieldStyle, fontFamily: 'inherit' }}
              />
            </div>

            <div>
              <label style={labelStyle}>7. Requirements / Skills Needed</label>
              <textarea
                name="requirements"
                value={formData.requirements}
                onChange={handleChange}
                rows={4}
                placeholder="One skill or requirement per line"
                style={{ ...fieldStyle, fontFamily: 'inherit' }}
              />
            </div>

            <div>
              <label style={labelStyle}>8. Salary / Compensation</label>
              <input
                type="text"
                name="compensation"
                value={formData.compensation}
                onChange={handleChange}
                placeholder="e.g., AED 5,000/month, Unpaid, Stipend"
                style={fieldStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>12. Industry / Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                style={fieldStyle}
              >
                <option value="">Select industry…</option>
                {[
                  'Technology',
                  'HR',
                  'Retail',
                  'Real Estate',
                  'Automotive',
                  'F&B',
                  'Hospitality',
                  'Health & Fitness',
                  'Consultancy',
                  'Business',
                  'Education',
                  'Nonprofit',
                  'Other',
                ].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>9. Suitability</label>
              <div className="flex flex-wrap gap-3">
                {SUITABILITY.map((label) => (
                  <label key={label} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={formData.suitableFor.includes(label)}
                      onChange={() => toggleSuitableFor(label)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label style={labelStyle}>10. Application Deadline</label>
                <input
                  type="date"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleChange}
                  style={fieldStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>11. Hiring By</label>
                <input
                  type="date"
                  name="hiringBy"
                  value={formData.hiringBy}
                  onChange={handleChange}
                  style={fieldStyle}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Full description (optional)</label>
              <RichTextEditor
                value={formData.description}
                onChange={(html) => setFormData((prev) => ({ ...prev, description: html }))}
                placeholder="Additional details for applicants…"
                minHeight={140}
              />
            </div>

            <div>
              <label style={labelStyle}>Application Process</label>
              <div className="flex flex-wrap gap-4 text-sm">
                {(
                  [
                    ['cv_upload', 'CV Upload on Platform'],
                    ['external_link', 'External Link'],
                    ['both', 'Both'],
                  ] as const
                ).map(([value, label]) => (
                  <label key={value} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="applicationProcess"
                      checked={formData.applicationProcess === value}
                      onChange={() => setFormData((p) => ({ ...p, applicationProcess: value }))}
                    />
                    {label}
                  </label>
                ))}
              </div>
              {(formData.applicationProcess === 'external_link' ||
                formData.applicationProcess === 'both') && (
                <input
                  type="url"
                  name="applicationURL"
                  value={formData.applicationURL}
                  onChange={handleChange}
                  placeholder="https://yourcompany.com/careers/apply"
                  className="mt-3 w-full px-3 py-2 border border-neutral-300 rounded-lg"
                />
              )}
            </div>

            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={formData.isMemberOnly}
                onChange={(e) => setFormData((p) => ({ ...p, isMemberOnly: e.target.checked }))}
              />
              Restrict to platform members only
            </label>

            <div className="flex flex-wrap gap-4 pt-4">
              <Button
                type="submit"
                disabled={isSaving}
                style={{
                  backgroundColor: '#111111',
                  color: '#ffffff',
                  padding: '12px 24px',
                }}
              >
                {isSaving ? 'Posting...' : 'Post Opportunity'}
              </Button>
              <Button
                type="button"
                disabled={isSaving}
                onClick={() => void submitOpportunity(true)}
                style={{
                  backgroundColor: '#ffffff',
                  color: '#111111',
                  border: '1px solid #e4e1da',
                  padding: '12px 24px',
                }}
              >
                Save Draft
              </Button>
              <Button
                type="button"
                onClick={() => router.back()}
                style={{
                  backgroundColor: 'transparent',
                  color: '#666666',
                  padding: '12px 24px',
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
