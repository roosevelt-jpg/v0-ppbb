'use client'
export const dynamic = 'force-dynamic'

import React from 'react'
import { RichTextEditor } from '@/components/rich-text-editor'
import { RichTextContent } from '@/components/rich-text-content'
import { useAuth } from '@/lib/auth-context'
import { hasBusinessAccess } from '@/lib/roles'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { sanitizeForFirestore } from '@/lib/firestore-utils'
import { Save, Edit2, X, Plus } from 'lucide-react'
import { BusinessShippingSettings } from '@/components/business/business-shipping-settings'

function servicesFromProfile(profile: Record<string, unknown> | undefined | null): string[] {
  if (!profile) return []
  const raw = profile.services
  if (Array.isArray(raw)) {
    return raw.map(String).map((s) => s.trim()).filter(Boolean)
  }
  if (typeof raw === 'string') {
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }
  return []
}

function buildFormDataFromUser(user: { businessProfile?: Record<string, unknown> } | null | undefined) {
  const bp = (user?.businessProfile || {}) as Record<string, unknown>
  return {
    businessName: String(bp.businessName || ''),
    businessType: String(bp.businessType || ''),
    businessDescription: String(bp.businessDescription || ''),
    businessWebsite: String(bp.businessWebsite || ''),
    businessEmail: String(bp.businessEmail || ''),
    businessPhone: String(bp.businessPhone || ''),
    services: servicesFromProfile(bp),
  }
}

export default function BusinessProfile() {
  const { user, refreshUser } = useAuth()
  const [isEditing, setIsEditing] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [tagDraft, setTagDraft] = React.useState('')
  const [formData, setFormData] = React.useState({
    businessName: '',
    businessType: '',
    businessDescription: '',
    businessWebsite: '',
    businessEmail: '',
    businessPhone: '',
    services: [] as string[],
  })

  React.useEffect(() => {
    if (!user) return
    setFormData(buildFormDataFromUser(user))
  }, [user])

  if (!user || !hasBusinessAccess(user)) {
    return <div className="text-center py-8">Access Denied</div>
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const addServiceTag = (raw?: string) => {
    const value = (raw ?? tagDraft).trim().replace(/^,+|,+$/g, '')
    if (!value) return
    setFormData((prev) => {
      if (prev.services.some((s) => s.toLowerCase() === value.toLowerCase())) return prev
      return { ...prev, services: [...prev.services, value].slice(0, 24) }
    })
    setTagDraft('')
  }

  const removeServiceTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.filter((s) => s !== tag),
    }))
  }

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addServiceTag()
    } else if (e.key === 'Backspace' && !tagDraft && formData.services.length > 0) {
      removeServiceTag(formData.services[formData.services.length - 1])
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const services = formData.services.map((s) => s.trim()).filter(Boolean)

      const userRef = doc(db, 'users', user.id)
      const userSnap = await getDoc(userRef)
      const existingProfile =
        (userSnap.exists() ? (userSnap.data().businessProfile as Record<string, unknown>) : null) ||
        (user.businessProfile as Record<string, unknown>) ||
        {}

      const nextProfile = sanitizeForFirestore({
        ...existingProfile,
        businessName: formData.businessName.trim(),
        businessType: formData.businessType.trim(),
        businessDescription: formData.businessDescription,
        businessWebsite: formData.businessWebsite.trim(),
        businessEmail: formData.businessEmail.trim(),
        businessPhone: formData.businessPhone.trim(),
        services,
      })

      await updateDoc(userRef, {
        businessProfile: nextProfile,
        updatedAt: new Date(),
      })

      // Marketplace directory reads `businesses/{id}.services`
      const bizRef = doc(db, 'businesses', user.id)
      const bizSnap = await getDoc(bizRef)
      const bizPayload = sanitizeForFirestore({
        name: formData.businessName.trim() || existingProfile.businessName || 'Business',
        businessName: formData.businessName.trim(),
        businessType: formData.businessType.trim(),
        description: formData.businessDescription,
        website: formData.businessWebsite.trim(),
        email: formData.businessEmail.trim(),
        phone: formData.businessPhone.trim(),
        services,
        servicesOffered: services,
        ownerId: user.id,
        updatedAt: new Date(),
      })
      if (bizSnap.exists()) {
        await updateDoc(bizRef, bizPayload)
      } else {
        await setDoc(
          bizRef,
          {
            ...bizPayload,
            id: user.id,
            status: 'active',
            isActive: true,
            createdAt: new Date(),
          },
          { merge: true }
        )
      }

      await refreshUser()
      setIsEditing(false)
      alert('Profile updated successfully!')
    } catch (error) {
      console.error('[v0] Error saving profile:', error)
      alert('Error saving profile. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#faf9f7] dark:bg-neutral-950">
      <div className="bg-white dark:bg-card border-b border-[#e4e1da] dark:border-border px-4 py-6 sm:px-6 sm:py-8">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#111111] dark:text-foreground">Business Profile</h1>
            <p className="text-[#888888] mt-2 text-sm sm:text-base">Manage your business information</p>
          </div>
          {!isEditing && (
            <Button
              onClick={() => setIsEditing(true)}
              className="flex items-center justify-center gap-2 min-h-[44px] w-full sm:w-auto bg-[#111111] text-white hover:bg-neutral-800"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
        <Card className="bg-white dark:bg-card border-[#e4e1da] dark:border-border p-4 sm:p-6">
          <div className="flex flex-col gap-6">
            <div>
              <label className="block font-semibold text-[#111111] dark:text-foreground mb-2">Business Name *</label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full min-h-[44px] px-4 py-3 border border-[#e4e1da] dark:border-border rounded-lg disabled:bg-neutral-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#111111] dark:text-foreground mb-2">Business Type</label>
              <input
                type="text"
                name="businessType"
                value={formData.businessType}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="e.g., Technology, Retail, Services"
                className="w-full min-h-[44px] px-4 py-3 border border-[#e4e1da] dark:border-border rounded-lg disabled:bg-neutral-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#111111] dark:text-foreground mb-2">Description</label>
              {isEditing ? (
                <RichTextEditor
                  value={formData.businessDescription}
                  onChange={(html) =>
                    setFormData((prev) => ({ ...prev, businessDescription: html }))
                  }
                  placeholder="Describe your business..."
                />
              ) : (
                <RichTextContent
                  html={formData.businessDescription || 'No description yet.'}
                  className="text-sm text-neutral-700 dark:text-neutral-200"
                />
              )}
            </div>

            {/* Services tags — shown on marketplace directory cards */}
            <div>
              <label className="block font-semibold text-[#111111] dark:text-foreground mb-2">Services tags</label>
              <p className="text-xs text-neutral-500 dark:text-muted-foreground mb-2">
                Add the services you offer. These appear on your marketplace profile.
              </p>

              <div className="flex flex-wrap gap-2 min-h-[28px]">
                {formData.services.length === 0 && !isEditing ? (
                  <p className="text-sm text-neutral-500 dark:text-muted-foreground">No service tags yet. Click Edit to add some.</p>
                ) : (
                  formData.services.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-foreground border border-neutral-200 dark:border-border"
                    >
                      {tag}
                      {isEditing ? (
                        <button
                          type="button"
                          onClick={() => removeServiceTag(tag)}
                          className="ml-0.5 rounded-full p-0.5 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                          aria-label={`Remove ${tag}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      ) : null}
                    </span>
                  ))
                )}
              </div>

              {isEditing ? (
                <div className="mt-3 flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={tagDraft}
                    onChange={(e) => setTagDraft(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder="Type a service and press Enter"
                    className="flex-1 min-h-[44px] px-4 py-3 border border-[#e4e1da] dark:border-border rounded-lg"
                    maxLength={48}
                  />
                  <Button
                    type="button"
                    onClick={() => addServiceTag()}
                    disabled={!tagDraft.trim()}
                    className="min-h-[44px] bg-black text-white hover:bg-neutral-800 inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add tag
                  </Button>
                </div>
              ) : null}
            </div>

            <div>
              <label className="block font-semibold text-[#111111] dark:text-foreground mb-2">Website</label>
              <input
                type="url"
                name="businessWebsite"
                value={formData.businessWebsite}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="https://example.com"
                className="w-full min-h-[44px] px-4 py-3 border border-[#e4e1da] dark:border-border rounded-lg disabled:bg-neutral-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#111111] dark:text-foreground mb-2">Business Email</label>
              <input
                type="email"
                name="businessEmail"
                value={formData.businessEmail}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full min-h-[44px] px-4 py-3 border border-[#e4e1da] dark:border-border rounded-lg disabled:bg-neutral-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#111111] dark:text-foreground mb-2">Business Phone</label>
              <input
                type="tel"
                name="businessPhone"
                value={formData.businessPhone}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full min-h-[44px] px-4 py-3 border border-[#e4e1da] dark:border-border rounded-lg disabled:bg-neutral-100"
              />
            </div>

            {isEditing && (
              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  onClick={() => void handleSave()}
                  disabled={isSaving}
                  className="min-h-[44px] bg-[#111111] text-white hover:bg-neutral-800 inline-flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Saving…' : 'Save Changes'}
                </Button>
                <Button
                  onClick={() => {
                    setFormData(buildFormDataFromUser(user))
                    setIsEditing(false)
                  }}
                  className="min-h-[44px] bg-[#e4e1da] text-[#111111] dark:text-foreground hover:bg-neutral-300"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </Card>

        <BusinessShippingSettings />

        <Card className="bg-white dark:bg-card border-[#e4e1da] dark:border-border p-4 sm:p-6 mt-6">
          <h3 className="text-lg font-semibold text-[#111111] dark:text-foreground mb-4">Membership Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <p className="text-sm text-[#888888]">Membership Tier</p>
              <p className="font-semibold text-[#111111] dark:text-foreground mt-1">
                {user.businessProfile?.membership || 'Partner'}
              </p>
            </div>
            <div>
              <p className="text-sm text-[#888888]">Member Since</p>
              <p className="font-semibold text-[#111111] dark:text-foreground mt-1">
                {user.memberSince ? new Date(user.memberSince).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-[#888888]">Active Opportunities</p>
              <p className="font-semibold text-[#111111] dark:text-foreground mt-1">
                {user.businessProfile?.activeOpportunities || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-[#888888]">Revenue Generated</p>
              <p className="font-semibold text-[#111111] dark:text-foreground mt-1">
                AED {user.businessProfile?.revenue || 0}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
