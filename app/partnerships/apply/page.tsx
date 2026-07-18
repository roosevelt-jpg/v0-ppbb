'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import {
  subscribeToPartnersConfig,
  DEFAULT_PARTNERS_CONFIG,
  getInquiryCategoryHref,
} from '@/lib/partners-page-config'
import { PartnershipInquiryForm } from '@/components/partners/partnership-inquiry-form'

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
 * Public apply page — same fields as /partners inquiry form.
 */
export default function PartnershipsApplyPage() {
  const router = useRouter()
  const [config, setConfig] = useState(DEFAULT_PARTNERS_CONFIG)
  const [ready, setReady] = useState(false)
  const [inquiryCategoryId, setInquiryCategoryId] = useState('')
  const [formKey, setFormKey] = useState(0)

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
    if (categories.length > 0 && !inquiryCategoryId) {
      setInquiryCategoryId(categories[0].id)
    }
  }, [categories, inquiryCategoryId])

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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-xl mx-auto w-full px-4 py-12">
        <p className="eyebrow text-muted-foreground mb-2">{pc.inquiryEyebrow}</p>
        <h1 className="font-headline text-3xl font-bold mb-3">{pc.inquiryHeadline}</h1>
        <p className="font-body text-muted-foreground mb-8 leading-relaxed">{pc.inquiryBody}</p>

        {!ready ? (
          <div className="h-64 animate-pulse bg-neutral-100 rounded-lg" />
        ) : (
          <div className="space-y-4">
            <div>
              <label htmlFor="apply-inquiry-category" className="block text-sm font-medium mb-1 font-body">
                Inquiry category
              </label>
              <select
                id="apply-inquiry-category"
                value={selected?.id || ''}
                onChange={(e) => {
                  setInquiryCategoryId(e.target.value)
                  setFormKey((k) => k + 1)
                }}
                className="w-full min-h-[44px] px-3 py-2 border border-[#e4e1da] rounded-lg font-body text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {charitySelected ? (
              <div className="rounded-lg border border-[#e4e1da] bg-white p-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Charity support uses our beneficiary request form — not the general partnership form.
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
              <div className="rounded-lg border border-[#e4e1da] bg-white p-4 space-y-3">
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
                key={`${inquiryCategoryId}-${formKey}`}
                type={inquiryType}
                submitLabel={pc.inquiryCTA}
              />
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
