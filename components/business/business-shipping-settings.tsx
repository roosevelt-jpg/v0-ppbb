'use client'

import React, { useEffect, useState } from 'react'
import { auth } from '@/lib/firebase'
import { Card } from '@/components/ui/card'
import { BUTTON_PRIMARY, BUTTON_OUTLINE } from '@/lib/admin-design-system'
import {
  MARKETPLACE_DELIVERY_PARTNERS,
  UAE_EMIRATES,
  emptyMarketplaceAddress,
  type MarketplaceAddress,
  type MarketplaceDeliveryPartnerId,
} from '@/lib/marketplace-shipping'

export function BusinessShippingSettings() {
  const [partner, setPartner] = useState<MarketplaceDeliveryPartnerId>('self_arrange')
  const [partnerName, setPartnerName] = useState('')
  const [shopAddress, setShopAddress] = useState<MarketplaceAddress>(emptyMarketplaceAddress())
  const [bank, setBank] = useState({
    bankName: '',
    accountName: '',
    iban: '',
    accountNumber: '',
    notes: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    void (async () => {
      try {
        const token = await auth.currentUser?.getIdToken()
        if (!token) return
        const res = await fetch('/api/marketplace/shipping-settings', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const json = await res.json()
        if (json.success) {
          setPartner(json.shipping.preferredDeliveryPartner || 'self_arrange')
          setPartnerName(json.shipping.preferredDeliveryPartnerName || '')
          setShopAddress({
            ...emptyMarketplaceAddress(),
            ...(json.shipping.shopAddress || {}),
          })
          setBank({
            bankName: json.bankTransfer?.bankName || '',
            accountName: json.bankTransfer?.accountName || '',
            iban: json.bankTransfer?.iban || '',
            accountNumber: json.bankTransfer?.accountNumber || '',
            notes: json.bankTransfer?.notes || '',
          })
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const save = async () => {
    setSaving(true)
    setMessage('')
    try {
      const token = await auth.currentUser?.getIdToken()
      if (!token) throw new Error('Sign in required')
      const res = await fetch('/api/marketplace/shipping-settings', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preferredDeliveryPartner: partner,
          preferredDeliveryPartnerName: partnerName,
          shopAddress,
          bankTransfer: bank,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Save failed')
      setMessage('Shipping & bank details saved. New orders will use these on invoices.')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const setAddr = (patch: Partial<MarketplaceAddress>) =>
    setShopAddress((prev) => ({ ...prev, ...patch }))

  if (loading) {
    return <p className="text-sm text-neutral-500 mt-6">Loading shipping settings…</p>
  }

  return (
    <Card className="bg-white border-[#e4e1da] p-4 sm:p-6 mt-6 space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-[#111111]">Shipping integrations</h3>
        <p className="text-sm text-[#888888] mt-1">
          Choose your preferred UAE delivery company. When someone purchases, you are notified and
          arrange pickup with that partner. Your shop name and address appear on invoices and
          receipts.
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#111111] mb-2">
          Preferred delivery company
        </label>
        <select
          className="w-full h-9 px-2 text-sm border border-neutral-300 rounded-md bg-white"
          value={partner}
          onChange={(e) => setPartner(e.target.value as MarketplaceDeliveryPartnerId)}
        >
          {MARKETPLACE_DELIVERY_PARTNERS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label} — {p.description}
            </option>
          ))}
        </select>
        {partner === 'other' ? (
          <input
            className="mt-2 w-full h-9 px-2 text-sm border border-neutral-300 rounded-md"
            placeholder="Partner company name"
            value={partnerName}
            onChange={(e) => setPartnerName(e.target.value)}
          />
        ) : null}
      </div>

      <fieldset className="space-y-2 border border-neutral-200 rounded-md p-3">
        <legend className="text-xs font-semibold uppercase tracking-wide text-neutral-600 px-1">
          Shop address (on invoices)
        </legend>
        <input
          className="w-full h-8 px-2 text-sm border border-neutral-300 rounded-md"
          placeholder="Shop / contact name"
          value={shopAddress.fullName}
          onChange={(e) => setAddr({ fullName: e.target.value })}
        />
        <input
          className="w-full h-8 px-2 text-sm border border-neutral-300 rounded-md"
          placeholder="Phone"
          value={shopAddress.phone}
          onChange={(e) => setAddr({ phone: e.target.value })}
        />
        <input
          className="w-full h-8 px-2 text-sm border border-neutral-300 rounded-md"
          placeholder="Street address"
          value={shopAddress.line1}
          onChange={(e) => setAddr({ line1: e.target.value })}
        />
        <input
          className="w-full h-8 px-2 text-sm border border-neutral-300 rounded-md"
          placeholder="Building / unit (optional)"
          value={shopAddress.line2 || ''}
          onChange={(e) => setAddr({ line2: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            className="w-full h-8 px-2 text-sm border border-neutral-300 rounded-md"
            placeholder="City"
            value={shopAddress.city}
            onChange={(e) => setAddr({ city: e.target.value })}
          />
          <select
            className="w-full h-8 px-2 text-sm border border-neutral-300 rounded-md bg-white"
            value={shopAddress.emirate}
            onChange={(e) => setAddr({ emirate: e.target.value })}
          >
            {UAE_EMIRATES.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </div>
      </fieldset>

      <fieldset className="space-y-2 border border-neutral-200 rounded-md p-3">
        <legend className="text-xs font-semibold uppercase tracking-wide text-neutral-600 px-1">
          UAE bank transfer details (for buyers)
        </legend>
        <input
          className="w-full h-8 px-2 text-sm border border-neutral-300 rounded-md"
          placeholder="Bank name"
          value={bank.bankName}
          onChange={(e) => setBank((b) => ({ ...b, bankName: e.target.value }))}
        />
        <input
          className="w-full h-8 px-2 text-sm border border-neutral-300 rounded-md"
          placeholder="Account name"
          value={bank.accountName}
          onChange={(e) => setBank((b) => ({ ...b, accountName: e.target.value }))}
        />
        <input
          className="w-full h-8 px-2 text-sm border border-neutral-300 rounded-md"
          placeholder="IBAN"
          value={bank.iban}
          onChange={(e) => setBank((b) => ({ ...b, iban: e.target.value }))}
        />
        <input
          className="w-full h-8 px-2 text-sm border border-neutral-300 rounded-md"
          placeholder="Account number (optional)"
          value={bank.accountNumber}
          onChange={(e) => setBank((b) => ({ ...b, accountNumber: e.target.value }))}
        />
        <textarea
          className="w-full px-2 py-1.5 text-sm border border-neutral-300 rounded-md"
          rows={2}
          placeholder="Transfer notes (e.g. use order ID as reference)"
          value={bank.notes}
          onChange={(e) => setBank((b) => ({ ...b, notes: e.target.value }))}
        />
      </fieldset>

      {message ? <p className="text-sm text-neutral-700">{message}</p> : null}

      <div className="flex gap-2">
        <button type="button" disabled={saving} onClick={() => void save()} className={BUTTON_PRIMARY}>
          {saving ? 'Saving…' : 'Save shipping settings'}
        </button>
        <a href="/business/orders" className={BUTTON_OUTLINE}>
          View orders
        </a>
      </div>
    </Card>
  )
}
