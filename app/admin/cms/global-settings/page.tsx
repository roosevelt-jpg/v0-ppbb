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
import {
  DEFAULT_LOGO_ON_DARK_BG,
  DEFAULT_LOGO_ON_LIGHT_BG,
} from '@/lib/logo-manager'
import {
  COLOR_FIELD_LABELS,
  DEFAULT_SITE_THEME,
  FONT_ROLE_LABELS,
  SITE_FONT_OPTIONS,
  buildGoogleFontsHref,
  type SiteFontRole,
  type SiteThemeColors,
} from '@/lib/site-theme'

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
  const [uploading, setUploading] = useState<'favicon' | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(
    null
  )
  const [migrationReport, setMigrationReport] = useState<string | null>(null)

  useEffect(() => subscribeToGlobalSettings(setSettings), [])
  useEffect(() => subscribeToReferralsConfig(setReferrals), [])

  // Load selected Google fonts for the live preview while editing
  useEffect(() => {
    const theme = settings.theme || DEFAULT_SITE_THEME
    const href = buildGoogleFontsHref(theme)
    if (!href || typeof document === 'undefined') return
    const id = 'pb-admin-theme-preview-fonts'
    let link = document.getElementById(id) as HTMLLinkElement | null
    if (!link) {
      link = document.createElement('link')
      link.id = id
      link.rel = 'stylesheet'
      document.head.appendChild(link)
    }
    link.href = href
  }, [settings.theme])

  const handleChange = <K extends keyof GlobalSettings>(field: K, value: GlobalSettings[K]) => {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  const handleSocialChange = (key: keyof GlobalSocialLinks, value: string) => {
    setSettings((prev) => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [key]: value },
    }))
  }

  const handleThemeFontChange = (role: SiteFontRole, fontId: string) => {
    setSettings((prev) => ({
      ...prev,
      theme: {
        ...prev.theme,
        fonts: { ...prev.theme.fonts, [role]: fontId },
      },
    }))
  }

  const handleThemeColorChange = (key: keyof SiteThemeColors, value: string) => {
    setSettings((prev) => ({
      ...prev,
      theme: {
        ...prev.theme,
        colors: { ...prev.theme.colors, [key]: value },
      },
    }))
  }

  const handleResetTheme = () => {
    setSettings((prev) => ({ ...prev, theme: DEFAULT_SITE_THEME }))
    setMessage({
      type: 'info',
      text: 'Theme reset to defaults in this form. Click Save global settings to apply.',
    })
  }

  const handleFaviconUpload = async (file: File) => {
    setUploading('favicon')
    setMessage(null)
    try {
      const url = await uploadImageToFirebase(file, 'branding/favicon', {
        preset: 'favicon',
      })
      handleChange('faviconUrl', url)
      setMessage({
        type: 'success',
        text: 'Favicon uploaded (64×64). Remember to Save.',
      })
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Favicon upload failed',
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
        text: 'Global settings saved. Branding, WhatsApp, fonts, and colors update live on the site.',
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
            Single source for platform branding, typography, colors, contact details, social links,
            and WhatsApp. API
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
            {(
              [
                {
                  key: 'dark-bg',
                  label: 'Logo (dark backgrounds — navbar / footer)',
                  src: DEFAULT_LOGO_ON_DARK_BG,
                  previewBg: 'bg-black',
                },
                {
                  key: 'light-bg',
                  label: 'Logo (light backgrounds — sidebars)',
                  src: DEFAULT_LOGO_ON_LIGHT_BG,
                  previewBg: 'bg-neutral-100',
                },
              ] as const
            ).map((item) => (
              <div key={item.key} className="border border-dashed border-neutral-300 rounded-lg p-4">
                <label className="block text-sm font-medium mb-2">{item.label}</label>
                <div
                  className={`mb-3 flex h-20 items-center justify-center rounded ${item.previewBg}`}
                >
                  <img
                    src={item.src}
                    alt={item.label}
                    className="h-16 w-auto max-w-full object-contain bg-transparent"
                  />
                </div>
                <p className="text-xs text-neutral-500">
                  Built-in original brand mark. Site chrome always uses these (admin uploads are
                  disabled for logos).
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 border border-dashed border-neutral-300 rounded-lg p-4 max-w-md">
            <label className="block text-sm font-medium mb-2">Favicon</label>
            {settings.faviconUrl ? (
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded bg-neutral-100 border border-neutral-200">
                <img
                  src={settings.faviconUrl}
                  alt="Favicon"
                  className="h-10 w-10 object-contain bg-transparent"
                />
              </div>
            ) : (
              <p className="text-xs text-neutral-400 mb-3">No favicon yet</p>
            )}
            <p className="text-xs text-neutral-500 mb-2">
              Browser tab icon. Auto-resized to <strong>64×64</strong> PNG (PNG, JPG,
              WebP, GIF, ICO, or SVG).
            </p>
            <label className="inline-flex w-full items-center justify-center gap-2 min-h-[44px] px-4 bg-white text-black border border-neutral-300 rounded text-sm font-semibold cursor-pointer hover:bg-neutral-50">
              <Upload className="w-4 h-4" />
              {uploading === 'favicon'
                ? 'Uploading…'
                : settings.faviconUrl
                  ? 'Change favicon'
                  : 'Upload favicon'}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,image/x-icon,.ico"
                className="hidden"
                disabled={!!uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) void handleFaviconUpload(f)
                }}
              />
            </label>
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

        {/* Typography & Colors */}
        <Card className="p-4 sm:p-6 space-y-6 w-full min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <p
                className="text-xs uppercase tracking-[0.15em] text-neutral-500 mb-1"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Appearance
              </p>
              <h2
                className="text-xl text-neutral-900"
                style={{ fontFamily: 'Cormorant Garamond, serif' }}
              >
                Typography & colors
              </h2>
              <p className="text-sm text-neutral-600 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                Choose fonts for headings, titles, subheadings, body content, and buttons, plus brand
                colors. Changes apply site-wide after you save.
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetTheme}
              className="min-h-[44px] px-4 !bg-white !text-black border border-neutral-300 rounded text-sm font-semibold hover:!bg-neutral-50 shrink-0"
            >
              Reset to defaults
            </button>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide">Fonts</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(Object.keys(FONT_ROLE_LABELS) as SiteFontRole[]).map((role) => (
                <div key={role}>
                  <label className="block text-sm font-medium mb-1">
                    {FONT_ROLE_LABELS[role].label}
                  </label>
                  <p className="text-xs text-neutral-500 mb-1.5">{FONT_ROLE_LABELS[role].hint}</p>
                  <select
                    value={settings.theme?.fonts?.[role] || DEFAULT_SITE_THEME.fonts[role]}
                    onChange={(e) => handleThemeFontChange(role, e.target.value)}
                    className={fieldClass}
                  >
                    {SITE_FONT_OPTIONS.map((font) => (
                      <option key={font.id} value={font.id}>
                        {font.label} ({font.category})
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide">Colors</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {COLOR_FIELD_LABELS.map(({ key, label, hint }) => {
                const value =
                  settings.theme?.colors?.[key] || DEFAULT_SITE_THEME.colors[key]
                return (
                  <div key={key}>
                    <label className="block text-sm font-medium mb-1">{label}</label>
                    <p className="text-xs text-neutral-500 mb-1.5">{hint}</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={value.length === 7 ? value : '#111111'}
                        onChange={(e) => handleThemeColorChange(key, e.target.value)}
                        className="h-11 w-14 shrink-0 border border-neutral-300 rounded cursor-pointer bg-white p-1"
                        aria-label={label}
                      />
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => handleThemeColorChange(key, e.target.value)}
                        className={fieldClass}
                        placeholder="#111111"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div
            className="rounded-lg border border-neutral-200 p-4 space-y-3"
            style={{
              background: settings.theme?.colors?.background || DEFAULT_SITE_THEME.colors.background,
              color: settings.theme?.colors?.foreground || DEFAULT_SITE_THEME.colors.foreground,
              borderColor: settings.theme?.colors?.border || DEFAULT_SITE_THEME.colors.border,
            }}
          >
            <p className="text-xs uppercase tracking-wide opacity-70">Live preview</p>
            <p
              className="text-3xl font-bold"
              style={{
                fontFamily:
                  SITE_FONT_OPTIONS.find(
                    (f) => f.id === (settings.theme?.fonts?.heading || 'cormorant-garamond')
                  )?.stack,
              }}
            >
              Heading sample
            </p>
            <p
              className="text-2xl font-bold"
              style={{
                fontFamily:
                  SITE_FONT_OPTIONS.find(
                    (f) => f.id === (settings.theme?.fonts?.title || 'cormorant-garamond')
                  )?.stack,
              }}
            >
              Title sample
            </p>
            <p
              className="text-lg font-semibold"
              style={{
                fontFamily:
                  SITE_FONT_OPTIONS.find(
                    (f) => f.id === (settings.theme?.fonts?.subheading || 'inter')
                  )?.stack,
              }}
            >
              Subheading sample
            </p>
            <p
              className="text-sm"
              style={{
                fontFamily:
                  SITE_FONT_OPTIONS.find(
                    (f) => f.id === (settings.theme?.fonts?.content || 'inter')
                  )?.stack,
                color: settings.theme?.colors?.muted || DEFAULT_SITE_THEME.colors.muted,
              }}
            >
              Body content sample — community events, volunteering, and support.
            </p>
            <button
              type="button"
              className="!min-h-[44px] !px-5 !rounded-lg !text-sm !font-semibold !shadow-none"
              style={{
                fontFamily:
                  SITE_FONT_OPTIONS.find(
                    (f) => f.id === (settings.theme?.fonts?.button || 'inter')
                  )?.stack,
                backgroundColor:
                  settings.theme?.colors?.buttonBg || DEFAULT_SITE_THEME.colors.buttonBg,
                color: settings.theme?.colors?.buttonText || DEFAULT_SITE_THEME.colors.buttonText,
              }}
            >
              Button sample
            </button>
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
