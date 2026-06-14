'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore'
import { Upload, ArrowLeft, Loader2 } from 'lucide-react'
import { Event, GenderRestriction } from '@/lib/event-types'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: { id?: string }
}

// Shared inline styles to bypass global CSS
const s = {
  input: {
    display: 'block', width: '100%', boxSizing: 'border-box' as const,
    border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px',
    fontSize: '14px', lineHeight: '1.5', outline: 'none', height: 'auto',
    backgroundColor: 'white', color: '#111',
  } as React.CSSProperties,
  label: {
    display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px',
    color: '#374151', textTransform: 'none' as const, letterSpacing: 'normal',
  } as React.CSSProperties,
  section: { display: 'flex', flexDirection: 'column' as const, gap: '16px' } as React.CSSProperties,
  sectionTitle: { fontSize: '18px', fontWeight: 600, color: '#111', margin: 0 } as React.CSSProperties,
  btnPrimary: {
    flex: 1, padding: '10px 16px', backgroundColor: '#111827', color: 'white',
    borderRadius: '8px', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
    border: 'none', height: 'auto', minHeight: '42px', display: 'flex',
    alignItems: 'center', justifyContent: 'center', gap: '8px',
  } as React.CSSProperties,
  btnSecondary: {
    flex: 1, padding: '10px 16px', backgroundColor: 'white', color: '#111',
    borderRadius: '8px', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
    border: '1px solid #d1d5db', height: 'auto', minHeight: '42px',
  } as React.CSSProperties,
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' } as React.CSSProperties,
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' } as React.CSSProperties,
}

export default function CreateEventPage({ params }: PageProps) {
  const router = useRouter()
  const isEditing = !!params?.id
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [imageFile, setImageFile] = useState<File | null>(null)

  const [formData, setFormData] = useState<Partial<Event>>({
    title: '', description: '', date: new Date(),
    startTime: '09:00', endTime: '17:00',
    location: { address: '', city: '', coordinates: { latitude: 0, longitude: 0 }, placeId: '' },
    bannerImageUrl: '', isPaid: false, price: 0, currency: 'AED',
    genderRestriction: 'mixed', dressCode: '', logistics: '',
    maxAttendees: undefined, status: 'draft',
  })

  useEffect(() => {
    if (isEditing && params?.id) {
      const loadEvent = async () => {
        setLoading(true)
        try {
          const eventDoc = await getDoc(doc(db, 'events', params.id))
          if (eventDoc.exists()) {
            const eventData = eventDoc.data() as Event
            setFormData({
              ...eventData,
              date: eventData.date instanceof Date ? eventData.date : (eventData.date as any).toDate?.() || new Date(),
            })
            if (eventData.bannerImageUrl) setImagePreview(eventData.bannerImageUrl)
          }
        } catch (error) {
          console.error('[v0] Error loading event:', error)
          alert('Failed to load event')
        } finally {
          setLoading(false)
        }
      }
      loadEvent()
    }
  }, [isEditing, params?.id])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => setImagePreview(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const uploadImageToFirebase = async (file: File): Promise<string> => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('type', 'event-banner')
    const response = await fetch('/api/upload', { method: 'POST', body: fd })
    if (!response.ok) throw new Error('Upload failed')
    const data = await response.json()
    return data.url
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!auth.currentUser) { alert('Please log in first'); return }
    if (!formData.title?.trim() || !formData.location?.address?.trim()) {
      alert('Please fill in required fields (title and location)'); return
    }
    setSaving(true)
    try {
      let bannerUrl = formData.bannerImageUrl
      if (imageFile) bannerUrl = await uploadImageToFirebase(imageFile)
      const eventData: Partial<Event> = { ...formData, bannerImageUrl: bannerUrl, updatedAt: serverTimestamp() }
      if (isEditing && params?.id) {
        await updateDoc(doc(db, 'events', params.id), eventData)
        alert('Event updated successfully!')
      } else {
        await addDoc(collection(db, 'events'), {
          ...eventData, createdBy: auth.currentUser.uid,
          createdAt: serverTimestamp(), attendees: [],
        })
        alert('Event created successfully!')
      }
      router.push('/admin/events')
    } catch (error) {
      console.error('[v0] Error saving event:', error)
      alert('Failed to save event. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '384px' }}>
      <Loader2 style={{ width: 32, height: 32 }} className="animate-spin" />
    </div>
  }

  return (
    <div style={{ width: '100%', padding: '32px' }}>
      <div style={{ maxWidth: '896px', margin: '0 auto' }}>

        {/* Back button */}
        <button onClick={() => router.back()}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px',
            background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer',
            fontSize: '14px', padding: 0, height: 'auto', minHeight: 'auto', boxShadow: 'none' }}>
          <ArrowLeft style={{ width: 16, height: 16 }} />
          Back
        </button>

        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '32px', color: '#111' }}>
            {isEditing ? 'Edit Event' : 'Create New Event'}
          </h1>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

            {/* Basic Information */}
            <div style={s.section}>
              <h2 style={s.sectionTitle}>Basic Information</h2>
              <div>
                <label style={s.label}>Event Title *</label>
                <input type="text" value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Annual Charity Gala" style={s.input} required />
              </div>
              <div>
                <label style={s.label}>Description</label>
                <textarea value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Event description and details" rows={5}
                  style={{ ...s.input, height: 'auto', resize: 'vertical' }} />
              </div>
            </div>

            {/* Date and Time */}
            <div style={s.section}>
              <h2 style={s.sectionTitle}>Date &amp; Time</h2>
              <div style={s.grid3}>
                <div>
                  <label style={s.label}>Date *</label>
                  <input type="date"
                    value={formData.date instanceof Date ? formData.date.toISOString().split('T')[0] : ''}
                    onChange={(e) => setFormData({ ...formData, date: new Date(e.target.value) })}
                    style={s.input} required />
                </div>
                <div>
                  <label style={s.label}>Start Time *</label>
                  <input type="time" value={formData.startTime || '09:00'}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    style={s.input} required />
                </div>
                <div>
                  <label style={s.label}>End Time *</label>
                  <input type="time" value={formData.endTime || '17:00'}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    style={s.input} required />
                </div>
              </div>
            </div>

            {/* Location */}
            <div style={s.section}>
              <h2 style={s.sectionTitle}>Location</h2>
              <div style={s.grid2}>
                <div>
                  <label style={s.label}>Address *</label>
                  <input type="text" value={formData.location?.address || ''}
                    onChange={(e) => setFormData({ ...formData, location: { ...formData.location!, address: e.target.value } })}
                    placeholder="Street address" style={s.input} required />
                </div>
                <div>
                  <label style={s.label}>City *</label>
                  <input type="text" value={formData.location?.city || ''}
                    onChange={(e) => setFormData({ ...formData, location: { ...formData.location!, city: e.target.value } })}
                    placeholder="City" style={s.input} required />
                </div>
              </div>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
                Note: Integrate Google Places API for autocomplete location selection
              </p>
            </div>

            {/* Event Settings */}
            <div style={s.section}>
              <h2 style={s.sectionTitle}>Event Settings</h2>
              <div style={s.grid2}>
                <div>
                  <label style={s.label}>Gender Restriction</label>
                  <select value={formData.genderRestriction || 'mixed'}
                    onChange={(e) => setFormData({ ...formData, genderRestriction: e.target.value as GenderRestriction })}
                    style={s.input}>
                    <option value="mixed">Mixed Gender</option>
                    <option value="men-only">Men Only</option>
                    <option value="ladies-only">Ladies Only</option>
                  </select>
                </div>
                <div>
                  <label style={s.label}>Event Status</label>
                  <select value={formData.status || 'draft'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    style={s.input}>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={s.label}>Dress Code</label>
                <input type="text" value={formData.dressCode || ''}
                  onChange={(e) => setFormData({ ...formData, dressCode: e.target.value })}
                  placeholder="e.g., Formal, Business Casual, Casual" style={s.input} />
              </div>
              <div>
                <label style={s.label}>Logistics &amp; Additional Info</label>
                <textarea value={formData.logistics || ''}
                  onChange={(e) => setFormData({ ...formData, logistics: e.target.value })}
                  placeholder="Transportation, accommodation, dietary requirements, etc."
                  rows={4} style={{ ...s.input, height: 'auto', resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" id="isPaid" checked={formData.isPaid || false}
                  onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })}
                  style={{ width: '16px', height: '16px', display: 'inline-block' }} />
                <label htmlFor="isPaid" style={{ ...s.label, margin: 0 }}>Paid Event</label>
              </div>
              {formData.isPaid && (
                <div style={s.grid2}>
                  <div>
                    <label style={s.label}>Price</label>
                    <input type="number" value={formData.price || 0}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                      placeholder="0" style={s.input} />
                  </div>
                  <div>
                    <label style={s.label}>Currency</label>
                    <select value={formData.currency || 'AED'}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      style={s.input}>
                      <option value="AED">AED</option>
                      <option value="USD">USD</option>
                      <option value="GBP">GBP</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                </div>
              )}
              <div>
                <label style={s.label}>Max Attendees (Optional)</label>
                <input type="number" value={formData.maxAttendees || ''}
                  onChange={(e) => setFormData({ ...formData, maxAttendees: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="Leave blank for unlimited" style={s.input} />
              </div>
            </div>

            {/* Banner Image */}
            <div style={s.section}>
              <h2 style={s.sectionTitle}>Event Banner Image</h2>
              <div style={{ border: '2px dashed #d1d5db', borderRadius: '8px', padding: '32px', textAlign: 'center', cursor: 'pointer' }}>
                <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} id="banner-upload" />
                <label htmlFor="banner-upload" style={{ cursor: 'pointer', display: 'block' }}>
                  <Upload style={{ width: 32, height: 32, margin: '0 auto 8px', color: '#9ca3af' }} />
                  <p style={{ fontSize: '14px', fontWeight: 500, margin: '0 0 4px' }}>Click to upload event banner</p>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>PNG, JPG, GIF up to 10MB</p>
                </label>
              </div>
              {imagePreview && (
                <img src={imagePreview} alt="Banner preview"
                  style={{ width: '100%', height: '192px', objectFit: 'cover', borderRadius: '8px' }} />
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '16px', paddingTop: '24px', borderTop: '1px solid #e5e7eb' }}>
              <button type="button" onClick={() => router.back()} style={s.btnSecondary}>Cancel</button>
              <button type="submit" disabled={saving} style={s.btnPrimary}>
                {saving ? <><Loader2 style={{ width: 16, height: 16 }} className="animate-spin" /> Saving...</> : isEditing ? 'Update Event' : 'Create Event'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  )
}
