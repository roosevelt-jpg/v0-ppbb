'use client'

export const dynamic = 'force-dynamic'

import React, { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { auth } from '@/lib/firebase'
import { Card } from '@/components/ui/card'
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
      if (!payJson.success || !payJson.checkoutUrl) {
        throw new Error(payJson.error || 'Checkout failed')
      }
      window.location.href = payJson.checkoutUrl
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Request failed')
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#faf9f7] p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">Advertise on homepage</h1>
          <p className="text-sm text-neutral-600 mt-1">
            Purchase a horizontal banner placement under the hero. After payment, an admin publishes
            it live.
          </p>
        </div>

        {message ? (
          <Card className="p-4 text-sm border border-neutral-200 bg-white">{message}</Card>
        ) : null}

        <Card className="p-5 space-y-4 bg-white border border-neutral-200">
          <div>
            <label className="block text-sm font-medium mb-1">Banner image (GIF or JPG/PNG)</label>
            <label className="inline-flex items-center gap-2 cursor-pointer border border-dashed border-neutral-300 rounded-lg px-4 py-3 text-sm">
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
              className="w-full border border-neutral-300 rounded-lg px-3 py-2"
              placeholder="https://your-site.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Alt text</label>
            <input
              type="text"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              className="w-full border border-neutral-300 rounded-lg px-3 py-2"
            />
          </div>
          <p className="text-sm text-neutral-600">Standard placement: AED 500 (one-time).</p>
          <button
            type="button"
            disabled={saving || uploading}
            onClick={() => void submitAndPay()}
            className="!bg-black !text-white px-4 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 inline-flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Submit &amp; pay
          </button>
        </Card>

        <Card className="p-5 bg-white border border-neutral-200">
          <h2 className="font-semibold mb-3">Your requests</h2>
          {requests.length === 0 ? (
            <p className="text-sm text-neutral-500">No advertising requests yet.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {requests.map((r) => (
                <li key={r.id} className="flex gap-3 items-start border-b border-neutral-100 pb-3">
                  {r.imageURL ? (
                    <img src={r.imageURL} alt="" className="w-24 h-12 object-cover rounded" />
                  ) : null}
                  <div>
                    <p className="font-medium capitalize">{String(r.status || 'pending').replace(/_/g, ' ')}</p>
                    <p className="text-neutral-500">AED {r.priceAed ?? 500}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}

export default function BusinessAdvertisePage() {
  return (
    <Suspense fallback={<div className="p-8 text-neutral-500">Loading…</div>}>
      <AdvertiseInner />
    </Suspense>
  )
}
