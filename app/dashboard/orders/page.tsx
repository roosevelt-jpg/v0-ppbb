'use client'

import React, { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { MemberHeader } from '@/components/member-layout'
import { Card } from '@/components/ui/card'
import { ShoppingBag, Truck, CheckCircle, Clock } from 'lucide-react'

export const dynamic = 'force-dynamic'

const STATUS_CONFIG = {
  pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
  processing: { color: 'bg-blue-100 text-blue-800', icon: Clock, label: 'Processing' },
  shipped: { color: 'bg-blue-100 text-blue-800', icon: Truck, label: 'Shipped' },
  delivered: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Delivered' },
  cancelled: { color: 'bg-red-100 text-red-800', icon: Clock, label: 'Cancelled' },
}

export default function OrdersPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const firebaseUser = auth.currentUser
    if (!firebaseUser) return

    const unsubscribe = onSnapshot(
      query(
        collection(db, 'orders'),
        where('userId', '==', firebaseUser.uid)
      ),
      (snapshot) => {
        setOrders(
          snapshot.docs
            .map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }))
            .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
        )
        setLoading(false)
      },
      (error) => {
        console.error('[v0] Error fetching orders:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const getStatusConfig = (status: string) => {
    return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending
  }

  return (
    <>
      <MemberHeader
        title="My Orders"
        subtitle="Track your merchandise and purchases"
        open={sidebarOpen}
        setOpen={setSidebarOpen}
      />

      <div className="p-8">
        {loading ? (
          <div className="flex justify-center py-8">
            <p className="text-muted-foreground">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <Card className="p-8 text-center">
            <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground">No orders yet</p>
            <p className="text-sm text-muted-foreground mt-2">Start shopping in the marketplace to see your orders here</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusConfig = getStatusConfig(order.status)
              const StatusIcon = statusConfig.icon
              
              return (
                <Card key={order.id} className="p-6 hover:shadow-lg transition">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold">Order #{order.id.slice(0, 8).toUpperCase()}</h3>
                      <p className="text-sm text-muted-foreground">
                        {order.createdAt ? new Date(order.createdAt.toMillis?.() || order.createdAt).toLocaleDateString() : 'Date not available'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusIcon className="w-5 h-5" />
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>{statusConfig.label}</span>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4 pb-4 border-b">
                    <div>
                      <p className="text-xs text-muted-foreground">Items</p>
                      <p className="font-semibold">{order.items?.length || 0} item(s)</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Amount</p>
                      <p className="font-semibold">AED {order.total?.toLocaleString() || '0'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Shipping Address</p>
                      <p className="text-sm">{order.shippingAddress || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Tracking Number</p>
                      <p className="text-sm font-mono">{order.trackingNumber || 'Not available yet'}</p>
                    </div>
                  </div>

                  {order.timeline && (
                    <div className="flex gap-4 text-xs">
                      {order.timeline.map((event: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                          <span className="text-muted-foreground">{event.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
