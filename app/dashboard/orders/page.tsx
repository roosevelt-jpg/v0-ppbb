'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { Card } from '@/components/ui/card'
import { ShoppingBag, Truck, CheckCircle, Clock, FileText, Banknote } from 'lucide-react'
import Link from 'next/link'
import {
  DashboardPageShell,
  DashboardSkeleton,
  DashboardErrorState,
  DashboardEmptyState,
} from '@/components/dashboard-states'
import {
  formatMarketplaceAddress,
  paymentMethodLabel,
  type MarketplaceAddress,
} from '@/lib/marketplace-shipping'
import { BUTTON_OUTLINE } from '@/lib/admin-design-system'

const STATUS_CONFIG: Record<
  string,
  { color: string; icon: typeof Clock; label: string }
> = {
  pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
  pending_payment: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending payment' },
  awaiting_fulfillment: {
    color: 'bg-amber-100 text-amber-900',
    icon: Clock,
    label: 'Awaiting shop fulfillment',
  },
  processing: { color: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-foreground', icon: Clock, label: 'Processing' },
  shipped: { color: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-foreground', icon: Truck, label: 'Shipped' },
  delivered: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Delivered' },
  cancelled: { color: 'bg-red-100 text-red-800', icon: Clock, label: 'Cancelled' },
  enquiry: { color: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-foreground', icon: Clock, label: 'Enquiry' },
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
        const orderData: Record<string, unknown>[] =
          snapshot?.docs?.map((doc) => ({ id: doc.id, ...doc.data() })) ?? []
        orderData.sort((a, b) => {
          const aT = (a.createdAt as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0
          const bT = (b.createdAt as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0
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
    <DashboardPageShell title="Orders" subtitle="Track your marketplace purchases, invoices & receipts">
      {orders.length === 0 ? (
        <DashboardEmptyState
          icon={<ShoppingBag className="w-12 h-12" />}
          title="No orders yet"
          description="Start shopping in the marketplace to see your orders here."
          action={
            <Link
              href="/marketplace"
              className="!bg-black !text-white px-4 py-2 rounded-lg text-sm font-semibold"
            >
              Browse Marketplace
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const status = String(order.status ?? 'pending')
            const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.pending
            const StatusIcon = statusConfig.icon
            const invoiceUrl = typeof order.invoiceUrl === 'string' ? order.invoiceUrl : null
            const receiptUrl = typeof order.receiptUrl === 'string' ? order.receiptUrl : null
            const paymentMethod = String(order.paymentMethod || '')
            const shopName = String(order.shopName || '')
            const total = Number(order.total ?? order.amount ?? 0)

            return (
              <Card key={String(order.id)} className="p-5 border border-neutral-200 dark:border-border space-y-3">
                <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">
                      {String(order.offerTitle || `Order #${String(order.id).slice(0, 8).toUpperCase()}`)}
                    </h3>
                    <p className="text-sm text-neutral-500 dark:text-muted-foreground">
                      {order.createdAt
                        ? new Date(
                            (order.createdAt as { toMillis?: () => number }).toMillis?.() ??
                              (order.createdAt as string)
                          ).toLocaleDateString()
                        : 'Date not available'}
                      {shopName ? ` · ${shopName}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusIcon className="w-5 h-5" />
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-muted-foreground">Total</p>
                    <p className="font-semibold">
                      {String(order.currency || 'AED')} {total.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-muted-foreground">Payment</p>
                    <p className="font-semibold flex items-center gap-1">
                      <Banknote className="w-3.5 h-3.5" />
                      {paymentMethodLabel(paymentMethod)}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-muted-foreground capitalize">
                      {String(order.paymentStatus || '').replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-muted-foreground">Delivery partner</p>
                    <p className="font-semibold">
                      {String(order.deliveryPartnerLabel || 'Arranged by shop')}
                    </p>
                    {typeof order.trackingNumber === 'string' && order.trackingNumber ? (
                      <p className="text-xs text-neutral-500 dark:text-muted-foreground">Tracking: {order.trackingNumber}</p>
                    ) : null}
                  </div>
                </div>

                {(order.deliveryAddress || order.invoiceAddress) && (
                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    {order.deliveryAddress ? (
                      <div>
                        <p className="text-xs text-neutral-500 dark:text-muted-foreground">Delivery address</p>
                        <pre className="whitespace-pre-wrap font-sans text-neutral-800 dark:text-foreground mt-0.5">
                          {formatMarketplaceAddress(order.deliveryAddress as MarketplaceAddress)}
                        </pre>
                      </div>
                    ) : null}
                    {order.invoiceAddress ? (
                      <div>
                        <p className="text-xs text-neutral-500 dark:text-muted-foreground">Invoice address</p>
                        <pre className="whitespace-pre-wrap font-sans text-neutral-800 dark:text-foreground mt-0.5">
                          {formatMarketplaceAddress(order.invoiceAddress as MarketplaceAddress)}
                        </pre>
                      </div>
                    ) : null}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {invoiceUrl ? (
                    <a href={invoiceUrl} target="_blank" rel="noreferrer" className={BUTTON_OUTLINE}>
                      <FileText className="w-3.5 h-3.5" /> Invoice
                    </a>
                  ) : null}
                  {receiptUrl ? (
                    <a href={receiptUrl} target="_blank" rel="noreferrer" className={BUTTON_OUTLINE}>
                      <FileText className="w-3.5 h-3.5" /> Receipt
                    </a>
                  ) : null}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </DashboardPageShell>
  )
}
