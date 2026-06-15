'use client'

import React from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getBusinessOffers, subscribeToBusinessOffers, deleteOffer } from '@/lib/business-queries'
import { BusinessOffer } from '@/lib/types'
import { Plus, Trash2, Edit2, TrendingUp } from 'lucide-react'

export default function BusinessOffers() {
  const { user } = useAuth()
  const router = useRouter()
  const [offers, setOffers] = React.useState<BusinessOffer[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!user || (user.role !== 'business' && user.role !== 'super_admin')) {
      router.push('/login')
      return
    }

    setLoading(true)
    const unsubscribe = subscribeToBusinessOffers(user.id, (data) => {
      setOffers(data)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user, router])

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this offer?')) {
      try {
        await deleteOffer(id)
        setOffers(offers.filter((o) => o.id !== id))
      } catch (error) {
        console.error('[v0] Error deleting offer:', error)
        alert('Error deleting offer')
      }
    }
  }

  if (!user || (user.role !== 'business' && user.role !== 'super_admin')) {
    return <div className="text-center py-8">Access Denied</div>
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#faf9f7' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e4e1da', padding: '32px' }}>
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 style={{ color: '#111111', fontSize: '32px', fontWeight: 700 }}>
              Posted Offers
            </h1>
            <p style={{ color: '#888888', marginTop: '8px' }}>
              Products, services, and member discounts
            </p>
          </div>
          <Button
            onClick={() => router.push('/business/offers/new')}
            style={{
              backgroundColor: '#111111',
              color: '#ffffff',
            }}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Post Offer
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-8">
        {loading ? (
          <div className="text-center py-8">Loading offers...</div>
        ) : offers.length === 0 ? (
          <Card style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da', padding: '48px', textAlign: 'center' }}>
            <p style={{ color: '#888888', marginBottom: '16px' }}>No offers posted yet</p>
            <Button
              onClick={() => router.push('/business/offers/new')}
              style={{ backgroundColor: '#111111', color: '#ffffff' }}
            >
              Post Your First Offer
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {offers.map((offer) => (
              <Card
                key={offer.id}
                style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da', padding: '24px' }}
              >
                <h3 style={{ color: '#111111', fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
                  {offer.title}
                </h3>
                <span style={{ backgroundColor: '#f0f0f0', color: '#111111', padding: '4px 12px', borderRadius: '4px', fontSize: '12px' }}>
                  {offer.type}
                </span>
                <p style={{ color: '#888888', marginTop: '12px', fontSize: '14px' }}>
                  {offer.description.substring(0, 100)}...
                </p>
                <div className="mt-4 space-y-2">
                  {offer.price && (
                    <p style={{ color: '#111111', fontWeight: 600 }}>
                      AED {offer.price}
                      {offer.discountPercentage && ` (${offer.discountPercentage}% off)`}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm">
                    <span style={{ color: '#888888' }}>Views: {offer.views}</span>
                    <span style={{ color: '#888888' }}>Conversions: {offer.conversions}</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={() => {}}
                    style={{ backgroundColor: '#e4e1da', color: '#111111', padding: '8px 12px', flex: 1 }}
                    className="text-sm"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => handleDelete(offer.id)}
                    style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '8px 12px', flex: 1 }}
                    className="text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
