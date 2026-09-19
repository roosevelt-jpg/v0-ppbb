'use client'

export const dynamic = 'force-dynamic'

import React, { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { auth } from '@/lib/firebase'
import { Card } from '@/components/ui/card'
import { Dialog } from '@/components/dialog'
import { StripeCardCheckout } from '@/components/stripe-card-checkout'
import { Loader2, Upload } from 'lucide-react'
import { uploadImageToFirebase } from '@/lib/upload-utils'

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
    setUploading(true)
    setMessage(null)
    try {
      const url = await uploadImageToFirebase(file, 'advertising', {
        preset: 'banner',
      })
      setImageURL(url)
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

  const confirmAdvertisingPayment = async (paymentIntentId: string) => {
    if (!stripeCheckout) return
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
  }

  return (
    <div className="min-h-screen bg-[#faf9f7] dark:bg-neutral-950 p-4 sm:p-8">
      <Dialog
        open={Boolean(stripeCheckout)}
        onOpenChange={(open) => {
          if (!open) setStripeCheckout(null)
        }}
        title="Pay for advertising"
        description="Enter card details below. Payment stays on this page — card fields only."
        maxWidth="26rem"
        compact={false}
      >
        {stripeCheckout ? (
          <StripeCardCheckout
            publishableKey={stripeCheckout.publishableKey}
            clientSecret={stripeCheckout.clientSecret}
            mode="payment"
            submitLabel="Pay & submit"
            onSuccess={(paymentIntentId) => {
              if (!paymentIntentId) {
                setMessage('Payment completed but confirmation id was missing. Contact support.')
                return
              }
              void confirmAdvertisingPayment(paymentIntentId)
            }}
            onCancel={() => setStripeCheckout(null)}
          />
        ) : null}
      </Dialog>

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
