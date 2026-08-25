'use client'

export const dynamic = 'force-dynamic'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { updateOffer } from '@/lib/business-queries'
import type { BusinessOffer } from '@/lib/types'
import { RichTextEditor } from '@/components/rich-text-editor'
import { OFFER_INDUSTRY_CATEGORIES, OFFER_TYPES } from '@/lib/offer-categories'
import { useAuth } from '@/lib/auth-context'
import { hasBusinessAccess } from '@/lib/roles'

export default function EditOfferPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { user, loading: authLoading } = useAuth()
  const [offer, setOffer] = useState<BusinessOffer | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user || !hasBusinessAccess(user)) {
      router.push('/login')
      return
    }
    async function load() {
      let snap = await getDoc(doc(db, 'businessOffers', id))
      if (!snap.exists()) snap = await getDoc(doc(db, 'offers', id))
      if (snap.exists()) setOffer({ id: snap.id, ...snap.data() } as BusinessOffer)
      setLoading(false)
    }
    void load()
  }, [authLoading, user, router, id])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!offer) return
    setSaving(true)
    try {
      const type = offer.type === 'service' ? 'service' : 'product'
      await updateOffer(id, {
        ...offer,
        type,
        category: offer.category || 'other',
      })
      router.push('/business/offers')
    } catch {
      alert('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (!user || !hasBusinessAccess(user)) return <p className="p-8">Access Denied</p>
  if (loading) return <p className="p-8">Loading…</p>
  if (!offer) return <p className="p-8">Offer not found</p>

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-8">
      <h1 className="text-2xl font-bold mb-2">Edit Offer</h1>
      <p className="text-sm text-neutral-600 dark:text-muted-foreground mb-6">
        Type is Product or Service. Category is industry — not the same as type.
      </p>
      <form onSubmit={handleSave} className="space-y-4 bg-white dark:bg-card border rounded-lg p-6">
        <div>
          <label className="block text-sm font-medium mb-1">Offer Title *</label>
          <input
            value={offer.title}
            onChange={(e) => setOffer({ ...offer, title: e.target.value })}
            className="w-full min-h-[44px] px-3 border rounded-lg"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Type *</label>
            <select
              value={offer.type === 'service' ? 'service' : 'product'}
              onChange={(e) =>
                setOffer({
                  ...offer,
                  type: e.target.value as BusinessOffer['type'],
                })
              }
              className="w-full min-h-[44px] px-3 border rounded-lg"
            >
              {OFFER_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category *</label>
            <select
              value={offer.category || ''}
              onChange={(e) => setOffer({ ...offer, category: e.target.value })}
              className="w-full min-h-[44px] px-3 border rounded-lg"
              required
            >
              <option value="">Select category</option>
              {OFFER_INDUSTRY_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
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
          <input
            type="number"
            value={offer.price ?? ''}
            onChange={(e) => setOffer({ ...offer, price: Number(e.target.value) })}
            className="w-full min-h-[44px] px-3 border rounded-lg"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="w-full min-h-[44px] bg-black text-white rounded-lg font-semibold disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}
