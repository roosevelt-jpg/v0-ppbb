'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { Card } from '@/components/ui/card'
import {
  subscribeToTransparencyConfig,
  DEFAULT_TRANSPARENCY_CONFIG,
  type TransparencyConfig,
} from '@/lib/transparency-config'
import { Save, CheckCircle2, AlertCircle, Plus, Trash2, ExternalLink } from 'lucide-react'

const btnPrimary =
  'inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-black !text-white rounded-lg text-xs font-medium hover:bg-neutral-900 shadow-none min-h-[36px]'
const btnIcon =
  'pb-compact-btn inline-flex items-center justify-center h-6 w-6 p-0 bg-black !text-white rounded-md hover:bg-neutral-900 shadow-none min-h-0 min-w-0 [&_svg]:h-3 [&_svg]:w-3'

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
      setMessage({
        type: 'success',
        text: 'Transparency page saved. Changes are live on /transparency.',
      })
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
          value={typeof config[key] === 'string' ? (config[key] as string) : ''}
          onChange={(e) => setConfig({ ...config, [key]: e.target.value })}
          rows={4}
          className="w-full border border-neutral-300 rounded px-3 py-2.5 min-h-[44px] text-sm"
        />
      ) : (
        <input
          type="text"
          value={typeof config[key] === 'string' ? (config[key] as string) : ''}
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

  const addBullet = () => {
    setConfig({ ...config, privacyBullets: [...config.privacyBullets, ''] })
  }

  const removeBullet = (index: number) => {
    setConfig({
      ...config,
      privacyBullets: config.privacyBullets.filter((_, i) => i !== index),
    })
  }

  const updateGetInvolved = (index: number, key: 'title' | 'description', value: string) => {
    const items = config.getInvolvedItems.map((item, i) =>
      i === index ? { ...item, [key]: value } : item
    )
    setConfig({ ...config, getInvolvedItems: items })
  }

  const addGetInvolved = () => {
    setConfig({
      ...config,
      getInvolvedItems: [...config.getInvolvedItems, { title: '', description: '' }],
    })
  }

  const removeGetInvolved = (index: number) => {
    setConfig({
      ...config,
      getInvolvedItems: config.getInvolvedItems.filter((_, i) => i !== index),
    })
  }

  return (
    <AdminPageLayout
      title="Transparency Page CMS"
      subtitle="Edit all copy on /transparency. Live donation and impact numbers stay automatic."
    >
      <div className="w-full min-w-0 max-w-3xl space-y-6">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Link
            href="/transparency"
            target="_blank"
            className={`${btnPrimary} !text-white no-underline hover:!text-white`}
          >
            Open live page <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <span className="text-neutral-400">·</span>
          <span className="text-neutral-600">
            Contact email must use <strong>passive-blessings.com</strong>
          </span>
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
          <h2 className="text-lg font-semibold text-neutral-900">Impact metrics labels</h2>
          {field('metricsHeading', 'Metrics section heading')}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {field('metricDonationsLabel', 'Donations label')}
            {field('metricDonationsSubtext', 'Donations subtext suffix')}
            {field('metricBeneficiariesLabel', 'Beneficiaries label')}
            {field('metricBeneficiariesSubtext', 'Beneficiaries subtext')}
            {field('metricCausesLabel', 'Active causes label')}
            {field('metricCausesSubtext', 'Active causes subtext')}
            {field('metricVolunteerLabel', 'Volunteer hours label')}
            {field('metricVolunteerSubtext', 'Volunteer subtext suffix')}
          </div>
        </Card>

        <Card className="p-4 sm:p-6 space-y-4">
          <h2 className="text-lg font-semibold text-neutral-900">Causes & timeline</h2>
          {field('causesHeading', 'Causes section heading')}
          {field('causesChartTitle', 'Causes chart title')}
          {field('totalFundraisedLabel', 'Total fundraised card label')}
          {field('causesFundedLabel', 'Causes funded card label')}
          {field('causesFundedSubtext', 'Causes funded subtext')}
          {field('timelineHeading', 'Timeline section heading')}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {field('timelineThisMonthLabel', 'This month label')}
            {field('timelineThisQuarterLabel', 'This quarter label')}
            {field('timelineYtdLabel', 'Year-to-date label')}
          </div>
        </Card>

        <Card className="p-4 sm:p-6 space-y-4">
          <h2 className="text-lg font-semibold text-neutral-900">Privacy & contact</h2>
          {field('privacyHeading', 'Privacy heading')}
          {field('privacyBody', 'Privacy body', true)}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label className="block text-xs uppercase tracking-wider text-neutral-500">
                Privacy bullets
              </label>
              <button type="button" onClick={addBullet} className={btnPrimary}>
                <Plus className="w-3.5 h-3.5" /> Add bullet
              </button>
            </div>
            {config.privacyBullets.map((bullet, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={bullet}
                  onChange={(e) => updateBullet(index, e.target.value)}
                  className="w-full border border-neutral-300 rounded px-3 py-2.5 min-h-[44px] text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeBullet(index)}
                  className={btnIcon}
                  aria-label="Remove bullet"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          {field('contactPrompt', 'Contact line (before email)')}
          {field('contactEmail', 'Contact email (use @passive-blessings.com)')}
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
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-neutral-500">Get involved items</p>
            <button type="button" onClick={addGetInvolved} className={btnPrimary}>
              <Plus className="w-3.5 h-3.5" /> Add item
            </button>
          </div>
          <div className="space-y-3">
            {config.getInvolvedItems.map((item, index) => (
              <div key={index} className="flex gap-2 items-start">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
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
                <button
                  type="button"
                  onClick={() => removeGetInvolved(index)}
                  className={btnIcon}
                  aria-label="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </Card>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-black !text-white rounded-lg text-sm font-medium hover:bg-neutral-900 disabled:opacity-60 min-h-[44px]"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving…' : 'Save transparency page'}
        </button>
      </div>
    </AdminPageLayout>
  )
}
