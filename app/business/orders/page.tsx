'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { auth } from '@/lib/firebase'
import { Card } from '@/components/ui/card'
import { BUTTON_PRIMARY, BUTTON_OUTLINE } from '@/lib/admin-design-system'
import {
  formatMarketplaceAddress,
  paymentMethodLabel,
  type MarketplaceAddress,
} from '@/lib/marketplace-shipping'
import { Package, Truck, CheckCircle, Clock, FileText } from 'lucide-react'

type Order = {
  id: string
  offerTitle?: string
  amount?: number
  total?: number
  currency?: string
  status?: string
  fulfillmentStatus?: string
  paymentMethod?: string
  paymentStatus?: string
  deliveryPartnerLabel?: string
  invoiceAddress?: MarketplaceAddress
  deliveryAddress?: MarketplaceAddress
  invoiceUrl?: string | null
  receiptUrl?: string | null
  trackingNumber?: string
  createdAt?: { toMillis?: () => number } | string
  buyerName?: string
}

export default function BusinessOrdersPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const token = await auth.currentUser?.getIdToken()
      if (!token) throw new Error('Sign in required')
      const res = await fetch('/api/marketplace/seller-orders', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Failed to load')
      setOrders(json.orders || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const act = async (orderId: string, action: string, extra?: Record<string, string>) => {
    setBusyId(orderId)
    try {
      const token = await auth.currentUser?.getIdToken()
      if (!token) throw new Error('Sign in required')
      const res = await fetch('/api/marketplace/seller-orders', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId, action, ...extra }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Update failed')
      await load()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Update failed')
    } finally {
      setBusyId(null)
    }
  }

  if (!user) {
    return <div className="p-8 text-center">Sign in required</div>
  }

  return (
    <div className="min-h-screen bg-[#faf9f7] dark:bg-neutral-950">
      <div className="bg-white dark:bg-card border-b border-[#e4e1da] dark:border-border px-4 py-6 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-[#111111] dark:text-foreground">Marketplace Orders</h1>
          <p className="text-sm text-[#888888] mt-1">
            When a customer buys, you are notified here. Arrange pickup with your preferred delivery
            partner, then mark the order shipped.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-4">
        {loading ? (
          <p className="text-neutral-500 dark:text-muted-foreground text-sm">Loading orders…</p>
        ) : error ? (
          <p className="text-red-700 text-sm">{error}</p>
        ) : orders.length === 0 ? (
          <Card className="p-8 text-center text-neutral-500 dark:text-muted-foreground border border-neutral-200 dark:border-border">
            <Package className="w-10 h-10 mx-auto mb-3 text-neutral-400 dark:text-neutral-500" />
            No marketplace orders yet.
          </Card>
        ) : (
          orders.map((order) => {
            const date = order.createdAt
              ? new Date(
                  typeof order.createdAt === 'object' && order.createdAt.toMillis
                    ? order.createdAt.toMillis()
                    : String(order.createdAt)
                ).toLocaleString()
              : ''
            const total = Number(order.total ?? order.amount ?? 0)
            const busy = busyId === order.id
            return (
              <Card key={order.id} className="p-5 border border-neutral-200 dark:border-border space-y-3">
                <div className="flex flex-wrap justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-[#111111] dark:text-foreground">
                      {order.offerTitle || 'Order'}
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-muted-foreground">
                      #{order.id.slice(0, 8).toUpperCase()} · {date}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-semibold">
                      {order.currency || 'AED'} {total.toFixed(2)}
                    </p>
                    <p className="text-neutral-600 dark:text-muted-foreground">{paymentMethodLabel(order.paymentMethod)}</p>
                    <p className="text-xs text-neutral-500 dark:text-muted-foreground capitalize">
                      {String(order.status || '').replace(/_/g, ' ')} ·{' '}
                      {String(order.fulfillmentStatus || '').replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs font-semibold uppercase text-neutral-500 dark:text-muted-foreground">Delivery</p>
                    <pre className="whitespace-pre-wrap font-sans text-neutral-800 dark:text-foreground mt-1">
                      {formatMarketplaceAddress(order.deliveryAddress)}
                    </pre>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-neutral-500 dark:text-muted-foreground">Invoice</p>
                    <pre className="whitespace-pre-wrap font-sans text-neutral-800 dark:text-foreground mt-1">
                      {formatMarketplaceAddress(order.invoiceAddress)}
                    </pre>
                  </div>
                </div>

                <p className="text-sm text-neutral-700 dark:text-neutral-200">
                  <Truck className="w-4 h-4 inline mr-1" />
                  Preferred partner:{' '}
                  <span className="font-medium">{order.deliveryPartnerLabel || 'Arrange yourself'}</span>
                </p>

                <div className="flex flex-wrap gap-2">
                  {order.invoiceUrl ? (
                    <a href={order.invoiceUrl} target="_blank" rel="noreferrer" className={BUTTON_OUTLINE}>
                      <FileText className="w-3.5 h-3.5" /> Invoice
                    </a>
                  ) : null}
                  {order.receiptUrl ? (
                    <a href={order.receiptUrl} target="_blank" rel="noreferrer" className={BUTTON_OUTLINE}>
                      <FileText className="w-3.5 h-3.5" /> Receipt
                    </a>
                  ) : null}

                  {order.paymentStatus === 'awaiting_bank_transfer' ? (
                    <button
                      type="button"
                      disabled={busy}
                      className={BUTTON_PRIMARY}
                      onClick={() => void act(order.id, 'confirm_bank_transfer')}
                    >
                      Confirm bank transfer
                    </button>
                  ) : null}

                  {order.fulfillmentStatus === 'awaiting_shop_pickup' ||
                  order.status === 'awaiting_fulfillment' ? (
                    <button
                      type="button"
                      disabled={busy}
                      className={BUTTON_PRIMARY}
                      onClick={() => void act(order.id, 'arrange_pickup')}
                    >
                      <Clock className="w-3.5 h-3.5" /> Pickup arranged with partner
                    </button>
                  ) : null}

                  {order.fulfillmentStatus === 'pickup_arranged' || order.status === 'processing' ? (
                    <button
                      type="button"
                      disabled={busy}
                      className={BUTTON_PRIMARY}
                      onClick={() => {
                        const tracking = window.prompt('Tracking number (optional)') || ''
                        void act(order.id, 'mark_shipped', { trackingNumber: tracking })
                      }}
                    >
                      <Truck className="w-3.5 h-3.5" /> Mark shipped
                    </button>
                  ) : null}

                  {order.status === 'shipped' ? (
                    <button
                      type="button"
                      disabled={busy}
                      className={BUTTON_PRIMARY}
                      onClick={() => void act(order.id, 'mark_delivered')}
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Mark delivered
                    </button>
                  ) : null}
                </div>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
