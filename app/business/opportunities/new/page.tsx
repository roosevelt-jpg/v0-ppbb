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

export default function NewOpportunity() {
  const { user } = useAuth()
  const router = useRouter()
  const [isSaving, setIsSaving] = React.useState(false)
  const [formData, setFormData] = React.useState({
    title: '',
    type: 'job',
    roleType: 'full_time',
    companyName: '',
    description: '',
    category: '',
    salary: 0,
    remote: false,
    locationCity: '',
    duration: '',
    hoursPerWeek: 0,
    requirements: '',
    benefits: '',
    suitableFor: [] as string[],
    genderRestriction: 'mixed' as 'male' | 'female' | 'mixed',
    applicationProcess: 'cv_upload' as 'cv_upload' | 'external_link' | 'both',
    applicationURL: '',
    deadline: '',
    posterRelation: 'employer' as 'employer' | 'connector',
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
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value,
    }))
  }

  const toggleSuitableFor = (label: string) => {
    setFormData((prev) => {
      const next = prev.suitableFor.includes(label)
        ? prev.suitableFor.filter((s) => s !== label)
        : [...prev.suitableFor, label]
      let genderRestriction: 'male' | 'female' | 'mixed' = 'mixed'
      if (next.includes('Women Only')) genderRestriction = 'female'
      else if (next.includes('Men Only')) genderRestriction = 'male'
      return { ...prev, suitableFor: next, genderRestriction }
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
      const res = await fetch('/api/business/opportunities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          businessName: user.businessProfile?.businessName || 'Unknown',
          companyName: formData.companyName || user.businessProfile?.businessName || 'Unknown',
          requirements: formData.requirements.split('\n').filter((r) => r.trim()),
          benefits: formData.benefits.split('\n').filter((b) => b.trim()),
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
      {/* Header */}
      <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e4e1da', padding: '32px' }}>
        <div className="max-w-2xl mx-auto">
          <h1
            style={{ color: '#111111', fontSize: '32px', fontWeight: 700, fontFamily: 'Cormorant Garamond, serif' }}
          >
            Post New Opportunity
          </h1>
          <p style={{ color: '#888888', marginTop: '8px', fontFamily: 'Inter, sans-serif' }}>
            Share a job, internship, or gig — submitted for admin approval before it goes live
          </p>
        </div>
      </div>

      {/* Form */}
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px' }}>
        <Card style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da', padding: '24px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Title */}
            <div>
              <label style={{ color: '#111111', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                Opportunity Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="e.g., Senior React Developer"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #e4e1da',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff',
                  color: '#111111',
                }}
              />
            </div>

            {/* Type and Category */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ color: '#111111', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                  Type *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #e4e1da',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    color: '#111111',
                  }}
                >
                  <option value="job">Job</option>
                  <option value="internship">Internship</option>
                  <option value="gig">Gig</option>
                  <option value="volunteer">Volunteer</option>
                  <option value="contract">Contract</option>
                </select>
              </div>
              <div>
                <label style={{ color: '#111111', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                  Category *
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Technology, Marketing"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #e4e1da',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    color: '#111111',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ color: '#111111', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                Company / Organization Name
              </label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="Your company or organization name"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #e4e1da',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff',
                  color: '#111111',
                }}
              />
            </div>

            <div>
              <label style={{ color: '#111111', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                Employment Type
              </label>
              <select
                name="roleType"
                value={formData.roleType}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #e4e1da',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff',
                  color: '#111111',
                }}
              >
                <option value="full_time">Full Time</option>
                <option value="part_time">Part Time</option>
                <option value="freelance">Freelance</option>
                <option value="volunteer">Volunteer</option>
                <option value="internship">Internship</option>
                <option value="contract">Contract</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label style={{ color: '#111111', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                Description *
              </label>
              <RichTextEditor
                value={formData.description}
                onChange={(html) => setFormData((prev) => ({ ...prev, description: html }))}
                placeholder="Describe the opportunity in detail..."
                minHeight={180}
              />
            </div>

            {/* Salary and Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={{ color: '#111111', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                  Salary (AED) or Hourly Rate
                </label>
                <input
                  type="number"
                  name="salary"
                  value={formData.salary}
                  onChange={handleChange}
                  placeholder="0"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #e4e1da',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    color: '#111111',
                  }}
                />
              </div>
              <div>
                <label style={{ color: '#111111', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                  Duration
                </label>
                <input
                  type="text"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  placeholder="e.g., 3 months, Full-time"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #e4e1da',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    color: '#111111',
                  }}
                />
              </div>
            </div>

            {/* Hours Per Week and Remote */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={{ color: '#111111', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                  Hours Per Week
                </label>
                <input
                  type="number"
                  name="hoursPerWeek"
                  value={formData.hoursPerWeek}
                  onChange={handleChange}
                  placeholder="0"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #e4e1da',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    color: '#111111',
                  }}
                />
              </div>
              <div className="flex items-end">
                <label style={{ color: '#111111', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    name="remote"
                    checked={formData.remote}
                    onChange={handleChange}
                  />
                  Remote Position
                </label>
              </div>
            </div>

            {!formData.remote && (
              <div>
                <label style={{ color: '#111111', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                  Location / City
                </label>
                <input
                  type="text"
                  name="locationCity"
                  value={formData.locationCity}
                  onChange={handleChange}
                  placeholder="e.g. Dubai, UAE"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #e4e1da',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    color: '#111111',
                  }}
                />
              </div>
            )}

            <div>
              <label style={{ color: '#111111', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                Who is this suitable for?
              </label>
              <div className="flex flex-wrap gap-3">
                {['Students', 'Graduates', 'Women Only', 'Men Only', 'Open to All'].map((label) => (
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

            <div>
              <label style={{ color: '#111111', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                Application Process
              </label>
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

            <div>
              <label style={{ color: '#111111', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                Application Deadline (optional)
              </label>
              <input
                type="date"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #e4e1da',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff',
                  color: '#111111',
                }}
              />
            </div>

            <div>
              <label style={{ color: '#111111', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                Your relation to this opportunity
              </label>
              <div className="flex flex-wrap gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={formData.posterRelation === 'employer'}
                    onChange={() => setFormData((p) => ({ ...p, posterRelation: 'employer' }))}
                  />
                  Employer
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={formData.posterRelation === 'connector'}
                    onChange={() => setFormData((p) => ({ ...p, posterRelation: 'connector' }))}
                  />
                  Connector
                </label>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={formData.isMemberOnly}
                onChange={(e) => setFormData((p) => ({ ...p, isMemberOnly: e.target.checked }))}
              />
              Restrict to platform members only
            </label>

            {/* Requirements */}
            <div>
              <label style={{ color: '#111111', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                Requirements (one per line)
              </label>
              <textarea
                name="requirements"
                value={formData.requirements}
                onChange={handleChange}
                rows={3}
                placeholder="3+ years experience&#10;React expertise&#10;..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #e4e1da',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff',
                  color: '#111111',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            {/* Benefits */}
            <div>
              <label style={{ color: '#111111', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                Benefits (one per line)
              </label>
              <textarea
                name="benefits"
                value={formData.benefits}
                onChange={handleChange}
                rows={3}
                placeholder="Health insurance&#10;Flexible hours&#10;..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #e4e1da',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff',
                  color: '#111111',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            {/* Buttons */}
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
                Save as Draft
              </Button>
              <Button
                type="button"
                onClick={() => router.back()}
                style={{
                  backgroundColor: '#e4e1da',
                  color: '#111111',
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
