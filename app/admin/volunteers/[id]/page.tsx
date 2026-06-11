'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { AlertCircle, CheckCircle, ArrowLeft, Clock, MapPin } from 'lucide-react'
import { Card } from '@/components/ui/card'

export default function VolunteerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const volunteerId = params.id as string
  
  const [volunteer, setVolunteer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState<any>({})
  const [volunteerEvents, setVolunteerEvents] = useState<any[]>([])

  useEffect(() => {
    const fetchVolunteer = async () => {
      try {
        if (!volunteerId) {
          setError('Volunteer ID not found')
          return
        }

        const volunteerDoc = await getDoc(doc(db, 'users', volunteerId))
        if (volunteerDoc.exists()) {
          const data = volunteerDoc.data()
          setVolunteer(data)
          setFormData(data)
          
          // Fetch volunteer event participation
          const eventsSnap = await getDocs(
            query(
              collection(db, 'events'),
              where('volunteers', 'array-contains', volunteerId)
            )
          )
          const events = eventsSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          setVolunteerEvents(events)
        } else {
          setError('Volunteer not found')
        }
      } catch (err) {
        console.error('[v0] Error fetching volunteer:', err)
        setError('Failed to load volunteer details')
      } finally {
        setLoading(false)
      }
    }

    fetchVolunteer()
  }, [volunteerId])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev: any) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await updateDoc(doc(db, 'users', volunteerId), formData)
      setSuccess('Volunteer updated successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('[v0] Error updating volunteer:', err)
      setError('Failed to update volunteer')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 p-8">
        <div className="text-center">Loading volunteer details...</div>
      </div>
    )
  }

  if (error && !volunteer) {
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
            <h1 className="text-3xl font-bold text-neutral-900">Volunteer Details</h1>
            <p className="text-neutral-600">Edit and manage volunteer information</p>
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
          <h2 className="text-xl font-bold text-neutral-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone || ''}
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
              <label className="block text-sm font-medium text-neutral-700 mb-1">Volunteer Hours</label>
              <input
                type="number"
                name="volunteerHours"
                value={formData.volunteerHours || 0}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-neutral-700 mb-1">Bio</label>
            <textarea
              name="bio"
              value={formData.bio || ''}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
            />
          </div>
        </Card>

        {/* Volunteer Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 border border-neutral-200">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-neutral-600">Total Hours</span>
            </div>
            <p className="text-2xl font-bold text-neutral-900">{volunteer?.volunteerHours || 0}</p>
          </Card>
          <Card className="p-4 border border-neutral-200">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-green-600" />
              <span className="text-sm text-neutral-600">Events</span>
            </div>
            <p className="text-2xl font-bold text-neutral-900">{volunteerEvents.length}</p>
          </Card>
          <Card className="p-4 border border-neutral-200">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-orange-600" />
              <span className="text-sm text-neutral-600">Status</span>
            </div>
            <p className="text-lg font-semibold text-orange-600">{volunteer?.active ? 'Active' : 'Inactive'}</p>
          </Card>
        </div>

        {/* Events Participated */}
        <Card className="p-6 border border-neutral-200">
          <h2 className="text-xl font-bold text-neutral-900 mb-4">Participated Events ({volunteerEvents.length})</h2>
          {volunteerEvents.length === 0 ? (
            <p className="text-neutral-600">No events yet</p>
          ) : (
            <div className="space-y-2">
              {volunteerEvents.map(event => (
                <div key={event.id} className="p-3 border border-neutral-200 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="font-medium text-neutral-900">{event.title}</p>
                    <p className="text-xs text-neutral-600">{event.date}</p>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded font-medium">Event</span>
                </div>
              ))}
            </div>
          )}
        </Card>

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
