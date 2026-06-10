'use client'

import React from 'react'
import { useAuth } from '@/lib/auth-context'
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
  })

  if (!user || user.role !== 'business') {
    return <div className="text-center py-8">Access Denied</div>
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      await updateDoc(doc(db, 'users', user.id), {
        businessProfile: formData,
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
    <div style={{ minHeight: '100vh', backgroundColor: '#faf9f7' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e4e1da', padding: '32px' }}>
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <div>
            <h1 style={{ color: '#111111', fontSize: '32px', fontWeight: 700 }}>
              Business Profile
            </h1>
            <p style={{ color: '#888888', marginTop: '8px' }}>
              Manage your business information
            </p>
          </div>
          {!isEditing && (
            <Button
              onClick={() => setIsEditing(true)}
              style={{
                backgroundColor: '#111111',
                color: '#ffffff',
              }}
              className="flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto p-8 space-y-6">
        <Card style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da', padding: '24px' }}>
          <div className="space-y-6">
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
              <textarea
                name="businessDescription"
                value={formData.businessDescription}
                onChange={handleChange}
                disabled={!isEditing}
                rows={4}
                placeholder="Describe your business..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #e4e1da',
                  borderRadius: '8px',
                  backgroundColor: isEditing ? '#ffffff' : '#f5f5f5',
                  color: '#111111',
                  fontFamily: 'inherit',
                }}
              />
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
        <Card style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da', padding: '24px' }}>
          <h3 style={{ color: '#111111', fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
            Membership Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
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
