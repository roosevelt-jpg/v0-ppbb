'use client'

import { RichTextEditor } from '@/components/rich-text-editor'

export const dynamic = 'force-dynamic'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { updateOffer } from '@/lib/business-queries'
import type { BusinessOffer } from '@/lib/types'

export default function EditOfferPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [offer, setOffer] = useState<BusinessOffer | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      let snap = await getDoc(doc(db, 'businessOffers', id))
      if (!snap.exists()) snap = await getDoc(doc(db, 'offers', id))
      if (snap.exists()) setOffer({ id: snap.id, ...snap.data() } as BusinessOffer)
      setLoading(false)
    }
    void load()
  }, [id])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!offer) return
    setSaving(true)
    try {
      await updateOffer(id, offer)
      router.push('/business/offers')
    } catch {
      alert('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="p-8">Loading…</p>
  if (!offer) return <p className="p-8">Offer not found</p>

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-8">
      <h1 className="text-2xl font-bold mb-6">Edit Offer</h1>
      <form onSubmit={handleSave} className="space-y-4 bg-white border rounded-lg p-6">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input value={offer.title} onChange={(e) => setOffer({ ...offer, title: e.target.value })} className="w-full min-h-[44px] px-3 border rounded-lg" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <RichTextEditor
            value={offer.description || ''}
            onChange={(html) => setOffer({ ...offer, description: html })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Price (AED)</label>
          <input type="number" value={offer.price ?? ''} onChange={(e) => setOffer({ ...offer, price: Number(e.target.value) })} className="w-full min-h-[44px] px-3 border rounded-lg" />
        </div>
        <button type="submit" disabled={saving} className="w-full min-h-[44px] bg-black text-white rounded-lg font-semibold disabled:opacity-50">
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}
