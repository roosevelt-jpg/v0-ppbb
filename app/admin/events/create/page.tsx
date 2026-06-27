'use client'

export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, ArrowLeft, Loader2, X } from 'lucide-react'
import Link from 'next/link'

interface EventFormData {
  title: string
  description: string
  date: string
  startTime: string
  endTime: string
  location: { address: string; city: string }
  bannerImageUrl: string
  isPaid: boolean
  price: number
  currency: string
  paymentGateway?: 'stripe' | 'paypal' | 'ziina'
  maxAttendees?: number
  status: 'draft' | 'published'
}

export default function CreateEventPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '17:00',
    location: { address: '', city: '' },
    bannerImageUrl: '',
    isPaid: false,
    price: 0,
    currency: 'AED',
    maxAttendees: undefined,
    status: 'draft',
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => setImagePreview(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleUploadImage = async (): Promise<string | null> => {
    if (!imageFile) return formData.bannerImageUrl
    try {
      const fd = new FormData()
      fd.append('file', imageFile)
      fd.append('path', 'events/banner')
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data.url
    } catch (err) {
      console.error('[v0] Upload error:', err)
      throw err
    }
  }

  const saveEvent = async (status: 'draft' | 'published') => {
    setSaving(true)
    setError(null)

    try {
      let imageUrl = formData.bannerImageUrl
      if (imageFile) {
        imageUrl = await handleUploadImage()
      }

      const payload = { ...formData, bannerImageUrl: imageUrl, status }

      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json()
      if (json.success) {
        router.push('/admin/events')
      } else {
        setError(json.error || 'Failed to save event')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving event')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent as keyof typeof prev], [child]: value }
      }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }

  return (
    <div className="w-full">
      <Link href="/admin/events" className="flex items-center gap-2 text-black mb-6 hover:text-gray-700">
        <ArrowLeft size={20} />
        Back to Events
      </Link>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h1 className="text-3xl font-bold text-black mb-8">Create Event</h1>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <X className="text-red-600 mt-0.5 flex-shrink-0" size={18} />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <form className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-black">Basic Information</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="e.g., Annual Charity Gala"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Event description"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-black">Date & Time</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleChange('date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => handleChange('startTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleChange('endTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-black">Location</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <input
                  type="text"
                  value={formData.location.address}
                  onChange={(e) => handleChange('location.address', e.target.value)}
                  placeholder="Street address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <input
                  type="text"
                  value={formData.location.city}
                  onChange={(e) => handleChange('location.city', e.target.value)}
                  placeholder="Dubai"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-black">Banner Image</h2>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                {imagePreview ? (
                  <div className="relative">
                    <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null)
                        setImagePreview('')
                      }}
                      className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <div className="flex flex-col items-center justify-center py-8">
                      <Upload className="text-gray-400 mb-2" size={28} />
                      <p className="text-gray-600 font-medium">Click to upload</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-black">Pricing & Payment</h2>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isPaid"
                  checked={formData.isPaid}
                  onChange={(e) => handleChange('isPaid', e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="isPaid" className="text-sm font-medium text-gray-700">This is a paid event</label>
              </div>

              {formData.isPaid && (
                <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ticket Price</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleChange('price', parseFloat(e.target.value))}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                    <select
                      value={formData.currency}
                      onChange={(e) => handleChange('currency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="AED">AED</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Gateway</label>
                    <select
                      value={formData.paymentGateway || 'stripe'}
                      onChange={(e) => handleChange('paymentGateway', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="stripe">Stripe</option>
                      <option value="paypal">PayPal</option>
                      <option value="ziina">Ziina</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.push('/admin/events')}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => saveEvent('draft')}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-900 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                Save as Draft
              </button>
              <button
                type="button"
                onClick={() => saveEvent('published')}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-900 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                Save & Publish
              </button>
            </div>
          </form>
        </div>
    </div>
  )
}
