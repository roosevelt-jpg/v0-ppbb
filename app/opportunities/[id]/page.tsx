'use client'

import React from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { getOpportunityById } from '@/lib/business-queries'
import { BusinessOpportunity } from '@/lib/types'
import { useAuth } from '@/lib/auth-context'
import { hasBusinessAccess } from '@/lib/roles'
import { OpportunityApplyModal } from '@/components/opportunity-apply-modal'
import { ArrowLeft, Briefcase, MapPin, Building2 } from 'lucide-react'

export default function OpportunityDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const id = params.id as string
  const [opportunity, setOpportunity] = React.useState<BusinessOpportunity | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [modalOpen, setModalOpen] = React.useState(false)

  React.useEffect(() => {
    if (!id) return
    getOpportunityById(id)
      .then((data) => setOpportunity(data))
      .catch((err) => console.error('[v0] Opportunity load error:', err))
      .finally(() => setLoading(false))
  }, [id])

  const canApply = user && !hasBusinessAccess(user)

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Link
            href="/opportunities"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Opportunities
          </Link>

          {loading ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : !opportunity ? (
            <p className="text-muted-foreground">Opportunity not found.</p>
          ) : (
            <article className="space-y-6">
              <header>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Building2 className="h-4 w-4" />
                  {(opportunity as { companyName?: string }).companyName || opportunity.businessName}
                </div>
                <h1 className="text-3xl font-bold text-foreground">{opportunity.title}</h1>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="px-2 py-1 bg-secondary text-xs font-semibold rounded capitalize">
                    {opportunity.type}
                  </span>
                  {opportunity.remote ? (
                    <span className="px-2 py-1 bg-teal-100 text-teal-800 text-xs rounded">Remote</span>
                  ) : (opportunity as { locationCity?: string }).locationCity ? (
                    <span className="px-2 py-1 bg-slate-100 text-xs rounded flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {(opportunity as { locationCity?: string }).locationCity}
                    </span>
                  ) : null}
                </div>
              </header>

              <section className="prose prose-sm max-w-none">
                <h2 className="text-lg font-semibold">Description</h2>
                <p className="whitespace-pre-wrap text-foreground">{opportunity.description}</p>
              </section>

              {opportunity.requirements?.length ? (
                <section>
                  <h2 className="text-lg font-semibold mb-2">Requirements</h2>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    {opportunity.requirements.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {opportunity.benefits?.length ? (
                <section>
                  <h2 className="text-lg font-semibold mb-2">Benefits</h2>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    {opportunity.benefits.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {opportunity.salary ? (
                <p className="text-sm">
                  <strong>Compensation:</strong> AED {opportunity.salary}
                </p>
              ) : null}

              <div className="flex flex-wrap gap-3 pt-4 border-t">
                {!user ? (
                  <Link
                    href="/login?returnUrl=/opportunities"
                    className="!bg-black !text-white px-6 py-2.5 rounded-lg text-sm font-semibold"
                  >
                    Sign in to Apply
                  </Link>
                ) : canApply ? (
                  <button
                    type="button"
                    onClick={() => setModalOpen(true)}
                    className="!bg-black !text-white px-6 py-2.5 rounded-lg text-sm font-semibold"
                  >
                    Apply Now
                  </button>
                ) : (
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Briefcase className="h-4 w-4" /> Posted by business account
                  </span>
                )}
              </div>
            </article>
          )}
        </div>
      </main>
      <Footer />
      <OpportunityApplyModal
        opportunity={opportunity}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onApplied={() => router.refresh()}
      />
    </div>
  )
}
