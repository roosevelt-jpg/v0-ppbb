'use client'

import React, { useEffect, useState } from 'react'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Save, AlertCircle, CheckCircle2, Plus, Trash2 } from 'lucide-react'
import {
  subscribeToEventsConfig,
  DEFAULT_EVENTS_CONFIG,
  EventsPlatformConfig,
  EventsCategory,
  slugifyCategoryId,
  buildCategoryFilterTabs,
} from '@/lib/events-config'
import { CmsImageUpload } from '@/components/cms-image-upload'
import { uploadImageToFirebase } from '@/lib/upload-utils'

export default function AdminCmsEventsPage() {
  const [config, setConfig] = useState<EventsPlatformConfig>(DEFAULT_EVENTS_CONFIG)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => subscribeToEventsConfig(setConfig), [])

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const payload: EventsPlatformConfig = {
        ...config,
        filterTabs: buildCategoryFilterTabs(config.categories),
      }
      const res = await fetch('/api/platform-config/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Save failed')
      setConfig(payload)
      setMessage({ type: 'success', text: 'Events page saved. Filter tags are live instantly.' })
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to save events page',
      })
    } finally {
      setSaving(false)
    }
  }

  const updateCategory = (index: number, field: keyof EventsCategory, value: string) => {
    setConfig((prev) => {
      const categories = [...prev.categories]
      const next = { ...categories[index], [field]: value }
      if (field === 'name') {
        const previousSlug = slugifyCategoryId(categories[index].name)
        if (!categories[index].id || categories[index].id === previousSlug) {
          next.id = slugifyCategoryId(value) || categories[index].id
        }
      }
      categories[index] = next
      return {
        ...prev,
        categories,
        filterTabs: buildCategoryFilterTabs(categories),
      }
    })
  }

  const addCategory = () => {
    setConfig((prev) => {
      const name = 'New category'
      const categories = [
        ...prev.categories,
        {
          id: slugifyCategoryId(name) || `category-${prev.categories.length + 1}`,
          name,
          color: '#111111',
        },
      ]
      return { ...prev, categories, filterTabs: buildCategoryFilterTabs(categories) }
    })
  }

  const removeCategory = (index: number) => {
    setConfig((prev) => {
      const categories = prev.categories.filter((_, i) => i !== index)
      return { ...prev, categories, filterTabs: buildCategoryFilterTabs(categories) }
    })
  }

  return (
    <AdminPageLayout title="Events CMS">
      <div className="space-y-6 w-full min-w-0">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-headline text-3xl font-bold text-neutral-900 dark:text-foreground">Events Page</h1>
            <p className="text-sm text-neutral-600 dark:text-muted-foreground mt-1">
              Edit public /events copy and category filter tags (Tech, Education, Social, …). These
              categories power the public filter bar, calendar colours, and event cards. Event
              records are managed at{' '}
              <a href="/admin/events" className="underline font-medium">
                /admin/events
              </a>
              .
            </p>
          </div>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="h-7 min-h-0 w-full sm:w-auto bg-black text-white hover:bg-gray-800"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving…' : 'Save events page'}
          </Button>
        </div>

        {message && (
          <div
            className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            {message.text}
          </div>
        )}

        <Card className="p-4 sm:p-6 space-y-4">
          <h2 className="font-headline text-xl font-bold">Page text (4A)</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Eyebrow</label>
              <input
                type="text"
                value={config.pageConfig.eyebrow}
                onChange={(e) =>
                  setConfig((p) => ({
                    ...p,
                    pageConfig: { ...p.pageConfig, eyebrow: e.target.value },
                  }))
                }
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Headline</label>
              <input
                type="text"
                value={config.pageConfig.headline}
                onChange={(e) =>
                  setConfig((p) => ({
                    ...p,
                    pageConfig: { ...p.pageConfig, headline: e.target.value },
                  }))
                }
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Body</label>
              <textarea
                value={config.pageConfig.body}
                onChange={(e) =>
                  setConfig((p) => ({
                    ...p,
                    pageConfig: { ...p.pageConfig, body: e.target.value },
                  }))
                }
                className="w-full min-h-24"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">WhatsApp button label</label>
                <input
                  type="text"
                  value={config.pageConfig.whatsappButtonLabel}
                  onChange={(e) =>
                    setConfig((p) => ({
                      ...p,
                      pageConfig: { ...p.pageConfig, whatsappButtonLabel: e.target.value },
                    }))
                  }
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  WhatsApp link (optional — falls back to Global Settings)
                </label>
                <input
                  type="url"
                  value={config.pageConfig.whatsappLink}
                  onChange={(e) =>
                    setConfig((p) => ({
                      ...p,
                      pageConfig: { ...p.pageConfig, whatsappLink: e.target.value },
                    }))
                  }
                  className="w-full"
                  placeholder="https://whatsapp.com/channel/…"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Lineup heading template</label>
                <input
                  type="text"
                  value={config.pageConfig.lineupHeadingTemplate}
                  onChange={(e) =>
                    setConfig((p) => ({
                      ...p,
                      pageConfig: { ...p.pageConfig, lineupHeadingTemplate: e.target.value },
                    }))
                  }
                  className="w-full"
                  placeholder="{MONTH} LINEUP"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Lineup count template</label>
                <input
                  type="text"
                  value={config.pageConfig.lineupCountTemplate}
                  onChange={(e) =>
                    setConfig((p) => ({
                      ...p,
                      pageConfig: { ...p.pageConfig, lineupCountTemplate: e.target.value },
                    }))
                  }
                  className="w-full"
                  placeholder="{count} events this month"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Register button label</label>
                <input
                  type="text"
                  value={config.pageConfig.registerButtonLabel}
                  onChange={(e) =>
                    setConfig((p) => ({
                      ...p,
                      pageConfig: { ...p.pageConfig, registerButtonLabel: e.target.value },
                    }))
                  }
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Details button label</label>
                <input
                  type="text"
                  value={config.pageConfig.detailsButtonLabel}
                  onChange={(e) =>
                    setConfig((p) => ({
                      ...p,
                      pageConfig: { ...p.pageConfig, detailsButtonLabel: e.target.value },
                    }))
                  }
                  className="w-full"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Empty lineup message</label>
              <textarea
                value={config.pageConfig.emptyLineupMessage}
                onChange={(e) =>
                  setConfig((p) => ({
                    ...p,
                    pageConfig: { ...p.pageConfig, emptyLineupMessage: e.target.value },
                  }))
                }
                className="w-full min-h-20"
              />
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6 space-y-4">
          <h2 className="font-headline text-xl font-bold">Volunteer & ad banners</h2>
          <p className="text-sm text-neutral-600 dark:text-muted-foreground">
            Shown on the public /events page beside the lineup (volunteer promo + optional ad strip).
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CmsImageUpload
              label="Volunteer banner image"
              value={config.pageConfig.volunteerBannerImageURL || ''}
              folder="cms/events"
              preset="banner"
              onChange={(url) =>
                setConfig((p) => ({
                  ...p,
                  pageConfig: { ...p.pageConfig, volunteerBannerImageURL: url },
                }))
              }
            />
            <div>
              <label className="block text-sm font-medium mb-1">Volunteer banner link</label>
              <input
                type="text"
                value={config.pageConfig.volunteerBannerHref || ''}
                onChange={(e) =>
                  setConfig((p) => ({
                    ...p,
                    pageConfig: { ...p.pageConfig, volunteerBannerHref: e.target.value },
                  }))
                }
                className="w-full"
                placeholder="/forms/volunteer-with-pb"
              />
            </div>
            <CmsImageUpload
              label="Ad banner image"
              value={config.pageConfig.adBannerImageURL || ''}
              folder="cms/events"
              preset="banner"
              onChange={(url) =>
                setConfig((p) => ({
                  ...p,
                  pageConfig: { ...p.pageConfig, adBannerImageURL: url },
                }))
              }
            />
            <div>
              <label className="block text-sm font-medium mb-1">Ad banner link</label>
              <input
                type="text"
                value={config.pageConfig.adBannerHref || ''}
                onChange={(e) =>
                  setConfig((p) => ({
                    ...p,
                    pageConfig: { ...p.pageConfig, adBannerHref: e.target.value },
                  }))
                }
                className="w-full"
                placeholder="https://… or /path"
              />
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6 space-y-4">
          <h2 className="font-headline text-xl font-bold">Hero photo gallery</h2>
          <p className="text-xs text-neutral-500 dark:text-muted-foreground">
            Previous event images shown as a slideshow beside the Events page hero text (max 12).
          </p>
          <div className="flex flex-wrap gap-2">
            {(config.pageConfig.heroGalleryURLs || []).map((url) => (
              <div key={url} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-20 w-28 object-cover rounded border" />
                <button
                  type="button"
                  className="absolute -top-2 -right-2 bg-black text-white rounded-full px-1.5 text-xs"
                  onClick={() =>
                    setConfig((p) => ({
                      ...p,
                      pageConfig: {
                        ...p.pageConfig,
                        heroGalleryURLs: (p.pageConfig.heroGalleryURLs || []).filter((u) => u !== url),
                      },
                    }))
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
                setConfig((p) => ({
                  ...p,
                  pageConfig: {
                    ...p.pageConfig,
                    heroGalleryURLs: [...(p.pageConfig.heroGalleryURLs || []), ...uploaded].slice(
                      0,
                      12
                    ),
                  },
                }))
              } catch (err) {
                setMessage({
                  type: 'error',
                  text: err instanceof Error ? err.message : 'Gallery upload failed',
                })
              }
              e.target.value = ''
            }}
          />
          <p className="text-xs text-neutral-500 dark:text-muted-foreground">Images are auto-resized before upload.</p>
        </Card>

        <Card className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="font-headline text-xl font-bold">Category filter tags</h2>
              <p className="text-xs text-neutral-500 dark:text-muted-foreground mt-1">
                These appear on /events as filter buttons (ALL + each tag). Assign one when creating
                an event so cards, calendar dots, and filters stay in sync.
              </p>
            </div>
            <Button
              type="button"
              onClick={addCategory}
              className="h-7 min-h-0 bg-black text-white hover:bg-gray-800 text-xs"
            >
              <Plus className="w-3 h-3 mr-1" /> Add category
            </Button>
          </div>
          <div className="space-y-3">
            {config.categories.map((category, i) => (
              <div
                key={`${category.id}-${i}`}
                className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end p-3 border rounded-lg"
              >
                <div className="sm:col-span-3">
                  <label className="text-xs font-medium">ID (slug)</label>
                  <input
                    type="text"
                    value={category.id}
                    onChange={(e) => updateCategory(i, 'id', e.target.value)}
                    className="w-full min-h-[44px]"
                    placeholder="tech"
                  />
                </div>
                <div className="sm:col-span-4">
                  <label className="text-xs font-medium">Filter label</label>
                  <input
                    type="text"
                    value={category.name}
                    onChange={(e) => updateCategory(i, 'name', e.target.value)}
                    className="w-full min-h-[44px]"
                    placeholder="Tech"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="text-xs font-medium">Colour</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={category.color}
                      onChange={(e) => updateCategory(i, 'color', e.target.value)}
                      className="h-10 w-12 p-1 border rounded"
                    />
                    <input
                      type="text"
                      value={category.color}
                      onChange={(e) => updateCategory(i, 'color', e.target.value)}
                      className="w-full min-h-[44px]"
                    />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="button"
                    onClick={() => removeCategory(i)}
                    className="flex items-center justify-center pb-compact-btn h-7 min-h-0 w-auto px-2 p-0 bg-black !text-white rounded"
                    aria-label="Remove category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {config.filterTabs.length > 1 && (
            <p className="text-xs text-neutral-500 dark:text-muted-foreground">
              Live filters:{' '}
              {config.filterTabs.map((t) => t.label).join(' · ')}
            </p>
          )}
        </Card>
      </div>
    </AdminPageLayout>
  )
}
