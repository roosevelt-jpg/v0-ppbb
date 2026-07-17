'use client'

export const dynamic = 'force-dynamic'

import React from 'react'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { db } from '@/lib/firebase'
import { adminApiFetch } from '@/lib/admin-api-client'
import { collection, onSnapshot } from 'firebase/firestore'
import { uploadImageToFirebase } from '@/lib/upload-utils'
import { CheckCircle2, Trash2, Star, Tag, Plus, X, Upload, Loader2 } from 'lucide-react'

type OfferRow = {
  id: string
  title: string
  businessName?: string
  businessId?: string
  type?: string
  category?: string
  price?: number | null
  status?: string
  isFeatured?: boolean
  createdAt?: Date | null
}

function formatDate(d: Date | null | undefined): string {
  if (!d) return '—'
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

type DiscountRow = {
  id: string
  title: string
  businessId?: string
  discountValue?: number
  discountType?: string
  status?: string
  createdAt?: Date | null
}

export default function AdminMarketplacePage() {
  const [offers, setOffers] = React.useState<OfferRow[]>([])
  const [discounts, setDiscounts] = React.useState<DiscountRow[]>([])
  const [loading, setLoading] = React.useState(true)
  const [actingId, setActingId] = React.useState<string | null>(null)
  const [section, setSection] = React.useState<'offers' | 'discounts'>('offers')
  const [filter, setFilter] = React.useState<'all' | 'pending_approval' | 'published' | 'pb'>('all')
  const [showCreate, setShowCreate] = React.useState(false)
  const [creating, setCreating] = React.useState(false)
  const [uploadingImage, setUploadingImage] = React.useState(false)
  const [createForm, setCreateForm] = React.useState({
    title: '',
    description: '',
    price: '',
    originalPrice: '',
    category: 'merchandise',
    variant: '',
    imageURL: '',
    publishNow: true,
  })

  const resetCreateForm = () => {
    setCreateForm({
      title: '',
      description: '',
      price: '',
      originalPrice: '',
      category: 'merchandise',
      variant: '',
      imageURL: '',
      publishNow: true,
    })
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('Please choose an image file (JPG, PNG, WebP, or GIF).')
      e.target.value = ''
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Image is too large. Maximum size is 10 MB.')
      e.target.value = ''
      return
    }
    setUploadingImage(true)
    try {
      const url = await uploadImageToFirebase(file, 'marketplace/pb-products', { preset: 'content' })
      setCreateForm((f) => ({ ...f, imageURL: url }))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Image upload failed')
    } finally {
      setUploadingImage(false)
      e.target.value = ''
    }
  }

  React.useEffect(() => {
    const map = new Map<string, OfferRow>()

    const merge = () => {
      const rows = Array.from(map.values()).sort(
        (a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
      )
      setOffers(rows)
      setLoading(false)
    }

    const normalize = (id: string, data: Record<string, unknown>): OfferRow => ({
      id,
      title: String(data.title || 'Untitled'),
      businessName: String(data.businessName || ''),
      businessId: String(data.businessId || ''),
      type: String(data.type || ''),
      category: String(data.category || ''),
      price: typeof data.price === 'number' ? data.price : null,
      status: String(data.status || ''),
      isFeatured: data.isFeatured === true,
      createdAt:
        data.createdAt && typeof (data.createdAt as { toDate?: () => Date }).toDate === 'function'
          ? (data.createdAt as { toDate: () => Date }).toDate()
          : data.createdAt instanceof Date
            ? data.createdAt
            : null,
    })

    const unsubA = onSnapshot(collection(db, 'offers'), (snap) => {
      snap.docs.forEach((d) => map.set(d.id, normalize(d.id, d.data() as Record<string, unknown>)))
      merge()
    })
    const unsubB = onSnapshot(collection(db, 'businessOffers'), (snap) => {
      snap.docs.forEach((d) => {
        if (!map.has(d.id)) {
          map.set(d.id, normalize(d.id, d.data() as Record<string, unknown>))
        }
      })
      merge()
    })

    return () => {
      unsubA()
      unsubB()
    }
  }, [])

  React.useEffect(() => {
    const unsub = onSnapshot(collection(db, 'discounts'), (snap) => {
      setDiscounts(
        snap.docs
          .map((d) => {
            const data = d.data()
            return {
              id: d.id,
              title: String(data.title || 'Untitled'),
              businessId: String(data.businessId || ''),
              discountValue: typeof data.discountValue === 'number' ? data.discountValue : undefined,
              discountType: String(data.discountType || 'percent'),
              status: String(data.status || ''),
              createdAt:
                data.createdAt && typeof (data.createdAt as { toDate?: () => Date }).toDate === 'function'
                  ? (data.createdAt as { toDate: () => Date }).toDate()
                  : null,
            }
          })
          .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      )
    })
    return () => unsub()
  }, [])

  const filtered = offers.filter((o) => {
    const s = (o.status || '').toLowerCase()
    if (filter === 'pb') {
      return (
        o.businessId === 'passive-blessings' ||
        (o.businessName || '').toLowerCase().includes('passive blessings')
      )
    }
    if (filter === 'pending_approval') return s === 'pending_approval' || s === 'draft'
    if (filter === 'published') return s === 'published' || s === 'active' || s === 'open'
    return true
  })

  const filteredDiscounts = discounts.filter((d) => {
    const s = (d.status || '').toLowerCase()
    if (filter === 'pending_approval') return s === 'pending_approval'
    if (filter === 'published') return s === 'active'
    return true
  })

  const runAction = async (id: string, action: string) => {
    setActingId(id)
    try {
      const json = await adminApiFetch('/api/admin/offers', {
        method: 'PATCH',
        body: JSON.stringify({ id, action }),
      })
      if (!json.success) {
        alert(json.error || 'Action failed')
        return
      }
      // Refresh list so Feature/Unfeature label updates
      window.location.reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setActingId(null)
    }
  }

  const runDiscountAction = async (id: string, action: string) => {
    setActingId(id)
    try {
      const json = await adminApiFetch('/api/admin/discounts', {
        method: 'PATCH',
        body: JSON.stringify({ id, action }),
      })
      if (!json.success) {
        alert(json.error || 'Action failed')
        return
      }
      window.location.reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setActingId(null)
    }
  }

  const createPbProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createForm.title.trim()) {
      alert('Title is required')
      return
    }
    setCreating(true)
    try {
      const json = await adminApiFetch('/api/admin/offers', {
        method: 'POST',
        body: JSON.stringify({
          title: createForm.title.trim(),
          description: createForm.description.trim(),
          price: createForm.price === '' ? null : Number(createForm.price),
          originalPrice: createForm.originalPrice === '' ? null : Number(createForm.originalPrice),
          category: createForm.category,
          type: 'product',
          variant: createForm.variant.trim(),
          imageURL: createForm.imageURL.trim(),
          status: createForm.publishNow ? 'published' : 'draft',
        }),
      })
      if (!json.success) {
        alert(json.error || 'Failed to create product')
        return
      }
      setShowCreate(false)
      resetCreateForm()
      setFilter('pb')
      setSection('offers')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create product')
    } finally {
      setCreating(false)
    }
  }

  return (
    <AdminPageLayout
      title="Marketplace"
      subtitle="Moderate business offers, and list Passive Blessings products for the shop"
    >
      <div className="space-y-6">
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
          <p>
            <strong>Marketplace</strong> is the community directory of business offers & discounts.
            <strong> PB products</strong> (hoodies, gifts, merch) also live here — use{' '}
            <strong>Add PB product</strong> so they appear on <code className="text-xs">/shop</code>{' '}
            when category is Merchandise and status is Published.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSection('offers')}
              className={`px-4 py-2 rounded-lg text-sm font-medium min-h-[44px] bg-black text-white ${
                section === 'offers' ? 'ring-2 ring-offset-1 ring-black' : 'opacity-70'
              }`}
            >
              Offers
            </button>
            <button
              type="button"
              onClick={() => setSection('discounts')}
              className={`px-4 py-2 rounded-lg text-sm font-medium min-h-[44px] inline-flex items-center gap-2 bg-black text-white ${
                section === 'discounts' ? 'ring-2 ring-offset-1 ring-black' : 'opacity-70'
              }`}
            >
              <Tag size={16} />
              Discounts
            </button>
          </div>
          {section === 'offers' && (
            <button
              type="button"
              onClick={() => setShowCreate((v) => !v)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium min-h-[44px] bg-black text-white"
            >
              {showCreate ? <X size={16} /> : <Plus size={16} />}
              {showCreate ? 'Cancel' : 'Add PB product'}
            </button>
          )}
        </div>

        {showCreate && section === 'offers' && (
          <form
            onSubmit={createPbProduct}
            className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 space-y-4"
          >
            <div>
              <h3 className="font-semibold text-neutral-900">New Passive Blessings product</h3>
              <p className="text-xs text-neutral-500 mt-1">
                Seller will be listed as Passive Blessings. Merchandise items show on the public shop.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="text-sm sm:col-span-2">
                Title *
                <input
                  required
                  value={createForm.title}
                  onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="Community Hoodie — Black"
                />
              </label>
              <label className="text-sm sm:col-span-2">
                Description
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm min-h-[80px]"
                  placeholder="Product details…"
                />
              </label>
              <label className="text-sm">
                Price (AED)
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={createForm.price}
                  onChange={(e) => setCreateForm((f) => ({ ...f, price: e.target.value }))}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                />
              </label>
              <label className="text-sm">
                Compare-at price (optional)
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={createForm.originalPrice}
                  onChange={(e) => setCreateForm((f) => ({ ...f, originalPrice: e.target.value }))}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                />
              </label>
              <label className="text-sm">
                Category
                <select
                  value={createForm.category}
                  onChange={(e) => setCreateForm((f) => ({ ...f, category: e.target.value }))}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="merchandise">Merchandise (shows on /shop)</option>
                  <option value="product">Product (marketplace)</option>
                  <option value="service">Service</option>
                  <option value="education">Education</option>
                </select>
              </label>
              <label className="text-sm">
                Variant (size / colour)
                <input
                  value={createForm.variant}
                  onChange={(e) => setCreateForm((f) => ({ ...f, variant: e.target.value }))}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="Black / M"
                />
              </label>
              <div className="text-sm sm:col-span-2 space-y-2">
                <span className="font-medium text-neutral-800">Product image</span>
                <p className="text-xs text-neutral-500">
                  Upload an image directly (not a link). JPG, PNG, WebP, or GIF up to 10 MB.
                </p>
                {createForm.imageURL ? (
                  <div className="relative w-full max-w-xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={createForm.imageURL}
                      alt="Product preview"
                      className="w-full aspect-square object-cover rounded-lg border border-neutral-200"
                    />
                    <button
                      type="button"
                      onClick={() => setCreateForm((f) => ({ ...f, imageURL: '' }))}
                      className="absolute top-2 right-2 inline-flex items-center gap-1 min-h-[36px] px-3 rounded-lg bg-black text-white text-xs font-semibold"
                    >
                      <X size={14} />
                      Remove
                    </button>
                  </div>
                ) : null}
                <label className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-lg bg-black text-white text-sm font-semibold cursor-pointer hover:bg-neutral-900 disabled:opacity-50">
                  {uploadingImage ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Upload size={16} />
                  )}
                  {uploadingImage
                    ? 'Uploading…'
                    : createForm.imageURL
                      ? 'Replace image'
                      : 'Upload image'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingImage || creating}
                    onChange={(e) => void handleImageUpload(e)}
                  />
                </label>
              </div>
              <label className="text-sm flex items-center gap-2 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={createForm.publishNow}
                  onChange={(e) => setCreateForm((f) => ({ ...f, publishNow: e.target.checked }))}
                />
                Publish immediately (live on shop/marketplace)
              </label>
            </div>
            <button
              type="submit"
              disabled={creating || uploadingImage}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-black text-white text-sm font-semibold disabled:opacity-50 min-h-[44px]"
            >
              <Plus size={16} />
              {creating ? 'Creating…' : 'Create PB product'}
            </button>
          </form>
        )}

        <div className="flex flex-wrap gap-2">
          {(['all', 'pending_approval', 'published', 'pb'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium min-h-[44px] bg-black text-white ${
                filter === tab ? 'ring-2 ring-offset-1 ring-black' : 'opacity-70'
              }`}
            >
              {tab === 'all'
                ? 'All'
                : tab === 'pending_approval'
                  ? 'Pending'
                  : tab === 'published'
                    ? 'Published'
                    : 'PB products'}
            </button>
          ))}
        </div>

        {loading && section === 'offers' ? (
          <p className="text-gray-500 py-12 text-center">Loading marketplace listings…</p>
        ) : section === 'discounts' ? (
          filteredDiscounts.length === 0 ? (
            <p className="text-gray-500 py-12 text-center bg-gray-50 rounded-lg">No discounts found.</p>
          ) : (
            <>
            <div className="md:hidden space-y-3">
              {filteredDiscounts.map((row) => {
                const isPending = (row.status || '').toLowerCase() === 'pending_approval'
                return (
                  <div key={row.id} className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
                    <p className="font-semibold text-sm break-words">{row.title}</p>
                    <p className="text-xs text-gray-600 break-all">{row.businessId}</p>
                    <p className="text-sm">
                      {row.discountType === 'fixed'
                        ? `AED ${row.discountValue ?? 0}`
                        : `${row.discountValue ?? 0}%`}
                      {' · '}
                      <span className="capitalize">{(row.status || '').replace(/_/g, ' ')}</span>
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {isPending && (
                        <button
                          type="button"
                          disabled={actingId === row.id}
                          onClick={() => runDiscountAction(row.id, 'approve')}
                          className="min-h-[44px] px-3 bg-black text-white rounded text-xs font-medium disabled:opacity-50"
                        >
                          Approve
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={actingId === row.id}
                        onClick={() => {
                          if (confirm('Remove this discount?')) void runDiscountAction(row.id, 'remove')
                        }}
                        className="min-h-[44px] px-3 bg-black text-white rounded text-xs font-medium disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="hidden md:block bg-white border border-gray-200 rounded-lg overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Title</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Business</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Value</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredDiscounts.map((row) => {
                    const isPending = (row.status || '').toLowerCase() === 'pending_approval'
                    return (
                      <tr key={row.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium">{row.title}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{row.businessId}</td>
                        <td className="px-4 py-3 text-sm">
                          {row.discountType === 'fixed'
                            ? `AED ${row.discountValue ?? 0}`
                            : `${row.discountValue ?? 0}%`}
                        </td>
                        <td className="px-4 py-3 text-sm capitalize">{(row.status || '').replace(/_/g, ' ')}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            {isPending && (
                              <button
                                type="button"
                                disabled={actingId === row.id}
                                onClick={() => runDiscountAction(row.id, 'approve')}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded text-xs font-medium disabled:opacity-50"
                              >
                                <CheckCircle2 size={14} />
                                Approve
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={actingId === row.id}
                              onClick={() => {
                                if (confirm('Remove this discount?')) void runDiscountAction(row.id, 'remove')
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded text-xs font-medium disabled:opacity-50"
                            >
                              <Trash2 size={14} />
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            </>
          )
        ) : filtered.length === 0 ? (
          <p className="text-gray-500 py-12 text-center bg-gray-50 rounded-lg">No listings found.</p>
        ) : (
          <>
          <div className="md:hidden space-y-3">
            {filtered.map((offer) => {
              const status = (offer.status || '').toLowerCase()
              const isPending = status === 'pending_approval' || status === 'draft'
              return (
                <div key={offer.id} className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
                  <p className="font-semibold text-sm break-words">{offer.title}</p>
                  <p className="text-xs text-gray-600">{offer.businessName || offer.businessId}</p>
                  <p className="text-sm capitalize">
                    {offer.type || offer.category} · {offer.price != null ? `AED ${offer.price}` : '—'} · {status.replace(/_/g, ' ')}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {isPending && (
                      <button
                        type="button"
                        disabled={actingId === offer.id}
                        onClick={() => runAction(offer.id, 'approve')}
                        className="min-h-[44px] px-3 bg-black text-white rounded text-xs font-medium disabled:opacity-50"
                      >
                        Approve
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={actingId === offer.id}
                      onClick={() => runAction(offer.id, 'feature')}
                      className="min-h-[44px] px-3 bg-black text-white rounded text-xs font-medium disabled:opacity-50"
                    >
                      {offer.isFeatured ? 'Unfeature' : 'Feature'}
                    </button>
                    <button
                      type="button"
                      disabled={actingId === offer.id}
                      onClick={() => {
                        if (confirm('Remove this listing from the marketplace?')) {
                          void runAction(offer.id, 'remove')
                        }
                      }}
                      className="min-h-[44px] px-3 bg-black text-white rounded text-xs font-medium disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="hidden md:block bg-white border border-gray-200 rounded-lg overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Title</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Business</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Price</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Posted</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((offer) => {
                  const status = (offer.status || '').toLowerCase()
                  const isPending = status === 'pending_approval' || status === 'draft'
                  return (
                    <tr key={offer.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium">{offer.title}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{offer.businessName || offer.businessId}</td>
                      <td className="px-4 py-3 text-sm capitalize">{offer.type || offer.category}</td>
                      <td className="px-4 py-3 text-sm">
                        {offer.price != null ? `AED ${offer.price}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm capitalize">{status.replace(/_/g, ' ')}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatDate(offer.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          {isPending && (
                            <button
                              type="button"
                              disabled={actingId === offer.id}
                              onClick={() => runAction(offer.id, 'approve')}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded text-xs font-medium disabled:opacity-50"
                            >
                              <CheckCircle2 size={14} />
                              Approve
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={actingId === offer.id}
                            onClick={() => runAction(offer.id, 'feature')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded text-xs font-medium disabled:opacity-50"
                          >
                            <Star size={14} />
                            {offer.isFeatured ? 'Unfeature' : 'Feature'}
                          </button>
                          <button
                            type="button"
                            disabled={actingId === offer.id}
                            onClick={() => {
                              if (confirm('Remove this listing from the marketplace?')) {
                                void runAction(offer.id, 'remove')
                              }
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded text-xs font-medium disabled:opacity-50"
                          >
                            <Trash2 size={14} />
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>
    </AdminPageLayout>
  )
}
