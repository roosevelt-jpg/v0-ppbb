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
import {
  ROLE_TYPE_LABELS,
  getRoleType,
  opportunityGenderBlocksUser,
  opportunityMemberBlocksUser,
  daysUntilDeadline,
} from '@/lib/opportunity-utils'
import { ArrowLeft, Briefcase, MapPin, Building2, Share2, Copy, Check } from 'lucide-react'

export default function OpportunityDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const id = params.id as string
  const [opportunity, setOpportunity] = React.useState<BusinessOpportunity | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [modalOpen, setModalOpen] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    if (!id) return
    getOpportunityById(id)
      .then((data) => setOpportunity(data))
      .catch((err) => console.error('[opportunity] load error:', err))
      .finally(() => setLoading(false))
  }, [id])

  const shareLink = () => {
    if (typeof window === 'undefined') return
    void navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const canApplyMember =
    user && !hasBusinessAccess(user) && user.role !== 'admin' && user.role !== 'super_admin'
  const genderBlock = opportunity && user ? opportunityGenderBlocksUser(opportunity, user.gender) : null
  const memberBlock =
    opportunity && user
      ? opportunityMemberBlocksUser(opportunity, user.role, hasBusinessAccess(user))
      : null
  const daysLeft = opportunity ? daysUntilDeadline(opportunity) : null
  const roleType = opportunity ? getRoleType(opportunity) : ''

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
              <header className="flex items-start gap-4">
                {opportunity.businessLogoUrl ? (
                  <img
                    src={opportunity.businessLogoUrl}
                    alt=""
                    className="w-14 h-14 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-neutral-400" />
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">
                    {opportunity.companyName || opportunity.businessName}
                  </p>
                  <h1 className="text-3xl font-bold text-foreground mt-1">{opportunity.title}</h1>
                </div>
              </header>

              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                  {ROLE_TYPE_LABELS[roleType] || roleType}
                </span>
                <span className="px-2 py-1 bg-teal-100 text-teal-800 text-xs rounded">
                  {opportunity.remote || opportunity.locationType === 'remote'
                    ? 'Remote'
                    : opportunity.locationType || 'Onsite'}
                </span>
                {opportunity.locationCity ? (
                  <span className="px-2 py-1 bg-slate-100 text-xs rounded flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {opportunity.locationCity}
                  </span>
                ) : null}
                {opportunity.genderRestriction && opportunity.genderRestriction !== 'mixed' ? (
                  <span className="px-2 py-1 bg-rose-100 text-rose-800 text-xs rounded capitalize">
                    {opportunity.genderRestriction} only
                  </span>
                ) : null}
                {opportunity.isMemberOnly ? (
                  <span className="px-2 py-1 bg-violet-100 text-violet-800 text-xs rounded">
                    Members Only
                  </span>
                ) : null}
                {(opportunity.suitableFor || []).map((s) => (
                  <span key={s} className="px-2 py-1 bg-lime-50 text-lime-800 text-xs rounded border border-lime-200">
                    {s}
                  </span>
                ))}
              </div>

              {daysLeft !== null ? (
                <p
                  className={`text-sm font-medium ${
                    daysLeft < 0 ? 'text-red-600' : 'text-amber-700'
                  }`}
                >
                  {daysLeft < 0 ? 'Application deadline has passed' : `${daysLeft} days remaining to apply`}
                </p>
              ) : null}

              <p className="text-sm text-muted-foreground">
                {opportunity.posterRelation === 'connector'
                  ? 'Shared by a Connector'
                  : 'Posted by an Employer'}
              </p>

              <section>
                <h2 className="text-lg font-semibold mb-2">Description</h2>
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

              {opportunity.salary || opportunity.compensation ? (
                <p className="text-sm">
                  <strong>Compensation:</strong>{' '}
                  {opportunity.salary
                    ? `AED ${opportunity.salary}`
                    : opportunity.compensation}
                </p>
              ) : null}

              <section>
                <h2 className="text-lg font-semibold mb-2">Application process</h2>
                <p className="text-sm text-muted-foreground capitalize">
                  {(opportunity.applicationProcess || 'cv_upload').replace(/_/g, ' ')}
                </p>
                {opportunity.applicationURL &&
                (opportunity.applicationProcess === 'external_link' ||
                  opportunity.applicationProcess === 'both') ? (
                  <a
                    href={opportunity.applicationURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 underline mt-1 inline-block"
                  >
                    Apply on company website →
                  </a>
                ) : null}
              </section>

              <div className="flex flex-wrap gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={shareLink}
                  className="inline-flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-lg text-sm"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                  {copied ? 'Link copied' : 'Share'}
                </button>
                {!user ? (
                  <Link
                    href={`/login?returnUrl=/opportunities/${id}`}
                    className="!bg-black !text-white px-6 py-2.5 rounded-lg text-sm font-semibold"
                  >
                    Sign in to Apply
                  </Link>
                ) : canApplyMember ? (
                  genderBlock || memberBlock ? (
                    <span className="text-sm text-muted-foreground py-2">
                      {genderBlock || memberBlock}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setModalOpen(true)}
                      className="!bg-black !text-white px-6 py-2.5 rounded-lg text-sm font-semibold"
                    >
                      Apply Now
                    </button>
                  )
                ) : user.role === 'admin' || user.role === 'super_admin' ? (
                  <span className="text-sm text-muted-foreground flex items-center gap-2 py-2">
                    Admin View
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground flex items-center gap-2 py-2">
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
