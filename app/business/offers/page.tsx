'use client'
export const dynamic = 'force-dynamic'

import React from 'react'
import { useAuth } from '@/lib/auth-context'
import { hasBusinessAccess } from '@/lib/roles'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { subscribeToBusinessOffers, deleteOffer } from '@/lib/business-queries'
import { BusinessOffer } from '@/lib/types'
import { Plus, Trash2, Edit2 } from 'lucide-react'

export default function BusinessOffers() {
  const { user } = useAuth()
  const router = useRouter()
  const [offers, setOffers] = React.useState<BusinessOffer[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

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
          <Card className="p-8 text-center border-[#e4e1da] dark:border-border">
            <p className="text-neutral-500 dark:text-muted-foreground mb-4">{error}</p>
            <Button type="button" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </Card>
        ) : loading ? (
          <div className="text-center py-8 text-neutral-500 dark:text-muted-foreground">Loading offers...</div>
        ) : offers.length === 0 ? (
          <Card className="p-8 sm:p-12 text-center border-[#e4e1da] dark:border-border">
            <p className="text-neutral-500 dark:text-muted-foreground mb-4">No offers posted yet</p>
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
              <Card key={offer.id} className="p-4 sm:p-6 border-[#e4e1da] dark:border-border flex flex-col">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-foreground mb-2">{offer.title}</h3>
                <span className="inline-block bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-foreground px-3 py-1 rounded text-xs w-fit">
                  {offer.type}
                </span>
                <p className="text-neutral-500 dark:text-muted-foreground mt-3 text-sm line-clamp-3 flex-1">
                  {(offer.description || '').substring(0, 120)}
                  {(offer.description || '').length > 120 ? '…' : ''}
                </p>
                <div className="mt-4 space-y-2">
                  {offer.price != null && (
                    <p className="text-neutral-900 dark:text-foreground font-semibold">
                      AED {offer.price}
                      {offer.discountPercentage ? ` (${offer.discountPercentage}% off)` : ''}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-500 dark:text-muted-foreground">
                    <span>Views: {offer.views ?? 0}</span>
                    <span>Conversions: {offer.conversions ?? 0}</span>
                  </div>
                  <p
                    className={`text-xs font-semibold capitalize ${
                      offer.status === 'pending_approval'
                        ? 'text-amber-700'
                        : offer.status === 'published' || offer.status === 'active'
                          ? 'text-green-700'
                          : 'text-neutral-500 dark:text-muted-foreground'
                    }`}
                  >
                    {String(offer.status || '').replace(/_/g, ' ')}
                  </p>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    type="button"
                    onClick={() => router.push(`/business/offers/${offer.id}/edit`)}
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
                    className="min-h-[44px] flex-1 bg-black !text-white border-0 hover:bg-neutral-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

    </div>
  )
}
