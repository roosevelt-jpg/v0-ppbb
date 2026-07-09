'use client'

import React, { useEffect, useState } from 'react'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { Card } from '@/components/ui/card'
import {
  subscribeToTransparencyConfig,
  DEFAULT_TRANSPARENCY_CONFIG,
  type TransparencyConfig,
} from '@/lib/transparency-config'
import { Save, CheckCircle2, AlertCircle } from 'lucide-react'

export default function AdminCmsTransparencyPage() {
  const [config, setConfig] = useState<TransparencyConfig>(DEFAULT_TRANSPARENCY_CONFIG)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => subscribeToTransparencyConfig(setConfig), [])

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/platform-config/transparency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Save failed')
      setMessage({ type: 'success', text: 'Transparency page saved. Live on /transparency instantly.' })
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to save',
      })
    } finally {
      setSaving(false)
    }
  }

  const field = (key: keyof TransparencyConfig, label: string, multiline = false) => (
    <div className="space-y-1">
      <label className="block text-xs uppercase tracking-wider text-neutral-500">{label}</label>
      {multiline ? (
        <textarea
          value={typeof config[key] === 'string' ? config[key] : ''}
          onChange={(e) => setConfig({ ...config, [key]: e.target.value })}
          rows={4}
          className="w-full border border-neutral-300 rounded px-3 py-2.5 min-h-[44px] text-sm"
        />
      ) : (
        <input
          type="text"
          value={typeof config[key] === 'string' ? config[key] : ''}
          onChange={(e) => setConfig({ ...config, [key]: e.target.value })}
          className="w-full border border-neutral-300 rounded px-3 py-2.5 min-h-[44px] text-sm"
        />
      )}
    </div>
  )

  const updateBullet = (index: number, value: string) => {
    const bullets = [...config.privacyBullets]
    bullets[index] = value
    setConfig({ ...config, privacyBullets: bullets })
  }

  const updateGetInvolved = (index: number, key: 'title' | 'description', value: string) => {
    const items = config.getInvolvedItems.map((item, i) =>
      i === index ? { ...item, [key]: value } : item
    )
    setConfig({ ...config, getInvolvedItems: items })
  }

  return (
    <AdminPageLayout
      title="Transparency Page CMS"
      subtitle="Edit copy for /transparency. Live donation and impact numbers stay automatic."
    >
      <div className="w-full min-w-0 max-w-3xl space-y-6">
        {message && (
          <div
            className={`flex items-start gap-2 rounded p-3 text-sm ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <Card className="p-4 sm:p-6 space-y-4">
          <h2 className="text-lg font-semibold text-neutral-900">Hero section</h2>
          {field('heroHeadline', 'Page headline')}
          {field('heroSubheadline', 'Subheadline', true)}
          {field('heroTagline', 'Tagline')}
          {field('commitmentTitle', 'Commitment box title')}
          {field('commitmentBody', 'Commitment box body', true)}
        </Card>

        <Card className="p-4 sm:p-6 space-y-4">
          <h2 className="text-lg font-semibold text-neutral-900">Section headings</h2>
          {field('metricsHeading', 'Metrics section heading')}
          {field('causesHeading', 'Causes section heading')}
          {field('causesChartTitle', 'Causes chart title')}
          {field('timelineHeading', 'Timeline section heading')}
        </Card>

        <Card className="p-4 sm:p-6 space-y-4">
          <h2 className="text-lg font-semibold text-neutral-900">Privacy section</h2>
          {field('privacyHeading', 'Privacy heading')}
          {field('privacyBody', 'Privacy body', true)}
          <div className="space-y-2">
            <label className="block text-xs uppercase tracking-wider text-neutral-500">
              Privacy bullets
            </label>
            {config.privacyBullets.map((bullet, index) => (
              <input
                key={index}
                type="text"
                value={bullet}
                onChange={(e) => updateBullet(index, e.target.value)}
                className="w-full border border-neutral-300 rounded px-3 py-2.5 min-h-[44px] text-sm"
              />
            ))}
          </div>
          {field('contactEmail', 'Contact email')}
        </Card>

        <Card className="p-4 sm:p-6 space-y-4">
          <h2 className="text-lg font-semibold text-neutral-900">Call to action</h2>
          {field('ctaHeading', 'CTA heading')}
          {field('ctaBody', 'CTA body', true)}
          {field('donateLabel', 'Donate button label')}
          {field('donateHref', 'Donate button link')}
          {field('joinLabel', 'Join button label')}
          {field('joinHref', 'Join button link')}
          {field('getInvolvedTitle', 'Get involved box title')}
          <div className="space-y-3">
            {config.getInvolvedItems.map((item, index) => (
              <div key={index} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => updateGetInvolved(index, 'title', e.target.value)}
                  placeholder={`Item ${index + 1} title`}
                  className="w-full border border-neutral-300 rounded px-3 py-2.5 min-h-[44px] text-sm"
                />
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => updateGetInvolved(index, 'description', e.target.value)}
                  placeholder={`Item ${index + 1} description`}
                  className="w-full border border-neutral-300 rounded px-3 py-2.5 min-h-[44px] text-sm"
                />
              </div>
            ))}
          </div>
        </Card>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#111111] text-white rounded-lg text-sm font-medium hover:bg-[#333333] disabled:opacity-60 min-h-[44px]"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving…' : 'Save transparency page'}
        </button>
      </div>
    </AdminPageLayout>
  )
}
