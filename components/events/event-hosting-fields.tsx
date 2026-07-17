'use client'

import React from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { EventCoupon, EventRecurrence, TicketType } from '@/lib/event-types'
import { createDefaultTicketType } from '@/lib/event-types'

type EventHostingFieldsProps = {
  currency: string
  ticketTypes: TicketType[]
  coupons: EventCoupon[]
  requireApproval: boolean
  enableWaitlist: boolean
  showGuestList: boolean
  isFeatured: boolean
  cohostEmails: string
  recurrence: EventRecurrence | null
  /** Event-wide guest / attendance cap (null = unlimited) */
  maxAttendees?: number | null
  onChange: (patch: {
    ticketTypes?: TicketType[]
    coupons?: EventCoupon[]
    requireApproval?: boolean
    enableWaitlist?: boolean
    showGuestList?: boolean
    isFeatured?: boolean
    cohostEmails?: string
    recurrence?: EventRecurrence | null
    maxAttendees?: number | null
  }) => void
}

export function EventHostingFields({
  currency,
  ticketTypes,
  coupons,
  requireApproval,
  enableWaitlist,
  showGuestList,
  isFeatured,
  cohostEmails,
  recurrence,
  maxAttendees = null,
  onChange,
}: EventHostingFieldsProps) {
  const types = ticketTypes.length
    ? ticketTypes
    : [createDefaultTicketType(0, currency)]

  const updateType = (index: number, patch: Partial<TicketType>) => {
    const next = types.map((t, i) => (i === index ? { ...t, ...patch } : t))
    // Single ticket type: keep event guest cap in sync with ticket capacity
    const extra: { ticketTypes: TicketType[]; maxAttendees?: number | null } = {
      ticketTypes: next,
    }
    if (next.length === 1 && 'capacity' in patch) {
      extra.maxAttendees =
        typeof patch.capacity === 'number' && patch.capacity > 0 ? patch.capacity : null
    }
    onChange(extra)
  }

  const setGuestCap = (raw: string) => {
    const cap = raw === '' ? null : Math.max(0, Number(raw) || 0)
    const nextCap = cap && cap > 0 ? cap : null
    const nextTypes =
      types.length === 1
        ? types.map((t, i) => (i === 0 ? { ...t, capacity: nextCap } : t))
        : types
    onChange({ maxAttendees: nextCap, ticketTypes: nextTypes })
  }

  const addType = () => {
    onChange({
      ticketTypes: [
        ...types,
        createDefaultTicketType(0, currency, `Ticket ${types.length + 1}`),
      ],
    })
  }

  const removeType = (index: number) => {
    if (types.length <= 1) return
    onChange({ ticketTypes: types.filter((_, i) => i !== index) })
  }

  const updateCoupon = (index: number, patch: Partial<EventCoupon>) => {
    const next = coupons.map((c, i) => (i === index ? { ...c, ...patch } : c))
    onChange({ coupons: next })
  }

  const guestCapValue =
    typeof maxAttendees === 'number' && maxAttendees > 0
      ? maxAttendees
      : types.length === 1 && typeof types[0].capacity === 'number' && types[0].capacity > 0
        ? types[0].capacity
        : ''

  return (
    <div className="space-y-6 border border-neutral-200 rounded-xl p-4 bg-neutral-50">
      <div>
        <h3 className="font-semibold text-neutral-900">Ticketing & capacity</h3>
        <p className="text-xs text-neutral-500 mt-1">
          Set a guest cap so listings show how full the event is. Leave blank for unlimited.
        </p>
      </div>

      <div className="bg-white border border-neutral-200 rounded-lg p-4 space-y-2">
        <label className="block text-sm font-medium text-neutral-900">
          Guest cap (max attendees)
        </label>
        <input
          type="number"
          min={1}
          value={guestCapValue}
          placeholder="e.g. 30 — leave empty for unlimited"
          onChange={(e) => setGuestCap(e.target.value)}
          className="w-full max-w-xs border rounded-md px-3 py-2 text-sm"
        />
        <p className="text-xs text-neutral-500">
          Public cards show <strong>0/{guestCapValue || '∞'} attending</strong>. When full,
          registration stops or waitlist applies if enabled below.
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Ticket types
        </p>
        {types.map((t, i) => (
          <div key={t.id || i} className="grid sm:grid-cols-5 gap-2 items-end bg-white p-3 rounded-lg border">
            <label className="text-xs sm:col-span-2">
              Name
              <input
                value={t.name}
                onChange={(e) => updateType(i, { name: e.target.value })}
                className="mt-1 w-full border rounded-md px-2 py-1.5 text-sm"
              />
            </label>
            <label className="text-xs">
              Price
              <input
                type="number"
                min={0}
                value={t.price}
                onChange={(e) => updateType(i, { price: Number(e.target.value) || 0 })}
                className="mt-1 w-full border rounded-md px-2 py-1.5 text-sm"
              />
            </label>
            <label className="text-xs">
              Ticket cap
              <input
                type="number"
                min={0}
                value={t.capacity ?? ''}
                placeholder="∞"
                onChange={(e) =>
                  updateType(i, {
                    capacity: e.target.value === '' ? null : Number(e.target.value),
                  })
                }
                className="mt-1 w-full border rounded-md px-2 py-1.5 text-sm"
              />
            </label>
            <button
              type="button"
              onClick={() => removeType(i)}
              className="inline-flex items-center justify-center p-2 rounded-lg bg-black !text-white hover:bg-neutral-900 shadow-none min-h-[40px] min-w-[40px]"
              aria-label="Remove ticket type"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addType}
          className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg bg-black !text-white hover:bg-neutral-900 shadow-none font-medium"
        >
          <Plus className="h-4 w-4" /> Add ticket type
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="text-sm flex items-start gap-2">
          <input
            type="checkbox"
            className="mt-1"
            checked={requireApproval}
            onChange={(e) => onChange({ requireApproval: e.target.checked })}
          />
          <span>
            Require host approval for all registrations
            <span className="block text-xs text-neutral-500 mt-0.5">
              When off, guests are confirmed immediately. When on, review them under Attendees.
            </span>
          </span>
        </label>
        <label className="text-sm flex items-center gap-2">
          <input
            type="checkbox"
            checked={enableWaitlist}
            onChange={(e) => onChange({ enableWaitlist: e.target.checked })}
          />
          Enable waitlist when full
        </label>
        <label className="text-sm flex items-center gap-2">
          <input
            type="checkbox"
            checked={showGuestList}
            onChange={(e) => onChange({ showGuestList: e.target.checked })}
          />
          Show guest count on public page
        </label>
        <label className="text-sm flex items-center gap-2">
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(e) => onChange({ isFeatured: e.target.checked })}
          />
          Featured event
        </label>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-2">Coupons / unlock codes</h4>
        {coupons.map((c, i) => (
          <div key={i} className="grid sm:grid-cols-4 gap-2 mb-2">
            <input
              value={c.code}
              placeholder="CODE"
              onChange={(e) => updateCoupon(i, { code: e.target.value.toUpperCase() })}
              className="border rounded-md px-2 py-1.5 text-sm"
            />
            <input
              type="number"
              placeholder="% off"
              value={c.percentOff ?? ''}
              onChange={(e) =>
                updateCoupon(i, {
                  percentOff: e.target.value === '' ? null : Number(e.target.value),
                })
              }
              className="border rounded-md px-2 py-1.5 text-sm"
            />
            <input
              type="number"
              placeholder="Amount off"
              value={c.amountOff ?? ''}
              onChange={(e) =>
                updateCoupon(i, {
                  amountOff: e.target.value === '' ? null : Number(e.target.value),
                })
              }
              className="border rounded-md px-2 py-1.5 text-sm"
            />
            <button
              type="button"
              className="inline-flex items-center justify-center text-sm px-3 py-1.5 rounded-lg bg-black !text-white hover:bg-neutral-900 shadow-none"
              onClick={() => onChange({ coupons: coupons.filter((_, j) => j !== i) })}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg bg-black !text-white hover:bg-neutral-900 shadow-none font-medium"
          onClick={() =>
            onChange({
              coupons: [...coupons, { code: '', percentOff: 10, amountOff: null, usedCount: 0 }],
            })
          }
        >
          + Add coupon
        </button>
      </div>

      <label className="block text-sm">
        Cohost emails (comma-separated)
        <input
          value={cohostEmails}
          onChange={(e) => onChange({ cohostEmails: e.target.value })}
          placeholder="cohost@example.com"
          className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
        />
      </label>

      <div className="grid sm:grid-cols-3 gap-3">
        <label className="text-sm">
          Recurrence
          <select
            value={recurrence?.frequency || ''}
            onChange={(e) => {
              const frequency = e.target.value as '' | 'weekly' | 'monthly'
              if (!frequency) onChange({ recurrence: null })
              else
                onChange({
                  recurrence: {
                    frequency,
                    interval: recurrence?.interval || 1,
                    until: recurrence?.until || null,
                  },
                })
            }}
            className="mt-1 w-full border rounded-md px-2 py-1.5 text-sm"
          >
            <option value="">None (one-time)</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </label>
        {recurrence && (
          <>
            <label className="text-sm">
              Every N
              <input
                type="number"
                min={1}
                value={recurrence.interval}
                onChange={(e) =>
                  onChange({
                    recurrence: { ...recurrence, interval: Number(e.target.value) || 1 },
                  })
                }
                className="mt-1 w-full border rounded-md px-2 py-1.5 text-sm"
              />
            </label>
            <label className="text-sm">
              Until
              <input
                type="date"
                value={recurrence.until || ''}
                onChange={(e) =>
                  onChange({
                    recurrence: { ...recurrence, until: e.target.value || null },
                  })
                }
                className="mt-1 w-full border rounded-md px-2 py-1.5 text-sm"
              />
            </label>
          </>
        )}
      </div>
      {recurrence && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">
            All dates in the series share this event&apos;s banner by default. Edit any weekly occurrence
            later to set a unique banner for that date.
          </p>
          <div className="flex flex-wrap gap-2">
            {[3, 4, 6].map((months) => (
              <button
                key={months}
                type="button"
                onClick={() => {
                  const until = new Date()
                  until.setMonth(until.getMonth() + months)
                  const yyyy = until.getFullYear()
                  const mm = String(until.getMonth() + 1).padStart(2, '0')
                  const dd = String(until.getDate()).padStart(2, '0')
                  onChange({
                    recurrence: { ...recurrence, until: `${yyyy}-${mm}-${dd}` },
                  })
                }}
                className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium hover:bg-gray-50"
              >
                Next {months} months
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
