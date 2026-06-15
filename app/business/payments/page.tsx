'use client'

import React from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { subscribeToBusinessPayments } from '@/lib/business-queries'
import { BusinessPayment } from '@/lib/types'
import { DollarSign } from 'lucide-react'

export default function Payments() {
  const { user } = useAuth()
  const router = useRouter()
  const [payments, setPayments] = React.useState<BusinessPayment[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!user || (user.role !== 'business' && user.role !== 'super_admin')) {
      router.push('/login')
      return
    }

    setLoading(true)
    const unsubscribe = subscribeToBusinessPayments(user.id, (data) => {
      setPayments(data)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user, router])

  if (!user || (user.role !== 'business' && user.role !== 'super_admin')) {
    return <div className="text-center py-8">Access Denied</div>
  }

  const completedAmount = payments
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0)
  const pendingAmount = payments
    .filter((p) => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#faf9f7' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e4e1da', padding: '32px' }}>
        <div className="max-w-6xl mx-auto">
          <h1 style={{ color: '#111111', fontSize: '32px', fontWeight: 700 }}>
            Payment & Subscription Management
          </h1>
          <p style={{ color: '#888888', marginTop: '8px' }}>
            Track your payments and manage subscriptions
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da', padding: '24px' }}>
            <div className="flex items-center gap-4">
              <DollarSign style={{ color: '#111111', opacity: 0.3 }} className="w-8 h-8" />
              <div>
                <p style={{ color: '#888888', fontSize: '14px' }}>Total Payments</p>
                <p style={{ color: '#111111', fontSize: '24px', fontWeight: 600 }}>
                  {payments.length}
                </p>
              </div>
            </div>
          </Card>
          <Card style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da', padding: '24px' }}>
            <div className="flex items-center gap-4">
              <DollarSign style={{ color: '#111111', opacity: 0.3 }} className="w-8 h-8" />
              <div>
                <p style={{ color: '#888888', fontSize: '14px' }}>Completed</p>
                <p style={{ color: '#111111', fontSize: '24px', fontWeight: 600 }}>
                  AED {completedAmount}
                </p>
              </div>
            </div>
          </Card>
          <Card style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da', padding: '24px' }}>
            <div className="flex items-center gap-4">
              <DollarSign style={{ color: '#111111', opacity: 0.3 }} className="w-8 h-8" />
              <div>
                <p style={{ color: '#888888', fontSize: '14px' }}>Pending</p>
                <p style={{ color: '#dc2626', fontSize: '24px', fontWeight: 600 }}>
                  AED {pendingAmount}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Payments List */}
        {loading ? (
          <div className="text-center py-8">Loading payments...</div>
        ) : payments.length === 0 ? (
          <Card style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da', padding: '48px', textAlign: 'center' }}>
            <p style={{ color: '#888888' }}>No payments yet</p>
          </Card>
        ) : (
          <Card style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da', padding: '24px' }}>
            <div className="overflow-x-auto">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e4e1da' }}>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#888888', fontWeight: 600 }}>
                      Date
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#888888', fontWeight: 600 }}>
                      Type
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#888888', fontWeight: 600 }}>
                      Amount
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#888888', fontWeight: 600 }}>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} style={{ borderBottom: '1px solid #e4e1da' }}>
                      <td style={{ padding: '12px', color: '#111111' }}>
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px', color: '#111111' }}>
                        {payment.type}
                      </td>
                      <td style={{ padding: '12px', color: '#111111', fontWeight: 600 }}>
                        AED {payment.amount}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span
                          style={{
                            backgroundColor:
                              payment.status === 'completed'
                                ? '#dcfce7'
                                : payment.status === 'pending'
                                  ? '#fef08a'
                                  : '#fee2e2',
                            color:
                              payment.status === 'completed'
                                ? '#166534'
                                : payment.status === 'pending'
                                  ? '#854d0e'
                                  : '#991b1b',
                            padding: '4px 12px',
                            borderRadius: '4px',
                            fontSize: '12px',
                          }}
                        >
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
