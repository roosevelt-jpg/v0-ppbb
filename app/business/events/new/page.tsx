'use client'

export const dynamic = 'force-dynamic'

import React, { Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { hasBusinessAccess } from '@/lib/roles'
import { ChevronLeft, MapPin, Upload, Loader2, Plus, X } from 'lucide-react'
import { toEventDate } from '@/lib/event-utils'
import GooglePlacesAutocomplete from '@/components/google-places-autocomplete'
import { GoogleMapPin } from '@/components/google-map-pin'
import { uploadImageToFirebase } from '@/lib/upload-utils'
import { EventHostingFields } from '@/components/events/event-hosting-fields'
import type { EventCoupon, EventRecurrence, TicketType } from '@/lib/event-types'
import {
  subscribeToEventsConfig,
  DEFAULT_EVENTS_CONFIG,
  type EventsCategory,
} from '@/lib/events-config'

export default function NewEventPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>Loading...</div>}>
      <BusinessEventForm />
    </Suspense>
  )
}

function BusinessEventForm() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const eventId = searchParams.get('id')
  const isEditing = Boolean(eventId)

  const EVENT_TAGS = [
    'Free', 'Paid', 'RSVP', 'Premium', 'Member Only', 'Ladies Only', 'Men Only',
    'Featured', 'Virtual', 'In-Person', 'Workshop', 'Conference', 'Prayer', 'Outreach', 'Fellowship',
  ]

  const [bannerProgress, setBannerProgress] = React.useState(0)
  const [speakerUploading, setSpeakerUploading] = React.useState<number | null>(null)

  const [formData, setFormData] = React.useState({
    title: '',
    description: '',
    category: DEFAULT_EVENTS_CONFIG.categories[0]?.id || 'social',
    genderRestriction: 'mixed',
    locationName: '',
    locationAddress: '',
    locationPlaceId: '',
    locationLat: 0,
    locationLng: 0,
    startDate: '',
    startTime: '09:00',
    endTime: '',
    pricingType: 'free',
    price: '',
    currency: 'AED',
    timezone: 'Asia/Dubai',
    bannerURL: '',
    tags: [] as string[],
    speakers: [] as { name: string; title: string; bio: string; photoURL: string; link: string }[],
    agenda: [] as { time: string; title: string; description: string; speaker: string; durationMinutes: number }[],
    maxAttendees: '',
    ticketTypes: [] as TicketType[],
    coupons: [] as EventCoupon[],
    requireApproval: false,
    enableWaitlist: true,
    showGuestList: true,
    isFeatured: false,
    cohostEmails: '',
    recurrence: null as EventRecurrence | null,
  })

  const [categories, setCategories] = React.useState<EventsCategory[]>(DEFAULT_EVENTS_CONFIG.categories)
  const [uploadingBanner, setUploadingBanner] = React.useState(false)

  React.useEffect(() => subscribeToEventsConfig((cfg) => setCategories(cfg.categories)), [])

  const [saving, setSaving] = React.useState(false)
  const [loading, setLoading] = React.useState(isEditing)
  const [error, setError] = React.useState<string | null>(null)
  const [approvalNotes, setApprovalNotes] = React.useState<string | null>(null)
  const [existingStatus, setExistingStatus] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!user || !hasBusinessAccess(user)) {
      router.push('/login')
    }
  }, [user, router])

  React.useEffect(() => {
    if (!eventId || !user) return

    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/events/${eventId}`)
        const json = await res.json()
        if (!json.success || !json.data) {
          throw new Error(json.error || 'Event not found')
        }
        const event = json.data
        if (event.createdBy && event.createdBy !== user.id && user.role !== 'admin' && user.role !== 'super_admin') {
          throw new Error('You can only edit your own events')
        }
        if (cancelled) return

        const start = toEventDate(event.startDate)
        const startDate = start
          ? `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`
          : ''
        const startTime = start
          ? `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`
          : '09:00'
        const end = toEventDate(event.endDate)
        const endTime = end
          ? `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`
          : ''

        setFormData({
          title: event.title || '',
          description: event.description || '',
          category: event.category || 'general',
          genderRestriction: event.genderRestriction || 'mixed',
          locationName: event.locationName || '',
          locationAddress: event.locationAddress || '',
          locationPlaceId: event.locationPlaceId || '',
          locationLat: event.locationLat ?? 0,
          locationLng: event.locationLng ?? 0,
          startDate,
          startTime,
          endTime,
          pricingType: event.pricingType === 'free' ? 'free' : 'paid_by_business',
          price: event.price != null ? String(event.price) : '',
          currency: event.currency || 'AED',
          timezone: event.timezone || 'Asia/Dubai',
          bannerURL: event.bannerURL || '',
          tags: Array.isArray(event.tags) ? event.tags : [],
          speakers: Array.isArray(event.speakers) ? event.speakers : [],
          agenda: Array.isArray(event.agenda) ? event.agenda : [],
          maxAttendees: event.maxAttendees != null ? String(event.maxAttendees) : '',
          ticketTypes: Array.isArray(event.ticketTypes) ? event.ticketTypes : [],
          coupons: Array.isArray(event.coupons) ? event.coupons : [],
          requireApproval: Boolean(event.requireApproval),
          enableWaitlist: event.enableWaitlist !== false,
          showGuestList: event.showGuestList !== false,
          isFeatured: Boolean(event.isFeatured),
          cohostEmails: Array.isArray(event.cohostEmails) ? event.cohostEmails.join(', ') : '',
          recurrence: event.recurrence || null,
        })
        setApprovalNotes(event.approvalNotes || null)
        setExistingStatus(event.status || null)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load event')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [eventId, user])

  const handleSave = async (status: 'draft' | 'pending_approval') => {
    setSaving(true)
    setError(null)

    try {
      if (!formData.title.trim() || !formData.description.trim() || !formData.startDate) {
        throw new Error('Please fill in all required fields')
      }

      if (!formData.locationPlaceId?.trim() && status === 'pending_approval') {
        throw new Error('Please select a location from the suggestions')
      }

      const startDateTime = formData.startTime
        ? `${formData.startDate}T${formData.startTime}:00`
        : `${formData.startDate}T09:00:00`
      const endDateTime = formData.endTime
        ? `${formData.startDate}T${formData.endTime}:00`
        : startDateTime

      const body = {
        ...formData,
        startDate: startDateTime,
        endDate: endDateTime,
        startTime: formData.startTime,
        endTime: formData.endTime,
        locationPlaceId: formData.locationPlaceId || null,
        locationLat: formData.locationLat || null,
        locationLng: formData.locationLng || null,
        bannerURL: formData.bannerURL || null,
        tags: formData.tags || [],
        speakers: formData.speakers || [],
        agenda: (formData.agenda || []).map((a: any, i: number) => ({
          time: a.time,
          title: a.title,
          description: a.description,
          speakerName: a.speakerName || a.speaker || null,
          durationMinutes: a.durationMinutes ?? null,
          order: i,
        })),
        maxAttendees: formData.maxAttendees ? Number(formData.maxAttendees) : null,
        timezone: formData.timezone || 'Asia/Dubai',
        price: formData.pricingType === 'free' ? null : parseFloat(formData.price),
        ticketTypes: formData.ticketTypes,
        coupons: formData.coupons,
        requireApproval: formData.requireApproval,
        enableWaitlist: formData.enableWaitlist,
        showGuestList: formData.showGuestList,
        isFeatured: formData.isFeatured,
        cohostEmails: formData.cohostEmails
          .split(/[,;\s]+/)
          .map((e) => e.trim())
          .filter(Boolean),
        recurrence: formData.recurrence,
        status,
        createdBy: user?.id,
        createdByRole: 'business' as const,
        submittedAt: status === 'pending_approval' ? new Date().toISOString() : null,
      }

      let res: Response
      const token = await (await import('@/lib/firebase')).auth.currentUser?.getIdToken()
      const authHeaders: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      }
      if (isEditing && eventId) {
        res = await fetch('/api/events', {
          method: 'PUT',
          headers: authHeaders,
          body: JSON.stringify({
            id: eventId,
            ...body,
            lastEditedBy: user?.id,
            lastEditedAt: new Date().toISOString(),
          }),
        })
      } else {
        res = await fetch('/api/events', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify(body),
        })
      }

      const json = await res.json()
      if (json.success) {
        router.push(
          status === 'pending_approval'
            ? '/business/events?tab=pending_approval'
            : '/business/events'
        )
      } else {
        setError(json.error || 'Failed to save event')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving event')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div style={{ padding: 40, color: '#888' }}>Loading event...</div>
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#fafafa' }}>
      <div
        style={{
          width: '280px',
          backgroundColor: '#ffffff',
          borderRight: '1px solid #e4e1da',
          padding: '24px',
        }}
      >
        <Link
          href="/business/events"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#111111',
            textDecoration: 'none',
            marginBottom: '32px',
          }}
        >
          <ChevronLeft size={20} />
          Back
        </Link>
      </div>

      <div style={{ flex: 1, padding: '40px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#111111', marginBottom: '8px' }}>
          {isEditing ? 'Edit Event' : 'Create New Event'}
        </h1>
        {existingStatus && (
          <p style={{ color: '#888', marginBottom: '24px', fontSize: 14 }}>
            Status: {existingStatus.replace(/_/g, ' ').toUpperCase()}
          </p>
        )}
        {!existingStatus && <div style={{ marginBottom: 24 }} />}

        {approvalNotes && (
          <div
            style={{
              padding: 16,
              backgroundColor: '#fff8e1',
              border: '1px solid #ffe082',
              borderRadius: 6,
              marginBottom: 24,
              color: '#e65100',
            }}
          >
            <p style={{ fontWeight: 600, marginBottom: 4 }}>Admin requested changes</p>
            <p style={{ whiteSpace: 'pre-wrap', fontSize: 14 }}>{approvalNotes}</p>
          </div>
        )}

        {error && (
          <div
            style={{
              padding: '16px',
              backgroundColor: '#ffebee',
              borderColor: '#ffcccc',
              color: '#c62828',
              border: '1px solid',
              borderRadius: '6px',
              marginBottom: '24px',
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#111111' }}>
              Basic Information
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#111111' }}>
                  Event Title *
                </label>
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
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#111111' }}>
                  Description *
                </label>
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
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#111111' }}>
                    Category
                  </label>
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
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#111111' }}>
                    Audience
                  </label>
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

          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#111111' }}>
              Event Banner
            </h2>
            <label className="inline-flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded-lg cursor-pointer text-sm font-medium mb-3">
              {uploadingBanner ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploadingBanner ? 'Uploading…' : 'Upload banner (JPG, PNG, WebP)'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                disabled={uploadingBanner}
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file || !user) return
                  setUploadingBanner(true)
                  setBannerProgress(10)
                  try {
                    setBannerProgress(40)
                    const url = await uploadImageToFirebase(file, `events/${user.id}/banner`, {
                      preset: 'hero',
                      maxDimension: 1920,
                      aspectRatio: 16 / 9,
                    })
                    setBannerProgress(100)
                    setFormData((p) => ({ ...p, bannerURL: url }))
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Banner upload failed')
                  } finally {
                    setUploadingBanner(false)
                    setTimeout(() => setBannerProgress(0), 600)
                    e.target.value = ''
                  }
                }}
              />
            </label>
            {uploadingBanner && bannerProgress > 0 ? (
              <div className="w-full h-2 bg-neutral-200 rounded-full mb-3 overflow-hidden">
                <div
                  className="h-full bg-black transition-all duration-300"
                  style={{ width: `${bannerProgress}%` }}
                />
              </div>
            ) : null}
            {formData.bannerURL && (
              <img
                src={formData.bannerURL}
                alt="Event banner preview"
                className="w-full max-h-48 object-cover rounded-lg border"
              />
            )}
          </div>

          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#111111' }}>
              Tags
            </h2>
            <div className="flex flex-wrap gap-2">
              {EVENT_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() =>
                    setFormData((p) => ({
                      ...p,
                      tags: p.tags.includes(tag)
                        ? p.tags.filter((t) => t !== tag)
                        : [...p.tags, tag],
                    }))
                  }
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${
                    formData.tags.includes(tag)
                      ? '!bg-black !text-white border-black'
                      : '!bg-white !text-black border-neutral-300'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#111111' }}>
              Location
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#111111' }}>
                  Venue Name (optional display label)
                </label>
                <input
                  type="text"
                  value={formData.locationName}
                  onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
                  placeholder="e.g. Community Hall"
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
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#111111' }}>
                  Event Location *
                </label>
                <GooglePlacesAutocomplete
                  value={formData.locationAddress || formData.locationName}
                  countryRestrictions={['AE']}
                  placeholder="Start typing a venue or address..."
                  onTextChange={(text) =>
                    setFormData((p) => ({ ...p, locationAddress: text, locationName: p.locationName || text }))
                  }
                  onChange={(place) =>
                    setFormData((p) => ({
                      ...p,
                      locationAddress: place.mainText,
                      locationName: p.locationName || place.mainText,
                      locationPlaceId: place.placeId,
                      locationLat: place.lat ?? 0,
                      locationLng: place.lng ?? 0,
                    }))
                  }
                />
                {formData.locationAddress && (
                  <div className="mt-2 space-y-2">
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 flex gap-2">
                      <MapPin size={16} className="text-blue-600 shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-900">{formData.locationAddress}</p>
                        {formData.locationLat !== 0 && formData.locationLng !== 0 && (
                          <p className="text-blue-700 text-xs">
                            {formData.locationLat.toFixed(4)}, {formData.locationLng.toFixed(4)}
                          </p>
                        )}
                      </div>
                    </div>
                    {formData.locationLat !== 0 && formData.locationLng !== 0 ? (
                      <GoogleMapPin lat={formData.locationLat} lng={formData.locationLng} />
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#111111' }}>
              Date & Time
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#111111' }}>
                  Start Date *
                </label>
                <input
                  type="date"
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
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#111111' }}>
                  Start Time *
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
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
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#111111' }}>
                  End Time
                </label>
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
            <div className="mt-4">
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#111111' }}>
                Timezone
              </label>
              <select
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm"
              >
                <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                <option value="UTC">UTC</option>
                <option value="Europe/London">Europe/London</option>
                <option value="America/New_York">America/New_York</option>
              </select>
            </div>
            <div className="mt-4">
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#111111' }}>
                Max Attendees (optional)
              </label>
              <input
                type="number"
                min="0"
                value={formData.maxAttendees}
                onChange={(e) => setFormData({ ...formData, maxAttendees: e.target.value })}
                placeholder="Leave blank for unlimited"
                className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#111111' }}>Speakers</h2>
              <button
                type="button"
                onClick={() =>
                  setFormData((p) => ({
                    ...p,
                    speakers: [...p.speakers, { name: '', title: '', bio: '', photoURL: '', link: '' }],
                  }))
                }
                className="inline-flex items-center gap-1 text-sm !bg-black !text-white px-3 py-1.5 rounded-lg"
              >
                <Plus className="h-4 w-4" /> Add Speaker
              </button>
            </div>
            {formData.speakers.map((speaker, idx) => (
              <div key={idx} className="border border-neutral-200 rounded-lg p-4 mb-3 space-y-2">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((p) => ({
                        ...p,
                        speakers: p.speakers.filter((_, i) => i !== idx),
                      }))
                    }
                    aria-label="Remove speaker"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <input
                  placeholder="Speaker name"
                  value={speaker.name}
                  onChange={(e) => {
                    const speakers = [...formData.speakers]
                    speakers[idx] = { ...speakers[idx], name: e.target.value }
                    setFormData((p) => ({ ...p, speakers }))
                  }}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
                <input
                  placeholder="Title / role"
                  value={speaker.title}
                  onChange={(e) => {
                    const speakers = [...formData.speakers]
                    speakers[idx] = { ...speakers[idx], title: e.target.value }
                    setFormData((p) => ({ ...p, speakers }))
                  }}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
                <textarea
                  placeholder="Bio"
                  value={speaker.bio}
                  rows={2}
                  onChange={(e) => {
                    const speakers = [...formData.speakers]
                    speakers[idx] = { ...speakers[idx], bio: e.target.value }
                    setFormData((p) => ({ ...p, speakers }))
                  }}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
                <input
                  placeholder="Speaker link (optional URL)"
                  value={speaker.link}
                  onChange={(e) => {
                    const speakers = [...formData.speakers]
                    speakers[idx] = { ...speakers[idx], link: e.target.value }
                    setFormData((p) => ({ ...p, speakers }))
                  }}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
                <div className="flex items-center gap-3">
                  {speaker.photoURL ? (
                    <img src={speaker.photoURL} alt="" className="h-12 w-12 rounded-full object-cover" />
                  ) : null}
                  <label className="inline-flex items-center gap-2 px-3 py-1.5 border rounded-lg text-xs cursor-pointer">
                    {speakerUploading === idx ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Upload className="h-3 w-3" />
                    )}
                    Photo
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      disabled={speakerUploading === idx}
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file || !user) return
                        setSpeakerUploading(idx)
                        try {
                          const url = await uploadImageToFirebase(
                            file,
                            `events/${user.id}/speakers`,
                            { preset: 'avatar' }
                          )
                          const speakers = [...formData.speakers]
                          speakers[idx] = { ...speakers[idx], photoURL: url }
                          setFormData((p) => ({ ...p, speakers }))
                        } catch (err) {
                          setError(err instanceof Error ? err.message : 'Photo upload failed')
                        } finally {
                          setSpeakerUploading(null)
                          e.target.value = ''
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#111111' }}>Agenda</h2>
              <button
                type="button"
                onClick={() =>
                  setFormData((p) => ({
                    ...p,
                    agenda: [
                      ...p.agenda,
                      { time: '', title: '', description: '', speaker: '', durationMinutes: 30 },
                    ],
                  }))
                }
                className="inline-flex items-center gap-1 text-sm !bg-black !text-white px-3 py-1.5 rounded-lg"
              >
                <Plus className="h-4 w-4" /> Add Item
              </button>
            </div>
            {formData.agenda.map((item, idx) => (
              <div key={idx} className="border border-neutral-200 rounded-lg p-4 mb-3 grid gap-2 sm:grid-cols-2">
                <div className="flex items-center gap-2 sm:col-span-2">
                  <span className="text-neutral-400 cursor-grab text-xs">⋮⋮</span>
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => {
                      const agenda = [...formData.agenda]
                      ;[agenda[idx - 1], agenda[idx]] = [agenda[idx], agenda[idx - 1]]
                      setFormData((p) => ({ ...p, agenda }))
                    }}
                    className="text-xs px-2 py-1 border rounded disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={idx === formData.agenda.length - 1}
                    onClick={() => {
                      const agenda = [...formData.agenda]
                      ;[agenda[idx], agenda[idx + 1]] = [agenda[idx + 1], agenda[idx]]
                      setFormData((p) => ({ ...p, agenda }))
                    }}
                    className="text-xs px-2 py-1 border rounded disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((p) => ({
                        ...p,
                        agenda: p.agenda.filter((_, i) => i !== idx),
                      }))
                    }
                    className="ml-auto text-xs text-red-600"
                  >
                    Remove
                  </button>
                </div>
                <input
                  type="time"
                  value={item.time}
                  onChange={(e) => {
                    const agenda = [...formData.agenda]
                    agenda[idx] = { ...agenda[idx], time: e.target.value }
                    setFormData((p) => ({ ...p, agenda }))
                  }}
                  className="px-3 py-2 border rounded-lg text-sm"
                />
                <input
                  type="number"
                  min={1}
                  placeholder="Duration (min)"
                  value={item.durationMinutes}
                  onChange={(e) => {
                    const agenda = [...formData.agenda]
                    agenda[idx] = {
                      ...agenda[idx],
                      durationMinutes: Number(e.target.value) || 0,
                    }
                    setFormData((p) => ({ ...p, agenda }))
                  }}
                  className="px-3 py-2 border rounded-lg text-sm"
                />
                <input
                  placeholder="Session title"
                  value={item.title}
                  onChange={(e) => {
                    const agenda = [...formData.agenda]
                    agenda[idx] = { ...agenda[idx], title: e.target.value }
                    setFormData((p) => ({ ...p, agenda }))
                  }}
                  className="px-3 py-2 border rounded-lg text-sm sm:col-span-2"
                />
                <select
                  value={item.speaker}
                  onChange={(e) => {
                    const agenda = [...formData.agenda]
                    agenda[idx] = { ...agenda[idx], speaker: e.target.value }
                    setFormData((p) => ({ ...p, agenda }))
                  }}
                  className="px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="">Select speaker</option>
                  {formData.speakers
                    .filter((s) => s.name.trim())
                    .map((s) => (
                      <option key={s.name} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                </select>
                <textarea
                  placeholder="Description"
                  value={item.description}
                  rows={2}
                  onChange={(e) => {
                    const agenda = [...formData.agenda]
                    agenda[idx] = { ...agenda[idx], description: e.target.value }
                    setFormData((p) => ({ ...p, agenda }))
                  }}
                  className="sm:col-span-2 px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            ))}
          </div>

          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#111111' }}>
              Pricing
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#111111' }}>
                  Event Type
                </label>
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
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: '#111111' }}>
                    Price (AED)
                  </label>
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

          <EventHostingFields
            currency={formData.currency}
            ticketTypes={formData.ticketTypes}
            coupons={formData.coupons}
            requireApproval={formData.requireApproval}
            enableWaitlist={formData.enableWaitlist}
            showGuestList={formData.showGuestList}
            isFeatured={formData.isFeatured}
            cohostEmails={formData.cohostEmails}
            recurrence={formData.recurrence}
            maxAttendees={
              formData.maxAttendees === '' || formData.maxAttendees == null
                ? null
                : Number(formData.maxAttendees) || null
            }
            onChange={(patch) =>
              setFormData((prev) => ({
                ...prev,
                ...patch,
                ...(patch.maxAttendees !== undefined
                  ? {
                      maxAttendees:
                        patch.maxAttendees == null ? '' : String(patch.maxAttendees),
                    }
                  : {}),
              }))
            }
          />

          <div
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              paddingTop: '24px',
              borderTop: '1px solid #e4e1da',
              flexWrap: 'wrap',
            }}
          >
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
              {saving
                ? 'Submitting...'
                : existingStatus === 'changes_requested'
                  ? 'Resubmit for Approval'
                  : 'Submit for Approval'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
