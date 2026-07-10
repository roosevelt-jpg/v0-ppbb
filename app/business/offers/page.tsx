'use client'
export const dynamic = 'force-dynamic'

import React from 'react'
import { useAuth } from '@/lib/auth-context'
import { hasBusinessAccess } from '@/lib/roles'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DashboardModal } from '@/components/dashboard-modal'
import { subscribeToBusinessOffers, deleteOffer, updateOffer } from '@/lib/business-queries'
import { BusinessOffer } from '@/lib/types'
import { Plus, Trash2, Edit2 } from 'lucide-react'

export default function BusinessOffers() {
  const { user } = useAuth()
  const router = useRouter()
  const [offers, setOffers] = React.useState<BusinessOffer[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [selectedOffer, setSelectedOffer] = React.useState<BusinessOffer | null>(null)
  const [isEditingModal, setIsEditingModal] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [editForm, setEditForm] = React.useState({
    title: '',
    description: '',
    price: '',
    status: 'pending_approval' as BusinessOffer['status'],
  })

  React.useEffect(() => {
    if (!user || !hasBusinessAccess(user)) {
      router.push('/login')
      return
    }

    setLoading(true)
    setError(null)
    const unsubscribe = subscribeToBusinessOffers(
      user.id,
      (data) => {
        setOffers(data)
        setLoading(false)
      },
      () => {
        setError('Unable to load offers. Check your connection and try again.')
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user, router])

  const openEditModal = (offer: BusinessOffer) => {
    setSelectedOffer(offer)
    setEditForm({
      title: offer.title,
      description: offer.description || '',
      price: offer.price != null ? String(offer.price) : '',
      status: offer.status,
    })
    setIsEditingModal(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedOffer) return
    if (!editForm.title.trim()) {
      alert('Title is required')
      return
    }
    if (editForm.status === 'published' || editForm.status === 'active') {
      alert('Published status is set by admin after approval.')
      return
    }

    setSaving(true)
    try {
      await updateOffer(selectedOffer.id, {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        price: editForm.price ? Number(editForm.price) : undefined,
        status: editForm.status,
      })
      setIsEditingModal(false)
      setSelectedOffer(null)
    } catch (err) {
      console.error('[v0] Error updating offer:', err)
      alert('Error updating offer')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this offer?')) {
      try {
        await deleteOffer(id)
        setOffers(offers.filter((o) => o.id !== id))
      } catch (err) {
        console.error('[v0] Error deleting offer:', err)
        alert('Error deleting offer')
      }
    }
  }

  if (!user || !hasBusinessAccess(user)) {
    return <div className="text-center py-8">Access Denied</div>
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8">
      <div className="flex justify-end mb-6">
        <Button
          type="button"
          onClick={() => router.push('/business/offers/new')}
          className="min-h-[44px] w-full sm:w-auto bg-neutral-900 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Post Offer
        </Button>
      </div>

        {error ? (
          <Card className="p-8 text-center border-[#e4e1da]">
            <p className="text-neutral-500 mb-4">{error}</p>
            <Button type="button" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </Card>
        ) : loading ? (
          <div className="text-center py-8 text-neutral-500">Loading offers...</div>
        ) : offers.length === 0 ? (
          <Card className="p-8 sm:p-12 text-center border-[#e4e1da]">
            <p className="text-neutral-500 mb-4">No offers posted yet</p>
            <Button
              type="button"
              onClick={() => router.push('/business/offers/new')}
              className="min-h-[44px] bg-neutral-900 text-white"
            >
              Post Your First Offer
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {offers.map((offer) => (
              <Card key={offer.id} className="p-4 sm:p-6 border-[#e4e1da] flex flex-col">
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">{offer.title}</h3>
                <span className="inline-block bg-neutral-100 text-neutral-900 px-3 py-1 rounded text-xs w-fit">
                  {offer.type}
                </span>
                <p className="text-neutral-500 mt-3 text-sm line-clamp-3 flex-1">
                  {(offer.description || '').substring(0, 120)}
                  {(offer.description || '').length > 120 ? '…' : ''}
                </p>
                <div className="mt-4 space-y-2">
                  {offer.price != null && (
                    <p className="text-neutral-900 font-semibold">
                      AED {offer.price}
                      {offer.discountPercentage ? ` (${offer.discountPercentage}% off)` : ''}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-500">
                    <span>Views: {offer.views ?? 0}</span>
                    <span>Conversions: {offer.conversions ?? 0}</span>
                  </div>
                  <p
                    className={`text-xs font-semibold capitalize ${
                      offer.status === 'pending_approval'
                        ? 'text-amber-700'
                        : offer.status === 'published' || offer.status === 'active'
                          ? 'text-green-700'
                          : 'text-neutral-500'
                    }`}
                  >
                    {String(offer.status || '').replace(/_/g, ' ')}
                  </p>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    type="button"
                    onClick={() => openEditModal(offer)}
                    variant="outline"
                    size="sm"
                    className="min-h-[44px] flex-1"
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleDelete(offer.id)}
                    variant="outline"
                    size="sm"
                    className="min-h-[44px] flex-1 text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

      <DashboardModal
        open={isEditingModal && !!selectedOffer}
        title="Edit offer"
        onClose={() => {
          setIsEditingModal(false)
          setSelectedOffer(null)
        }}
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsEditingModal(false)
                setSelectedOffer(null)
              }}
              className="min-h-[44px] w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveEdit}
              disabled={saving}
              className="min-h-[44px] w-full sm:w-auto bg-neutral-900 text-white"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Title</label>
            <input
              type="text"
              value={editForm.title}
              onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full min-h-[44px] rounded-lg border border-neutral-300 px-3 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
              rows={4}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Price (AED)</label>
            <input
              type="number"
              min="0"
              value={editForm.price}
              onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))}
              className="w-full min-h-[44px] rounded-lg border border-neutral-300 px-3 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Status</label>
            <select
              value={editForm.status}
              onChange={(e) =>
                setEditForm((f) => ({
                  ...f,
                  status: e.target.value as BusinessOffer['status'],
                }))
              }
              className="w-full min-h-[44px] rounded-lg border border-neutral-300 px-3 text-sm"
            >
              <option value="pending_approval">Pending approval</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </DashboardModal>
    </div>
  )
}
