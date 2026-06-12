'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, ArrowLeft, Loader2 } from 'lucide-react'
import { Event, GenderRestriction } from '@/lib/event-types'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: { id?: string }
}

export default function CreateEventPage({ params }: PageProps) {
  const router = useRouter()
  const isEditing = !!params?.id
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [imageFile, setImageFile] = useState<File | null>(null)

  const [formData, setFormData] = useState<Partial<Event>>({
    title: '',
    description: '',
    date: new Date(),
    startTime: '09:00',
    endTime: '17:00',
    location: { address: '', city: '', coordinates: { latitude: 0, longitude: 0 }, placeId: '' },
    bannerImageUrl: '',
    isPaid: false,
    price: 0,
    currency: 'AED',
    genderRestriction: 'mixed',
    dressCode: '',
    logistics: '',
    maxAttendees: undefined,
    status: 'draft',
  })

  // Load event if editing
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
            if (eventData.bannerImageUrl) {
              setImagePreview(eventData.bannerImageUrl)
            }
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
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadImageToFirebase = async (file: File): Promise<string> => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'event-banner')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Upload failed')
      const data = await response.json()
      return data.url
    } catch (error) {
      console.error('[v0] Upload error:', error)
      throw error
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!auth.currentUser) {
      alert('Please log in first')
      return
    }

    if (!formData.title?.trim() || !formData.location?.address?.trim()) {
      alert('Please fill in required fields (title and location)')
      return
    }

    setSaving(true)
    try {
      let bannerUrl = formData.bannerImageUrl
      if (imageFile) {
        bannerUrl = await uploadImageToFirebase(imageFile)
      }

      const eventData: Partial<Event> = {
        ...formData,
        bannerImageUrl: bannerUrl,
        updatedAt: serverTimestamp(),
      }

      if (isEditing && params?.id) {
        // Update existing event
        await updateDoc(doc(db, 'events', params.id), eventData)
        alert('Event updated successfully!')
      } else {
        // Create new event
        await addDoc(collection(db, 'events'), {
          ...eventData,
          createdBy: auth.currentUser.uid,
          createdAt: serverTimestamp(),
          attendees: [],
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
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="w-full px-8 py-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 mb-6 text-neutral-600 hover:text-neutral-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <Card className="p-8 border-neutral-200">
          <h1 className="text-3xl font-bold mb-8">{isEditing ? 'Edit Event' : 'Create New Event'}</h1>

          <form onSubmit={handleSave} className="space-y-8">
          {/* Basic Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Basic Information</h2>

            <div>
              <label className="block text-sm font-medium mb-2">Event Title *</label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Annual Charity Gala"
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Event description and details"
                rows={5}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>
          </div>

          {/* Date and Time */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Date & Time</h2>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Date *</label>
                <input
                  type="date"
                  value={formData.date instanceof Date ? formData.date.toISOString().split('T')[0] : ''}
                  onChange={(e) => setFormData({ ...formData, date: new Date(e.target.value) })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Start Time *</label>
                <input
                  type="time"
                  value={formData.startTime || '09:00'}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">End Time *</label>
                <input
                  type="time"
                  value={formData.endTime || '17:00'}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  required
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Location</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Address *</label>
                <input
                  type="text"
                  value={formData.location?.address || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    location: { ...formData.location!, address: e.target.value }
                  })}
                  placeholder="Street address"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">City *</label>
                <input
                  type="text"
                  value={formData.location?.city || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    location: { ...formData.location!, city: e.target.value }
                  })}
                  placeholder="City"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  required
                />
              </div>
            </div>

            <p className="text-xs text-neutral-600">Note: Integrate Google Places API for autocomplete location selection</p>
          </div>

          {/* Event Settings */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Event Settings</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Gender Restriction</label>
                <select
                  value={formData.genderRestriction || 'mixed'}
                  onChange={(e) => setFormData({ ...formData, genderRestriction: e.target.value as GenderRestriction })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                >
                  <option value="mixed">Mixed Gender</option>
                  <option value="men-only">Men Only</option>
                  <option value="ladies-only">Ladies Only</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Event Status</label>
                <select
                  value={formData.status || 'draft'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Dress Code</label>
              <input
                type="text"
                value={formData.dressCode || ''}
                onChange={(e) => setFormData({ ...formData, dressCode: e.target.value })}
                placeholder="e.g., Formal, Business Casual, Casual"
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Logistics & Additional Info</label>
              <textarea
                value={formData.logistics || ''}
                onChange={(e) => setFormData({ ...formData, logistics: e.target.value })}
                placeholder="Transportation, accommodation, dietary requirements, etc."
                rows={4}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  <input
                    type="checkbox"
                    checked={formData.isPaid || false}
                    onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })}
                    className="mr-2"
                  />
                  Paid Event
                </label>
              </div>

              {formData.isPaid && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Price</label>
                    <input
                      type="number"
                      value={formData.price || 0}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                      placeholder="0"
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Currency</label>
                    <select
                      value={formData.currency || 'AED'}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    >
                      <option value="AED">AED</option>
                      <option value="USD">USD</option>
                      <option value="GBP">GBP</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Max Attendees (Optional)</label>
              <input
                type="number"
                value={formData.maxAttendees || ''}
                onChange={(e) => setFormData({ ...formData, maxAttendees: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder="Leave blank for unlimited"
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>
          </div>

          {/* Banner Image */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Event Banner Image</h2>

            <div className="border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center hover:border-neutral-400 transition cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="banner-upload"
              />
              <label htmlFor="banner-upload" className="cursor-pointer">
                <Upload className="w-8 h-8 mx-auto mb-2 text-neutral-400" />
                <p className="text-sm font-medium">Click to upload event banner</p>
                <p className="text-xs text-neutral-600">PNG, JPG, GIF up to 10MB</p>
              </label>
            </div>

            {imagePreview && (
              <div className="mt-4">
                <img src={imagePreview} alt="Banner preview" className="w-full h-48 object-cover rounded-lg" />
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 pt-8 border-t border-neutral-200">
            <Button
              type="button"
              onClick={() => router.back()}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="flex-1 bg-neutral-900 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                isEditing ? 'Update Event' : 'Create Event'
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
    </div>
  )
}
