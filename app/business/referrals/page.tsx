'use client'
export const dynamic = 'force-dynamic'

import React from 'react'
import { useAuth } from '@/lib/auth-context'
import { hasBusinessAccess } from '@/lib/roles'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { getBusinessReferral, subscribeToReferral } from '@/lib/business-queries'
import { BusinessReferral } from '@/lib/types'
import { DollarSign, TrendingUp, Wallet } from 'lucide-react'

export default function ReferralSystem() {
  const { user } = useAuth()
  const router = useRouter()
  const [referral, setReferral] = React.useState<BusinessReferral | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!user || (!hasBusinessAccess(user))) {
      router.push('/login')
      return
    }

    setLoading(true)
    const unsubscribe = subscribeToReferral(user.id, (data) => {
      setReferral(data || null)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user, router])

  if (!user || (!hasBusinessAccess(user))) {
    return <div className="text-center py-8">Access Denied</div>
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#faf9f7' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e4e1da', padding: '32px' }}>
        <div className="max-w-6xl mx-auto">
          <h1 style={{ color: '#111111', fontSize: '32px', fontWeight: 700 }}>
            Referral System & Commissions
          </h1>
          <p style={{ color: '#888888', marginTop: '8px' }}>
            Track your referral earnings and contributions
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-8">
        {loading ? (
          <div className="text-center py-8">Loading referral data...</div>
        ) : (
          <div className="space-y-8">
            {/* Referral Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da', padding: '24px' }}>
                <div className="flex items-center gap-4">
                  <TrendingUp style={{ color: '#111111', opacity: 0.3 }} className="w-8 h-8" />
                  <div>
                    <p style={{ color: '#888888', fontSize: '14px' }}>Referral Percentage</p>
                    <p style={{ color: '#111111', fontSize: '28px', fontWeight: 600 }}>
                      {referral?.referralPercentage || 0}%
                    </p>
                  </div>
                </div>
              </Card>
              <Card style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da', padding: '24px' }}>
                <div className="flex items-center gap-4">
                  <DollarSign style={{ color: '#111111', opacity: 0.3 }} className="w-8 h-8" />
                  <div>
                    <p style={{ color: '#888888', fontSize: '14px' }}>Total Commissions</p>
                    <p style={{ color: '#111111', fontSize: '28px', fontWeight: 600 }}>
                      AED {referral?.totalCommissions || 0}
                    </p>
                  </div>
                </div>
              </Card>
              <Card style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da', padding: '24px' }}>
                <div className="flex items-center gap-4">
                  <Wallet style={{ color: '#111111', opacity: 0.3 }} className="w-8 h-8" />
                  <div>
                    <p style={{ color: '#888888', fontSize: '14px' }}>Pending Payout</p>
                    <p style={{ color: '#dc2626', fontSize: '28px', fontWeight: 600 }}>
                      AED {referral?.pendingCommission || 0}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Additional Stats */}
            <Card style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da', padding: '24px' }}>
              <h3 style={{ color: '#111111', fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
                Referral Details
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p style={{ color: '#888888', fontSize: '14px' }}>Total Referrals</p>
                  <p style={{ color: '#111111', fontWeight: 600, marginTop: '4px' }}>
                    {referral?.totalReferrals || 0}
                  </p>
                </div>
                <div>
                  <p style={{ color: '#888888', fontSize: '14px' }}>Paid Commission</p>
                  <p style={{ color: '#111111', fontWeight: 600, marginTop: '4px' }}>
                    AED {referral?.paidCommission || 0}
                  </p>
                </div>
                <div>
                  <p style={{ color: '#888888', fontSize: '14px' }}>Status</p>
                  <p style={{ color: '#111111', fontWeight: 600, marginTop: '4px' }}>
                    {referral?.status === 'active' ? '✓ Active' : '⚠ Suspended'}
                  </p>
                </div>
                <div>
                  <p style={{ color: '#888888', fontSize: '14px' }}>Last Payout</p>
                  <p style={{ color: '#111111', fontWeight: 600, marginTop: '4px' }}>
                    {referral?.lastPayout
                      ? new Date(referral.lastPayout).toLocaleDateString()
                      : 'Never'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Bank Details */}
            {referral?.bankDetails && (
              <Card style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da', padding: '24px' }}>
                <h3 style={{ color: '#111111', fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
                  Bank Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p style={{ color: '#888888', fontSize: '14px' }}>Account Holder</p>
                    <p style={{ color: '#111111', fontWeight: 600, marginTop: '4px' }}>
                      {referral.bankDetails.accountHolder || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: '#888888', fontSize: '14px' }}>Bank Name</p>
                    <p style={{ color: '#111111', fontWeight: 600, marginTop: '4px' }}>
                      {referral.bankDetails.bankName || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: '#888888', fontSize: '14px' }}>Account Number</p>
                    <p style={{ color: '#111111', fontWeight: 600, marginTop: '4px' }}>
                      {referral.bankDetails.accountNumber
                        ? `****${referral.bankDetails.accountNumber.slice(-4)}`
                        : 'Not set'}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* How It Works */}
            <Card style={{ backgroundColor: '#ffffff', borderColor: '#e4e1da', padding: '24px' }}>
              <h3 style={{ color: '#111111', fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
                How Referrals Work
              </h3>
              <div className="space-y-4">
                <div>
                  <p style={{ color: '#111111', fontWeight: 600 }}>1. Share Your Referral</p>
                  <p style={{ color: '#888888', fontSize: '14px', marginTop: '4px' }}>
                    Send your unique referral link to potential customers and partners
                  </p>
                </div>
                <div>
                  <p style={{ color: '#111111', fontWeight: 600 }}>2. Track Conversions</p>
                  <p style={{ color: '#888888', fontSize: '14px', marginTop: '4px' }}>
                    Every successful referral is tracked and recorded in your dashboard
                  </p>
                </div>
                <div>
                  <p style={{ color: '#111111', fontWeight: 600 }}>3. Earn Commissions</p>
                  <p style={{ color: '#888888', fontSize: '14px', marginTop: '4px' }}>
                    Earn {referral?.referralPercentage || 0}% of all referred sales automatically
                  </p>
                </div>
                <div>
                  <p style={{ color: '#111111', fontWeight: 600 }}>4. Get Paid</p>
                  <p style={{ color: '#888888', fontSize: '14px', marginTop: '4px' }}>
                    Receive monthly payouts directly to your bank account
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
