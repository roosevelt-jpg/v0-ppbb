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
  onChange: (patch: {
    ticketTypes?: TicketType[]
    coupons?: EventCoupon[]
    requireApproval?: boolean
    enableWaitlist?: boolean
    showGuestList?: boolean
    isFeatured?: boolean
    cohostEmails?: string
    recurrence?: EventRecurrence | null
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
  onChange,
}: EventHostingFieldsProps) {
  const types = ticketTypes.length
    ? ticketTypes
    : [createDefaultTicketType(0, currency)]

  const updateType = (index: number, patch: Partial<TicketType>) => {
    const next = types.map((t, i) => (i === index ? { ...t, ...patch } : t))
    onChange({ ticketTypes: next })
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

  return (
    <div className="space-y-6 border border-neutral-200 rounded-xl p-4 bg-neutral-50">
      <div>
        <h3 className="font-semibold text-neutral-900">Ticketing & capacity</h3>
        <p className="text-xs text-neutral-500 mt-1">
          Multiple ticket types, waitlist, approval, coupons, and cohosts.
        </p>
      </div>

      <div className="space-y-3">
        {types.map((t, i) => (
          <div key={t.id || i} className="grid sm:grid-cols-6 gap-2 items-end bg-white p-3 rounded-lg border">
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
              Capacity
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
            <label className="text-xs flex items-center gap-2 mt-5">
              <input
                type="checkbox"
                checked={Boolean(t.requireApproval)}
                onChange={(e) => updateType(i, { requireApproval: e.target.checked })}
              />
              Approve
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
        <label className="text-sm flex items-center gap-2">
          <input
            type="checkbox"
            checked={requireApproval}
            onChange={(e) => onChange({ requireApproval: e.target.checked })}
          />
          Require host approval for all registrations
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
    </div>
  )
}
