'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { Card } from '@/components/ui/card'
import { ShoppingBag, Truck, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'
import {
  DashboardPageShell,
  DashboardSkeleton,
  DashboardErrorState,
  DashboardEmptyState,
} from '@/components/dashboard-states'

const STATUS_CONFIG = {
  pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
  processing: { color: 'bg-neutral-100 text-neutral-900', icon: Clock, label: 'Processing' },
  shipped: { color: 'bg-neutral-100 text-neutral-900', icon: Truck, label: 'Shipped' },
  delivered: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Delivered' },
  cancelled: { color: 'bg-red-100 text-red-800', icon: Clock, label: 'Cancelled' },
}

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth()
  const [orders, setOrders] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!user?.id) {
      setLoading(false)
      return
    }

    const unsubscribe = onSnapshot(
      query(collection(db, 'orders'), where('userId', '==', user.id)),
      (snapshot) => {
        const orderData =
          snapshot?.docs?.map((doc) => ({ id: doc.id, ...doc.data() })) ?? []
        orderData.sort((a, b) => {
          const aT = (a.createdAt as { toMillis?: () => number })?.toMillis?.() ?? 0
          const bT = (b.createdAt as { toMillis?: () => number })?.toMillis?.() ?? 0
          return bT - aT
        })
        setOrders(orderData)
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error('[v0] Error fetching orders:', err)
        setError('Failed to load orders.')
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [authLoading, user?.id])

  if (authLoading || loading) return <DashboardSkeleton />
  if (error) return <DashboardErrorState message={error} />

  return (
    <DashboardPageShell title="Orders" subtitle="Track your marketplace purchases">
      {orders.length === 0 ? (
        <DashboardEmptyState
          icon={<ShoppingBag className="w-12 h-12" />}
          title="No orders yet"
          description="Start shopping in the marketplace to see your orders here."
          action={
            <Link href="/dashboard/marketplace" className="!bg-black !text-white px-4 py-2 rounded-lg text-sm font-semibold">
              Browse Marketplace
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const status = String(order.status ?? 'pending')
            const statusConfig = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending
            const StatusIcon = statusConfig.icon
            return (
              <Card key={String(order.id)} className="p-5 border border-neutral-200">
                <div className="flex flex-col sm:flex-row sm:justify-between gap-3 mb-4">
                  <div>
                    <h3 className="font-semibold">Order #{String(order.id).slice(0, 8).toUpperCase()}</h3>
                    <p className="text-sm text-neutral-500">
                      {order.createdAt
                        ? new Date(
                            (order.createdAt as { toMillis?: () => number }).toMillis?.() ??
                              (order.createdAt as string)
                          ).toLocaleDateString()
                        : 'Date not available'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusIcon className="w-5 h-5" />
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-neutral-500">Items</p>
                    <p className="font-semibold">{Array.isArray(order.items) ? order.items.length : 0} item(s)</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500">Total</p>
                    <p className="font-semibold">AED {Number(order.total ?? 0).toLocaleString()}</p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </DashboardPageShell>
  )
}
