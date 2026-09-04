'use client'

export const dynamic = 'force-dynamic'

import React, { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Upload, ArrowLeft, Loader2, X } from 'lucide-react'
import Link from 'next/link'
import {
  AddressLocationPicker,
  addressValueToEventFields,
  eventFieldsToAddressValue,
  type AddressLocationValue,
} from '@/components/address-location-picker'
import { useAuth } from '@/lib/auth-context'
import {
  buildEventApiPayload,
  buildEventUpdatePayload,
  mapEventDocToAdminForm,
} from '@/lib/build-event-payload'
import type { EventTag, GenderRestriction } from '@/lib/types'
import type { EventCoupon, EventRecurrence, EventStatus, TicketType } from '@/lib/event-types'
import { EventHostingFields } from '@/components/events/event-hosting-fields'
import { BUTTON_BACK, BUTTON_PRIMARY } from '@/lib/admin-design-system'
import {
  subscribeToEventsConfig,
  DEFAULT_EVENTS_CONFIG,
  type EventsCategory,
} from '@/lib/events-config'

interface EventFormData {
  title: string
  description: string
  date: string
  startTime: string
  endTime: string
  locationName: string
  locationAddress: string
  locationPlaceId: string
  locationLat: number
  locationLng: number
  bannerURL: string
  galleryURLs: string[]
  isPaid: boolean
  price: number
  currency: string
  paymentGateway?: 'stripe' | 'paypal' | 'ziina'
  maxAttendees?: number
  status: 'draft' | 'published'
  category: string
  genderRestriction: GenderRestriction
  tags: EventTag[]
  ticketTypes: TicketType[]
  coupons: EventCoupon[]
  requireApproval: boolean
  enableWaitlist: boolean
  allowNonMemberGuests: boolean
  showGuestList: boolean
  isFeatured: boolean
  cohostEmails: string
  recurrence: EventRecurrence | null
  seriesId: string | null
  applyChangesToFuture: boolean
}

const EMPTY_FORM: EventFormData = {
  title: '',
  description: '',
  date: new Date().toISOString().split('T')[0],
  startTime: '09:00',
  endTime: '17:00',
  locationName: '',
  locationAddress: '',
  locationPlaceId: '',
  locationLat: 0,
  locationLng: 0,
  bannerURL: '',
  galleryURLs: [],
  isPaid: false,
  price: 0,
  currency: 'AED',
  paymentGateway: 'stripe',
  maxAttendees: undefined,
  status: 'draft',
  category: DEFAULT_EVENTS_CONFIG.categories[0]?.id || 'social',
  genderRestriction: 'mixed',
  tags: [],
  ticketTypes: [],
  coupons: [],
  requireApproval: false,
  enableWaitlist: true,
  allowNonMemberGuests: false,
  showGuestList: true,
  isFeatured: false,
  cohostEmails: '',
  recurrence: null,
  seriesId: null,
  applyChangesToFuture: false,
}

export default function CreateEventPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full py-12 text-center text-gray-500 dark:text-muted-foreground">Loading event form...</div>
      }
    >
      <CreateEventForm />
    </Suspense>
  )
}

function CreateEventForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const eventId = searchParams.get('id')
  const isEditing = Boolean(eventId)
  const { user } = useAuth()

  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEditing)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [galleryUploading, setGalleryUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [approvalNotes, setApprovalNotes] = useState<string | null>(null)
  const [existingStatus, setExistingStatus] = useState<EventStatus | null>(null)
  const [formData, setFormData] = useState<EventFormData>(EMPTY_FORM)
  const [categories, setCategories] = useState<EventsCategory[]>(DEFAULT_EVENTS_CONFIG.categories)

  useEffect(() => subscribeToEventsConfig((cfg) => {
    setCategories(cfg.categories)
  }), [])

  useEffect(() => {
    if (!eventId) return

    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/events/${eventId}`)
        const json = await res.json()
        if (!json.success || !json.data) {
          throw new Error(json.error || 'Event not found')
        }
        if (cancelled) return

        const mapped = mapEventDocToAdminForm(json.data as Record<string, unknown>)
        setFormData({
          title: mapped.title,
          description: mapped.description,
          date: mapped.date,
          startTime: mapped.startTime,
          endTime: mapped.endTime,
          locationName: mapped.locationName,
          locationAddress: mapped.locationAddress,
          locationPlaceId: mapped.locationPlaceId,
          locationLat: mapped.locationLat,
          locationLng: mapped.locationLng,
          bannerURL: mapped.bannerURL,
          galleryURLs: mapped.galleryURLs || [],
          isPaid: mapped.isPaid,
          price: mapped.price,
          currency: mapped.currency,
          paymentGateway: mapped.paymentGateway,
          maxAttendees: mapped.maxAttendees,
          status: mapped.status,
          category: mapped.category || 'social',
          genderRestriction: mapped.genderRestriction,
          tags: mapped.tags,
          ticketTypes: mapped.ticketTypes || [],
          coupons: mapped.coupons || [],
          requireApproval: mapped.requireApproval === true,
          enableWaitlist: mapped.enableWaitlist !== false,
          allowNonMemberGuests: mapped.allowNonMemberGuests === true,
          showGuestList: mapped.showGuestList !== false,
          isFeatured: Boolean(mapped.isFeatured),
          cohostEmails: (mapped.cohostEmails || []).join(', '),
          recurrence: mapped.recurrence || null,
          seriesId: mapped.seriesId || null,
          applyChangesToFuture: false,
        })
        setApprovalNotes(mapped.approvalNotes || null)
        setExistingStatus(mapped.existingStatus || null)
        if (mapped.bannerURL) setImagePreview(mapped.bannerURL)
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
  }, [eventId])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (ev) => setImagePreview(ev.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleUploadImage = async (): Promise<string | null> => {
    if (!imageFile) return formData.bannerURL
    try {
      const fd = new FormData()
      fd.append('file', imageFile)
      // Unique object per upload — a fixed path reused the same URL + year-long CDN cache
      fd.append('folder', 'events/banners')
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Upload failed')
      return json.url
    } catch (err) {
      console.error('[v0] Upload error:', err)
      throw err
    }
  }

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setGalleryUploading(true)
    setError(null)
    try {
      const uploaded: string[] = []
      for (const file of files) {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('folder', 'events/gallery')
        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        const json = await res.json()
        if (!json.success || !json.url) throw new Error(json.error || 'Gallery upload failed')
        uploaded.push(json.url)
      }
      setFormData((prev) => ({
        ...prev,
        galleryURLs: [...(prev.galleryURLs || []), ...uploaded].slice(0, 12),
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gallery upload failed')
    } finally {
      setGalleryUploading(false)
      e.target.value = ''
    }
  }

  const saveEvent = async (status: 'draft' | 'published' | 'preserve') => {
    setSaving(true)
    setError(null)

    try {
      if (!formData.title?.trim()) throw new Error('Event title is required')
      if (!formData.description?.trim()) throw new Error('Event description is required')
      if (!formData.date?.trim()) throw new Error('Event date is required')
      if (!formData.category?.trim()) throw new Error('Event category is required')
      if (!formData.locationName?.trim()) throw new Error('Event location is required')
      if (formData.isPaid && (!formData.price || formData.price <= 0)) {
        throw new Error('Paid events require a ticket price greater than 0')
      }

      const dateObj = new Date(formData.date)
      if (isNaN(dateObj.getTime())) throw new Error('Please select a valid date')

      let bannerURL = formData.bannerURL
      if (imageFile) {
        bannerURL = (await handleUploadImage()) || ''
      }

      if (isEditing && eventId) {
        // Preserve existing status unless admin explicitly chooses draft or published
        const statusToSave: EventStatus =
          status === 'preserve'
            ? existingStatus || 'draft'
            : status

        const updatePayload = buildEventUpdatePayload({
          ...formData,
          bannerURL,
          status: statusToSave === 'published' ? 'published' : 'draft',
          cohostEmails: formData.cohostEmails
            .split(/[,;\s]+/)
            .map((e) => e.trim())
            .filter(Boolean),
        })

        const res = await fetch('/api/events', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: eventId,
            ...updatePayload,
            status: statusToSave,
            applyChangesToFuture: formData.applyChangesToFuture === true,
            lastEditedBy: user?.id || user?.email || 'admin',
            lastEditedAt: new Date().toISOString(),
          }),
        })

        const json = await res.json()
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Failed to update event')
        }

        const tab =
          statusToSave === 'published'
            ? 'published'
            : statusToSave === 'pending_approval'
              ? 'pending_approval'
              : statusToSave === 'changes_requested'
                ? 'changes_requested'
                : statusToSave === 'draft'
                  ? 'draft'
                  : 'all'
        router.push(`/admin/events?tab=${tab}`)
        return
      }

      const createStatus: 'draft' | 'published' = status === 'published' ? 'published' : 'draft'
      const payload = buildEventApiPayload({
        ...formData,
        bannerURL,
        status: createStatus,
        createdBy: user?.id || user?.email || 'admin',
        createdByRole: 'admin',
        cohostEmails: formData.cohostEmails
          .split(/[,;\s]+/)
          .map((e) => e.trim())
          .filter(Boolean),
      })

      const token = await (await import('@/lib/firebase')).auth.currentUser?.getIdToken()
      const authHeaders: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      }

      const res = await fetch('/api/events', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(payload),
      })

      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to save event')
      }

      router.push(
        createStatus === 'published' ? '/admin/events?tab=published' : '/admin/events?tab=draft'
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving event')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof EventFormData, value: EventFormData[keyof EventFormData]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="w-full py-12 text-center text-gray-500 dark:text-muted-foreground flex items-center justify-center gap-2">
        <Loader2 className="animate-spin" size={18} />
        Loading event...
      </div>
    )
  }

  return (
    <div className="w-full">
      <Link href="/admin/events" className={`${BUTTON_BACK} mb-6`}>
        <ArrowLeft />
        Back to Events
      </Link>

      <div className="bg-white dark:bg-card rounded-lg shadow-sm border border-gray-200 dark:border-border p-4 sm:p-8">
        <h1 className="text-3xl font-bold text-black dark:text-foreground mb-2">
          {isEditing ? 'Edit Event' : 'Create Event'}
        </h1>
        {existingStatus && (
          <p className="text-sm text-gray-600 dark:text-muted-foreground mb-6">
            Current status:{' '}
            <span className="font-medium text-black dark:text-foreground uppercase">
              {existingStatus.replace(/_/g, ' ')}
            </span>
          </p>
        )}
        {!existingStatus && <div className="mb-8" />}

        {approvalNotes && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm font-medium text-amber-900 mb-1">Requested changes</p>
            <p className="text-sm text-amber-800 whitespace-pre-wrap">{approvalNotes}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <X className="text-red-600 mt-0.5 flex-shrink-0" size={18} />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <form className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-black dark:text-foreground">Basic Information</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-2">Event Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="e.g., Annual Charity Gala"
                className="w-full px-3 py-2 border border-gray-300 dark:border-border rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Event description"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-border rounded-lg"
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-black dark:text-foreground">Date & Time</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-2">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-2">Start Time</label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleChange('startTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-border rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-2">End Time</label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => handleChange('endTime', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-border rounded-lg"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-black dark:text-foreground">Location</h2>
            <p className="text-sm text-gray-600 dark:text-muted-foreground">
              Choose country / city, then search the venue address and drag the pin if needed.
            </p>
            <AddressLocationPicker
              variant="venue"
              value={eventFieldsToAddressValue(formData)}
              onChange={(next: AddressLocationValue) => {
                const fields = addressValueToEventFields(next)
                setFormData((prev) => ({
                  ...prev,
                  locationName: fields.locationName,
                  locationAddress: fields.locationAddress,
                  locationPlaceId: fields.locationPlaceId,
                  locationLat: fields.locationLat,
                  locationLng: fields.locationLng,
                }))
              }}
              showAutoDetect={false}
              pinDraggable
            />
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-black dark:text-foreground">Banner Image</h2>

            <div className="border-2 border-dashed border-gray-300 dark:border-border rounded-lg p-6">
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null)
                      setImagePreview('')
                      handleChange('bannerURL', '')
                    }}
                    className="absolute top-2 right-2 p-1 bg-black !text-white rounded-full"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <div className="flex flex-col items-center justify-center py-8">
                    <Upload className="text-gray-400 dark:text-muted-foreground mb-2" size={28} />
                    <p className="text-gray-600 dark:text-muted-foreground font-medium">Click to upload</p>
                  </div>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-black dark:text-foreground">Gallery slideshow</h2>
            <p className="text-sm text-neutral-600 dark:text-muted-foreground">
              Extra photos shown as a slideshow on the public event page (up to 12).
            </p>
            {formData.galleryURLs.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {formData.galleryURLs.map((url) => (
                  <div key={url} className="relative">
                    <img src={url} alt="" className="w-full h-28 object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          galleryURLs: prev.galleryURLs.filter((u) => u !== url),
                        }))
                      }
                      className="absolute top-1 right-1 p-1 bg-black !text-white rounded-full"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
            <label className="inline-flex items-center gap-2 cursor-pointer border border-dashed border-gray-300 dark:border-border rounded-lg px-4 py-3 text-sm">
              <Upload size={16} />
              {galleryUploading ? 'Uploading…' : 'Add gallery photos'}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                disabled={galleryUploading || formData.galleryURLs.length >= 12}
                onChange={(e) => void handleGalleryUpload(e)}
              />
            </label>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-black dark:text-foreground">Event Type & Audience</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-2">
                Category (public filter tag) *
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 border border-gray-300 dark:border-border rounded-lg"
                required
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
                {formData.category &&
                  !categories.some((c) => c.id === formData.category) && (
                    <option value={formData.category}>{formData.category}</option>
                  )}
              </select>
              <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">
                Managed in{' '}
                <Link href="/admin/cms/events" className="underline">
                  CMS → Events
                </Link>
                . This drives /events filters and card labels.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-3">Who can attend?</label>
              <div className="space-y-2">
                {(['mixed', 'ladies-only', 'men-only'] as const).map((option) => (
                  <label
                    key={option}
                    className="flex items-center gap-3 p-3 border border-gray-200 dark:border-border rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="radio"
                      name="genderRestriction"
                      value={option}
                      checked={formData.genderRestriction === option}
                      onChange={(e) => handleChange('genderRestriction', e.target.value)}
                      className="w-4 h-4"
                    />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-foreground capitalize">
                        {option.replace('-', ' ')}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-muted-foreground">
                        {option === 'mixed' && 'Everyone is welcome'}
                        {option === 'ladies-only' && 'Exclusively for women'}
                        {option === 'men-only' && 'Exclusively for men'}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-3">Event Tags</label>
              <p className="text-xs text-gray-600 dark:text-muted-foreground mb-3">Select all that apply</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(
                  [
                    'free',
                    'rsvp',
                    'premium',
                    'member-only',
                    'ladies-only',
                    'men-only',
                    'networking',
                    'workshop',
                    'fundraiser',
                    'celebration',
                    'educational',
                  ] as EventTag[]
                ).map((tag) => (
                  <label
                    key={tag}
                    className="flex items-center gap-2 p-2 border border-gray-200 dark:border-border rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={formData.tags.includes(tag)}
                      onChange={(e) => {
                        const newTags = e.target.checked
                          ? [...formData.tags, tag]
                          : formData.tags.filter((t) => t !== tag)
                        handleChange('tags', newTags)
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-foreground capitalize">
                      {tag.replace('-', ' ')}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <EventHostingFields
            currency={formData.currency}
            ticketTypes={formData.ticketTypes}
            coupons={formData.coupons}
            requireApproval={formData.requireApproval}
            enableWaitlist={formData.enableWaitlist}
            allowNonMemberGuests={formData.allowNonMemberGuests}
            showGuestList={formData.showGuestList}
            isFeatured={formData.isFeatured}
            cohostEmails={formData.cohostEmails}
            recurrence={formData.recurrence}
            seriesId={formData.seriesId}
            applyChangesToFuture={formData.applyChangesToFuture}
            maxAttendees={formData.maxAttendees ?? null}
            onChange={(patch) => setFormData((prev) => ({ ...prev, ...patch }))}
          />

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-black dark:text-foreground">Pricing & Payment</h2>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isPaid"
                checked={formData.isPaid}
                onChange={(e) => handleChange('isPaid', e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="isPaid" className="text-sm font-medium text-gray-700 dark:text-foreground">
                This is a paid event
              </label>
            </div>

            {formData.isPaid && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50 dark:bg-muted p-4 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-2">Ticket Price</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleChange('price', Number(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-2">Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => handleChange('currency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-border rounded-lg"
                  >
                    <option value="AED">AED</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-foreground mb-2">
                    Payment Gateway
                  </label>
                  <select
                    value={formData.paymentGateway || 'stripe'}
                    onChange={(e) => handleChange('paymentGateway', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-border rounded-lg"
                  >
                    <option value="stripe">Stripe</option>
                    <option value="paypal">PayPal</option>
                    <option value="ziina">Ziina</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200 dark:border-border">
            <button
              type="button"
              onClick={() => router.push('/admin/events')}
              className={`${BUTTON_PRIMARY} flex-1`}
            >
              Cancel
            </button>
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => saveEvent('preserve')}
                  disabled={saving}
                  className="h-7 min-h-0 flex-1 px-4 py-2 bg-black !text-white rounded-lg font-medium hover:bg-gray-900 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => saveEvent('published')}
                  disabled={saving}
                  className="h-7 min-h-0 flex-1 px-4 py-2 bg-black !text-white rounded-lg font-medium hover:bg-gray-900 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  Save & Publish
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => saveEvent('draft')}
                  disabled={saving}
                  className="h-7 min-h-0 flex-1 px-4 py-2 bg-black !text-white rounded-lg font-medium hover:bg-gray-900 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  Save as Draft
                </button>
                <button
                  type="button"
                  onClick={() => saveEvent('published')}
                  disabled={saving}
                  className="h-7 min-h-0 flex-1 px-4 py-2 bg-black !text-white rounded-lg font-medium hover:bg-gray-900 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  Save & Publish
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
