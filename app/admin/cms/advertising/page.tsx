'use client'

import React, { useEffect, useState } from 'react'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { Card } from '@/components/ui/card'
import { auth } from '@/lib/firebase'
import { BUTTON_PRIMARY, BUTTON_SECONDARY, BUTTON_DANGER } from '@/lib/admin-design-system'

type AdRequest = {
  id: string
  businessName?: string
  imageURL?: string
  href?: string
  alt?: string
  priceAed?: number
  status?: string
}

export default function AdminAdvertisingPage() {
  const [rows, setRows] = useState<AdRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const token = await auth.currentUser?.getIdToken()
      if (!token) return
      const res = await fetch('/api/advertising/requests?admin=1', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (json.success) setRows(json.data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const act = async (id: string, action: 'publish' | 'reject' | 'unpublish') => {
    setMessage(null)
    try {
      const token = await auth.currentUser?.getIdToken()
      if (!token) throw new Error('Sign in required')
      const res = await fetch('/api/advertising/requests', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, action }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Action failed')
      setMessage(action === 'publish' ? 'Published to homepage advertising banner.' : `Marked ${action}.`)
      await load()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Action failed')
    }
  }

  return (
    <AdminPageLayout title="Advertising requests">
      <div className="space-y-4">
        <p className="text-sm text-neutral-600">
          Paid homepage banner requests from businesses. Publish places the creative on the live
          homepage advertising strip (also editable under CMS → Homepage).
        </p>
        {message ? (
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm">{message}</div>
        ) : null}
        {loading ? (
          <p className="text-sm text-neutral-500">Loading…</p>
        ) : rows.length === 0 ? (
          <Card className="p-6 text-sm text-neutral-600">No advertising requests yet.</Card>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => (
              <Card key={r.id} className="p-4 flex flex-col sm:flex-row gap-4 items-start">
                {r.imageURL ? (
                  <img src={r.imageURL} alt="" className="w-full sm:w-48 h-20 object-cover rounded border" />
                ) : null}
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="font-semibold">{r.businessName || 'Business'}</p>
                  <p className="text-xs text-neutral-500 capitalize">
                    {String(r.status || '').replace(/_/g, ' ')} · AED {r.priceAed ?? 500}
                  </p>
                  {r.href ? (
                    <a href={r.href} className="text-xs underline break-all" target="_blank" rel="noreferrer">
                      {r.href}
                    </a>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {(r.status === 'paid' || r.status === 'published') && (
                    <button type="button" className={BUTTON_PRIMARY} onClick={() => void act(r.id, 'publish')}>
                      Publish to homepage
                    </button>
                  )}
                  {r.status === 'published' && (
                    <button type="button" className={BUTTON_SECONDARY} onClick={() => void act(r.id, 'unpublish')}>
                      Unpublish
                    </button>
                  )}
                  {r.status !== 'rejected' && (
                    <button type="button" className={BUTTON_DANGER} onClick={() => void act(r.id, 'reject')}>
                      Reject
                    </button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminPageLayout>
  )
}
