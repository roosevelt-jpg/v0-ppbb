'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { hasBusinessAccess } from '@/lib/roles'
import {
  subscribeToPartnersConfig,
  DEFAULT_PARTNERS_CONFIG,
  getInquiryCategoryHref,
} from '@/lib/partners-page-config'
import { PartnershipInquiryForm } from '@/components/partners/partnership-inquiry-form'
import { DashboardPageShell, DashboardSkeleton } from '@/components/dashboard-states'
import { getPartnershipRequestById } from '@/lib/business-queries'
import type { PartnershipRequest } from '@/lib/types'

function isCharityCategory(id: string, label: string) {
  const i = id.toLowerCase()
  const l = label.toLowerCase()
  return (
    i === 'charity-support' ||
    i.includes('charity') ||
    /charity\s*support|seeking\s*charity/i.test(l)
  )
}

function partnershipTypeFromCategory(id: string, label: string): string {
  const i = id.toLowerCase()
  const l = label.toLowerCase()
  if (i.includes('sponsor') || l.includes('sponsor')) return 'sponsorship'
  if (i.includes('campaign') || l.includes('campaign')) return 'campaign'
  if (i.includes('event') || l.includes('event')) return 'event'
  return 'partnership'
}

/**
 * Business portal inquiry — same fields as the public /partners form
 * so submissions arrive in a consistent format.
 */
export default function BusinessPartnershipNewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const resubmitId = searchParams.get('resubmit')
  const { user, loading: authLoading } = useAuth()
  const [config, setConfig] = useState(DEFAULT_PARTNERS_CONFIG)
  const [ready, setReady] = useState(false)
  const [inquiryCategoryId, setInquiryCategoryId] = useState('')
  const [formKey, setFormKey] = useState(0)
  const [resubmitSource, setResubmitSource] = useState<PartnershipRequest | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!user || !hasBusinessAccess(user)) {
      router.replace('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (!resubmitId) return
    getPartnershipRequestById(resubmitId)
      .then((req) => setResubmitSource(req))
      .catch(() => setResubmitSource(null))
  }, [resubmitId])

  useEffect(
    () =>
      subscribeToPartnersConfig((data) => {
        setConfig(data)
        setReady(true)
      }),
    []
  )

  const categories = config.pageConfig.inquiryCategories

  useEffect(() => {
    if (categories.length === 0 || inquiryCategoryId) return
    // Resuming a declined request: restore the category it was originally
    // submitted under, when one still matches.
    const matching = resubmitSource
      ? categories.find(
          (c) => partnershipTypeFromCategory(c.id, c.label) === resubmitSource.type
        )
      : null
    setInquiryCategoryId((matching || categories[0]).id)
  }, [categories, inquiryCategoryId, resubmitSource])

  const selected = useMemo(
    () => categories.find((c) => c.id === inquiryCategoryId) || categories[0],
    [categories, inquiryCategoryId]
  )

  const charitySelected = selected
    ? isCharityCategory(selected.id, selected.label)
    : false
  const linkedFormHref = selected ? getInquiryCategoryHref(selected) : null
  const inquiryType = selected
    ? partnershipTypeFromCategory(selected.id, selected.label)
    : 'partnership'
  const pc = config.pageConfig

  const openLinkedOrCharity = () => {
    if (!selected) return
    if (charitySelected) {
      router.push('/dashboard/charity-requests?apply=1')
      return
    }
    if (linkedFormHref) {
      if (/^https?:\/\//i.test(linkedFormHref)) {
        window.open(linkedFormHref, '_blank', 'noopener,noreferrer')
      } else {
        router.push(linkedFormHref)
      }
    }
  }

  if (authLoading || !user || !hasBusinessAccess(user)) {
    return <DashboardSkeleton />
  }

  return (
    <DashboardPageShell title="New partnership request">
      <div className="max-w-xl space-y-4">
        <div>
          <h1 className="font-headline text-2xl font-bold text-foreground">
            {resubmitId ? 'Edit & resubmit request' : 'New partnership request'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {resubmitId
              ? 'Your previous submission has been loaded below — make changes and resubmit.'
              : 'Same fields as the public Partners inquiry — submissions stay consistent.'}
          </p>
        </div>
        {!ready ? (
          <div className="h-64 animate-pulse bg-neutral-100 dark:bg-neutral-800 rounded-lg" />
        ) : (
          <>
            <div>
              <label htmlFor="biz-inquiry-category" className="block text-sm font-medium mb-1 font-body">
                Inquiry category
              </label>
              <select
                id="biz-inquiry-category"
                value={selected?.id || ''}
                onChange={(e) => {
                  setInquiryCategoryId(e.target.value)
                  setFormKey((k) => k + 1)
                }}
                className="w-full min-h-[44px] px-3 py-2 border border-[#e4e1da] dark:border-border rounded-lg font-body text-sm bg-white dark:bg-card focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {charitySelected ? (
              <div className="rounded-lg border border-[#e4e1da] dark:border-border bg-white dark:bg-card p-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Charity support uses our beneficiary request form.
                </p>
                <button
                  type="button"
                  onClick={openLinkedOrCharity}
                  className="min-h-[44px] px-5 py-3 bg-black text-white rounded-lg font-body text-sm font-semibold hover:bg-gray-800"
                >
                  {pc.inquiryCTA}
                </button>
              </div>
            ) : linkedFormHref ? (
              <div className="rounded-lg border border-[#e4e1da] dark:border-border bg-white dark:bg-card p-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  This category opens the form linked in Admin → CMS → Partners.
                </p>
                <button
                  type="button"
                  onClick={openLinkedOrCharity}
                  className="min-h-[44px] px-5 py-3 bg-black text-white rounded-lg font-body text-sm font-semibold hover:bg-gray-800"
                >
                  {pc.inquiryCTA}
                </button>
              </div>
            ) : (
              <PartnershipInquiryForm
                key={`${inquiryCategoryId}-${formKey}-${resubmitSource?.id || ''}`}
                type={inquiryType}
                submitLabel={pc.inquiryCTA}
                showContactLink={false}
                cancelHref="/business/partnerships"
                initialValues={
                  resubmitSource
                    ? { title: resubmitSource.title, description: resubmitSource.description }
                    : undefined
                }
                onSuccess={() => {
                  setTimeout(() => router.push('/business/partnerships'), 1500)
                }}
              />
            )}
          </>
        )}
      </div>
    </DashboardPageShell>
  )
}
