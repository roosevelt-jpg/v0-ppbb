'use client'

import React from 'react'
import { format } from 'date-fns'
import {
  MapPin,
  Calendar,
  Users,
  DollarSign,
  Loader2,
  Share2,
  CalendarPlus,
  Copy,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import type { Event, TicketType } from '@/lib/event-types'
import { getEventBannerURL, toEventDate } from '@/lib/event-utils'

interface EventDetailViewProps {
  event: Event
  previewMode?: boolean
  registering?: boolean
  error?: string | null
  selectedTicketId?: string
  couponCode?: string
  onTicketChange?: (id: string) => void
  onCouponChange?: (code: string) => void
  onRegister?: () => void
}

function formatEventDate(value: unknown, pattern: string) {
  const date = toEventDate(value)
  return date ? format(date, pattern) : 'TBA'
}

export function EventDetailView({
  event,
  previewMode = false,
  registering = false,
  error = null,
  selectedTicketId,
  couponCode = '',
  onTicketChange,
  onCouponChange,
  onRegister,
}: EventDetailViewProps) {
  const ticketTypes: TicketType[] = Array.isArray(event.ticketTypes)
    ? event.ticketTypes.filter((t) => t.isActive !== false)
    : []
  const enableWaitlist = Boolean((event as any).enableWaitlist)
  const isFull =
    event.maxAttendees != null && event.currentAttendees >= event.maxAttendees
  const canWaitlist = isFull && enableWaitlist

  const shareUrl =
    typeof window !== 'undefined' ? window.location.href : `/events/${event.id}`

  const copyShare = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      alert('Link copied')
    } catch {
      /* ignore */
    }
  }

  const selected =
    ticketTypes.find((t) => t.id === selectedTicketId) || ticketTypes[0] || null

  const bannerSrc = getEventBannerURL(event as unknown as Record<string, unknown>)

  return (
    <div className="min-h-screen bg-gray-50">
      {previewMode && (
        <div className="bg-amber-500 text-white text-center py-2 text-sm font-medium">
          Preview mode — this is how the event will appear on the public site
        </div>
      )}

      {bannerSrc ? (
        <div className="w-full h-48 sm:h-64 lg:h-96 relative overflow-hidden">
          <img src={bannerSrc} alt={event.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
      ) : null}

      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-black mb-4 break-words">
                {event.title}
              </h1>
              <p className="text-gray-700 text-base sm:text-lg break-words">{event.description}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
                <Calendar className="text-gray-600 shrink-0" size={20} />
                <div>
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="font-semibold">{formatEventDate(event.startDate, 'MMM dd, yyyy')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
                <MapPin className="text-gray-600 shrink-0" size={20} />
                <div>
                  <p className="text-xs text-gray-500">Location</p>
                  <p className="font-semibold break-words">{event.locationName}</p>
                </div>
              </div>
              {(event as any).showGuestList !== false && (
                <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
                  <Users className="text-gray-600 shrink-0" size={20} />
                  <div>
                    <p className="text-xs text-gray-500">Attending</p>
                    <p className="font-semibold">
                      {event.currentAttendees}/{event.maxAttendees || '∞'}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
                <DollarSign className="text-gray-600 shrink-0" size={20} />
                <div>
                  <p className="text-xs text-gray-500">From</p>
                  <p className="font-semibold">
                    {selected
                      ? selected.price > 0
                        ? `${selected.currency} ${selected.price}`
                        : 'Free'
                      : event.pricingType === 'free'
                        ? 'Free'
                        : `${event.currency || 'AED'} ${event.price}`}
                  </p>
                </div>
              </div>
            </div>

            {event.speakers && event.speakers.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8">
                <h2 className="text-2xl font-bold mb-6">Speakers</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {event.speakers.map((speaker, idx) => (
                    <div key={idx}>
                      {speaker.photoURL && (
                        <div className="w-full h-40 rounded-lg overflow-hidden mb-3">
                          <img
                            src={speaker.photoURL}
                            alt={speaker.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <h3 className="font-semibold text-black">{speaker.name}</h3>
                      {speaker.title && <p className="text-sm text-gray-600">{speaker.title}</p>}
                      {speaker.bio && <p className="text-sm text-gray-700 mt-2">{speaker.bio}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {event.agenda && event.agenda.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8">
                <h2 className="text-2xl font-bold mb-6">Agenda</h2>
                <div className="space-y-4">
                  {event.agenda.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row gap-2 sm:gap-4 pb-4 border-b border-gray-200 last:border-0"
                    >
                      <span className="font-mono font-bold text-gray-700 sm:min-w-20">
                        {item.time}
                      </span>
                      <div>
                        <span className="text-gray-900">{item.title}</span>
                        {item.speakerName && (
                          <p className="text-xs text-gray-500">{item.speakerName}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <Card className="bg-white border border-gray-200 p-6 sm:p-8 lg:sticky lg:top-20">
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Category</p>
                  <p className="font-semibold text-black">{event.category}</p>
                </div>

                {event.genderRestriction !== 'mixed' && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-700 font-medium">
                      {event.genderRestriction === 'ladies-only'
                        ? 'Exclusively for Women'
                        : 'Exclusively for Men'}
                    </p>
                  </div>
                )}

                {ticketTypes.length > 0 && onTicketChange && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Ticket type</p>
                    {ticketTypes.map((t) => (
                      <label
                        key={t.id}
                        className={`flex items-center justify-between gap-2 p-3 border rounded-lg cursor-pointer ${
                          selectedTicketId === t.id || (!selectedTicketId && t === ticketTypes[0])
                            ? 'border-black bg-neutral-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <span className="flex items-center gap-2 text-sm">
                          <input
                            type="radio"
                            name="ticketType"
                            checked={
                              selectedTicketId === t.id ||
                              (!selectedTicketId && t.id === ticketTypes[0].id)
                            }
                            onChange={() => onTicketChange(t.id)}
                          />
                          {t.name}
                        </span>
                        <span className="text-sm font-semibold">
                          {t.price > 0 ? `${t.currency} ${t.price}` : 'Free'}
                        </span>
                      </label>
                    ))}
                  </div>
                )}

                {onCouponChange && (
                  <div>
                    <label className="text-sm font-medium">Coupon / unlock code</label>
                    <input
                      value={couponCode}
                      onChange={(e) => onCouponChange(e.target.value)}
                      placeholder="Optional"
                      className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                )}

                {!previewMode && onRegister && (
                  <button
                    type="button"
                    onClick={onRegister}
                    disabled={registering || (isFull && !canWaitlist)}
                    className="w-full py-3 bg-black !text-white rounded-lg font-semibold hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    {registering && <Loader2 size={16} className="animate-spin" />}
                    {isFull && !canWaitlist
                      ? 'Event Full'
                      : canWaitlist
                        ? 'Join Waitlist'
                        : selected && selected.price > 0
                          ? 'Get Tickets'
                          : 'Register Now'}
                  </button>
                )}

                {previewMode && (
                  <div className="w-full py-3 bg-black !text-white rounded-lg font-semibold text-center min-h-[44px] flex items-center justify-center">
                    Register Now
                  </div>
                )}

                <p className="text-xs text-gray-600 text-center">
                  {event.maxAttendees
                    ? `${Math.max(0, event.maxAttendees - event.currentAttendees)} spots remaining`
                    : 'No limit on attendees'}
                  {canWaitlist ? ' · Waitlist open' : ''}
                </p>

                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={copyShare}
                    className="inline-flex items-center justify-center gap-2 w-full py-2 border rounded-lg text-sm"
                  >
                    <Copy size={14} /> Copy share link
                  </button>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`${event.title} ${shareUrl}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full py-2 border rounded-lg text-sm"
                  >
                    <Share2 size={14} /> Share on WhatsApp
                  </a>
                  {event.id && (
                    <a
                      href={`/api/events/${event.id}/ics`}
                      className="inline-flex items-center justify-center gap-2 w-full py-2 border rounded-lg text-sm"
                    >
                      <CalendarPlus size={14} /> Add to calendar
                    </a>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-200 space-y-2 text-xs text-gray-600 break-words">
                  <p>{event.locationAddress}</p>
                  <p>{formatEventDate(event.startDate, 'MMM dd, yyyy HH:mm')}</p>
                  {event.endDate && <p>Ends {formatEventDate(event.endDate, 'HH:mm')}</p>}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
