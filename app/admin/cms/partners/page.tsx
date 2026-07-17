'use client'

import React, { useEffect, useState } from 'react'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Save,
  AlertCircle,
  CheckCircle2,
  Upload,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'
import {
  subscribeToPartnersConfig,
  DEFAULT_PARTNERS_CONFIG,
  PartnersPlatformConfig,
  PartnersTrack,
  PartnersInquiryCategory,
} from '@/lib/partners-page-config'
import { uploadFileToFirebase } from '@/lib/upload-utils'
import { subscribeToForms } from '@/lib/form-builder-queries'
import type { CustomForm } from '@/lib/form-builder-types'
import { getPublicFormPath } from '@/lib/form-builder-utils'

export default function AdminCmsPartnersPage() {
  const [config, setConfig] = useState<PartnersPlatformConfig>(DEFAULT_PARTNERS_CONFIG)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [forms, setForms] = useState<CustomForm[]>([])

  useEffect(() => subscribeToPartnersConfig(setConfig), [])
  useEffect(() => subscribeToForms(setForms), [])

  const activeForms = forms.filter((f) => f.status === 'active' && f.slug)

  const persistConfig = async (nextConfig: PartnersPlatformConfig) => {
    const res = await fetch('/api/platform-config/partners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nextConfig),
    })
    const json = await res.json()
    if (!json.success) throw new Error(json.error || 'Save failed')
    return nextConfig
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      await persistConfig(config)
      setMessage({ type: 'success', text: 'Partners page saved. Changes are live instantly.' })
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to save partners page',
      })
    } finally {
      setSaving(false)
    }
  }

  const updatePage = <K extends keyof typeof config.pageConfig>(
    field: K,
    value: (typeof config.pageConfig)[K]
  ) => {
    setConfig((prev) => ({
      ...prev,
      pageConfig: { ...prev.pageConfig, [field]: value },
    }))
  }

  const handlePdfUpload = async (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setMessage({ type: 'error', text: 'Please upload a PDF file.' })
      return
    }
    setUploading(true)
    setMessage(null)
    try {
      const url = await uploadFileToFirebase(file, 'partners/sponsorship-deck')
      const nextConfig: PartnersPlatformConfig = {
        ...config,
        pageConfig: { ...config.pageConfig, sponsorshipDeckPDFUrl: url },
      }
      setConfig(nextConfig)
      await persistConfig(nextConfig)
      setMessage({ type: 'success', text: 'Sponsorship deck PDF uploaded and saved.' })
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'PDF upload failed',
      })
    } finally {
      setUploading(false)
    }
  }

  const handleRemovePdf = async () => {
    setMessage(null)
    try {
      const nextConfig: PartnersPlatformConfig = {
        ...config,
        pageConfig: { ...config.pageConfig, sponsorshipDeckPDFUrl: '' },
      }
      setConfig(nextConfig)
      await persistConfig(nextConfig)
      setMessage({ type: 'success', text: 'Sponsorship deck PDF removed.' })
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to remove PDF',
      })
    }
  }

  const updateTrack = (index: number, field: keyof PartnersTrack, value: string) => {
    setConfig((prev) => {
      const tracks = [...prev.pageConfig.tracks]
      tracks[index] = { ...tracks[index], [field]: value }
      return { ...prev, pageConfig: { ...prev.pageConfig, tracks } }
    })
  }

  const addTrack = () => {
    setConfig((prev) => ({
      ...prev,
      pageConfig: {
        ...prev.pageConfig,
        tracks: [...prev.pageConfig.tracks, { title: 'New track', description: '' }],
      },
    }))
  }

  const removeTrack = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      pageConfig: {
        ...prev.pageConfig,
        tracks: prev.pageConfig.tracks.filter((_, i) => i !== index),
      },
    }))
  }

  const moveTrack = (index: number, direction: 'up' | 'down') => {
    setConfig((prev) => {
      const tracks = [...prev.pageConfig.tracks]
      const swap = direction === 'up' ? index - 1 : index + 1
      if (swap < 0 || swap >= tracks.length) return prev
      ;[tracks[index], tracks[swap]] = [tracks[swap], tracks[index]]
      return { ...prev, pageConfig: { ...prev.pageConfig, tracks } }
    })
  }

  const updateInquiryCategory = (
    index: number,
    patch: Partial<PartnersInquiryCategory>
  ) => {
    setConfig((prev) => {
      const inquiryCategories = [...prev.pageConfig.inquiryCategories]
      inquiryCategories[index] = { ...inquiryCategories[index], ...patch }
      return { ...prev, pageConfig: { ...prev.pageConfig, inquiryCategories } }
    })
  }

  const addInquiryCategory = () => {
    setConfig((prev) => ({
      ...prev,
      pageConfig: {
        ...prev.pageConfig,
        inquiryCategories: [
          ...prev.pageConfig.inquiryCategories,
          {
            id: `inquiry-${Date.now()}`,
            label: 'New category',
            formId: '',
            formSlug: '',
            formUrl: '',
          },
        ],
      },
    }))
  }

  const removeInquiryCategory = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      pageConfig: {
        ...prev.pageConfig,
        inquiryCategories: prev.pageConfig.inquiryCategories.filter((_, i) => i !== index),
      },
    }))
  }

  const pc = config.pageConfig

  return (
    <AdminPageLayout title="Partners CMS">
      <div className="space-y-6 w-full min-w-0">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-headline text-3xl font-bold text-neutral-900">Partners Page</h1>
            <p className="text-sm text-neutral-600 mt-1 font-body">
              Edit public /partners copy, sponsorship deck PDF, tracks, and map inquiry categories
              to Admin → Forms.
            </p>
          </div>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-auto bg-black text-white hover:bg-gray-800 min-h-[44px]"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving…' : 'Save partners page'}
          </Button>
        </div>

        {message && (
          <div
            className={`flex items-center gap-2 p-3 rounded-lg text-sm font-body ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            {message.text}
          </div>
        )}

        <Card className="p-4 sm:p-6 space-y-4">
          <h2 className="font-headline text-xl font-bold">Hero</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 font-body">Eyebrow</label>
              <input
                type="text"
                value={pc.eyebrow}
                onChange={(e) => updatePage('eyebrow', e.target.value)}
                className="w-full min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 font-body">Headline</label>
              <input
                type="text"
                value={pc.headline}
                onChange={(e) => updatePage('headline', e.target.value)}
                className="w-full min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 font-body">Body</label>
              <textarea
                value={pc.body}
                onChange={(e) => updatePage('body', e.target.value)}
                className="w-full min-h-24"
              />
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6 space-y-4">
          <h2 className="font-headline text-xl font-bold">Sponsorship deck</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 font-body">Eyebrow</label>
              <input
                type="text"
                value={pc.sponsorshipDeckEyebrow}
                onChange={(e) => updatePage('sponsorshipDeckEyebrow', e.target.value)}
                className="w-full min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 font-body">Headline</label>
              <input
                type="text"
                value={pc.sponsorshipDeckHeadline}
                onChange={(e) => updatePage('sponsorshipDeckHeadline', e.target.value)}
                className="w-full min-h-[44px]"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1 font-body">Body</label>
              <textarea
                value={pc.sponsorshipDeckBody}
                onChange={(e) => updatePage('sponsorshipDeckBody', e.target.value)}
                className="w-full min-h-24"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 font-body">CTA label</label>
              <input
                type="text"
                value={pc.sponsorshipDeckCTA}
                onChange={(e) => updatePage('sponsorshipDeckCTA', e.target.value)}
                className="w-full min-h-[44px]"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1 font-body">Sponsorship deck PDF</label>
              <p className="text-xs text-neutral-500 mb-3 font-body">
                Upload a PDF → Firebase Storage → URL stored in Firestore only.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 items-start">
                <label className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-neutral-50 text-sm font-body min-h-[44px] bg-white text-black">
                  <Upload className="w-4 h-4" />
                  {uploading ? 'Uploading…' : pc.sponsorshipDeckPDFUrl ? 'Replace PDF' : 'Upload PDF'}
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) void handlePdfUpload(file)
                      e.target.value = ''
                    }}
                  />
                </label>
                {pc.sponsorshipDeckPDFUrl && (
                  <>
                    <a
                      href={pc.sponsorshipDeckPDFUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center min-h-[44px] px-4 py-2 bg-white text-black border rounded-lg text-sm font-body hover:bg-neutral-50"
                    >
                      Open current PDF
                    </a>
                    <Button
                      type="button"
                      onClick={handleRemovePdf}
                      className="min-h-[44px] bg-red-600 text-white hover:bg-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove PDF
                    </Button>
                  </>
                )}
              </div>
              {pc.sponsorshipDeckPDFUrl && (
                <p className="text-xs text-neutral-500 mt-2 break-all font-body">
                  {pc.sponsorshipDeckPDFUrl}
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6 space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-headline text-xl font-bold">Tracks</h2>
              <p className="text-sm text-neutral-600 mt-1 font-body">
                Title + description pairs. Reorder with the arrows.
              </p>
            </div>
            <Button
              type="button"
              onClick={addTrack}
              className="bg-white text-black border border-neutral-300 hover:bg-neutral-50 min-h-[44px]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add track
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 font-body">Section eyebrow</label>
              <input
                type="text"
                value={pc.tracksEyebrow}
                onChange={(e) => updatePage('tracksEyebrow', e.target.value)}
                className="w-full min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 font-body">Section headline</label>
              <input
                type="text"
                value={pc.tracksHeadline}
                onChange={(e) => updatePage('tracksHeadline', e.target.value)}
                className="w-full min-h-[44px]"
              />
            </div>
          </div>

          <div className="space-y-4">
            {pc.tracks.map((track, index) => (
              <div
                key={index}
                className="border border-neutral-200 rounded-lg p-4 space-y-3 bg-neutral-50/50"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="text-sm font-medium text-neutral-700 font-body">Track {index + 1}</p>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={index === 0}
                      onClick={() => moveTrack(index, 'up')}
                      className="min-h-[40px] bg-white text-black border"
                      aria-label="Move up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={index === pc.tracks.length - 1}
                      onClick={() => moveTrack(index, 'down')}
                      className="min-h-[40px] bg-white text-black border"
                      aria-label="Move down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => removeTrack(index)}
                      className="min-h-[40px] bg-red-600 text-white hover:bg-red-700"
                      aria-label="Delete track"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 font-body">Title</label>
                  <input
                    type="text"
                    value={track.title}
                    onChange={(e) => updateTrack(index, 'title', e.target.value)}
                    className="w-full min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 font-body">Description</label>
                  <textarea
                    value={track.description}
                    onChange={(e) => updateTrack(index, 'description', e.target.value)}
                    className="w-full min-h-20"
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4 sm:p-6 space-y-4">
          <h2 className="font-headline text-xl font-bold">Inquiry block</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 font-body">Eyebrow</label>
              <input
                type="text"
                value={pc.inquiryEyebrow}
                onChange={(e) => updatePage('inquiryEyebrow', e.target.value)}
                className="w-full min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 font-body">CTA label</label>
              <input
                type="text"
                value={pc.inquiryCTA}
                onChange={(e) => updatePage('inquiryCTA', e.target.value)}
                className="w-full min-h-[44px]"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1 font-body">Headline</label>
              <input
                type="text"
                value={pc.inquiryHeadline}
                onChange={(e) => updatePage('inquiryHeadline', e.target.value)}
                className="w-full min-h-[44px]"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1 font-body">Body</label>
              <textarea
                value={pc.inquiryBody}
                onChange={(e) => updatePage('inquiryBody', e.target.value)}
                className="w-full min-h-24"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-200 space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h3 className="font-semibold text-sm">Inquiry categories → forms</h3>
                <p className="text-xs text-neutral-500 mt-1">
                  Create forms under Admin → Forms, copy the public link (or pick the form here).
                  “Start a conversation” opens that form for the selected category.
                </p>
              </div>
              <Button
                type="button"
                onClick={addInquiryCategory}
                className="bg-black text-white hover:bg-gray-800 text-xs min-h-[36px]"
              >
                <Plus className="w-3 h-3 mr-1" /> Add category
              </Button>
            </div>

            {pc.inquiryCategories.map((cat, i) => (
              <div
                key={cat.id}
                className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end p-3 border rounded-lg"
              >
                <div className="md:col-span-3">
                  <label className="text-xs font-medium">Label</label>
                  <input
                    type="text"
                    value={cat.label}
                    onChange={(e) => updateInquiryCategory(i, { label: e.target.value })}
                    className="w-full min-h-[44px]"
                  />
                </div>
                <div className="md:col-span-4">
                  <label className="text-xs font-medium">Linked form</label>
                  <select
                    value={
                      cat.formId ||
                      activeForms.find((f) => f.slug === cat.formSlug)?.id ||
                      ''
                    }
                    onChange={(e) => {
                      const form = activeForms.find((f) => f.id === e.target.value)
                      updateInquiryCategory(i, {
                        formId: form?.id || '',
                        formSlug: form?.slug || '',
                        formUrl: '',
                      })
                    }}
                    className="w-full min-h-[44px]"
                  >
                    <option value="">Select an active form…</option>
                    {activeForms.map((form) => (
                      <option key={form.id} value={form.id}>
                        {form.title} ({getPublicFormPath(form.slug!)})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-4">
                  <label className="text-xs font-medium">Or paste form / external URL</label>
                  <input
                    type="text"
                    value={
                      cat.formUrl || (cat.formSlug ? getPublicFormPath(cat.formSlug) : '')
                    }
                    onChange={(e) => {
                      const value = e.target.value.trim()
                      const slugMatch = value.match(/\/forms\/([^/?#]+)/i)
                      if (slugMatch) {
                        const form = activeForms.find((f) => f.slug === slugMatch[1])
                        updateInquiryCategory(i, {
                          formUrl: '',
                          formSlug: slugMatch[1],
                          formId: form?.id || '',
                        })
                      } else {
                        updateInquiryCategory(i, {
                          formUrl: value,
                          formSlug: '',
                          formId: '',
                        })
                      }
                    }}
                    className="w-full min-h-[44px]"
                    placeholder="/forms/your-form-slug or https://…"
                  />
                </div>
                <div className="md:col-span-1">
                  <button
                    type="button"
                    onClick={() => removeInquiryCategory(i)}
                    className="w-full min-h-[44px] inline-flex items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                    aria-label="Remove category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {activeForms.length === 0 && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                No active forms with a public slug yet. Create and activate a form under{' '}
                <a href="/admin/forms" className="underline font-medium">
                  Admin → Forms
                </a>
                , then link it here.
              </p>
            )}
          </div>
        </Card>

        <Card className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="font-headline text-xl font-bold">Featured partnership projects</h2>
              <p className="text-xs text-neutral-500 mt-1">
                Shown on the public Partners page with title, photo, brief, date, location, and partner names.
              </p>
            </div>
            <Button
              type="button"
              onClick={() =>
                setConfig((prev) => ({
                  ...prev,
                  pageConfig: {
                    ...prev.pageConfig,
                    featuredProjects: [
                      ...(prev.pageConfig.featuredProjects || []),
                      {
                        id: `project-${Date.now()}`,
                        title: 'New project',
                        brief: '',
                        date: '',
                        location: '',
                        partnerNames: '',
                        imageURL: '',
                        ctaLabel: 'Learn more',
                        ctaHref: '',
                      },
                    ],
                  },
                }))
              }
              className="bg-black text-white hover:bg-gray-800 text-xs min-h-[44px]"
            >
              <Plus className="w-3 h-3 mr-1" /> Add project
            </Button>
          </div>
          <div className="space-y-4">
            {(pc.featuredProjects || []).map((project, i) => (
              <div key={project.id} className="border border-neutral-200 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={project.title}
                    onChange={(e) =>
                      setConfig((prev) => {
                        const featuredProjects = [...(prev.pageConfig.featuredProjects || [])]
                        featuredProjects[i] = { ...featuredProjects[i], title: e.target.value }
                        return { ...prev, pageConfig: { ...prev.pageConfig, featuredProjects } }
                      })
                    }
                    className="w-full min-h-[44px]"
                    placeholder="Project title"
                  />
                  <input
                    type="text"
                    value={project.partnerNames}
                    onChange={(e) =>
                      setConfig((prev) => {
                        const featuredProjects = [...(prev.pageConfig.featuredProjects || [])]
                        featuredProjects[i] = { ...featuredProjects[i], partnerNames: e.target.value }
                        return { ...prev, pageConfig: { ...prev.pageConfig, featuredProjects } }
                      })
                    }
                    className="w-full min-h-[44px]"
                    placeholder="Partner names"
                  />
                  <input
                    type="text"
                    value={project.date}
                    onChange={(e) =>
                      setConfig((prev) => {
                        const featuredProjects = [...(prev.pageConfig.featuredProjects || [])]
                        featuredProjects[i] = { ...featuredProjects[i], date: e.target.value }
                        return { ...prev, pageConfig: { ...prev.pageConfig, featuredProjects } }
                      })
                    }
                    className="w-full min-h-[44px]"
                    placeholder="Date (e.g. Jul 2026)"
                  />
                  <input
                    type="text"
                    value={project.location}
                    onChange={(e) =>
                      setConfig((prev) => {
                        const featuredProjects = [...(prev.pageConfig.featuredProjects || [])]
                        featuredProjects[i] = { ...featuredProjects[i], location: e.target.value }
                        return { ...prev, pageConfig: { ...prev.pageConfig, featuredProjects } }
                      })
                    }
                    className="w-full min-h-[44px]"
                    placeholder="Location"
                  />
                </div>
                <textarea
                  value={project.brief}
                  onChange={(e) =>
                    setConfig((prev) => {
                      const featuredProjects = [...(prev.pageConfig.featuredProjects || [])]
                      featuredProjects[i] = { ...featuredProjects[i], brief: e.target.value }
                      return { ...prev, pageConfig: { ...prev.pageConfig, featuredProjects } }
                    })
                  }
                  className="w-full min-h-20"
                  placeholder="Brief description"
                />
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="url"
                    value={project.imageURL}
                    onChange={(e) =>
                      setConfig((prev) => {
                        const featuredProjects = [...(prev.pageConfig.featuredProjects || [])]
                        featuredProjects[i] = { ...featuredProjects[i], imageURL: e.target.value }
                        return { ...prev, pageConfig: { ...prev.pageConfig, featuredProjects } }
                      })
                    }
                    className="flex-1 min-h-[44px] min-w-[200px]"
                    placeholder="Image URL"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    className="text-sm"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      try {
                        const url = await uploadFileToFirebase(file, 'partners/projects')
                        setConfig((prev) => {
                          const featuredProjects = [...(prev.pageConfig.featuredProjects || [])]
                          featuredProjects[i] = { ...featuredProjects[i], imageURL: url }
                          return { ...prev, pageConfig: { ...prev.pageConfig, featuredProjects } }
                        })
                      } catch (err) {
                        setMessage({
                          type: 'error',
                          text: err instanceof Error ? err.message : 'Upload failed',
                        })
                      }
                      e.target.value = ''
                    }}
                  />
                  <input
                    type="text"
                    value={project.ctaLabel || ''}
                    placeholder="CTA label"
                    onChange={(e) =>
                      setConfig((prev) => {
                        const featuredProjects = [...(prev.pageConfig.featuredProjects || [])]
                        featuredProjects[i] = { ...featuredProjects[i], ctaLabel: e.target.value }
                        return { ...prev, pageConfig: { ...prev.pageConfig, featuredProjects } }
                      })
                    }
                    className="w-full min-h-[44px] px-3 border rounded-lg"
                  />
                  <input
                    type="url"
                    value={project.ctaHref || ''}
                    placeholder="CTA link (https://…)"
                    onChange={(e) =>
                      setConfig((prev) => {
                        const featuredProjects = [...(prev.pageConfig.featuredProjects || [])]
                        featuredProjects[i] = { ...featuredProjects[i], ctaHref: e.target.value }
                        return { ...prev, pageConfig: { ...prev.pageConfig, featuredProjects } }
                      })
                    }
                    className="w-full min-h-[44px] px-3 border rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setConfig((prev) => ({
                        ...prev,
                        pageConfig: {
                          ...prev.pageConfig,
                          featuredProjects: (prev.pageConfig.featuredProjects || []).filter(
                            (_, idx) => idx !== i
                          ),
                        },
                      }))
                    }
                    className="min-h-[44px] px-3 rounded-lg border border-red-200 text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4 sm:p-6 space-y-4">
          <h2 className="font-headline text-xl font-bold">Trusted by</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 font-body">Label (eyebrow)</label>
              <input
                type="text"
                value={pc.trustedByLabel}
                onChange={(e) => updatePage('trustedByLabel', e.target.value)}
                className="w-full min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 font-body">Sub-label</label>
              <input
                type="text"
                value={pc.trustedBySubLabel}
                onChange={(e) => updatePage('trustedBySubLabel', e.target.value)}
                className="w-full min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 font-body">Description</label>
              <textarea
                value={pc.trustedByDescription}
                onChange={(e) => updatePage('trustedByDescription', e.target.value)}
                className="w-full min-h-20"
              />
            </div>
          </div>
        </Card>

        <div className="flex justify-end pb-8">
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-auto bg-black text-white hover:bg-gray-800 min-h-[44px]"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving…' : 'Save partners page'}
          </Button>
        </div>
      </div>
    </AdminPageLayout>
  )
}
