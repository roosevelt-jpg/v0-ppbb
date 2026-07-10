'use client'

export const dynamic = 'force-dynamic'

import React from 'react'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { db } from '@/lib/firebase'
import { adminApiFetch } from '@/lib/admin-api-client'
import { collection, onSnapshot } from 'firebase/firestore'
import { CheckCircle2, Trash2, Star, Tag } from 'lucide-react'

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
  const [filter, setFilter] = React.useState<'all' | 'pending_approval' | 'published'>('all')

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

  return (
    <AdminPageLayout title="Marketplace Moderation" subtitle="Approve offers and member discounts">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSection('offers')}
            className={`px-4 py-2 rounded-lg text-sm font-medium min-h-[44px] ${
              section === 'offers' ? 'bg-black text-white' : 'bg-white border border-gray-300 text-black'
            }`}
          >
            Offers
          </button>
          <button
            type="button"
            onClick={() => setSection('discounts')}
            className={`px-4 py-2 rounded-lg text-sm font-medium min-h-[44px] inline-flex items-center gap-2 ${
              section === 'discounts' ? 'bg-black text-white' : 'bg-white border border-gray-300 text-black'
            }`}
          >
            <Tag size={16} />
            Discounts
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {(['all', 'pending_approval', 'published'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium min-h-[44px] ${
                filter === tab ? 'bg-black text-white' : 'bg-white border border-gray-300 text-black'
              }`}
            >
              {tab === 'all' ? 'All' : tab === 'pending_approval' ? 'Pending' : 'Published'}
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
                          className="min-h-[44px] px-3 bg-green-600 text-white rounded text-xs font-medium disabled:opacity-50"
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
                        className="min-h-[44px] px-3 bg-red-50 text-red-700 rounded text-xs font-medium disabled:opacity-50"
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
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded text-xs font-medium disabled:opacity-50"
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
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 rounded text-xs font-medium disabled:opacity-50"
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
                        className="min-h-[44px] px-3 bg-green-600 text-white rounded text-xs font-medium disabled:opacity-50"
                      >
                        Approve
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={actingId === offer.id}
                      onClick={() => runAction(offer.id, 'feature')}
                      className="min-h-[44px] px-3 bg-amber-100 text-amber-800 rounded text-xs font-medium disabled:opacity-50"
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
                      className="min-h-[44px] px-3 bg-red-50 text-red-700 rounded text-xs font-medium disabled:opacity-50"
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
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded text-xs font-medium disabled:opacity-50"
                            >
                              <CheckCircle2 size={14} />
                              Approve
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={actingId === offer.id}
                            onClick={() => runAction(offer.id, 'feature')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-100 text-amber-800 rounded text-xs font-medium disabled:opacity-50"
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
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 rounded text-xs font-medium disabled:opacity-50"
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
