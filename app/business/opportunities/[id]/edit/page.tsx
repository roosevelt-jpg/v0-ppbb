'use client'

export const dynamic = 'force-dynamic'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { hasBusinessAccess } from '@/lib/roles'
import { getOpportunityById, updateOpportunity } from '@/lib/business-queries'
import type { BusinessOpportunity } from '@/lib/types'
import {
  INDUSTRY_OPTIONS,
  ROLE_TYPE_FORM_OPTIONS,
  SUITABILITY_OPTIONS,
  UAE_EMIRATES,
  WORK_TYPE_FORM_OPTIONS,
  getWorkType,
  normalizeRoleType,
  roleTypeToLegacyType,
  toDate,
} from '@/lib/opportunity-utils'
import { htmlToPlainText } from '@/lib/cms-page-content'

function toDateInput(value: unknown): string {
  const d = toDate(value)
  if (!d) return ''
  return d.toISOString().slice(0, 10)
}

function asText(value: unknown): string {
  if (Array.isArray(value)) return value.map(String).join('\n')
  return typeof value === 'string' ? value : ''
}

const fieldClass =
  'w-full min-h-[44px] px-3 py-2 border border-[#e4e1da] rounded-lg bg-white text-sm'

export default function EditJobPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const id = params.id as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
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
  })

  useEffect(() => {
    if (authLoading) return
    if (!user || !hasBusinessAccess(user)) {
      router.push('/login')
      return
    }
    void getOpportunityById(id).then((job) => {
      if (!job) {
        setLoading(false)
        return
      }
      const locationRaw = String(
        (job as { locationCity?: string }).locationCity || job.locationText || ''
      )
      const isMapsLink = /^https?:\/\//i.test(locationRaw)
      setFormData({
        title: job.title || '',
        companyName:
          (job as { companyName?: string }).companyName || job.businessName || '',
        roleType: normalizeRoleType(job.roleType || job.type),
        locationType: getWorkType(job),
        locationCity: isMapsLink ? '' : locationRaw,
        locationLink: isMapsLink ? locationRaw : '',
        responsibilities: asText(job.responsibilities),
        requirements: asText(job.requirements),
        compensation: job.compensation || (job.salary != null ? String(job.salary) : ''),
        category: job.category || '',
        suitableFor: Array.isArray(job.suitableFor) ? job.suitableFor.map(String) : [],
        deadline: toDateInput(job.deadline),
        hiringBy: toDateInput(job.hiringBy),
        description: htmlToPlainText(job.description || ''),
      })
      setLoading(false)
    })
  }, [id, user, authLoading, router])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const toggleSuitableFor = (label: string) => {
    setFormData((prev) => {
      const next = prev.suitableFor.includes(label)
        ? prev.suitableFor.filter((s) => s !== label)
        : [...prev.suitableFor, label]
      return { ...prev, suitableFor: next }
    })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const locationValue =
        formData.locationType === 'remote'
          ? 'Remote'
          : formData.locationLink.trim() || formData.locationCity || ''

      const payload: Partial<BusinessOpportunity> = {
        title: formData.title,
        companyName: formData.companyName,
        roleType: formData.roleType,
        type: roleTypeToLegacyType(formData.roleType),
        locationType: formData.locationType,
        remote: formData.locationType === 'remote',
        locationCity: locationValue,
        locationText: locationValue,
        responsibilities: formData.responsibilities
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        requirements: formData.requirements
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        compensation: formData.compensation,
        category: formData.category,
        suitableFor: formData.suitableFor,
        deadline: formData.deadline ? new Date(formData.deadline) : undefined,
        hiringBy: formData.hiringBy || null,
        description: htmlToPlainText(formData.description || formData.responsibilities),
      }

      await updateOpportunity(id, payload)
      router.push('/business/opportunities')
    } catch {
      alert('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) return <p className="p-8">Loading…</p>
  if (!user || !hasBusinessAccess(user)) return <p className="p-8">Access Denied</p>

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-8">
      <h1 className="text-2xl font-bold mb-2">Edit Job / Gig</h1>
      <p className="text-sm text-neutral-600 mb-6">
        Same fields as the shared opportunity form (single Role Type — no separate Employment Type)
      </p>
      <form onSubmit={handleSave} className="space-y-5 bg-white border border-[#e4e1da] rounded-lg p-6">
        <div>
          <label className="block text-sm font-semibold mb-1">1. Job Title / Opportunity Name *</label>
          <input
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={fieldClass}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">2. Company / Organization Name</label>
          <input
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            className={fieldClass}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">3. Role Type *</label>
          <select
            name="roleType"
            value={formData.roleType}
            onChange={handleChange}
            className={fieldClass}
            required
          >
            {ROLE_TYPE_FORM_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">4. Work Type *</label>
          <select
            name="locationType"
            value={formData.locationType}
            onChange={handleChange}
            className={fieldClass}
            required
          >
            {WORK_TYPE_FORM_OPTIONS.map((w) => (
              <option key={w.value} value={w.value}>
                {w.label}
              </option>
            ))}
          </select>
        </div>

        {formData.locationType !== 'remote' ? (
          <div className="space-y-3">
            <label className="block text-sm font-semibold mb-1">5. Location</label>
            <select
              value={(UAE_EMIRATES as readonly string[]).includes(formData.locationCity) ? formData.locationCity : ''}
              onChange={(e) => {
                if (!e.target.value) return
                setFormData((p) => ({ ...p, locationCity: e.target.value, locationLink: '' }))
              }}
              className={fieldClass}
            >
              <option value="">Select UAE emirate…</option>
              {UAE_EMIRATES.map((em) => (
                <option key={em} value={em}>
                  {em}
                </option>
              ))}
            </select>
            <input
              type="url"
              name="locationLink"
              value={formData.locationLink}
              onChange={handleChange}
              placeholder="Or paste a Google Maps link"
              className={fieldClass}
            />
            <input
              name="locationCity"
              value={formData.locationCity}
              onChange={handleChange}
              placeholder="Or type area / city"
              className={fieldClass}
            />
          </div>
        ) : null}

        <div>
          <label className="block text-sm font-semibold mb-1">6. Key Responsibilities (brief)</label>
          <textarea
            name="responsibilities"
            value={formData.responsibilities}
            onChange={handleChange}
            rows={4}
            className={fieldClass}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">7. Requirements / Skills Needed</label>
          <textarea
            name="requirements"
            value={formData.requirements}
            onChange={handleChange}
            rows={4}
            className={fieldClass}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">8. Salary / Compensation</label>
          <input
            name="compensation"
            value={formData.compensation}
            onChange={handleChange}
            className={fieldClass}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">9. Suitability</label>
          <div className="flex flex-wrap gap-3">
            {SUITABILITY_OPTIONS.map((label) => (
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
            <label className="block text-sm font-semibold mb-1">10. Application Deadline</label>
            <input
              type="date"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
              className={fieldClass}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">11. Hiring By</label>
            <input
              type="date"
              name="hiringBy"
              value={formData.hiringBy}
              onChange={handleChange}
              className={fieldClass}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">12. Industry / Category</label>
          <select name="category" value={formData.category} onChange={handleChange} className={fieldClass}>
            <option value="">Select industry…</option>
            {INDUSTRY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Full description (optional)</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={6}
            className={`${fieldClass} min-h-[140px]`}
            placeholder="Plain text description…"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full min-h-[44px] bg-black text-white rounded-lg font-semibold disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}
