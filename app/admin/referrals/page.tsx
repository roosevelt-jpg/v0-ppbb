'use client'

export const dynamic = 'force-dynamic'

import React from 'react'
import Link from 'next/link'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { Share2, ArrowRight } from 'lucide-react'

export default function AdminReferralsOverviewPage() {
  return (
    <AdminPageLayout
      title="Referrals Overview"
      subtitle="Platform-wide referral activity and business referral management"
    >
      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <Share2 className="w-8 h-8 text-gray-700 mb-3" />
          <h2 className="text-lg font-semibold mb-2">Business Referrals</h2>
          <p className="text-sm text-gray-600 mb-4">
            Review referral conversions, payouts, and business-attributed leads in the finance module.
          </p>
          <Link
            href="/admin/finance/referrals"
            className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 bg-black text-white rounded-lg text-sm font-medium"
          >
            Open Business Referrals
            <ArrowRight size={16} />
          </Link>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-2">Referral collections</h2>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>
              <code className="text-xs bg-gray-100 px-1 rounded">referrals</code> — member-to-business conversion records
            </li>
            <li>
              <code className="text-xs bg-gray-100 px-1 rounded">businessReferrals</code> — per-business referral aggregates
            </li>
          </ul>
          <p className="text-sm text-gray-500 mt-4">
            Use the finance referrals page for moderation, payout tracking, and export.
          </p>
        </div>
      </div>
    </AdminPageLayout>
  )
}
