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
} from '@/lib/partners-page-config'
import { uploadFileToFirebase } from '@/lib/upload-utils'

export default function AdminCmsPartnersPage() {
  const [config, setConfig] = useState<PartnersPlatformConfig>(DEFAULT_PARTNERS_CONFIG)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => subscribeToPartnersConfig(setConfig), [])

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

  const pc = config.pageConfig

  return (
    <AdminPageLayout title="Partners CMS">
      <div className="space-y-6 w-full min-w-0">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-headline text-3xl font-bold text-neutral-900">Partners Page</h1>
            <p className="text-sm text-neutral-600 mt-1 font-body">
              Edit public /partners copy, sponsorship deck PDF, tracks, and inquiry labels. Logos
              grid and inquiry form are managed in later CMS batches.
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
