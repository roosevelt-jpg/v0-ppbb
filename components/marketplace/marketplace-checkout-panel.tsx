'use client'

import React, { useState } from 'react'
import {
  MARKETPLACE_PAYMENT_METHODS,
  UAE_EMIRATES,
  emptyMarketplaceAddress,
  type MarketplaceAddress,
  type MarketplacePaymentMethod,
} from '@/lib/marketplace-shipping'
import { BUTTON_PRIMARY, BUTTON_OUTLINE } from '@/lib/admin-design-system'

type Props = {
  offerId: string
  price: number
  currency: string
  onCancel: () => void
  onSuccessMessage: (msg: string) => void
  getToken: () => Promise<string | undefined>
}

function AddressFields({
  label,
  value,
  onChange,
}: {
  label: string
  value: MarketplaceAddress
  onChange: (next: MarketplaceAddress) => void
}) {
  const set = (patch: Partial<MarketplaceAddress>) => onChange({ ...value, ...patch })
  return (
    <fieldset className="space-y-2 border border-neutral-200 rounded-md p-3">
      <legend className="text-xs font-semibold uppercase tracking-wide text-neutral-600 px-1">
        {label}
      </legend>
      <input
        className="w-full h-8 px-2 text-sm border border-neutral-300 rounded-md"
        placeholder="Full name"
        value={value.fullName}
        onChange={(e) => set({ fullName: e.target.value })}
      />
      <input
        className="w-full h-8 px-2 text-sm border border-neutral-300 rounded-md"
        placeholder="Phone"
        value={value.phone}
        onChange={(e) => set({ phone: e.target.value })}
      />
      <input
        className="w-full h-8 px-2 text-sm border border-neutral-300 rounded-md"
        placeholder="Street address"
        value={value.line1}
        onChange={(e) => set({ line1: e.target.value })}
      />
      <input
        className="w-full h-8 px-2 text-sm border border-neutral-300 rounded-md"
        placeholder="Apartment / building (optional)"
        value={value.line2 || ''}
        onChange={(e) => set({ line2: e.target.value })}
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          className="w-full h-8 px-2 text-sm border border-neutral-300 rounded-md"
          placeholder="City"
          value={value.city}
          onChange={(e) => set({ city: e.target.value })}
        />
        <select
          className="w-full h-8 px-2 text-sm border border-neutral-300 rounded-md bg-white"
          value={value.emirate}
          onChange={(e) => set({ emirate: e.target.value })}
        >
          {UAE_EMIRATES.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
      </div>
      <input
        className="w-full h-8 px-2 text-sm border border-neutral-300 rounded-md"
        placeholder="Postal code (optional)"
        value={value.postalCode || ''}
        onChange={(e) => set({ postalCode: e.target.value })}
      />
    </fieldset>
  )
}

export function MarketplaceCheckoutPanel({
  offerId,
  price,
  currency,
  onCancel,
  onSuccessMessage,
  getToken,
}: Props) {
  const [paymentMethod, setPaymentMethod] = useState<MarketplacePaymentMethod>('card')
  const [invoiceAddress, setInvoiceAddress] = useState(emptyMarketplaceAddress)
  const [deliveryAddress, setDeliveryAddress] = useState(emptyMarketplaceAddress)
  const [sameAsInvoice, setSameAsInvoice] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    setBusy(true)
    setError('')
    try {
      const token = await getToken()
      if (!token) throw new Error('Sign in required')
      const res = await fetch('/api/marketplace/checkout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          offerId,
          paymentMethod,
          invoiceAddress,
          deliveryAddress: sameAsInvoice ? invoiceAddress : deliveryAddress,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Checkout failed')

      if (json.checkoutUrl) {
        window.location.href = json.checkoutUrl
        return
      }

      const docs =
        json.invoiceUrl || json.receiptUrl
          ? ' Invoice/receipt generated — see My Orders.'
          : ''
      let bankNote = ''
      const bt = json.bankTransferDetails as
        | {
            bankName?: string
            accountName?: string
            iban?: string
            accountNumber?: string
            notes?: string
            shopName?: string
          }
        | null
        | undefined
      if (paymentMethod === 'bank_transfer' && bt) {
        bankNote = [
          bt.shopName ? `Pay ${bt.shopName}` : 'Pay the shop',
          bt.bankName,
          bt.accountName ? `A/C: ${bt.accountName}` : '',
          bt.iban ? `IBAN: ${bt.iban}` : bt.accountNumber ? `A/C #: ${bt.accountNumber}` : '',
          bt.notes,
          json.orderId ? `Reference: ${json.orderId}` : '',
        ]
          .filter(Boolean)
          .join(' · ')
        bankNote = ` ${bankNote}`
      }
      onSuccessMessage(
        paymentMethod === 'cod'
          ? `Order placed (COD). The shop was notified and will arrange pickup with their delivery partner.${docs}`
          : paymentMethod === 'bank_transfer'
            ? `Order placed. Complete the UAE bank transfer, then the shop confirms and arranges delivery.${bankNote}${docs}`
            : `Order placed.${docs}`
      )
      onCancel()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Checkout failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-4 space-y-4 rounded-lg border border-neutral-200 bg-white p-4">
      <div>
        <h3 className="font-semibold text-neutral-900">Checkout</h3>
        <p className="text-sm text-neutral-600 mt-0.5">
          Total: <span className="font-semibold text-neutral-900">{currency} {price.toFixed(2)}</span>
        </p>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-600 mb-2">
          Payment method
        </p>
        <div className="space-y-2">
          {MARKETPLACE_PAYMENT_METHODS.map((m) => (
            <label
              key={m.id}
              className={`flex gap-2 items-start rounded-md border px-3 py-2 cursor-pointer ${
                paymentMethod === m.id ? 'border-black bg-neutral-50' : 'border-neutral-200'
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                className="mt-1 accent-black"
                checked={paymentMethod === m.id}
                onChange={() => setPaymentMethod(m.id)}
              />
              <span>
                <span className="block text-sm font-medium text-neutral-900">{m.label}</span>
                <span className="block text-xs text-neutral-500">{m.description}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <AddressFields label="Invoice address" value={invoiceAddress} onChange={setInvoiceAddress} />

      <label className="flex items-center gap-2 text-sm text-neutral-700">
        <input
          type="checkbox"
          className="accent-black"
          checked={sameAsInvoice}
          onChange={(e) => setSameAsInvoice(e.target.checked)}
        />
        Delivery address same as invoice
      </label>

      {!sameAsInvoice ? (
        <AddressFields
          label="Delivery address"
          value={deliveryAddress}
          onChange={setDeliveryAddress}
        />
      ) : null}

      <p className="text-xs text-neutral-500">
        After you order, the shop is notified and arranges pickup with their preferred UAE delivery
        partner. You receive an auto-generated invoice (and receipt when paid by card).
      </p>

      {error ? (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={() => void submit()} className={BUTTON_PRIMARY}>
          {busy
            ? 'Working…'
            : paymentMethod === 'card'
              ? 'Continue to card payment'
              : 'Place order'}
        </button>
        <button type="button" disabled={busy} onClick={onCancel} className={BUTTON_OUTLINE}>
          Cancel
        </button>
      </div>
    </div>
  )
}
