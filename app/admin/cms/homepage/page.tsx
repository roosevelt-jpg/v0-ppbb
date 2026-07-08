'use client'

import React, { useEffect, useState } from 'react'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Save, AlertCircle, CheckCircle2, Upload, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import {
  subscribeToHomepage,
  DEFAULT_HOMEPAGE,
  HomepageConfig,
  HeroButton,
  HeroButtonStyle,
  HeroImage,
  HeroTransitionType,
  HomepagePillarItem,
  HomepageBannerButton,
} from '@/lib/homepage-config'
import { uploadImageToFirebase } from '@/lib/upload-utils'

async function uploadHomepageImage(file: File, folder: string, preset: 'content' | 'hero' = 'content'): Promise<string> {
  return uploadImageToFirebase(file, folder, { preset })
}

export default function AdminCmsHomepagePage() {
  const [config, setConfig] = useState<HomepageConfig>(DEFAULT_HOMEPAGE)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => subscribeToHomepage(setConfig), [])

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/platform-config/homepage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Save failed')
      setMessage({ type: 'success', text: 'Homepage saved. Changes are live instantly.' })
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to save homepage',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleHeroImagesAdd = async (files: FileList) => {
    setUploading('hero')
    try {
      const added: HeroImage[] = []
      for (const file of Array.from(files)) {
        const url = await uploadHomepageImage(file, 'homepage/hero', 'hero')
        added.push({
          id: `hero-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          imageURL: url,
          caption: '',
        })
      }
      setConfig((p) => ({
        ...p,
        hero: { ...p.hero, images: [...p.hero.images, ...added] },
      }))
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Image upload failed',
      })
    } finally {
      setUploading(null)
    }
  }

  const handleMissionImageUpload = async (file: File) => {
    setUploading('mission')
    try {
      const url = await uploadHomepageImage(file, 'homepage/mission')
      setConfig((p) => ({ ...p, mission: { ...p.mission, imageURL: url } }))
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Image upload failed',
      })
    } finally {
      setUploading(null)
    }
  }

  const updateHeroImage = (id: string, field: 'caption', value: string) => {
    setConfig((p) => ({
      ...p,
      hero: {
        ...p.hero,
        images: p.hero.images.map((img) => (img.id === id ? { ...img, [field]: value } : img)),
      },
    }))
  }

  const removeHeroImage = (id: string) => {
    setConfig((p) => ({
      ...p,
      hero: { ...p.hero, images: p.hero.images.filter((img) => img.id !== id) },
    }))
  }

  const moveHeroImage = (index: number, direction: 'up' | 'down') => {
    setConfig((p) => {
      const images = [...p.hero.images]
      const swap = direction === 'up' ? index - 1 : index + 1
      if (swap < 0 || swap >= images.length) return p
      ;[images[index], images[swap]] = [images[swap], images[index]]
      return { ...p, hero: { ...p.hero, images } }
    })
  }

  const updateHeroButton = (index: number, field: keyof HeroButton, value: string) => {
    setConfig((p) => {
      const buttons = [...p.hero.buttons]
      buttons[index] = { ...buttons[index], [field]: value }
      return { ...p, hero: { ...p.hero, buttons } }
    })
  }

  const addHeroButton = () => {
    setConfig((p) => ({
      ...p,
      hero: {
        ...p.hero,
        buttons: [...p.hero.buttons, { label: 'New button', href: '/', style: 'primary' }],
      },
    }))
  }

  const removeHeroButton = (index: number) => {
    setConfig((p) => ({
      ...p,
      hero: { ...p.hero, buttons: p.hero.buttons.filter((_, i) => i !== index) },
    }))
  }

  const updateStat = (index: number, field: 'number' | 'label', value: string) => {
    setConfig((p) => {
      const items = [...p.stats.items]
      items[index] = { ...items[index], [field]: value }
      return { ...p, stats: { ...p.stats, items } }
    })
  }

  const handlePillarImageUpload = async (index: number, file: File) => {
    setUploading(`pillar-${index}`)
    try {
      const url = await uploadHomepageImage(file, 'homepage/pillars')
      setConfig((p) => {
        const items = [...p.pillars.items]
        items[index] = { ...items[index], imageURL: url }
        return { ...p, pillars: { ...p.pillars, items } }
      })
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Image upload failed',
      })
    } finally {
      setUploading(null)
    }
  }

  const updatePillar = (index: number, field: keyof HomepagePillarItem, value: string) => {
    setConfig((p) => {
      const items = [...p.pillars.items]
      items[index] = { ...items[index], [field]: value }
      return { ...p, pillars: { ...p.pillars, items } }
    })
  }

  const movePillar = (index: number, direction: 'up' | 'down') => {
    setConfig((p) => {
      const items = [...p.pillars.items]
      const swap = direction === 'up' ? index - 1 : index + 1
      if (swap < 0 || swap >= items.length) return p
      ;[items[index], items[swap]] = [items[swap], items[index]]
      return { ...p, pillars: { ...p.pillars, items } }
    })
  }

  const updateBannerButton = (index: number, field: keyof HomepageBannerButton, value: string) => {
    setConfig((p) => {
      const buttons = [...p.donationBanner.buttons]
      buttons[index] = { ...buttons[index], [field]: value }
      return { ...p, donationBanner: { ...p.donationBanner, buttons } }
    })
  }

  const addBannerButton = () => {
    setConfig((p) => ({
      ...p,
      donationBanner: {
        ...p.donationBanner,
        buttons: [...p.donationBanner.buttons, { label: 'New button', href: '/', style: 'primary' }],
      },
    }))
  }

  const removeBannerButton = (index: number) => {
    setConfig((p) => ({
      ...p,
      donationBanner: {
        ...p.donationBanner,
        buttons: p.donationBanner.buttons.filter((_, i) => i !== index),
      },
    }))
  }

  return (
    <AdminPageLayout title="Homepage CMS">
      <div className="space-y-6 w-full min-w-0">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-headline text-3xl font-bold text-neutral-900">Homepage</h1>
            <p className="text-sm text-neutral-600 mt-1">
              Edit all homepage sections (2A–2I). Live sync via Firestore.
            </p>
          </div>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-auto bg-black text-white hover:bg-gray-800 min-h-[44px]"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving…' : 'Save homepage'}
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

        {/* 2A Hero */}
        <Card className="p-4 sm:p-6 space-y-4">
          <h2 className="font-headline text-xl font-bold">Hero (2A)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Eyebrow</label>
              <input
                type="text"
                value={config.hero.eyebrow}
                onChange={(e) => setConfig((p) => ({ ...p, hero: { ...p.hero, eyebrow: e.target.value } }))}
                className="w-full"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Headline</label>
              <input
                type="text"
                value={config.hero.headline}
                onChange={(e) => setConfig((p) => ({ ...p, hero: { ...p.hero, headline: e.target.value } }))}
                className="w-full"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Body</label>
              <textarea
                value={config.hero.body}
                onChange={(e) => setConfig((p) => ({ ...p, hero: { ...p.hero, body: e.target.value } }))}
                className="w-full min-h-24"
              />
            </div>
          </div>

          <div className="space-y-4 pt-2 border-t border-neutral-200">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-semibold text-sm">Hero images (slider)</h3>
              <label className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-neutral-50 text-sm">
                <Upload className="w-4 h-4" />
                {uploading === 'hero' ? 'Uploading…' : 'Add image'}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  disabled={uploading === 'hero'}
                  onChange={(e) => {
                    const files = e.target.files
                    if (files?.length) void handleHeroImagesAdd(files)
                    e.target.value = ''
                  }}
                />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              <div className="flex flex-col gap-2 w-full min-w-0">
                <label htmlFor="hero-transition" className="block text-sm font-medium leading-normal">
                  Transition
                </label>
                <select
                  id="hero-transition"
                  value={config.hero.slider.transition}
                  onChange={(e) =>
                    setConfig((p) => ({
                      ...p,
                      hero: {
                        ...p.hero,
                        slider: {
                          ...p.hero.slider,
                          transition: e.target.value as HeroTransitionType,
                        },
                      },
                    }))
                  }
                  className="w-full block"
                >
                  <option value="fade">Fade</option>
                  <option value="slide">Slide</option>
                </select>
              </div>
              <div className="flex flex-col gap-2 w-full min-w-0">
                <label htmlFor="hero-speed" className="block text-sm font-medium leading-normal">
                  Speed (seconds per slide)
                </label>
                <input
                  id="hero-speed"
                  type="number"
                  min={2}
                  max={30}
                  value={config.hero.slider.speedSeconds}
                  onChange={(e) =>
                    setConfig((p) => ({
                      ...p,
                      hero: {
                        ...p.hero,
                        slider: {
                          ...p.hero.slider,
                          speedSeconds: parseInt(e.target.value, 10) || 5,
                        },
                      },
                    }))
                  }
                  className="w-full block"
                />
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.hero.slider.autoplay}
                    onChange={(e) =>
                      setConfig((p) => ({
                        ...p,
                        hero: {
                          ...p.hero,
                          slider: { ...p.hero.slider, autoplay: e.target.checked },
                        },
                      }))
                    }
                  />
                  Autoplay carousel
                </label>
              </div>
            </div>

            {config.hero.images.length === 0 ? (
              <p className="text-sm text-neutral-500">No hero images yet. Add one or more above.</p>
            ) : (
              <div className="space-y-3">
                {config.hero.images.map((img, i) => (
                  <div
                    key={img.id}
                    className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start p-3 border rounded-lg"
                  >
                    <div className="md:col-span-2">
                      <img
                        src={img.imageURL}
                        alt=""
                        className="w-full h-20 object-cover rounded border border-neutral-200"
                      />
                    </div>
                    <div className="md:col-span-7">
                      <label className="block text-xs font-medium mb-1">Caption (optional)</label>
                      <input
                        type="text"
                        value={img.caption || ''}
                        onChange={(e) => updateHeroImage(img.id, 'caption', e.target.value)}
                        placeholder="COMMUNITY LED since day one."
                        className="w-full"
                      />
                    </div>
                    <div className="md:col-span-3 flex flex-wrap gap-2 justify-start md:justify-end">
                      <button
                        type="button"
                        onClick={() => moveHeroImage(i, 'up')}
                        disabled={i === 0}
                        className="flex items-center justify-center min-h-[44px] min-w-[44px] p-2 border rounded hover:bg-neutral-50 disabled:opacity-40"
                        aria-label="Move up"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveHeroImage(i, 'down')}
                        disabled={i === config.hero.images.length - 1}
                        className="flex items-center justify-center min-h-[44px] min-w-[44px] p-2 border rounded hover:bg-neutral-50 disabled:opacity-40"
                        aria-label="Move down"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeHeroImage(img.id)}
                        className="flex items-center justify-center min-h-[44px] min-w-[44px] p-2 bg-red-600 text-white rounded"
                        aria-label="Remove image"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Buttons</h3>
              <Button type="button" onClick={addHeroButton} className="bg-black text-white hover:bg-gray-800 text-xs">
                <Plus className="w-3 h-3 mr-1" /> Add
              </Button>
            </div>
            {config.hero.buttons.map((btn, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end p-3 border rounded-lg">
                <div className="md:col-span-4">
                  <label className="text-xs font-medium">Label</label>
                  <input
                    type="text"
                    value={btn.label}
                    onChange={(e) => updateHeroButton(i, 'label', e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="text-xs font-medium">Href</label>
                  <input
                    type="text"
                    value={btn.href}
                    onChange={(e) => updateHeroButton(i, 'href', e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="text-xs font-medium">Style</label>
                  <select
                    value={btn.style}
                    onChange={(e) => updateHeroButton(i, 'style', e.target.value as HeroButtonStyle)}
                    className="w-full"
                  >
                    <option value="primary">Primary</option>
                    <option value="secondary">Secondary</option>
                    <option value="text">Text</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <button
                    type="button"
                    onClick={() => removeHeroButton(i)}
                    className="p-2 bg-red-600 text-white rounded shadow-none min-h-0 w-full"
                  >
                    <Trash2 className="w-4 h-4 mx-auto" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* 2B Stats */}
        <Card className="p-4 sm:p-6 space-y-4">
          <h2 className="font-headline text-xl font-bold">Stats bar (2B)</h2>
          <div>
            <label className="block text-sm font-medium mb-1">Display mode</label>
            <select
              value={config.stats.displayMode}
              onChange={(e) =>
                setConfig((p) => ({
                  ...p,
                  stats: { ...p.stats, displayMode: e.target.value as 'static' | 'live' },
                }))
              }
              className="w-full sm:max-w-[20rem]"
            >
              <option value="static">Static (override numbers)</option>
              <option value="live">Live (Firestore counts)</option>
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {config.stats.items.map((item, i) => (
              <div key={i} className="grid grid-cols-2 gap-2 p-3 border rounded-lg">
                <div>
                  <label className="text-xs font-medium">Number</label>
                  <input
                    type="text"
                    value={item.number}
                    onChange={(e) => updateStat(i, 'number', e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">Label</label>
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) => updateStat(i, 'label', e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* 2C Marquee settings */}
        <Card className="p-4 sm:p-6 space-y-4">
          <h2 className="font-headline text-xl font-bold">Partners marquee (2C)</h2>
          <p className="text-sm text-neutral-600">
            Partner logos are managed at{' '}
            <a href="/admin/partners" className="underline font-medium">
              /admin/partners
            </a>
            . Configure animation here.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <div className="flex flex-col gap-2 w-full min-w-0">
              <label htmlFor="marquee-speed" className="block text-sm font-medium leading-normal">
                Speed (seconds per loop)
              </label>
              <input
                id="marquee-speed"
                type="number"
                min={10}
                max={120}
                value={config.marquee.speed}
                onChange={(e) =>
                  setConfig((p) => ({
                    ...p,
                    marquee: { ...p.marquee, speed: parseInt(e.target.value, 10) || 40 },
                  }))
                }
                className="w-full block"
              />
            </div>
            <div className="flex flex-col gap-2 w-full min-w-0">
              <label htmlFor="marquee-gap" className="block text-sm font-medium leading-normal">
                Gap (px between logos)
              </label>
              <input
                id="marquee-gap"
                type="number"
                min={16}
                max={120}
                value={config.marquee.gap}
                onChange={(e) =>
                  setConfig((p) => ({
                    ...p,
                    marquee: { ...p.marquee, gap: parseInt(e.target.value, 10) || 48 },
                  }))
                }
                className="w-full block"
              />
            </div>
          </div>
        </Card>

        {/* 2D Mission */}
        <Card className="p-4 sm:p-6 space-y-4">
          <h2 className="font-headline text-xl font-bold">Mission (2D)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Eyebrow</label>
              <input
                type="text"
                value={config.mission.eyebrow}
                onChange={(e) =>
                  setConfig((p) => ({ ...p, mission: { ...p.mission, eyebrow: e.target.value } }))
                }
                className="w-full"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Headline</label>
              <input
                type="text"
                value={config.mission.headline}
                onChange={(e) =>
                  setConfig((p) => ({ ...p, mission: { ...p.mission, headline: e.target.value } }))
                }
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Italic word in headline</label>
              <input
                type="text"
                value={config.mission.headlineItalicWord}
                onChange={(e) =>
                  setConfig((p) => ({
                    ...p,
                    mission: { ...p.mission, headlineItalicWord: e.target.value },
                  }))
                }
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mission image</label>
              <label className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-neutral-50">
                <Upload className="w-4 h-4" />
                {uploading === 'mission' ? 'Uploading…' : 'Upload image'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleMissionImageUpload(e.target.files[0])}
                />
              </label>
              {config.mission.imageURL && (
                <img src={config.mission.imageURL} alt="" className="mt-2 h-24 rounded object-cover" />
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Body</label>
              <textarea
                value={config.mission.body}
                onChange={(e) =>
                  setConfig((p) => ({ ...p, mission: { ...p.mission, body: e.target.value } }))
                }
                className="w-full min-h-28"
              />
            </div>
          </div>
        </Card>

        {/* 2E Pillars */}
        <Card className="p-4 sm:p-6 space-y-4">
          <h2 className="font-headline text-xl font-bold">Six Pillars (2E)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Eyebrow</label>
              <input
                type="text"
                value={config.pillars.eyebrow}
                onChange={(e) =>
                  setConfig((p) => ({ ...p, pillars: { ...p.pillars, eyebrow: e.target.value } }))
                }
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Headline</label>
              <input
                type="text"
                value={config.pillars.headline}
                onChange={(e) =>
                  setConfig((p) => ({ ...p, pillars: { ...p.pillars, headline: e.target.value } }))
                }
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-3">
            {config.pillars.items.map((pillar, i) => (
              <div key={i} className="p-3 border rounded-lg space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">Pillar {pillar.number || i + 1}</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => movePillar(i, 'up')}
                      disabled={i === 0}
                      className="flex items-center justify-center min-h-[44px] min-w-[44px] p-2 border rounded disabled:opacity-40"
                      aria-label="Move up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => movePillar(i, 'down')}
                      disabled={i === config.pillars.items.length - 1}
                      className="flex items-center justify-center min-h-[44px] min-w-[44px] p-2 border rounded disabled:opacity-40"
                      aria-label="Move down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium">Number</label>
                    <input
                      type="text"
                      value={pillar.number}
                      onChange={(e) => updatePillar(i, 'number', e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Title</label>
                    <input
                      type="text"
                      value={pillar.title}
                      onChange={(e) => updatePillar(i, 'title', e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium">Description</label>
                    <textarea
                      value={pillar.description}
                      onChange={(e) => updatePillar(i, 'description', e.target.value)}
                      className="w-full min-h-16"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium">CTA label</label>
                    <input
                      type="text"
                      value={pillar.ctaLabel}
                      onChange={(e) => updatePillar(i, 'ctaLabel', e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium">CTA href</label>
                    <input
                      type="text"
                      value={pillar.ctaHref}
                      onChange={(e) => updatePillar(i, 'ctaHref', e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium">Image</label>
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      <label className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-neutral-50 text-sm">
                        <Upload className="w-4 h-4" />
                        {uploading === `pillar-${i}` ? 'Uploading…' : 'Upload image'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            e.target.files?.[0] && void handlePillarImageUpload(i, e.target.files[0])
                          }
                        />
                      </label>
                      {pillar.imageURL && (
                        <img src={pillar.imageURL} alt="" className="h-16 w-24 object-cover rounded border" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* 2F Events section */}
        <Card className="p-4 sm:p-6 space-y-4">
          <h2 className="font-headline text-xl font-bold">Upcoming Events (2F)</h2>
          <p className="text-sm text-neutral-600">
            Event cards are loaded from the <code className="text-xs">events</code> collection (published,
            future dates). Configure section labels here.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Heading</label>
              <input
                type="text"
                value={config.eventsSection.heading}
                onChange={(e) =>
                  setConfig((p) => ({
                    ...p,
                    eventsSection: { ...p.eventsSection, heading: e.target.value },
                  }))
                }
                className="w-full"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Subheading</label>
              <input
                type="text"
                value={config.eventsSection.subheading}
                onChange={(e) =>
                  setConfig((p) => ({
                    ...p,
                    eventsSection: { ...p.eventsSection, subheading: e.target.value },
                  }))
                }
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Max events to show</label>
              <input
                type="number"
                min={3}
                max={8}
                value={config.eventsSection.maxEventsToShow}
                onChange={(e) =>
                  setConfig((p) => ({
                    ...p,
                    eventsSection: {
                      ...p.eventsSection,
                      maxEventsToShow: parseInt(e.target.value, 10) || 6,
                    },
                  }))
                }
                className="w-full sm:max-w-[20rem]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">CTA label</label>
              <input
                type="text"
                value={config.eventsSection.ctaLabel}
                onChange={(e) =>
                  setConfig((p) => ({
                    ...p,
                    eventsSection: { ...p.eventsSection, ctaLabel: e.target.value },
                  }))
                }
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">CTA href</label>
              <input
                type="text"
                value={config.eventsSection.ctaHref}
                onChange={(e) =>
                  setConfig((p) => ({
                    ...p,
                    eventsSection: { ...p.eventsSection, ctaHref: e.target.value },
                  }))
                }
                className="w-full"
              />
            </div>
          </div>
        </Card>

        {/* 2G Donation banner */}
        <Card className="p-4 sm:p-6 space-y-4">
          <h2 className="font-headline text-xl font-bold">Donation + Volunteer Banner (2G)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Eyebrow</label>
              <input
                type="text"
                value={config.donationBanner.eyebrow}
                onChange={(e) =>
                  setConfig((p) => ({
                    ...p,
                    donationBanner: { ...p.donationBanner, eyebrow: e.target.value },
                  }))
                }
                className="w-full"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Headline</label>
              <input
                type="text"
                value={config.donationBanner.headline}
                onChange={(e) =>
                  setConfig((p) => ({
                    ...p,
                    donationBanner: { ...p.donationBanner, headline: e.target.value },
                  }))
                }
                className="w-full"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Body</label>
              <textarea
                value={config.donationBanner.body}
                onChange={(e) =>
                  setConfig((p) => ({
                    ...p,
                    donationBanner: { ...p.donationBanner, body: e.target.value },
                  }))
                }
                className="w-full min-h-20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Background color</label>
              <input
                type="text"
                value={config.donationBanner.backgroundColor}
                onChange={(e) =>
                  setConfig((p) => ({
                    ...p,
                    donationBanner: { ...p.donationBanner, backgroundColor: e.target.value },
                  }))
                }
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Text color</label>
              <input
                type="text"
                value={config.donationBanner.textColor}
                onChange={(e) =>
                  setConfig((p) => ({
                    ...p,
                    donationBanner: { ...p.donationBanner, textColor: e.target.value },
                  }))
                }
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Buttons</h3>
              <Button type="button" onClick={addBannerButton} className="bg-black text-white hover:bg-gray-800 text-xs">
                <Plus className="w-3 h-3 mr-1" /> Add
              </Button>
            </div>
            {config.donationBanner.buttons.map((btn, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end p-3 border rounded-lg">
                <div className="md:col-span-4">
                  <label className="text-xs font-medium">Label</label>
                  <input
                    type="text"
                    value={btn.label}
                    onChange={(e) => updateBannerButton(i, 'label', e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="text-xs font-medium">Href</label>
                  <input
                    type="text"
                    value={btn.href}
                    onChange={(e) => updateBannerButton(i, 'href', e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="text-xs font-medium">Style</label>
                  <select
                    value={btn.style}
                    onChange={(e) => updateBannerButton(i, 'style', e.target.value as HeroButtonStyle)}
                    className="w-full"
                  >
                    <option value="primary">Primary</option>
                    <option value="secondary">Secondary</option>
                    <option value="text">Text</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <button
                    type="button"
                    onClick={() => removeBannerButton(i)}
                    className="flex items-center justify-center min-h-[44px] w-full p-2 bg-red-600 text-white rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* 2H Social feeds */}
        <Card className="p-4 sm:p-6 space-y-4">
          <h2 className="font-headline text-xl font-bold">Social Feeds (2H)</h2>
          <p className="text-sm text-neutral-600">
            Control homepage display for social feeds. YouTube Channel ID, API key, and video fetch
            live at{' '}
            <a href="/admin/youtube-config" className="underline font-medium">
              /admin/youtube-config
            </a>
            . Disabled feeds show a placeholder on the homepage.
          </p>

          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-semibold text-sm">YouTube</h3>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={config.socialFeeds.youtube.isEnabled}
                onChange={(e) =>
                  setConfig((p) => ({
                    ...p,
                    socialFeeds: {
                      ...p.socialFeeds,
                      youtube: { ...p.socialFeeds.youtube, isEnabled: e.target.checked },
                    },
                  }))
                }
              />
              Enable YouTube feed on homepage
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium">Heading</label>
                <input
                  type="text"
                  value={config.socialFeeds.youtube.heading}
                  onChange={(e) =>
                    setConfig((p) => ({
                      ...p,
                      socialFeeds: {
                        ...p.socialFeeds,
                        youtube: { ...p.socialFeeds.youtube, heading: e.target.value },
                      },
                    }))
                  }
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs font-medium">Max videos shown</label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={config.socialFeeds.youtube.maxVideos}
                  onChange={(e) =>
                    setConfig((p) => ({
                      ...p,
                      socialFeeds: {
                        ...p.socialFeeds,
                        youtube: {
                          ...p.socialFeeds.youtube,
                          maxVideos: parseInt(e.target.value, 10) || 6,
                        },
                      },
                    }))
                  }
                  className="w-full"
                />
              </div>
            </div>
            <p className="text-xs text-neutral-500">
              Video source data comes from the existing YouTube config page — not duplicated here.
            </p>
          </div>

          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-semibold text-sm">Instagram</h3>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={config.socialFeeds.instagram.isEnabled}
                onChange={(e) =>
                  setConfig((p) => ({
                    ...p,
                    socialFeeds: {
                      ...p.socialFeeds,
                      instagram: { ...p.socialFeeds.instagram, isEnabled: e.target.checked },
                    },
                  }))
                }
              />
              Enable Instagram feed
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium">Heading</label>
                <input
                  type="text"
                  value={config.socialFeeds.instagram.heading}
                  onChange={(e) =>
                    setConfig((p) => ({
                      ...p,
                      socialFeeds: {
                        ...p.socialFeeds,
                        instagram: { ...p.socialFeeds.instagram, heading: e.target.value },
                      },
                    }))
                  }
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs font-medium">Max posts</label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={config.socialFeeds.instagram.maxPosts}
                  onChange={(e) =>
                    setConfig((p) => ({
                      ...p,
                      socialFeeds: {
                        ...p.socialFeeds,
                        instagram: {
                          ...p.socialFeeds.instagram,
                          maxPosts: parseInt(e.target.value, 10) || 9,
                        },
                      },
                    }))
                  }
                  className="w-full"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-medium">Access token</label>
                <input
                  type="password"
                  value={config.socialFeeds.instagram.accessToken || ''}
                  onChange={(e) =>
                    setConfig((p) => ({
                      ...p,
                      socialFeeds: {
                        ...p.socialFeeds,
                        instagram: {
                          ...p.socialFeeds.instagram,
                          accessToken: e.target.value || null,
                        },
                      },
                    }))
                  }
                  className="w-full"
                  placeholder="Optional — for future API wiring"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* 2I Testimonials heading */}
        <Card className="p-4 sm:p-6 space-y-4">
          <h2 className="font-headline text-xl font-bold">Testimonials (2I)</h2>
          <p className="text-sm text-neutral-600">
            Testimonial content is managed at{' '}
            <a href="/admin/cms/testimonials" className="underline font-medium">
              /admin/cms/testimonials
            </a>
            . Set the section heading here.
          </p>
          <div>
            <label className="block text-sm font-medium mb-1">Section heading</label>
            <input
              type="text"
              value={config.testimonials.heading}
              onChange={(e) =>
                setConfig((p) => ({
                  ...p,
                  testimonials: { ...p.testimonials, heading: e.target.value },
                }))
              }
              className="w-full sm:max-w-[20rem]"
            />
          </div>
        </Card>
      </div>
    </AdminPageLayout>
  )
}
