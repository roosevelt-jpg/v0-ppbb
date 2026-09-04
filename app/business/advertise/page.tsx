'use client'

export const dynamic = 'force-dynamic'

import React, { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { auth } from '@/lib/firebase'
import { Card } from '@/components/ui/card'
import { StripeCardForm } from '@/components/payments/stripe-card-form'
import { Loader2, Upload } from 'lucide-react'

type AdRequest = {
  id: string
  imageURL?: string
  href?: string
  alt?: string
  priceAed?: number
  status?: string
}

function AdvertiseInner() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [imageURL, setImageURL] = useState('')
  const [href, setHref] = useState('')
  const [alt, setAlt] = useState('Advertisement')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [requests, setRequests] = useState<AdRequest[]>([])
  const [stripeCheckout, setStripeCheckout] = useState<{
    clientSecret: string
    publishableKey: string
    advertisingRequestId: string
  } | null>(null)

  const load = async () => {
    const token = await auth.currentUser?.getIdToken()
    if (!token) return
    const res = await fetch('/api/advertising/requests', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const json = await res.json()
    if (json.success) setRequests(json.data || [])
  }

  useEffect(() => {
    void load()
    const status = searchParams.get('status')
    if (status === 'success') setMessage('Payment received. Admin will publish your banner after review.')
    if (status === 'canceled') setMessage('Checkout canceled.')
  }, [searchParams])

  const uploadBanner = async (file: File) => {
    if (file.size > 25 * 1024 * 1024) {
      setMessage('Image too large. Maximum 25 MB.')
      return
    }
    setUploading(true)
    setMessage(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'advertising')
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Upload failed')
      setImageURL(json.url)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const submitAndPay = async () => {
    if (!user?.id) return
    if (!imageURL) {
      setMessage('Upload a banner image first.')
      return
    }
    setSaving(true)
    setMessage(null)
    try {
      const token = await auth.currentUser?.getIdToken()
      if (!token) throw new Error('Sign in required')
      const createRes = await fetch('/api/advertising/requests', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageURL,
          href,
          alt,
          businessName: user.businessProfile?.businessName || user.displayName || 'Business',
        }),
      })
      const createJson = await createRes.json()
      if (!createJson.success) throw new Error(createJson.error || 'Could not create request')

      const payRes = await fetch('/api/advertising/requests', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: createJson.id }),
      })
      const payJson = await payRes.json()
      if (!payJson.success) {
        throw new Error(payJson.error || 'Checkout failed')
      }
      if (payJson.embedded && payJson.clientSecret && payJson.publishableKey) {
        setStripeCheckout({
          clientSecret: payJson.clientSecret,
          publishableKey: payJson.publishableKey,
          advertisingRequestId: createJson.id,
        })
        setSaving(false)
        return
      }
      throw new Error('Card checkout is not available. Check Stripe in Admin → Integrations.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Request failed')
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#faf9f7] dark:bg-neutral-950 p-4 sm:p-8">
      {stripeCheckout ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-md p-6 bg-white space-y-3">
            <h2 className="text-lg font-semibold">Pay for advertising</h2>
            <p className="text-sm text-neutral-600">Enter card details — you stay on Passive Blessings.</p>
            <StripeCardForm
              publishableKey={stripeCheckout.publishableKey}
              clientSecret={stripeCheckout.clientSecret}
              submitLabel="Pay & submit"
              onSuccess={async (paymentIntentId) => {
                const res = await fetch('/api/payments/confirm', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    type: 'advertising',
                    paymentIntentId,
                    advertisingRequestId: stripeCheckout.advertisingRequestId,
                  }),
                })
                const confirmJson = await res.json()
                if (!res.ok || !confirmJson.success) {
                  setMessage(confirmJson.error || 'Payment confirmation failed')
                  return
                }
                setStripeCheckout(null)
                setImageURL('')
                setHref('')
                setMessage('Payment received. Admin will publish your banner after review.')
                void load()
              }}
              onError={(msg) => setMessage(msg)}
            />
            <button
              type="button"
              className="text-xs underline text-neutral-600"
              onClick={() => setStripeCheckout(null)}
            >
              Cancel
            </button>
          </Card>
        </div>
      ) : null}

      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-foreground">Advertise on homepage</h1>
          <p className="text-sm text-neutral-600 dark:text-muted-foreground mt-1">
            Purchase a horizontal banner placement under the hero. After payment, an admin publishes
            it live.
          </p>
        </div>

        {message ? (
          <Card className="p-4 text-sm border border-neutral-200 dark:border-border bg-white dark:bg-card">{message}</Card>
        ) : null}

        <Card className="p-5 space-y-4 bg-white dark:bg-card border border-neutral-200 dark:border-border">
          <div>
            <label className="block text-sm font-medium mb-1">Banner image (GIF or JPG/PNG)</label>
            <label className="inline-flex items-center gap-2 cursor-pointer border border-dashed border-neutral-300 dark:border-border rounded-lg px-4 py-3 text-sm">
              <Upload size={16} />
              {uploading ? 'Uploading…' : 'Upload banner'}
              <input
                type="file"
                accept="image/*,image/gif"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) void uploadBanner(f)
                }}
              />
            </label>
            {imageURL ? (
              <img src={imageURL} alt="" className="mt-3 w-full max-h-40 object-cover rounded border" />
            ) : null}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Click-through link</label>
            <input
              type="url"
              value={href}
              onChange={(e) => setHref(e.target.value)}
              className="w-full border border-neutral-300 dark:border-border rounded-lg px-3 py-2"
              placeholder="https://"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Alt text</label>
            <input
              type="text"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              className="w-full border border-neutral-300 dark:border-border rounded-lg px-3 py-2"
            />
          </div>
          <button
            type="button"
            onClick={() => void submitAndPay()}
            disabled={saving || uploading}
            className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-lg bg-black text-white font-semibold disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {saving ? 'Preparing checkout…' : 'Pay with card'}
          </button>
        </Card>

        {requests.length > 0 ? (
          <Card className="p-5 bg-white dark:bg-card border border-neutral-200 dark:border-border">
            <h2 className="font-semibold mb-3">Your requests</h2>
            <ul className="space-y-2 text-sm">
              {requests.map((r) => (
                <li key={r.id} className="flex justify-between gap-2 border-b border-neutral-100 pb-2">
                  <span className="truncate">{r.alt || r.href || r.id}</span>
                  <span className="shrink-0 text-neutral-500">{r.status}</span>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
      </div>
    </div>
  )
}

export default function AdvertisePage() {
  return (
    <Suspense fallback={<div className="p-8">Loading…</div>}>
      <AdvertiseInner />
    </Suspense>
  )
}
