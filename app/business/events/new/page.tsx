'use client'

export const dynamic = 'force-dynamic'
import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { hasBusinessAccess } from '@/lib/roles'
import { ChevronLeft, Upload, X } from 'lucide-react'

export default function NewEventPage() {
  const { user } = useAuth()
  const router = useRouter()
  
  const [formData, setFormData] = React.useState({
    title: '',
    description: '',
    category: 'general',
    genderRestriction: 'mixed',
    locationName: '',
    locationAddress: '',
    startDate: '',
    endTime: '',
    pricingType: 'free',
    price: '',
    currency: 'AED',
  })

  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!user || !hasBusinessAccess(user)) {
      router.push('/login')
    }
  }, [user])

  const handleSave = async (status: 'draft' | 'pending_approval') => {
    setSaving(true)
    setError(null)

    try {
      if (!formData.title.trim() || !formData.description.trim() || !formData.startDate) {
        throw new Error('Please fill in all required fields')
      }

      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: formData.pricingType === 'free' ? null : parseFloat(formData.price),
          status,
          createdBy: user?.id,
          createdByRole: 'business',
        }),
      })

      const json = await res.json()
      if (json.success) {
        router.push(status === 'pending_approval' ? '/business/events?tab=pending_approval' : '/business/events')
      } else {
        setError(json.error || 'Failed to create event')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating event')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#fafafa' }}>
      {/* Sidebar */}
      <div style={{ width: '280px', backgroundColor: '#ffffff', borderRight: '1px solid #e4e1da', padding: '24px' }}>
        <Link href="/business/events" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#111111', textDecoration: 'none', marginBottom: '32px' }}>
          <ChevronLeft size={20} />
          Back
        </Link>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '40px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#111111', marginBottom: '32px' }}>
          Create New Event
        </h1>

        {error && (
          <div style={{ padding: '16px', backgroundColor: '#ffebee', borderColor: '#ffcccc', color: '#c62828', border: '1px solid', borderRadius: '6px', marginBottom: '24px' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Basic Info */}
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#111111' }}>Basic Information</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#111111' }}>Event Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e4e1da',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#111111' }}>Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e4e1da',
                    borderRadius: '6px',
                    fontSize: '14px',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#111111' }}>Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #e4e1da',
                      borderRadius: '6px',
                      fontSize: '14px',
                    }}
                  >
                    <option>general</option>
                    <option>workshop</option>
                    <option>gala</option>
                    <option>seminar</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#111111' }}>Audience</label>
                  <select
                    value={formData.genderRestriction}
                    onChange={(e) => setFormData({ ...formData, genderRestriction: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #e4e1da',
                      borderRadius: '6px',
                      fontSize: '14px',
                    }}
                  >
                    <option value="mixed">Mixed</option>
                    <option value="ladies-only">Ladies Only</option>
                    <option value="men-only">Men Only</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#111111' }}>Location</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#111111' }}>Venue Name *</label>
                <input
                  type="text"
                  value={formData.locationName}
                  onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e4e1da',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#111111' }}>Address *</label>
                <input
                  type="text"
                  value={formData.locationAddress}
                  onChange={(e) => setFormData({ ...formData, locationAddress: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e4e1da',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#111111' }}>Date & Time</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#111111' }}>Start Date *</label>
                <input
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e4e1da',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#111111' }}>End Time</label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e4e1da',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#111111' }}>Pricing</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#111111' }}>Event Type</label>
                <select
                  value={formData.pricingType}
                  onChange={(e) => setFormData({ ...formData, pricingType: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e4e1da',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                >
                  <option value="free">Free</option>
                  <option value="paid_by_business">Paid</option>
                </select>
              </div>

              {formData.pricingType !== 'free' && (
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#111111' }}>Price (AED)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    min="0"
                    step="0.01"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #e4e1da',
                      borderRadius: '6px',
                      fontSize: '14px',
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '24px', borderTop: '1px solid #e4e1da', flexWrap: 'wrap' }}>
            <button
              onClick={() => router.back()}
              style={{
                padding: '12px 24px',
                backgroundColor: '#ffffff',
                color: '#111111',
                border: '1px solid #e4e1da',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => handleSave('draft')}
              disabled={saving}
              style={{
                padding: '12px 24px',
                backgroundColor: '#ffffff',
                color: '#111111',
                border: '1px solid #e4e1da',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 500,
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? 'Saving...' : 'Save as Draft'}
            </button>
            <button
              onClick={() => handleSave('pending_approval')}
              disabled={saving}
              style={{
                padding: '12px 24px',
                backgroundColor: '#111111',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 500,
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? 'Submitting...' : 'Submit for Approval'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
