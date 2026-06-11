'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { AlertCircle, CheckCircle, ArrowLeft, Users, Calendar, MapPin } from 'lucide-react'
import { Card } from '@/components/ui/card'

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string
  
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState<any>({})

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        if (!eventId) {
          setError('Event ID not found')
          return
        }

        const eventDoc = await getDoc(doc(db, 'events', eventId))
        if (eventDoc.exists()) {
          const data = eventDoc.data()
          setEvent(data)
          setFormData(data)
        } else {
          setError('Event not found')
        }
      } catch (err) {
        console.error('[v0] Error fetching event:', err)
        setError('Failed to load event details')
      } finally {
        setLoading(false)
      }
    }

    fetchEvent()
  }, [eventId])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev: any) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await updateDoc(doc(db, 'events', eventId), formData)
      setSuccess('Event updated successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('[v0] Error updating event:', err)
      setError('Failed to update event')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 p-8">
        <div className="text-center">Loading event details...</div>
      </div>
    )
  }

  if (error && !event) {
    return (
      <div className="min-h-screen bg-neutral-50 p-8">
        <div className="text-center text-red-600">{error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-neutral-200 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Event Details</h1>
            <p className="text-neutral-600">Edit and manage event information</p>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            {success}
          </div>
        )}

        {/* Main Info Card */}
        <Card className="p-6 border border-neutral-200">
          <h2 className="text-xl font-bold text-neutral-900 mb-4">Event Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Event Title</label>
              <input
                type="text"
                name="title"
                value={formData.title || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Date</label>
              <input
                type="date"
                name="date"
                value={formData.date || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Time</label>
              <input
                type="time"
                name="time"
                value={formData.time || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Category</label>
              <select
                name="category"
                value={formData.category || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
              >
                <option value="">Select category...</option>
                <option value="fundraiser">Fundraiser</option>
                <option value="awareness">Awareness</option>
                <option value="volunteer">Volunteer</option>
                <option value="workshop">Workshop</option>
                <option value="meeting">Meeting</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Status</label>
              <select
                name="status"
                value={formData.status || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
              >
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description || ''}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
            />
          </div>
        </Card>

        {/* Event Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 border border-neutral-200">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-neutral-600">Attendees</span>
            </div>
            <p className="text-2xl font-bold text-neutral-900">{event?.attendees?.length || 0}</p>
          </Card>
          <Card className="p-4 border border-neutral-200">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-green-600" />
              <span className="text-sm text-neutral-600">Volunteers</span>
            </div>
            <p className="text-2xl font-bold text-neutral-900">{event?.volunteers?.length || 0}</p>
          </Card>
          <Card className="p-4 border border-neutral-200">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-orange-600" />
              <span className="text-sm text-neutral-600">Status</span>
            </div>
            <p className="text-lg font-semibold text-orange-600 capitalize">{event?.status || 'Unknown'}</p>
          </Card>
        </div>

        {/* Save Button */}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-neutral-300 text-neutral-900 rounded-lg font-medium hover:bg-neutral-400 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
