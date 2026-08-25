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
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (user && !hasBusinessAccess(user)) router.push('/login')
  }, [user, router])

  React.useEffect(() => {
    if (!user?.id) return
    const unsub = subscribeToBusinessDiscounts(
      user.id,
      (data) => {
        setDiscounts(data)
        setLoading(false)
        setError(null)
      },
      () => {
        setError('Could not load discounts. Please refresh or try again later.')
        setLoading(false)
      }
    )
    return () => unsub()
  }, [user?.id])

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Member Discounts</h1>
          <p className="text-neutral-600 dark:text-muted-foreground text-sm">Codes and offers exclusive to Passive Blessings members</p>
        </div>
        <Link href="/business/discounts/create" className="inline-flex items-center gap-2 min-h-[44px] px-4 bg-black text-white rounded-lg font-semibold">
          <Plus size={18} /> Create Discount
        </Link>
      </div>

      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : loading ? (
        <p className="text-neutral-500 dark:text-muted-foreground">Loading discounts…</p>
      ) : discounts.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <p className="text-neutral-600 dark:text-muted-foreground mb-4">No member discounts yet.</p>
          <Link href="/business/discounts/create" className="text-black dark:text-foreground font-semibold underline">Create your first discount</Link>
        </div>
      ) : (
        <>
          <div className="md:hidden space-y-3">
            {discounts.map((d) => (
              <div key={d.id} className="bg-white dark:bg-card border border-[#e4e1da] dark:border-border rounded-lg p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-sm break-words">{d.title}</p>
                  <button
                    type="button"
                    onClick={() => void deleteBusinessDiscount(d.id)}
                    className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center bg-black !text-white hover:bg-neutral-800 rounded shrink-0"
                    aria-label="Delete discount"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <p className="text-xs text-neutral-500 dark:text-muted-foreground capitalize">{d.status.replace(/_/g, ' ')}</p>
                {d.discountCode ? <p className="text-sm font-mono break-all">{d.discountCode}</p> : null}
                <p className="text-sm">
                  {d.discountType === 'percent' ? `${d.discountValue}%` : `${d.currency || 'AED'} ${d.discountValue}`}
                  {' · '}
                  {d.usageCount}{d.usageLimit != null ? ` / ${d.usageLimit}` : ''} used
                </p>
              </div>
            ))}
          </div>
          <div className="hidden md:block overflow-x-auto table-scroll bg-white dark:bg-card border border-[#e4e1da] dark:border-border rounded-lg">
          <table className="w-full min-w-[640px]">
            <thead className="bg-neutral-50 dark:bg-white/5 border-b">
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
                    <button type="button" onClick={() => void deleteBusinessDiscount(d.id)} className="pb-compact-btn h-6 w-6 min-h-0 p-0 rounded-md bg-black !text-white hover:bg-neutral-800 inline-flex items-center justify-center rounded">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </>
      )}
    </div>
  )
}
