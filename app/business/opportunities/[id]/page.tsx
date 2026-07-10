'use client'

export const dynamic = 'force-dynamic'

import React from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { hasBusinessAccess } from '@/lib/roles'
import { getOpportunityById } from '@/lib/business-queries'
import { BusinessOpportunity } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft, ExternalLink, Users } from 'lucide-react'

export default function BusinessOpportunityDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const id = params.id as string
  const [opportunity, setOpportunity] = React.useState<BusinessOpportunity | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!user) return
    if (!hasBusinessAccess(user)) {
      router.push('/login')
      return
    }
    if (!id) return

    getOpportunityById(id)
      .then((data) => {
        if (data && data.businessId !== user.id) {
          setOpportunity(null)
          return
        }
        setOpportunity(data)
      })
      .catch((err) => console.error('[business opportunity] load error:', err))
      .finally(() => setLoading(false))
  }, [id, user, router])

  if (loading) {
    return <div className="p-8 text-center text-neutral-500">Loading opportunity…</div>
  }

  if (!opportunity) {
    return (
      <div className="p-8 text-center">
        <p className="text-neutral-500 mb-4">Opportunity not found.</p>
        <Button type="button" onClick={() => router.push('/business/opportunities')}>
          Back to opportunities
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[#faf9f7]">
      <div className="border-b border-[#e4e1da] bg-white px-4 py-6 sm:px-8">
        <div className="max-w-4xl mx-auto">
          <button
            type="button"
            onClick={() => router.push('/business/opportunities')}
            className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 mb-4 min-h-[44px]"
          >
            <ArrowLeft className="h-4 w-4" /> Back to opportunities
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">{opportunity.title}</h1>
          <p className="mt-2 text-sm text-neutral-500 capitalize">
            {String(opportunity.status || '').replace(/_/g, ' ')} · {opportunity.type}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row flex-wrap gap-3">
          <Button
            type="button"
            onClick={() =>
              router.push(`/business/opportunities/applicants?opportunityId=${opportunity.id}`)
            }
            className="min-h-[44px]"
          >
            <Users className="w-4 h-4 mr-2" />
            View applicants
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => window.open(`/opportunities/${opportunity.id}`, '_blank')}
            className="min-h-[44px]"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Public preview
          </Button>
        </div>

        <Card className="p-4 sm:p-6 border-[#e4e1da]">
          <h2 className="font-semibold text-neutral-900 mb-2">Description</h2>
          <p className="text-sm text-neutral-600 whitespace-pre-wrap">{opportunity.description}</p>
        </Card>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4 border-[#e4e1da]">
            <p className="text-xs text-neutral-500">Category</p>
            <p className="font-medium text-neutral-900">{opportunity.category || '—'}</p>
          </Card>
          <Card className="p-4 border-[#e4e1da]">
            <p className="text-xs text-neutral-500">Applications</p>
            <p className="font-medium text-neutral-900">{opportunity.applications ?? 0}</p>
          </Card>
          <Card className="p-4 border-[#e4e1da]">
            <p className="text-xs text-neutral-500">Location</p>
            <p className="font-medium text-neutral-900">{opportunity.location || '—'}</p>
          </Card>
          <Card className="p-4 border-[#e4e1da]">
            <p className="text-xs text-neutral-500">Deadline</p>
            <p className="font-medium text-neutral-900">
              {opportunity.deadline
                ? new Date(opportunity.deadline).toLocaleDateString()
                : '—'}
            </p>
          </Card>
        </div>

        <p className="text-sm text-neutral-500">
          Need to edit? Use the Edit button on the{' '}
          <Link href="/business/opportunities" className="underline text-neutral-900">
            opportunities list
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
