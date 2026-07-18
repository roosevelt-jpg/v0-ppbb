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
  getWorkTypeLabel,
  getOpportunityLocation,
  getPostedDate,
  toDate,
  opportunityGenderBlocksUser,
  opportunityMemberBlocksUser,
  daysUntilDeadline,
} from '@/lib/opportunity-utils'
import { cmsContentToHtml } from '@/lib/cms-page-content'
import { isMapsOrWebUrl } from '@/lib/event-utils'
import { format } from 'date-fns'
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  Building2,
  Share2,
  Check,
  Banknote,
  Users,
  Calendar,
  CalendarCheck,
  Layers,
  Laptop,
  Clock,
} from 'lucide-react'

function isMapsUrl(value: string): boolean {
  return isMapsOrWebUrl(value)
}

function asLines(value: unknown): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value.map(String).map((s) => s.trim()).filter(Boolean)
  return String(value)
    .split(/\n|•|\u2022/)
    .map((s) => s.replace(/^[-–—*\s]+/, '').trim())
    .filter(Boolean)
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex gap-3 py-3 border-b border-neutral-100 last:border-0">
      <div className="w-9 h-9 rounded-md bg-neutral-100 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-neutral-700" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">{label}</p>
        <div className="text-sm font-semibold text-neutral-900 mt-0.5 break-words">{value}</div>
      </div>
    </div>
  )
}

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
  const companyName = opportunity
    ? opportunity.companyName || opportunity.businessName || 'Organization'
    : ''
  const posted = opportunity ? getPostedDate(opportunity) : null
  const locationRaw = opportunity ? getOpportunityLocation(opportunity) : ''
  const locationIsLink = locationRaw ? isMapsUrl(locationRaw) : false
  const salary =
    opportunity?.compensation ||
    (opportunity?.salary ? `AED ${Number(opportunity.salary).toLocaleString()}` : null) ||
    (opportunity as { salaryRange?: string } | null)?.salaryRange ||
    'TBA'
  const responsibilities = opportunity
    ? asLines((opportunity as { responsibilities?: string | string[] }).responsibilities)
    : []
  const requirements = opportunity
    ? asLines(opportunity.requirements).length
      ? asLines(opportunity.requirements)
      : []
    : []
  const suitability = opportunity?.suitableFor?.length
    ? opportunity.suitableFor
    : []
  const deadline = opportunity ? toDate(opportunity.deadline) : null
  const hiringBy = opportunity ? toDate((opportunity as { hiringBy?: unknown }).hiringBy) : null

  const applyButton = !opportunity ? null : !user ? (
    <Link
      href={`/login?returnUrl=/opportunities/${id}`}
      className="inline-flex items-center justify-center gap-2 w-full sm:w-auto h-10 px-5 rounded-md bg-black !text-white text-sm font-semibold hover:bg-neutral-800"
    >
      Sign in to Apply
    </Link>
  ) : canApplyMember ? (
    genderBlock || memberBlock ? (
      <p className="text-sm text-neutral-600">{genderBlock || memberBlock}</p>
    ) : (
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="inline-flex items-center justify-center gap-2 w-full sm:w-auto h-10 px-5 rounded-md bg-black !text-white text-sm font-semibold hover:bg-neutral-800"
      >
        Apply Now →
      </button>
    )
  ) : user.role === 'admin' || user.role === 'super_admin' ? (
    <p className="text-sm text-neutral-500">Admin View</p>
  ) : (
    <p className="text-sm text-neutral-500 inline-flex items-center gap-2">
      <Briefcase className="h-4 w-4" /> Posted by business account
    </p>
  )

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <Link
            href="/opportunities"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-neutral-900 mb-4"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Opportunities
          </Link>

          {loading ? (
            <p className="text-neutral-500">Loading…</p>
          ) : !opportunity ? (
            <p className="text-neutral-500">Opportunity not found.</p>
          ) : (
            <div className="space-y-5">
              {/* Header — reference style */}
              <header className="bg-white border border-neutral-200 rounded-lg shadow-sm p-4 sm:p-5">
                <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
                  <div className="shrink-0 flex flex-col items-start gap-2">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg border border-neutral-200 bg-white flex items-center justify-center overflow-hidden p-2">
                      {opportunity.businessLogoUrl ? (
                        <img
                          src={opportunity.businessLogoUrl}
                          alt=""
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <Building2 className="w-10 h-10 text-neutral-300" />
                      )}
                    </div>
                    <p className="text-xs font-semibold text-neutral-800 max-w-[7.5rem] leading-snug">
                      {companyName}
                    </p>
                    {opportunity.businessId ? (
                      <Link
                        href={`/opportunities?businessId=${opportunity.businessId}`}
                        className="text-[11px] font-semibold text-neutral-600 underline hover:text-neutral-900"
                      >
                        View all jobs →
                      </Link>
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-black text-white">
                      {ROLE_TYPE_LABELS[roleType] || roleType}
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 mt-2 leading-tight">
                      {opportunity.title}
                    </h1>
                    <p className="text-sm text-neutral-600 mt-1.5">
                      Posted {posted ? format(posted, 'd MMMM yyyy') : 'recently'} by{' '}
                      <span className="font-semibold text-neutral-900">{companyName}</span>
                    </p>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-neutral-700">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-neutral-500" />
                        {locationIsLink ? (
                          <a
                            href={locationRaw}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline font-medium"
                          >
                            View map location
                          </a>
                        ) : (
                          locationRaw || 'Location TBA'
                        )}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Banknote className="w-4 h-4 text-neutral-500" />
                        {salary}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Laptop className="w-4 h-4 text-neutral-500" />
                        {getWorkTypeLabel(opportunity)}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 flex flex-col gap-2 lg:items-stretch lg:min-w-[10rem]">
                    {applyButton}
                    <button
                      type="button"
                      onClick={shareLink}
                      className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-md border border-neutral-300 bg-white text-neutral-800 text-xs font-semibold hover:bg-neutral-50"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                      {copied ? 'Copied' : 'Share'}
                    </button>
                  </div>
                </div>
              </header>

              {/* Body: description + sidebar */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 space-y-5">
                  <section className="bg-white border border-neutral-200 rounded-lg shadow-sm p-4 sm:p-5">
                    <h2 className="text-lg font-bold text-neutral-900 mb-3">Job Description</h2>
                    {opportunity.description ? (
                      <div
                        className="prose prose-sm max-w-none text-neutral-700 [&_p]:mb-3 [&_br]:block"
                        dangerouslySetInnerHTML={{
                          __html: cmsContentToHtml(opportunity.description, opportunity.title),
                        }}
                      />
                    ) : (
                      <p className="text-sm text-neutral-500">No description provided.</p>
                    )}
                  </section>

                  <section className="bg-white border border-neutral-200 rounded-lg shadow-sm p-4 sm:p-5">
                    <h2 className="text-lg font-bold text-neutral-900 mb-3">
                      6. Key Responsibilities
                    </h2>
                    {responsibilities.length ? (
                      <ul className="space-y-2 text-sm text-neutral-700">
                        {responsibilities.map((item) => (
                          <li key={item} className="flex gap-2">
                            <span className="text-neutral-400 shrink-0">--</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-neutral-500">Not specified.</p>
                    )}
                  </section>

                  <section className="bg-white border border-neutral-200 rounded-lg shadow-sm p-4 sm:p-5">
                    <h2 className="text-lg font-bold text-neutral-900 mb-3">
                      7. Requirements / Skills Needed
                    </h2>
                    {requirements.length ? (
                      <ul className="space-y-2 text-sm text-neutral-700">
                        {requirements.map((item) => (
                          <li key={item} className="flex gap-2">
                            <span className="text-neutral-400 shrink-0">--</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-neutral-500">Not specified.</p>
                    )}
                  </section>

                  {opportunity.benefits?.length ? (
                    <section className="bg-white border border-neutral-200 rounded-lg shadow-sm p-4 sm:p-5">
                      <h2 className="text-lg font-bold text-neutral-900 mb-3">Benefits</h2>
                      <ul className="space-y-2 text-sm text-neutral-700">
                        {opportunity.benefits.map((b) => (
                          <li key={b} className="flex gap-2">
                            <span className="text-neutral-400 shrink-0">--</span>
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ) : null}
                </div>

                {/* Position Information sidebar */}
                <aside className="lg:col-span-1">
                  <div className="bg-white border border-neutral-200 rounded-lg shadow-sm p-4 sm:p-5 lg:sticky lg:top-4">
                    <h2 className="text-base font-bold text-neutral-900 mb-1">
                      Position Information
                    </h2>
                    <p className="text-xs text-neutral-500 mb-2">Work opportunity details</p>

                    <InfoRow
                      icon={Briefcase}
                      label="1. Job Title"
                      value={opportunity.title}
                    />
                    <InfoRow
                      icon={Building2}
                      label="2. Company / Organization"
                      value={companyName}
                    />
                    <InfoRow
                      icon={Clock}
                      label="3. Role Type"
                      value={ROLE_TYPE_LABELS[roleType] || roleType}
                    />
                    <InfoRow
                      icon={Laptop}
                      label="4. Work Type"
                      value={getWorkTypeLabel(opportunity)}
                    />
                    <InfoRow
                      icon={MapPin}
                      label="5. Location"
                      value={
                        locationIsLink ? (
                          <a
                            href={locationRaw}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline"
                          >
                            Open map link
                          </a>
                        ) : (
                          locationRaw || 'TBA'
                        )
                      }
                    />
                    <InfoRow icon={Banknote} label="8. Salary / Compensation" value={salary} />
                    <InfoRow
                      icon={Users}
                      label="9. Suitability"
                      value={suitability.length ? suitability.join(', ') : 'Open to all'}
                    />
                    <InfoRow
                      icon={Calendar}
                      label="10. Application Deadline"
                      value={
                        deadline
                          ? `${format(deadline, 'MMM d, yyyy')}${
                              daysLeft != null && daysLeft >= 0 ? ` (${daysLeft} days left)` : ''
                            }`
                          : 'Open'
                      }
                    />
                    <InfoRow
                      icon={CalendarCheck}
                      label="11. Hiring By"
                      value={hiringBy ? format(hiringBy, 'MMM d, yyyy') : 'TBA'}
                    />
                    <InfoRow
                      icon={Layers}
                      label="12. Industry / Category"
                      value={opportunity.category || 'TBA'}
                    />

                    <div className="mt-4 pt-3 border-t border-neutral-100">{applyButton}</div>
                  </div>
                </aside>
              </div>
            </div>
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
