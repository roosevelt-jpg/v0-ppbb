'use client'

import React, { useEffect, useState } from 'react'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Save, AlertCircle, CheckCircle2, Upload, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import {
  subscribeToAbout,
  DEFAULT_ABOUT,
  AboutConfig,
  AboutDifferentiator,
  AboutValueItem,
} from '@/lib/about-config'
import { uploadImageToFirebase } from '@/lib/upload-utils'

export default function AdminCmsAboutPage() {
  const [config, setConfig] = useState<AboutConfig>(DEFAULT_ABOUT)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => subscribeToAbout(setConfig), [])

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
    setUploading(true)
    try {
      const url = await uploadImageToFirebase(file, 'about/founder', { preset: 'content' })
      setConfig((p) => ({ ...p, story: { ...p.story, founderImageURL: url } }))
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Image upload failed',
      })
    } finally {
      setUploading(false)
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
            <h1 className="font-headline text-3xl font-bold text-neutral-900">About Page</h1>
            <p className="text-sm text-neutral-600 mt-1">
              Edit hero, story, and values (3A–3C). Team members are managed at{' '}
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
            className="w-full sm:w-auto bg-black text-white hover:bg-gray-800 min-h-[44px]"
          >
            <Save className="w-4 h-4 mr-2" />
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
              <label className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-neutral-50 text-sm min-h-[44px]">
                <Upload className="w-4 h-4" />
                {uploading ? 'Uploading…' : 'Upload image'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) =>
                    e.target.files?.[0] && void handleFounderImageUpload(e.target.files[0])
                  }
                />
              </label>
              {config.story.founderImageURL && (
                <img
                  src={config.story.founderImageURL}
                  alt=""
                  className="mt-2 h-28 rounded object-cover"
                />
              )}
            </div>
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium">Paragraphs</label>
                <Button
                  type="button"
                  onClick={addParagraph}
                  className="bg-black text-white hover:bg-gray-800 text-xs min-h-[44px]"
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
                    className="flex items-center justify-center min-h-[44px] min-w-[44px] p-2 bg-red-600 text-white rounded"
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
                    className="flex items-center justify-center min-h-[44px] min-w-[44px] p-2 rounded bg-black text-white hover:bg-neutral-800 disabled:opacity-40 shadow-none"
                    aria-label="Move up"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDifferentiator(i, 'down')}
                    disabled={i === config.values.differentiators.length - 1}
                    className="flex items-center justify-center min-h-[44px] min-w-[44px] p-2 rounded bg-black text-white hover:bg-neutral-800 disabled:opacity-40 shadow-none"
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
                className="bg-black text-white hover:bg-gray-800 text-xs min-h-[44px]"
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
                    className="flex items-center justify-center min-h-[44px] w-full p-2 bg-red-600 text-white rounded"
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
          <p className="text-sm text-neutral-600">
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
