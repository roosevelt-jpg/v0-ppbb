'use client'
export const dynamic = 'force-dynamic'

import React from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { hasBusinessAccess } from '@/lib/roles'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { subscribeToBusinessPayments } from '@/lib/business-queries'
import { BusinessPayment } from '@/lib/types'
import { DollarSign } from 'lucide-react'
import { MembershipSubscriptionOverview } from '@/components/membership/subscription-overview'

export default function Payments() {
  const { user } = useAuth()
  const router = useRouter()
  const [payments, setPayments] = React.useState<BusinessPayment[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!user || !hasBusinessAccess(user)) {
      router.push('/login')
      return
    }

    setLoading(true)
    setError(null)
    const unsubscribe = subscribeToBusinessPayments(
      user.id,
      (data) => {
        setPayments(data)
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error('[v0] Payments subscription error:', err)
        setError('Unable to load payments. Firestore rules may need deploying — refresh after deploy.')
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user, router])

  if (!user || !hasBusinessAccess(user)) {
    return <div className="text-center py-8">Access Denied</div>
  }

  const completedAmount = payments
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0)
  const pendingAmount = payments
    .filter((p) => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-8">
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Membership & renewal</h2>
            <p className="text-sm text-neutral-600">
              Renewal date, months remaining, invoices, and stop renewal
            </p>
          </div>
          <Link
            href="/business/membership"
            className="text-sm underline text-neutral-700 hover:text-black"
          >
            Browse membership plans
          </Link>
        </div>
        <MembershipSubscriptionOverview manageHref="/business/membership" />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Marketplace & business payments</h2>
          <p className="text-sm text-neutral-600">Commissions, payouts, and other business charges</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 sm:p-6 border-[#e4e1da] bg-white text-neutral-900">
            <div className="flex items-center gap-4">
              <DollarSign className="w-8 h-8 text-neutral-900 opacity-30" />
              <div>
                <p className="text-neutral-500 text-sm">Total Payments</p>
                <p className="text-neutral-900 text-2xl font-semibold">{payments.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 sm:p-6 border-[#e4e1da] bg-white text-neutral-900">
            <div className="flex items-center gap-4">
              <DollarSign className="w-8 h-8 text-neutral-900 opacity-30" />
              <div>
                <p className="text-neutral-500 text-sm">Completed</p>
                <p className="text-neutral-900 text-2xl font-semibold">AED {completedAmount}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 sm:p-6 border-[#e4e1da] bg-white text-neutral-900">
            <div className="flex items-center gap-4">
              <DollarSign className="w-8 h-8 text-neutral-900 opacity-30" />
              <div>
                <p className="text-neutral-500 text-sm">Pending</p>
                <p className="text-red-600 text-2xl font-semibold">AED {pendingAmount}</p>
              </div>
            </div>
          </Card>
        </div>

        {loading ? (
          <div className="text-center py-8 text-neutral-500">Loading payments...</div>
        ) : error ? (
          <Card className="p-8 text-center border-[#e4e1da] bg-white text-neutral-900">
            <p className="text-neutral-500 mb-4">{error}</p>
            <Button
              type="button"
              onClick={() => window.location.reload()}
              className="min-h-[44px] bg-neutral-900 text-white hover:bg-neutral-800"
            >
              Retry
            </Button>
          </Card>
        ) : payments.length === 0 ? (
          <Card className="p-8 sm:p-12 text-center border-[#e4e1da] bg-white text-neutral-900">
            <p className="text-neutral-500">No marketplace payments yet</p>
          </Card>
        ) : (
          <Card className="p-4 sm:p-6 border-[#e4e1da] overflow-x-auto table-scroll">
            <table className="w-full border-collapse min-w-[480px]">
              <thead>
                <tr className="border-b border-[#e4e1da]">
                  <th className="p-3 text-left text-neutral-500 font-semibold text-sm">Date</th>
                  <th className="p-3 text-left text-neutral-500 font-semibold text-sm">Type</th>
                  <th className="p-3 text-left text-neutral-500 font-semibold text-sm">Amount</th>
                  <th className="p-3 text-left text-neutral-500 font-semibold text-sm">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-[#e4e1da]">
                    <td className="p-3 text-neutral-900 text-sm">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-neutral-900 text-sm">{payment.type}</td>
                    <td className="p-3 text-neutral-900 font-semibold text-sm">
                      AED {payment.amount}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-3 py-1 rounded text-xs capitalize ${
                          payment.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : payment.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </section>
    </div>
  )
}
