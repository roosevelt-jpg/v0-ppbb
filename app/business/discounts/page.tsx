'use client'

export const dynamic = 'force-dynamic'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { hasBusinessAccess } from '@/lib/roles'
import { subscribeToBusinessDiscounts, deleteBusinessDiscount, type BusinessDiscount } from '@/lib/business-discounts'
import { Plus, Trash2 } from 'lucide-react'

export default function BusinessDiscountsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [discounts, setDiscounts] = React.useState<BusinessDiscount[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (user && !hasBusinessAccess(user)) router.push('/login')
  }, [user, router])

  React.useEffect(() => {
    if (!user?.id) return
    const unsub = subscribeToBusinessDiscounts(user.id, (data) => {
      setDiscounts(data)
      setLoading(false)
    })
    return () => unsub()
  }, [user?.id])

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Member Discounts</h1>
          <p className="text-neutral-600 text-sm">Codes and offers exclusive to Passive Blessings members</p>
        </div>
        <Link href="/business/discounts/create" className="inline-flex items-center gap-2 min-h-[44px] px-4 bg-black text-white rounded-lg font-semibold">
          <Plus size={18} /> Create Discount
        </Link>
      </div>

      {loading ? (
        <p className="text-neutral-500">Loading discounts…</p>
      ) : discounts.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <p className="text-neutral-600 mb-4">No member discounts yet.</p>
          <Link href="/business/discounts/create" className="text-black font-semibold underline">Create your first discount</Link>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white border border-[#e4e1da] rounded-lg">
          <table className="w-full min-w-[640px]">
            <thead className="bg-neutral-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Title</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Code</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Discount</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Usage</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {discounts.map((d) => (
                <tr key={d.id}>
                  <td className="px-4 py-3 text-sm font-medium">{d.title}</td>
                  <td className="px-4 py-3 text-sm font-mono">{d.discountCode || '—'}</td>
                  <td className="px-4 py-3 text-sm">
                    {d.discountType === 'percent' ? `${d.discountValue}%` : `${d.currency || 'AED'} ${d.discountValue}`}
                  </td>
                  <td className="px-4 py-3 text-sm">{d.usageCount}{d.usageLimit != null ? ` / ${d.usageLimit}` : ''}</td>
                  <td className="px-4 py-3 text-sm capitalize">{d.status.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" onClick={() => void deleteBusinessDiscount(d.id)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
