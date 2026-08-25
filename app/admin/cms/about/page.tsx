'use client'

import React, { useEffect, useState } from 'react'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Save, AlertCircle, CheckCircle2, Upload, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { BUTTON_PRIMARY, BUTTON_ROW_COMPACT } from '@/lib/admin-design-system'
import {
  subscribeToAbout,
  DEFAULT_ABOUT,
  AboutConfig,
  AboutDifferentiator,
  AboutValueItem,
} from '@/lib/about-config'
import { uploadImageToFirebase } from '@/lib/upload-utils'
import { BUTTON_LABEL_COMPACT } from '@/lib/admin-design-system'

export default function AdminCmsAboutPage() {
  const [config, setConfig] = useState<AboutConfig>(DEFAULT_ABOUT)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<'founder' | 'missionVision' | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => subscribeToAbout(setConfig), [])

  const persistConfig = async (nextConfig: AboutConfig) => {
    const res = await fetch('/api/platform-config/about', {
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
      const res = await fetch('/api/platform-config/about', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Save failed')
      setMessage({ type: 'success', text: 'About page saved. Changes are live instantly.' })
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to save about page',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleFounderImageUpload = async (file: File) => {
    setUploading('founder')
    setMessage(null)
    try {
      const url = await uploadImageToFirebase(file, 'about/founder', { preset: 'founder' })
      const nextConfig: AboutConfig = {
        ...config,
        story: { ...config.story, founderImageURL: url },
      }
      setConfig(nextConfig)
      await persistConfig(nextConfig)
      setMessage({ type: 'success', text: 'Founder image uploaded and saved.' })
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Founder image upload failed',
      })
    } finally {
      setUploading(null)
    }
  }

  const handleRemoveFounderImage = async () => {
    setMessage(null)
    try {
      const nextConfig: AboutConfig = {
        ...config,
        story: { ...config.story, founderImageURL: null },
      }
      setConfig(nextConfig)
      await persistConfig(nextConfig)
      setMessage({ type: 'success', text: 'Founder image removed.' })
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to remove founder image',
      })
    }
  }

  const handleMissionVisionImageUpload = async (file: File) => {
    setUploading('missionVision')
    setMessage(null)
    try {
      const url = await uploadImageToFirebase(file, 'about/mission-vision', { preset: 'hero' })
      const nextConfig: AboutConfig = {
        ...config,
        missionVision: { ...config.missionVision, imageURL: url },
      }
      setConfig(nextConfig)
      await persistConfig(nextConfig)
      setMessage({ type: 'success', text: 'Mission / Vision image uploaded and saved.' })
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Mission / Vision image upload failed',
      })
    } finally {
      setUploading(null)
    }
  }

  const handleRemoveMissionVisionImage = async () => {
    setMessage(null)
    try {
      const nextConfig: AboutConfig = {
        ...config,
        missionVision: { ...config.missionVision, imageURL: null },
      }
      setConfig(nextConfig)
      await persistConfig(nextConfig)
      setMessage({ type: 'success', text: 'Mission / Vision image removed.' })
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to remove Mission / Vision image',
      })
    }
  }

  const updateParagraph = (index: number, value: string) => {
    setConfig((p) => {
      const paragraphs = [...p.story.paragraphs]
      paragraphs[index] = value
      return { ...p, story: { ...p.story, paragraphs } }
    })
  }

  const addParagraph = () => {
    setConfig((p) => ({
      ...p,
      story: { ...p.story, paragraphs: [...p.story.paragraphs, ''] },
    }))
  }

  const removeParagraph = (index: number) => {
    setConfig((p) => ({
      ...p,
      story: { ...p.story, paragraphs: p.story.paragraphs.filter((_, i) => i !== index) },
    }))
  }

  const updateDifferentiator = (
    index: number,
    field: keyof AboutDifferentiator,
    value: string
  ) => {
    setConfig((p) => {
      const differentiators = [...p.values.differentiators]
      differentiators[index] = { ...differentiators[index], [field]: value }
      return { ...p, values: { ...p.values, differentiators } }
    })
  }

  const moveDifferentiator = (index: number, direction: 'up' | 'down') => {
    setConfig((p) => {
      const differentiators = [...p.values.differentiators]
      const swap = direction === 'up' ? index - 1 : index + 1
      if (swap < 0 || swap >= differentiators.length) return p
      ;[differentiators[index], differentiators[swap]] = [
        differentiators[swap],
        differentiators[index],
      ]
      return { ...p, values: { ...p.values, differentiators } }
    })
  }

  const updateValue = (index: number, field: keyof AboutValueItem, value: string) => {
    setConfig((p) => {
      const values = [...p.values.values]
      values[index] = { ...values[index], [field]: value }
      return { ...p, values: { ...p.values, values } }
    })
  }

  const addValue = () => {
    setConfig((p) => ({
      ...p,
      values: {
        ...p.values,
        values: [...p.values.values, { title: 'New value', description: '' }],
      },
    }))
  }

  const removeValue = (index: number) => {
    setConfig((p) => ({
      ...p,
      values: { ...p.values, values: p.values.values.filter((_, i) => i !== index) },
    }))
  }

  return (
    <AdminPageLayout title="About CMS">
      <div className="space-y-6 w-full min-w-0">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-headline text-3xl font-bold text-neutral-900 dark:text-foreground">About Page</h1>
            <p className="text-sm text-neutral-600 dark:text-muted-foreground mt-1">
              Edit hero, story, mission/vision, and values. Team members are managed at{' '}
              <a href="/admin/team" className="underline font-medium">
                /admin/team
              </a>
              .
            </p>
          </div>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={BUTTON_PRIMARY}
          >
            <Save className="w-3 h-3 mr-1" />
            {saving ? 'Saving…' : 'Save about page'}
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

        {/* 3A Hero */}
        <Card className="p-4 sm:p-6 space-y-4">
          <h2 className="font-headline text-xl font-bold">Hero (3A)</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Eyebrow</label>
              <input
                type="text"
                value={config.hero.eyebrow}
                onChange={(e) =>
                  setConfig((p) => ({ ...p, hero: { ...p.hero, eyebrow: e.target.value } }))
                }
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Headline</label>
              <input
                type="text"
                value={config.hero.headline}
                onChange={(e) =>
                  setConfig((p) => ({ ...p, hero: { ...p.hero, headline: e.target.value } }))
                }
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Body</label>
              <textarea
                value={config.hero.body}
                onChange={(e) =>
                  setConfig((p) => ({ ...p, hero: { ...p.hero, body: e.target.value } }))
                }
                className="w-full min-h-24"
              />
            </div>
          </div>
        </Card>

        {/* 3B Story */}
        <Card className="p-4 sm:p-6 space-y-4">
          <h2 className="font-headline text-xl font-bold">Story (3B)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Eyebrow</label>
              <input
                type="text"
                value={config.story.eyebrow}
                onChange={(e) =>
                  setConfig((p) => ({ ...p, story: { ...p.story, eyebrow: e.target.value } }))
                }
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Founder image alt text</label>
              <input
                type="text"
                value={config.story.founderImageAlt}
                onChange={(e) =>
                  setConfig((p) => ({
                    ...p,
                    story: { ...p.story, founderImageAlt: e.target.value },
                  }))
                }
                className="w-full"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Founder image</label>
              <p className="text-xs text-neutral-500 dark:text-muted-foreground mb-3">
                Portrait orientation (3:4). Shown in the Story section on the public About page.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <div className="w-full max-w-[14rem] sm:max-w-[16rem] shrink-0">
                  <p className="text-[0.65rem] text-neutral-400 dark:text-muted-foreground mb-1 text-center sm:text-left">
                    Portrait preview (3:4)
                  </p>
                  <div className="relative w-full overflow-hidden rounded-lg border border-neutral-200 dark:border-border aspect-[3/4] bg-neutral-50 dark:bg-muted">
                    {config.story.founderImageURL ? (
                      <img
                        src={config.story.founderImageURL}
                        alt={config.story.founderImageAlt || 'Founder preview'}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center px-3 text-center text-xs text-neutral-500 dark:text-muted-foreground">
                        No image yet
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className={BUTTON_LABEL_COMPACT}>
                    <Upload className="w-4 h-4" />
                    {uploading === 'founder' ? 'Uploading…' : 'Upload founder image'}
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      disabled={uploading !== null}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        e.target.value = ''
                        if (file) void handleFounderImageUpload(file)
                      }}
                    />
                  </label>
                  {config.story.founderImageURL && (
                    <button
                      type="button"
                      onClick={() => void handleRemoveFounderImage()}
                      className="pb-compact-btn h-7 min-h-0 px-2.5 text-[11px] rounded-md bg-black !text-white hover:bg-neutral-800 text-left no-underline"
                    >
                      Remove image
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium">Paragraphs</label>
                <Button
                  type="button"
                  onClick={addParagraph}
                  className="h-7 min-h-0 bg-black text-white hover:bg-gray-800 text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" /> Add
                </Button>
              </div>
              {config.story.paragraphs.map((para, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <textarea
                    value={para}
                    onChange={(e) => updateParagraph(i, e.target.value)}
                    className="w-full min-h-20"
                  />
                  <button
                    type="button"
                    onClick={() => removeParagraph(i)}
                    className="flex items-center justify-center pb-compact-btn h-6 w-6 min-h-0 min-w-0 p-0 bg-black text-white rounded inline-flex items-center justify-center [&_svg]:h-3 [&_svg]:w-3"
                    aria-label="Remove paragraph"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Pull quote</label>
              <textarea
                value={config.story.pullQuote}
                onChange={(e) =>
                  setConfig((p) => ({ ...p, story: { ...p.story, pullQuote: e.target.value } }))
                }
                className="w-full min-h-20"
              />
            </div>
          </div>
        </Card>

        {/* Mission / Vision (About-only; separate from homepage Mission) */}
        <Card className="p-4 sm:p-6 space-y-4">
          <h2 className="font-headline text-xl font-bold">Mission / Vision</h2>
          <p className="text-sm text-neutral-600 dark:text-muted-foreground">
            About-page Mission &amp; Vision block — separate from the homepage Mission section.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Mission headline</label>
              <input
                type="text"
                value={config.missionVision.missionHeadline}
                onChange={(e) =>
                  setConfig((p) => ({
                    ...p,
                    missionVision: { ...p.missionVision, missionHeadline: e.target.value },
                  }))
                }
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Vision headline</label>
              <input
                type="text"
                value={config.missionVision.visionHeadline}
                onChange={(e) =>
                  setConfig((p) => ({
                    ...p,
                    missionVision: { ...p.missionVision, visionHeadline: e.target.value },
                  }))
                }
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mission body</label>
              <textarea
                value={config.missionVision.missionBody}
                onChange={(e) =>
                  setConfig((p) => ({
                    ...p,
                    missionVision: { ...p.missionVision, missionBody: e.target.value },
                  }))
                }
                className="w-full min-h-24"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Vision body</label>
              <textarea
                value={config.missionVision.visionBody}
                onChange={(e) =>
                  setConfig((p) => ({
                    ...p,
                    missionVision: { ...p.missionVision, visionBody: e.target.value },
                  }))
                }
                className="w-full min-h-24"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Section image</label>
              <p className="text-xs text-neutral-500 dark:text-muted-foreground mb-3">
                Landscape orientation (4:3). Shown beside Mission &amp; Vision copy on the public About page.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <div className="w-full max-w-[24rem] shrink-0">
                  <div className="relative w-full overflow-hidden rounded-lg border border-neutral-200 dark:border-border aspect-[4/3] bg-neutral-50 dark:bg-muted">
                    {config.missionVision.imageURL ? (
                      <img
                        src={config.missionVision.imageURL}
                        alt="Mission / Vision preview"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center px-3 text-center text-xs text-neutral-500 dark:text-muted-foreground">
                        No image yet
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className={BUTTON_LABEL_COMPACT}>
                    <Upload className="w-4 h-4" />
                    {uploading === 'missionVision' ? 'Uploading…' : 'Upload section image'}
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      disabled={uploading !== null}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        e.target.value = ''
                        if (file) void handleMissionVisionImageUpload(file)
                      }}
                    />
                  </label>
                  {config.missionVision.imageURL && (
                    <button
                      type="button"
                      onClick={() => void handleRemoveMissionVisionImage()}
                      className="pb-compact-btn h-7 min-h-0 px-2.5 text-[11px] rounded-md bg-black !text-white hover:bg-neutral-800 text-left no-underline"
                    >
                      Remove image
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* 3C Values */}
        <Card className="p-4 sm:p-6 space-y-4">
          <h2 className="font-headline text-xl font-bold">Values (3C)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Eyebrow</label>
              <input
                type="text"
                value={config.values.eyebrow}
                onChange={(e) =>
                  setConfig((p) => ({ ...p, values: { ...p.values, eyebrow: e.target.value } }))
                }
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Headline</label>
              <input
                type="text"
                value={config.values.headline}
                onChange={(e) =>
                  setConfig((p) => ({ ...p, values: { ...p.values, headline: e.target.value } }))
                }
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Differentiators</h3>
            {config.values.differentiators.map((item, i) => (
              <div key={i} className="p-3 border rounded-lg space-y-3">
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => moveDifferentiator(i, 'up')}
                    disabled={i === 0}
                    className="flex items-center justify-center pb-compact-btn h-6 w-6 min-h-0 min-w-0 p-0 rounded bg-black text-white hover:bg-neutral-800 disabled:opacity-40 shadow-none inline-flex items-center justify-center [&_svg]:h-3 [&_svg]:w-3"
                    aria-label="Move up"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDifferentiator(i, 'down')}
                    disabled={i === config.values.differentiators.length - 1}
                    className="flex items-center justify-center pb-compact-btn h-6 w-6 min-h-0 min-w-0 p-0 rounded bg-black text-white hover:bg-neutral-800 disabled:opacity-40 shadow-none inline-flex items-center justify-center [&_svg]:h-3 [&_svg]:w-3"
                    aria-label="Move down"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium">Number</label>
                    <input
                      type="text"
                      value={item.number}
                      onChange={(e) => updateDifferentiator(i, 'number', e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium">Title</label>
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => updateDifferentiator(i, 'title', e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="text-xs font-medium">Description</label>
                    <textarea
                      value={item.description}
                      onChange={(e) => updateDifferentiator(i, 'description', e.target.value)}
                      className="w-full min-h-16"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <label className="block text-sm font-medium mb-1">Values heading</label>
                <input
                  type="text"
                  value={config.values.valuesHeading}
                  onChange={(e) =>
                    setConfig((p) => ({
                      ...p,
                      values: { ...p.values, valuesHeading: e.target.value },
                    }))
                  }
                  className="w-full sm:max-w-[20rem]"
                />
              </div>
              <Button
                type="button"
                onClick={addValue}
                className="h-7 min-h-0 bg-black text-white hover:bg-gray-800 text-xs"
              >
                <Plus className="w-3 h-3 mr-1" /> Add value
              </Button>
            </div>
            {config.values.values.map((item, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end p-3 border rounded-lg">
                <div className="md:col-span-4">
                  <label className="text-xs font-medium">Title</label>
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => updateValue(i, 'title', e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="md:col-span-7">
                  <label className="text-xs font-medium">Description</label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateValue(i, 'description', e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="md:col-span-1">
                  <button
                    type="button"
                    onClick={() => removeValue(i)}
                    className="flex items-center justify-center pb-compact-btn h-7 min-h-0 w-auto px-2 p-0 bg-black !text-white rounded"
                    aria-label="Remove value"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Team heading (3D copy only) */}
        <Card className="p-4 sm:p-6 space-y-4">
          <h2 className="font-headline text-xl font-bold">Team section labels (3D)</h2>
          <p className="text-sm text-neutral-600 dark:text-muted-foreground">
            Member profiles are managed at{' '}
            <a href="/admin/team" className="underline font-medium">
              /admin/team
            </a>
            .
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Eyebrow</label>
              <input
                type="text"
                value={config.team.eyebrow}
                onChange={(e) =>
                  setConfig((p) => ({ ...p, team: { ...p.team, eyebrow: e.target.value } }))
                }
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Headline</label>
              <input
                type="text"
                value={config.team.headline}
                onChange={(e) =>
                  setConfig((p) => ({ ...p, team: { ...p.team, headline: e.target.value } }))
                }
                className="w-full"
              />
            </div>
          </div>
        </Card>
      </div>
    </AdminPageLayout>
  )
}
