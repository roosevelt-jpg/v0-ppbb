'use client'
export const dynamic = 'force-dynamic'

import React from 'react'
import { RichTextEditor } from '@/components/rich-text-editor'
import { RichTextContent } from '@/components/rich-text-content'
import { useAuth } from '@/lib/auth-context'
import { hasBusinessAccess } from '@/lib/roles'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Save, Edit2 } from 'lucide-react'

export default function BusinessProfile() {
  const { user } = useAuth()
  const router = useRouter()
  const [isEditing, setIsEditing] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [formData, setFormData] = React.useState({
    businessName: user?.businessProfile?.businessName || '',
    businessType: user?.businessProfile?.businessType || '',
    businessDescription: user?.businessProfile?.businessDescription || '',
    businessWebsite: user?.businessProfile?.businessWebsite || '',
    businessEmail: user?.businessProfile?.businessEmail || '',
    businessPhone: user?.businessProfile?.businessPhone || '',
    services:
      Array.isArray((user?.businessProfile as { services?: string[] } | undefined)?.services)
        ? ((user?.businessProfile as { services?: string[] }).services || []).join(', ')
        : typeof (user?.businessProfile as { services?: string } | undefined)?.services === 'string'
          ? String((user?.businessProfile as { services?: string }).services)
          : '',
  })

  if (!user || (!hasBusinessAccess(user))) {
    return <div className="text-center py-8">Access Denied</div>
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const services = formData.services
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      await updateDoc(doc(db, 'users', user.id), {
        businessProfile: {
          ...formData,
          services,
        },
        updatedAt: new Date(),
      })
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
    <div className="min-h-screen bg-[#faf9f7]">
      <div className="bg-white border-b border-[#e4e1da] px-4 py-6 sm:px-6 sm:py-8">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#111111]">Business Profile</h1>
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
        <Card className="bg-white border-[#e4e1da] p-4 sm:p-6">
          <div className="flex flex-col gap-6">
            {/* Business Name */}
            <div>
              <label style={{ color: '#111111', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                Business Name *
              </label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                disabled={!isEditing}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #e4e1da',
                  borderRadius: '8px',
                  backgroundColor: isEditing ? '#ffffff' : '#f5f5f5',
                  color: '#111111',
                }}
              />
            </div>

            {/* Business Type */}
            <div>
              <label style={{ color: '#111111', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                Business Type
              </label>
              <input
                type="text"
                name="businessType"
                value={formData.businessType}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="e.g., Technology, Retail, Services"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #e4e1da',
                  borderRadius: '8px',
                  backgroundColor: isEditing ? '#ffffff' : '#f5f5f5',
                  color: '#111111',
                }}
              />
            </div>

            {/* Business Description */}
            <div>
              <label style={{ color: '#111111', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                Description
              </label>
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
                  className="text-sm text-neutral-700"
                />
              )}
            </div>

            {/* Services tags */}
            <div>
              <label style={{ color: '#111111', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                Services / tags
              </label>
              <input
                type="text"
                name="services"
                value={formData.services}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Comma-separated, e.g. Consulting, Catering, Mentorship"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #e4e1da',
                  borderRadius: '8px',
                  backgroundColor: isEditing ? '#ffffff' : '#f5f5f5',
                  color: '#111111',
                }}
              />
              {!isEditing && formData.services ? (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.services
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-1 rounded bg-neutral-100 text-neutral-700"
                      >
                        {tag}
                      </span>
                    ))}
                </div>
              ) : null}
            </div>

            {/* Website */}
            <div>
              <label style={{ color: '#111111', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                Website
              </label>
              <input
                type="url"
                name="businessWebsite"
                value={formData.businessWebsite}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="https://example.com"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #e4e1da',
                  borderRadius: '8px',
                  backgroundColor: isEditing ? '#ffffff' : '#f5f5f5',
                  color: '#111111',
                }}
              />
            </div>

            {/* Business Email */}
            <div>
              <label style={{ color: '#111111', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                Business Email
              </label>
              <input
                type="email"
                name="businessEmail"
                value={formData.businessEmail}
                onChange={handleChange}
                disabled={!isEditing}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #e4e1da',
                  borderRadius: '8px',
                  backgroundColor: isEditing ? '#ffffff' : '#f5f5f5',
                  color: '#111111',
                }}
              />
            </div>

            {/* Business Phone */}
            <div>
              <label style={{ color: '#111111', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                Business Phone
              </label>
              <input
                type="tel"
                name="businessPhone"
                value={formData.businessPhone}
                onChange={handleChange}
                disabled={!isEditing}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #e4e1da',
                  borderRadius: '8px',
                  backgroundColor: isEditing ? '#ffffff' : '#f5f5f5',
                  color: '#111111',
                }}
              />
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex gap-4 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  style={{
                    backgroundColor: '#111111',
                    color: '#ffffff',
                    padding: '12px 24px',
                  }}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  onClick={() => setIsEditing(false)}
                  style={{
                    backgroundColor: '#e4e1da',
                    color: '#111111',
                    padding: '12px 24px',
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Membership Info */}
        <Card className="bg-white border-[#e4e1da] p-4 sm:p-6 mt-6">
          <h3 className="text-lg font-semibold text-[#111111] mb-4">Membership Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <p style={{ color: '#888888', fontSize: '14px' }}>Membership Tier</p>
              <p style={{ color: '#111111', fontWeight: 600, marginTop: '4px' }}>
                {user.businessProfile?.membership || 'Partner'}
              </p>
            </div>
            <div>
              <p style={{ color: '#888888', fontSize: '14px' }}>Member Since</p>
              <p style={{ color: '#111111', fontWeight: 600, marginTop: '4px' }}>
                {user.memberSince ? new Date(user.memberSince).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <p style={{ color: '#888888', fontSize: '14px' }}>Active Opportunities</p>
              <p style={{ color: '#111111', fontWeight: 600, marginTop: '4px' }}>
                {user.businessProfile?.activeOpportunities || 0}
              </p>
            </div>
            <div>
              <p style={{ color: '#888888', fontSize: '14px' }}>Revenue Generated</p>
              <p style={{ color: '#111111', fontWeight: 600, marginTop: '4px' }}>
                AED {user.businessProfile?.revenue || 0}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
