'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { AdminPageLayout } from '@/components/admin-page-layout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Save, AlertCircle, CheckCircle2, Upload, Plug } from 'lucide-react'
import {
  subscribeToGlobalSettings,
  DEFAULT_GLOBAL_SETTINGS,
  GlobalSettings,
  GlobalSocialLinks,
} from '@/lib/platform-config'
import {
  subscribeToReferralsConfig,
  DEFAULT_REFERRALS_CONFIG,
  ReferralsPlatformConfig,
} from '@/lib/referral-config'
import { uploadImageToFirebase } from '@/lib/upload-utils'
import { auth } from '@/lib/firebase'

const SOCIAL_FIELDS: Array<{ key: keyof GlobalSocialLinks; label: string }> = [
  { key: 'twitter', label: 'Twitter' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'youtube', label: 'YouTube' },
]

export default function AdminCmsGlobalSettingsPage() {
  const [settings, setSettings] = useState<GlobalSettings>(DEFAULT_GLOBAL_SETTINGS)
  const [referrals, setReferrals] = useState<ReferralsPlatformConfig>(DEFAULT_REFERRALS_CONFIG)
  const [saving, setSaving] = useState(false)
  const [savingReferrals, setSavingReferrals] = useState(false)
  const [migrating, setMigrating] = useState(false)
  const [uploading, setUploading] = useState<'light' | 'dark' | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(
    null
  )
  const [migrationReport, setMigrationReport] = useState<string | null>(null)

  useEffect(() => subscribeToGlobalSettings(setSettings), [])
  useEffect(() => subscribeToReferralsConfig(setReferrals), [])

  const handleChange = <K extends keyof GlobalSettings>(field: K, value: GlobalSettings[K]) => {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  const handleSocialChange = (key: keyof GlobalSocialLinks, value: string) => {
    setSettings((prev) => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [key]: value },
    }))
  }

  const handleLogoUpload = async (file: File, variant: 'light' | 'dark') => {
    setUploading(variant)
    setMessage(null)
    try {
      const url = await uploadImageToFirebase(
        file,
        variant === 'light' ? 'branding/logo-light' : 'branding/logo-dark',
        { preset: 'logo' }
      )
      handleChange(variant === 'light' ? 'logoUrlLight' : 'logoUrlDark', url)
      setMessage({ type: 'success', text: `${variant === 'light' ? 'Light' : 'Dark'} logo uploaded.` })
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Logo upload failed',
      })
    } finally {
      setUploading(null)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/platform-config/globalSettings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Save failed')
      setMessage({
        type: 'success',
        text: 'Global settings saved. Public contact, footer socials, WhatsApp, and logos update live.',
      })
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to save settings',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveReferrals = async () => {
    setSavingReferrals(true)
    setMessage(null)
    try {
      const res = await fetch('/api/platform-config/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(referrals),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Save failed')
      setMessage({ type: 'success', text: 'Referral platform defaults saved.' })
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to save referrals config',
      })
    } finally {
      setSavingReferrals(false)
    }
  }

  const runMigration = async () => {
    setMigrating(true)
    setMessage(null)
    setMigrationReport(null)
    try {
      const token = await auth.currentUser?.getIdToken()
      const res = await fetch('/api/admin/migrate-global-settings', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Migration failed')
      const conflictCount = Array.isArray(json.conflicts) ? json.conflicts.length : 0
      setMigrationReport(
        `Migrated from settings/global + siteSettings/branding. Conflicts resolved: ${conflictCount}. Old paths left unused for manual delete: ${(json.leaveUnused || []).join(', ')}`
      )
      setMessage({
        type: 'success',
        text: 'Legacy settings merged into platformConfig/globalSettings.',
      })
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Migration failed',
      })
    } finally {
      setMigrating(false)
    }
  }

  const fieldClass =
    'w-full min-h-[44px] border border-neutral-300 rounded px-3 py-2.5 text-sm bg-white'

  return (
    <AdminPageLayout title="Global Settings">
      <div className="space-y-6 w-full min-w-0">
        <div>
          <p
            className="text-xs uppercase tracking-[0.15em] text-neutral-500 mb-1"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            CMS
          </p>
          <h1
            className="text-2xl sm:text-3xl text-neutral-900"
            style={{ fontFamily: 'Cormorant Garamond, serif' }}
          >
            Global Settings
          </h1>
          <p className="text-sm text-neutral-600 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
            Single source for platform branding, contact details, social links, and WhatsApp. API
            credentials live on{' '}
            <Link href="/admin/integrations" className="underline font-medium">
              Integrations
            </Link>
            .
          </p>
        </div>

        {message && (
          <div
            className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : message.type === 'info'
                  ? 'bg-amber-50 text-amber-900 border border-amber-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
            }`}
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {migrationReport && (
          <p className="text-xs text-neutral-600" style={{ fontFamily: 'Inter, sans-serif' }}>
            {migrationReport}
          </p>
        )}

        {/* Site branding */}
        <Card className="p-4 sm:p-6 space-y-4 w-full min-w-0">
          <div>
            <p
              className="text-xs uppercase tracking-[0.15em] text-neutral-500 mb-1"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Site branding
            </p>
            <h2
              className="text-xl text-neutral-900"
              style={{ fontFamily: 'Cormorant Garamond, serif' }}
            >
              Name & logos
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Site / platform name</label>
              <input
                type="text"
                value={settings.platformName}
                onChange={(e) => handleChange('platformName', e.target.value)}
                className={fieldClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Site description</label>
              <textarea
                value={settings.siteDescription}
                onChange={(e) => handleChange('siteDescription', e.target.value)}
                rows={3}
                className={`${fieldClass} min-h-[96px]`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Footer text</label>
              <input
                type="text"
                value={settings.footerText}
                onChange={(e) => handleChange('footerText', e.target.value)}
                className={fieldClass}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(['light', 'dark'] as const).map((variant) => {
              const url = variant === 'light' ? settings.logoUrlLight : settings.logoUrlDark
              return (
                <div key={variant} className="border border-dashed border-neutral-300 rounded-lg p-4">
                  <label className="block text-sm font-medium mb-2">
                    Logo ({variant === 'light' ? 'Light' : 'Dark'})
                  </label>
                  {url ? (
                    <img
                      src={url}
                      alt={`${variant} logo`}
                      className="h-16 w-auto max-w-full object-contain mb-3 mx-auto"
                    />
                  ) : (
                    <p className="text-xs text-neutral-400 mb-3 text-center">No logo yet</p>
                  )}
                  <label className="inline-flex w-full items-center justify-center gap-2 min-h-[44px] px-4 bg-white text-black border border-neutral-300 rounded text-sm font-semibold cursor-pointer hover:bg-neutral-50">
                    <Upload className="w-4 h-4" />
                    {uploading === variant ? 'Uploading…' : url ? 'Change logo' : 'Upload logo'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={!!uploading}
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) void handleLogoUpload(f, variant)
                      }}
                    />
                  </label>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Contact */}
        <Card className="p-4 sm:p-6 space-y-4 w-full min-w-0">
          <div>
            <p
              className="text-xs uppercase tracking-[0.15em] text-neutral-500 mb-1"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Contact
            </p>
            <h2
              className="text-xl text-neutral-900"
              style={{ fontFamily: 'Cormorant Garamond, serif' }}
            >
              Public contact details
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Contact email</label>
              <input
                type="email"
                value={settings.contactEmail}
                onChange={(e) => handleChange('contactEmail', e.target.value)}
                className={fieldClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                type="text"
                value={settings.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className={fieldClass}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Address</label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className={fieldClass}
              />
            </div>
          </div>
        </Card>

        {/* WhatsApp */}
        <Card className="p-4 sm:p-6 space-y-4 w-full min-w-0">
          <div>
            <p
              className="text-xs uppercase tracking-[0.15em] text-neutral-500 mb-1"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              WhatsApp
            </p>
            <h2
              className="text-xl text-neutral-900"
              style={{ fontFamily: 'Cormorant Garamond, serif' }}
            >
              Floating channel button
            </h2>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">WhatsApp channel URL</label>
            <input
              type="url"
              value={settings.whatsappLink}
              onChange={(e) => handleChange('whatsappLink', e.target.value)}
              className={fieldClass}
              placeholder="https://whatsapp.com/channel/..."
            />
            <p className="text-xs text-neutral-500 mt-1">
              Shown as a floating green button on public pages. Leave empty to hide.
            </p>
          </div>
        </Card>

        {/* Social */}
        <Card className="p-4 sm:p-6 space-y-4 w-full min-w-0">
          <div>
            <p
              className="text-xs uppercase tracking-[0.15em] text-neutral-500 mb-1"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Social media
            </p>
            <h2
              className="text-xl text-neutral-900"
              style={{ fontFamily: 'Cormorant Garamond, serif' }}
            >
              Footer & contact icons
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {SOCIAL_FIELDS.map(({ key, label }) => (
              <div key={key}>
                <label className="block text-sm font-medium mb-1">{label} URL</label>
                <input
                  type="url"
                  value={settings.socialLinks[key] || ''}
                  onChange={(e) => handleSocialChange(key, e.target.value)}
                  placeholder={`https://${key}.com/...`}
                  className={fieldClass}
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Integrations — link only, NOT the credentials page */}
        <Card className="p-4 sm:p-6 space-y-3 w-full min-w-0">
          <div>
            <p
              className="text-xs uppercase tracking-[0.15em] text-neutral-500 mb-1"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Integrations
            </p>
            <h2
              className="text-xl text-neutral-900"
              style={{ fontFamily: 'Cormorant Garamond, serif' }}
            >
              API credentials & services
            </h2>
          </div>
          <p className="text-sm text-neutral-600" style={{ fontFamily: 'Inter, sans-serif' }}>
            Payment gateways, Gmail SMTP, Maps, calendars, and webhooks are managed on the dedicated
            Integrations page (Firestore <code className="text-xs">integrations/</code> collection).
            This settings page does not store API keys.
          </p>
          <Link
            href="/admin/integrations"
            className="inline-flex items-center gap-2 min-h-[44px] px-5 bg-black text-white rounded text-sm font-semibold hover:bg-neutral-900 w-full sm:w-auto justify-center"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            <Plug className="w-4 h-4" />
            Open Integrations dashboard
          </Link>
        </Card>

        {/* Referrals */}
        <Card className="p-4 sm:p-6 space-y-4 w-full min-w-0">
          <div>
            <p
              className="text-xs uppercase tracking-[0.15em] text-neutral-500 mb-1"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Referrals
            </p>
            <h2
              className="text-xl text-neutral-900"
              style={{ fontFamily: 'Cormorant Garamond, serif' }}
            >
              Business referral defaults
            </h2>
            <p className="text-sm text-neutral-600 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
              Stored in platformConfig/referrals.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Default contribution %</label>
              <input
                type="number"
                min={0}
                max={100}
                value={referrals.defaultContributionPercent}
                onChange={(e) =>
                  setReferrals((p) => ({
                    ...p,
                    defaultContributionPercent: Number(e.target.value) || 0,
                  }))
                }
                className={fieldClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Attribution window (days)</label>
              <input
                type="number"
                min={1}
                max={365}
                value={referrals.attributionWindowDays}
                onChange={(e) =>
                  setReferrals((p) => ({
                    ...p,
                    attributionWindowDays: Number(e.target.value) || 30,
                  }))
                }
                className={fieldClass}
              />
            </div>
          </div>
          <Button
            type="button"
            onClick={handleSaveReferrals}
            disabled={savingReferrals}
            className="bg-black text-white hover:bg-gray-800 min-h-[44px]"
          >
            <Save className="w-4 h-4 mr-2" />
            {savingReferrals ? 'Saving…' : 'Save referral defaults'}
          </Button>
        </Card>

        <div className="flex flex-col sm:flex-row flex-wrap gap-3 justify-end pb-8">
          <button
            type="button"
            onClick={() => void runMigration()}
            disabled={migrating}
            className="min-h-[44px] px-5 bg-white text-black border border-neutral-300 rounded text-sm font-semibold hover:bg-neutral-50 disabled:opacity-50"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            {migrating ? 'Migrating…' : 'Import from legacy settings'}
          </button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="bg-black text-white hover:bg-gray-800 min-h-[44px]"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving…' : 'Save global settings'}
          </Button>
        </div>
      </div>
    </AdminPageLayout>
  )
}
