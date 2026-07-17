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
  subscribeToMarketplaceConfig,
  DEFAULT_MARKETPLACE_CONFIG,
  MarketplacePlatformConfig,
  MarketplaceBenefit,
} from '@/lib/marketplace-config'
import { uploadImageToFirebase } from '@/lib/upload-utils'

export default function AdminCmsMarketplacePage() {
  const [config, setConfig] = useState<MarketplacePlatformConfig>(DEFAULT_MARKETPLACE_CONFIG)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => subscribeToMarketplaceConfig(setConfig), [])

  const persistConfig = async (nextConfig: MarketplacePlatformConfig) => {
    const res = await fetch('/api/platform-config/marketplace', {
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
      setMessage({ type: 'success', text: 'Marketplace page saved. Changes are live instantly.' })
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to save marketplace page',
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

  const handleImageUpload = async (file: File) => {
    setUploading(true)
    setMessage(null)
    try {
      const url = await uploadImageToFirebase(file, 'marketplace/membership', { preset: 'hero' })
      const nextConfig: MarketplacePlatformConfig = {
        ...config,
        pageConfig: { ...config.pageConfig, membershipImageURL: url },
      }
      setConfig(nextConfig)
      await persistConfig(nextConfig)
      setMessage({ type: 'success', text: 'Membership image uploaded and saved.' })
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Image upload failed',
      })
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = async () => {
    setMessage(null)
    try {
      const nextConfig: MarketplacePlatformConfig = {
        ...config,
        pageConfig: { ...config.pageConfig, membershipImageURL: '' },
      }
      setConfig(nextConfig)
      await persistConfig(nextConfig)
      setMessage({ type: 'success', text: 'Membership image removed.' })
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to remove image',
      })
    }
  }

  const updateBenefit = (index: number, field: keyof MarketplaceBenefit, value: string) => {
    setConfig((prev) => {
      const benefits = [...prev.pageConfig.benefits]
      benefits[index] = { ...benefits[index], [field]: value }
      return { ...prev, pageConfig: { ...prev.pageConfig, benefits } }
    })
  }

  const addBenefit = () => {
    setConfig((prev) => ({
      ...prev,
      pageConfig: {
        ...prev.pageConfig,
        benefits: [...prev.pageConfig.benefits, { title: 'New benefit', description: '' }],
      },
    }))
  }

  const removeBenefit = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      pageConfig: {
        ...prev.pageConfig,
        benefits: prev.pageConfig.benefits.filter((_, i) => i !== index),
      },
    }))
  }

  const moveBenefit = (index: number, direction: 'up' | 'down') => {
    setConfig((prev) => {
      const benefits = [...prev.pageConfig.benefits]
      const swap = direction === 'up' ? index - 1 : index + 1
      if (swap < 0 || swap >= benefits.length) return prev
      ;[benefits[index], benefits[swap]] = [benefits[swap], benefits[index]]
      return { ...prev, pageConfig: { ...prev.pageConfig, benefits } }
    })
  }

  const pc = config.pageConfig

  return (
    <AdminPageLayout title="Marketplace CMS">
      <div className="space-y-6 w-full min-w-0">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-headline text-3xl font-bold text-neutral-900">Marketplace Page</h1>
            <p className="text-sm text-neutral-600 mt-1">
              Edit public /marketplace hero, membership, and benefits copy. Business directory
              listing is managed separately.
            </p>
          </div>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-auto bg-black text-white hover:bg-gray-800 min-h-[44px]"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving…' : 'Save marketplace page'}
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
              <label className="block text-sm font-medium mb-1">Eyebrow</label>
              <input
                type="text"
                value={pc.eyebrow}
                onChange={(e) => updatePage('eyebrow', e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Headline</label>
              <input
                type="text"
                value={pc.headline}
                onChange={(e) => updatePage('headline', e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Body</label>
              <textarea
                value={pc.body}
                onChange={(e) => updatePage('body', e.target.value)}
                className="w-full min-h-24"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Hero image (beside text)</label>
              <p className="text-xs text-neutral-500 mb-2">
                Shown beside the first marketplace text block. Falls back to membership image if empty.
              </p>
              {pc.heroImageURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={pc.heroImageURL} alt="" className="h-24 w-40 object-cover rounded border mb-2" />
              ) : null}
              <label className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-neutral-50 text-sm min-h-[44px] w-fit bg-white text-black">
                <Upload className="w-4 h-4" />
                {uploading ? 'Uploading…' : 'Upload hero image'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    try {
                      setUploading(true)
                      const url = await uploadImageToFirebase(file, 'marketplace/hero')
                      updatePage('heroImageURL', url)
                    } catch (err) {
                      setMessage({
                        type: 'error',
                        text: err instanceof Error ? err.message : 'Upload failed',
                      })
                    } finally {
                      setUploading(false)
                      e.target.value = ''
                    }
                  }}
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">WhatsApp channel URL (unused on public page)</label>
              <input
                type="url"
                value={pc.whatsappLink}
                onChange={(e) => updatePage('whatsappLink', e.target.value)}
                className="w-full"
                placeholder="https://whatsapp.com/channel/..."
              />
              <p className="text-xs text-neutral-500 mt-1">
                WhatsApp CTA was removed from the public marketplace per feedback; field kept for
                legacy config only.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">WhatsApp button label</label>
              <input
                type="text"
                value={pc.whatsappButtonLabel}
                onChange={(e) => updatePage('whatsappButtonLabel', e.target.value)}
                className="w-full"
                placeholder="Join Our Whatsapp"
              />
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6 space-y-4">
          <h2 className="font-headline text-xl font-bold">Membership</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Eyebrow</label>
              <input
                type="text"
                value={pc.membershipEyebrow}
                onChange={(e) => updatePage('membershipEyebrow', e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Headline</label>
              <input
                type="text"
                value={pc.membershipHeadline}
                onChange={(e) => updatePage('membershipHeadline', e.target.value)}
                className="w-full"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Body</label>
              <textarea
                value={pc.membershipBody}
                onChange={(e) => updatePage('membershipBody', e.target.value)}
                className="w-full min-h-24"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">CTA label</label>
              <input
                type="text"
                value={pc.membershipCTA}
                onChange={(e) => updatePage('membershipCTA', e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">CTA href</label>
              <input
                type="text"
                value={pc.membershipCTAHref}
                onChange={(e) => updatePage('membershipCTAHref', e.target.value)}
                className="w-full"
                placeholder="/join?type=business"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Membership image</label>
              <p className="text-xs text-neutral-500 mb-3">
                Landscape market/bazaar image (4:3). Stored as a Firebase Storage URL only.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <div className="w-full max-w-[24rem] shrink-0">
                  <div className="relative w-full overflow-hidden rounded-lg border border-neutral-200 aspect-[4/3] bg-neutral-50">
                    {pc.membershipImageURL ? (
                      <img
                        src={pc.membershipImageURL}
                        alt="Membership preview"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center px-3 text-center text-xs text-neutral-500">
                        No image yet
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-neutral-50 text-sm min-h-[44px] w-fit bg-white text-black">
                    <Upload className="w-4 h-4" />
                    {uploading ? 'Uploading…' : 'Upload image'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) void handleImageUpload(file)
                        e.target.value = ''
                      }}
                    />
                  </label>
                  {pc.membershipImageURL && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleRemoveImage}
                      className="min-h-[44px] w-fit bg-red-600 text-white border-red-600 hover:bg-red-700 hover:text-white"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove image
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6 space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-headline text-xl font-bold">Benefits</h2>
              <p className="text-sm text-neutral-600 mt-1">
                Title + description pairs. Reorder with the arrows.
              </p>
            </div>
            <Button
              type="button"
              onClick={addBenefit}
              className="bg-white text-black border border-neutral-300 hover:bg-neutral-50 min-h-[44px]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add benefit
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Section eyebrow</label>
              <input
                type="text"
                value={pc.benefitsEyebrow}
                onChange={(e) => updatePage('benefitsEyebrow', e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Section headline</label>
              <input
                type="text"
                value={pc.benefitsHeadline}
                onChange={(e) => updatePage('benefitsHeadline', e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-4">
            {pc.benefits.map((benefit, index) => (
              <div
                key={index}
                className="border border-neutral-200 rounded-lg p-4 space-y-3 bg-neutral-50/50"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="text-sm font-medium text-neutral-700">Benefit {index + 1}</p>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={index === 0}
                      onClick={() => moveBenefit(index, 'up')}
                      className="min-h-[40px] bg-white text-black border"
                      aria-label="Move up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={index === pc.benefits.length - 1}
                      onClick={() => moveBenefit(index, 'down')}
                      className="min-h-[40px] bg-white text-black border"
                      aria-label="Move down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => removeBenefit(index)}
                      className="min-h-[40px] bg-red-600 text-white hover:bg-red-700"
                      aria-label="Delete benefit"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input
                    type="text"
                    value={benefit.title}
                    onChange={(e) => updateBenefit(index, 'title', e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={benefit.description}
                    onChange={(e) => updateBenefit(index, 'description', e.target.value)}
                    className="w-full min-h-20"
                  />
                </div>
              </div>
            ))}
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
            {saving ? 'Saving…' : 'Save marketplace page'}
          </Button>
        </div>
      </div>
    </AdminPageLayout>
  )
}
