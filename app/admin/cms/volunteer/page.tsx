'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { AdminPageLayout } from '@/components/admin-page-layout'
import {
  subscribeToVolunteerConfig,
  DEFAULT_VOLUNTEER_CONFIG,
  VolunteerPlatformConfig,
} from '@/lib/volunteer-config'
import {
  subscribeToEventsConfig,
  DEFAULT_EVENTS_CONFIG,
  EventsPlatformConfig,
  buildCategoryFilterTabs,
} from '@/lib/events-config'
import {
  subscribeToHomepage,
  DEFAULT_HOMEPAGE,
  type HomepageAdvertisingBanner,
} from '@/lib/homepage-config'
import { CmsImageUpload } from '@/components/cms-image-upload'
import { uploadImageToFirebase } from '@/lib/upload-utils'
import { auth } from '@/lib/firebase'
import { Save, CheckCircle2, AlertCircle, Plus, Trash2 } from 'lucide-react'
import { BUTTON_PRIMARY, BUTTON_OUTLINE, BUTTON_DANGER } from '@/lib/admin-design-system'

type TabId = 'page' | 'events' | 'ads'

type AdRequest = {
  id: string
  businessName?: string
  imageURL?: string
  href?: string
  alt?: string
  priceAed?: number
  status?: string
  adminFree?: boolean
}

export default function AdminCmsVolunteerPage() {
  const [tab, setTab] = useState<TabId>('page')
  const [config, setConfig] = useState<VolunteerPlatformConfig>(DEFAULT_VOLUNTEER_CONFIG)
  const [eventsConfig, setEventsConfig] = useState<EventsPlatformConfig>(() => ({
    ...DEFAULT_EVENTS_CONFIG,
    filterTabs: buildCategoryFilterTabs(DEFAULT_EVENTS_CONFIG.categories),
  }))
  const [homeBanner, setHomeBanner] = useState<HomepageAdvertisingBanner>(
    DEFAULT_HOMEPAGE.advertisingBanner
  )
  const [adRows, setAdRows] = useState<AdRequest[]>([])
  const [saving, setSaving] = useState(false)
  const [newPillar, setNewPillar] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [ready, setReady] = useState(false)
  const [freeAd, setFreeAd] = useState({ imageURL: '', href: '', alt: 'Advertisement' })

  useEffect(
    () =>
      subscribeToVolunteerConfig((data) => {
        setConfig(data)
        setReady(true)
      }),
    []
  )

  useEffect(() => subscribeToEventsConfig(setEventsConfig), [])
  useEffect(
    () =>
      subscribeToHomepage((cfg) => {
        setHomeBanner(cfg.advertisingBanner || DEFAULT_HOMEPAGE.advertisingBanner)
      }),
    []
  )

  const loadAds = async () => {
    const token = await auth.currentUser?.getIdToken()
    if (!token) return
    const res = await fetch('/api/advertising/requests?admin=1', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const json = await res.json()
    if (json.success) setAdRows(json.data || [])
  }

  useEffect(() => {
    if (tab === 'ads') void loadAds()
  }, [tab])

  const pc = config.pageConfig
  const epc = eventsConfig.pageConfig

  const updatePage = <K extends keyof typeof pc>(key: K, value: (typeof pc)[K]) => {
    setConfig({
      ...config,
      pageConfig: { ...pc, [key]: value },
    })
  }

  const updateEventsPage = <K extends keyof typeof epc>(key: K, value: (typeof epc)[K]) => {
    setEventsConfig((prev) => ({
      ...prev,
      pageConfig: { ...prev.pageConfig, [key]: value },
    }))
  }

  const showMsg = (type: 'success' | 'error', text: string) => setMessage({ type, text })

  const saveVolunteer = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/platform-config/volunteer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Save failed')
      showMsg('success', 'Volunteer page config saved.')
    } catch (error: unknown) {
      showMsg('error', error instanceof Error ? error.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const saveEventsBanners = async () => {
    setSaving(true)
    setMessage(null)
    try {
      // Keep form link in sync when saving events volunteer banner
      const next = {
        ...eventsConfig,
        pageConfig: {
          ...eventsConfig.pageConfig,
          volunteerBannerHref:
            eventsConfig.pageConfig.volunteerBannerHref ||
            config.pageConfig.formLink ||
            '/forms/volunteer-unpaid-service',
        },
      }
      const res = await fetch('/api/platform-config/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Save failed')
      setEventsConfig(next)
      showMsg(
        'success',
        'Events gallery & volunteer banner saved. Live on /events.'
      )
    } catch (error: unknown) {
      showMsg('error', error instanceof Error ? error.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const saveHomeBanner = async (banner: HomepageAdvertisingBanner) => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/platform-config/homepage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ advertisingBanner: banner }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Save failed')
      setHomeBanner(banner)
      showMsg('success', 'Homepage advertising banner updated (free admin placement).')
    } catch (error: unknown) {
      showMsg('error', error instanceof Error ? error.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const publishFreeAd = async () => {
    if (!freeAd.imageURL) {
      showMsg('error', 'Upload a banner image first.')
      return
    }
    setSaving(true)
    setMessage(null)
    try {
      const token = await auth.currentUser?.getIdToken()
      if (!token) throw new Error('Sign in required')
      const res = await fetch('/api/advertising/requests', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...freeAd,
          adminFree: true,
          publishNow: true,
          businessName: 'Passive Blessings (admin)',
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Publish failed')
      setFreeAd({ imageURL: '', href: '', alt: 'Advertisement' })
      showMsg('success', 'Free homepage banner published.')
      await loadAds()
    } catch (error: unknown) {
      showMsg('error', error instanceof Error ? error.message : 'Publish failed')
    } finally {
      setSaving(false)
    }
  }

  const actAd = async (id: string, action: 'publish' | 'reject' | 'unpublish') => {
    setMessage(null)
    try {
      const token = await auth.currentUser?.getIdToken()
      if (!token) throw new Error('Sign in required')
      const res = await fetch('/api/advertising/requests', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, action }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Action failed')
      showMsg('success', `Request ${action}ed.`)
      await loadAds()
    } catch (error: unknown) {
      showMsg('error', error instanceof Error ? error.message : 'Action failed')
    }
  }

  const addPillar = () => {
    const trimmed = newPillar.trim()
    if (!trimmed) return
    if (pc.pillarOptions.includes(trimmed)) {
      setNewPillar('')
      return
    }
    updatePage('pillarOptions', [...pc.pillarOptions, trimmed])
    setNewPillar('')
  }

  const removePillar = (index: number) => {
    updatePage(
      'pillarOptions',
      pc.pillarOptions.filter((_, i) => i !== index)
    )
  }

  const field = (
    key: 'eyebrow' | 'headline' | 'body' | 'formLink' | 'trackingNote',
    label: string,
    multiline = false
  ) => (
    <div className="space-y-1">
      <label className="block text-xs uppercase tracking-wider text-neutral-500">{label}</label>
      {multiline ? (
        <textarea
          value={pc[key]}
          onChange={(e) => updatePage(key, e.target.value)}
          rows={4}
          className="w-full border border-neutral-300 rounded px-3 py-2.5 text-sm"
        />
      ) : (
        <input
          type="text"
          value={pc[key]}
          onChange={(e) => updatePage(key, e.target.value)}
          className="w-full border border-neutral-300 rounded px-3 py-2.5 text-sm"
        />
      )}
    </div>
  )

  const tabs: { id: TabId; label: string }[] = [
    { id: 'page', label: 'Volunteer page' },
    { id: 'events', label: 'Events banners & gallery' },
    { id: 'ads', label: 'Homepage advertising' },
  ]

  if (!ready) {
    return (
      <AdminPageLayout title="Volunteer & Ads" subtitle="Loading…">
        <div className="w-full max-w-3xl space-y-4 animate-pulse">
          <div className="h-8 w-48 bg-neutral-200 rounded" />
          <div className="h-24 w-full bg-neutral-100 rounded" />
        </div>
      </AdminPageLayout>
    )
  }

  return (
    <AdminPageLayout
      title="Volunteer & Ads"
      subtitle="Volunteer form config, /events gallery & volunteer banner, homepage advertising"
    >
      <div className="max-w-3xl w-full min-w-0 space-y-6">
        <div className="flex flex-wrap gap-2 border-b border-neutral-200 pb-3">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold ${
                tab === t.id
                  ? 'bg-black text-white'
                  : 'bg-white text-black border border-neutral-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {message && (
          <div
            className={`flex items-start gap-2 rounded p-3 text-sm ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            {message.text}
          </div>
        )}

        {tab === 'page' ? (
          <div className="space-y-4 rounded-lg border border-[#e4e1da] bg-white p-4 sm:p-6">
            {field('eyebrow', 'Eyebrow')}
            {field('headline', 'Headline')}
            {field('body', 'Body', true)}
            {field('formLink', 'Volunteer form link (used by Events banner CTA)')}
            {field('trackingNote', 'Tracking note', true)}

            <CmsImageUpload
              label="Hero / team image"
              value={pc.imageURL || ''}
              folder="volunteer/cms"
              preset="content"
              onChange={(url) => updatePage('imageURL', url)}
            />

            <div className="space-y-3">
              <label className="block text-xs uppercase tracking-wider text-neutral-500">
                Pillar options
              </label>
              <ul className="space-y-2">
                {pc.pillarOptions.map((pillar, index) => (
                  <li
                    key={`${pillar}-${index}`}
                    className="flex items-center gap-2 border border-neutral-200 rounded px-3 py-2"
                  >
                    <span className="flex-1 text-sm text-neutral-800 min-w-0 break-words">
                      {pillar}
                    </span>
                    <button
                      type="button"
                      onClick={() => removePillar(index)}
                      className="pb-compact-btn inline-flex items-center justify-center h-6 w-6 rounded bg-black text-white"
                      aria-label={`Remove ${pillar}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newPillar}
                  onChange={(e) => setNewPillar(e.target.value)}
                  placeholder="Add a pillar"
                  className="flex-1 border border-neutral-300 rounded px-3 py-2.5 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addPillar()
                    }
                  }}
                />
                <button type="button" onClick={addPillar} className={BUTTON_OUTLINE}>
                  <Plus className="w-3.5 h-3.5" /> Add pillar
                </button>
              </div>
            </div>

            <button type="button" onClick={() => void saveVolunteer()} disabled={saving} className={BUTTON_PRIMARY}>
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Saving…' : 'Save volunteer config'}
            </button>
          </div>
        ) : null}

        {tab === 'events' ? (
          <div className="space-y-6 rounded-lg border border-[#e4e1da] bg-white p-4 sm:p-6">
            <div>
              <h2 className="font-semibold text-lg text-neutral-900">Events volunteer banner</h2>
              <p className="text-sm text-neutral-600 mt-1">
                Vertical advertising banner beside the /events calendar. Image or GIF. Button links
                to the volunteer form.
              </p>
            </div>
            <CmsImageUpload
              label="Volunteer banner (image / GIF)"
              value={epc.volunteerBannerImageURL || ''}
              folder="cms/events/volunteer-banner"
              preset="banner"
              accept="image/*,image/gif"
              onChange={(url) => updateEventsPage('volunteerBannerImageURL', url)}
            />
            <div className="space-y-1">
              <label className="block text-xs uppercase tracking-wider text-neutral-500">
                Banner link (volunteer form)
              </label>
              <input
                type="text"
                value={epc.volunteerBannerHref || ''}
                onChange={(e) => updateEventsPage('volunteerBannerHref', e.target.value)}
                className="w-full border border-neutral-300 rounded px-3 py-2.5 text-sm"
                placeholder="/forms/volunteer-unpaid-service"
              />
            </div>

            <div className="border-t border-neutral-200 pt-5 space-y-3">
              <h2 className="font-semibold text-lg text-neutral-900">Hero photo gallery</h2>
              <p className="text-sm text-neutral-600">
                Previous event images as slides beside the Events hero text (max 12). Also falls
                back to photos attached to published events.
              </p>
              <div className="flex flex-wrap gap-2">
                {(epc.heroGalleryURLs || []).map((url) => (
                  <div key={url} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="h-20 w-28 object-cover rounded border" />
                    <button
                      type="button"
                      className="absolute -top-2 -right-2 bg-black text-white rounded-full px-1.5 text-xs"
                      onClick={() =>
                        updateEventsPage(
                          'heroGalleryURLs',
                          (epc.heroGalleryURLs || []).filter((u) => u !== url)
                        )
                      }
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <input
                type="file"
                accept="image/*,image/gif"
                multiple
                onChange={async (e) => {
                  const files = Array.from(e.target.files || [])
                  if (!files.length) return
                  try {
                    const uploaded: string[] = []
                    for (const file of files) {
                      const url = await uploadImageToFirebase(file, 'events/hero-gallery', {
                        preset: 'content',
                      })
                      uploaded.push(url)
                    }
                    updateEventsPage(
                      'heroGalleryURLs',
                      [...(epc.heroGalleryURLs || []), ...uploaded].slice(0, 12)
                    )
                  } catch (err) {
                    showMsg(
                      'error',
                      err instanceof Error ? err.message : 'Gallery upload failed'
                    )
                  }
                  e.target.value = ''
                }}
              />
            </div>

            <div className="border-t border-neutral-200 pt-5 space-y-3">
              <h2 className="font-semibold text-lg text-neutral-900">Optional events side ad</h2>
              <CmsImageUpload
                label="Side ad image / GIF"
                value={epc.adBannerImageURL || ''}
                folder="cms/events/ads"
                preset="banner"
                accept="image/*,image/gif"
                onChange={(url) => updateEventsPage('adBannerImageURL', url)}
              />
              <input
                type="text"
                value={epc.adBannerHref || ''}
                onChange={(e) => updateEventsPage('adBannerHref', e.target.value)}
                className="w-full border border-neutral-300 rounded px-3 py-2.5 text-sm"
                placeholder="Ad link (optional)"
              />
            </div>

            <button
              type="button"
              onClick={() => void saveEventsBanners()}
              disabled={saving}
              className={BUTTON_PRIMARY}
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Saving…' : 'Save events banners & gallery'}
            </button>
            <p className="text-xs text-neutral-500">
              Full Events page copy still lives under{' '}
              <Link href="/admin/cms/events" className="underline">
                CMS → Events Config
              </Link>
              .
            </p>
          </div>
        ) : null}

        {tab === 'ads' ? (
          <div className="space-y-6">
            <div className="rounded-lg border border-[#e4e1da] bg-white p-4 sm:p-6 space-y-4">
              <div>
                <h2 className="font-semibold text-lg text-neutral-900">
                  Admin free homepage banner
                </h2>
                <p className="text-sm text-neutral-600 mt-1">
                  Upload an image or GIF for the horizontal homepage strip. Free for admin. Businesses
                  pay via Business Portal → Advertise (Stripe).
                </p>
              </div>
              <CmsImageUpload
                label="Homepage banner (image / GIF)"
                value={freeAd.imageURL || homeBanner.imageURL || ''}
                folder="advertising/admin"
                preset="banner"
                accept="image/*,image/gif"
                onChange={(url) => setFreeAd((p) => ({ ...p, imageURL: url }))}
              />
              <input
                type="text"
                value={freeAd.href}
                onChange={(e) => setFreeAd((p) => ({ ...p, href: e.target.value }))}
                className="w-full border border-neutral-300 rounded px-3 py-2.5 text-sm"
                placeholder="Click-through URL (optional)"
              />
              <input
                type="text"
                value={freeAd.alt}
                onChange={(e) => setFreeAd((p) => ({ ...p, alt: e.target.value }))}
                className="w-full border border-neutral-300 rounded px-3 py-2.5 text-sm"
                placeholder="Alt text"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void publishFreeAd()}
                  className={BUTTON_PRIMARY}
                >
                  Publish free banner now
                </button>
                {homeBanner.enabled && homeBanner.imageURL ? (
                  <button
                    type="button"
                    disabled={saving}
                    className={BUTTON_OUTLINE}
                    onClick={() =>
                      void saveHomeBanner({ ...homeBanner, enabled: false })
                    }
                  >
                    Disable live banner
                  </button>
                ) : null}
              </div>
              {homeBanner.enabled && homeBanner.imageURL ? (
                <div className="rounded border border-neutral-200 overflow-hidden">
                  <p className="text-xs uppercase tracking-wide text-neutral-500 px-3 py-2 bg-neutral-50">
                    Currently live
                  </p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={homeBanner.imageURL}
                    alt={homeBanner.alt || ''}
                    className="w-full max-h-40 object-cover"
                  />
                </div>
              ) : null}
            </div>

            <div className="rounded-lg border border-[#e4e1da] bg-white p-4 sm:p-6 space-y-4">
              <div>
                <h2 className="font-semibold text-lg text-neutral-900">
                  Business paid requests
                </h2>
                <p className="text-sm text-neutral-600 mt-1">
                  After Stripe payment, publish to the homepage strip. Same queue as CMS →
                  Advertising.
                </p>
              </div>
              {adRows.length === 0 ? (
                <p className="text-sm text-neutral-500">No advertising requests yet.</p>
              ) : (
                <div className="space-y-3">
                  {adRows.map((r) => (
                    <div
                      key={r.id}
                      className="flex flex-col sm:flex-row gap-3 items-start border border-neutral-200 rounded-lg p-3"
                    >
                      {r.imageURL ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={r.imageURL}
                          alt=""
                          className="w-full sm:w-40 h-16 object-cover rounded border"
                        />
                      ) : null}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{r.businessName || 'Business'}</p>
                        <p className="text-xs text-neutral-500 capitalize">
                          {String(r.status || '').replace(/_/g, ' ')}
                          {r.adminFree ? ' · free admin' : ` · AED ${r.priceAed ?? 500}`}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(r.status === 'paid' ||
                          r.status === 'published' ||
                          r.status === 'admin_free') && (
                          <button
                            type="button"
                            className={BUTTON_PRIMARY}
                            onClick={() => void actAd(r.id, 'publish')}
                          >
                            Publish
                          </button>
                        )}
                        {r.status === 'published' && (
                          <button
                            type="button"
                            className={BUTTON_OUTLINE}
                            onClick={() => void actAd(r.id, 'unpublish')}
                          >
                            Unpublish
                          </button>
                        )}
                        {r.status !== 'rejected' && (
                          <button
                            type="button"
                            className={BUTTON_DANGER}
                            onClick={() => void actAd(r.id, 'reject')}
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </AdminPageLayout>
  )
}
