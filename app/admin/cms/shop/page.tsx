'use client'

import React, { useEffect, useState } from 'react'
import { AdminPageLayout } from '@/components/admin-page-layout'
import {
  subscribeToShopConfig,
  DEFAULT_SHOP_CONFIG,
  ShopPlatformConfig,
} from '@/lib/shop-config'
import { Save, CheckCircle2, AlertCircle } from 'lucide-react'

export default function AdminCmsShopPage() {
  const [config, setConfig] = useState<ShopPlatformConfig>(DEFAULT_SHOP_CONFIG)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  )

  useEffect(() => subscribeToShopConfig(setConfig), [])

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/platform-config/shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Save failed')
      setMessage({ type: 'success', text: 'Shop page saved. Changes are live on /shop instantly.' })
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to save',
      })
    } finally {
      setSaving(false)
    }
  }

  const field = (
    key: keyof ShopPlatformConfig['pageConfig'],
    label: string,
    multiline = false
  ) => (
    <div className="space-y-1">
      <label
        className="block text-xs uppercase tracking-wider text-neutral-500"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        {label}
      </label>
      {multiline ? (
        <textarea
          value={config.pageConfig[key]}
          onChange={(e) =>
            setConfig({
              ...config,
              pageConfig: { ...config.pageConfig, [key]: e.target.value },
            })
          }
          rows={3}
          className="w-full border border-neutral-300 rounded px-3 py-2.5 min-h-[44px] text-sm"
          style={{ fontFamily: 'Inter, sans-serif' }}
        />
      ) : (
        <input
          type="text"
          value={config.pageConfig[key]}
          onChange={(e) =>
            setConfig({
              ...config,
              pageConfig: { ...config.pageConfig, [key]: e.target.value },
            })
          }
          className="w-full border border-neutral-300 rounded px-3 py-2.5 min-h-[44px] text-sm"
          style={{ fontFamily: 'Inter, sans-serif' }}
        />
      )}
    </div>
  )

  return (
    <AdminPageLayout
      title="Shop Page CMS"
      subtitle="Headline, body, and donate-via-purchase banner for /shop"
    >
      <div className="max-w-3xl space-y-6">
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

        <div className="bg-white rounded-lg border border-neutral-100 shadow-sm p-4 sm:p-6 space-y-4">
          <h2 className="text-lg" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Page hero
          </h2>
          {field('headline', 'Headline')}
          {field('body', 'Body', true)}
        </div>

        <div className="bg-white rounded-lg border border-neutral-100 shadow-sm p-4 sm:p-6 space-y-4">
          <h2 className="text-lg" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Donate via purchase banner
          </h2>
          {field('donateBannerEyebrow', 'Eyebrow')}
          {field('donateBannerHeadline', 'Headline')}
          {field('donateBannerCTA', 'CTA label')}
          {field('donateBannerCTAHref', 'CTA href (e.g. /impact)')}
        </div>

        <p className="text-sm text-neutral-600" style={{ fontFamily: 'Inter, sans-serif' }}>
          Merch products are managed via the existing business offer form — set Category to{' '}
          <strong>Merchandise</strong> and Status to <strong>Published</strong>.
        </p>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="min-h-[44px] inline-flex items-center gap-2 bg-black hover:bg-neutral-900 text-white px-5 py-2.5 rounded text-sm font-semibold disabled:opacity-50"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving…' : 'Save shop config'}
        </button>
      </div>
    </AdminPageLayout>
  )
}
