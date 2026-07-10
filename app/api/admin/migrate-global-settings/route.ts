import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { sanitizeForFirestore } from '@/lib/firestore-utils'
import { DEFAULT_GLOBAL_SETTINGS, mergeGlobalSettings } from '@/lib/global-settings'

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

/**
 * One-shot merge of legacy settings into platformConfig/globalSettings.
 *
 * Sources (left for manual delete later):
 *  - settings/global
 *  - siteSettings/branding
 *  - siteSettings/default (unused by Settings UI writes, read for logos if present)
 *
 * Conflict rule: prefer the value currently shown on the public site.
 *  - Contact email/phone/address → settings/global overwrites CMS on Contact page
 *  - Logos in <Logo> → siteSettings/branding
 *  - WhatsApp → already platformConfig/globalSettings
 *  - Site name/description in metadata → settings/global
 */
export async function POST(_request: NextRequest) {
  try {
    const db = getAdminDb()
    const conflicts: Array<{ field: string; cmsValue: string; oldValue: string; used: string; reason: string }> =
      []
    const mapping: Array<{ field: string; oldPath: string; newPath: string; valuePreview: string }> = []

    const [cmsSnap, settingsSnap, brandingSnap, defaultSnap] = await Promise.all([
      db.collection('platformConfig').doc('globalSettings').get(),
      db.collection('settings').doc('global').get(),
      db.collection('siteSettings').doc('branding').get(),
      db.collection('siteSettings').doc('default').get(),
    ])

    const cms = mergeGlobalSettings(cmsSnap.exists ? cmsSnap.data() : undefined)
    const old = (settingsSnap.exists ? settingsSnap.data() : {}) as Record<string, unknown>
    const branding = (brandingSnap.exists ? brandingSnap.data() : {}) as Record<string, unknown>
    const siteDefault = (defaultSnap.exists ? defaultSnap.data() : {}) as Record<string, unknown>

    const oldSiteName = asString(old.siteName) || asString((old.branding as { siteName?: string })?.siteName)
    const oldDescription =
      asString(old.siteDescription) ||
      asString(old.description) ||
      asString((old.branding as { description?: string })?.description)
    const oldEmail =
      asString(old.email) || asString((old.contact as { email?: string })?.email)
    const oldPhone =
      asString(old.phone) || asString((old.contact as { phone?: string })?.phone)
    const oldAddress =
      asString(old.address) || asString((old.contact as { address?: string })?.address)
    const oldLogoLight =
      asString(branding.lightLogoUrl) ||
      asString(old.logoUrl) ||
      asString(siteDefault.logoUrl)
    const oldLogoDark =
      asString(branding.darkLogoUrl) ||
      asString(old.logoUrlDark) ||
      asString(siteDefault.logoUrlDark)
    const oldFavicon =
      asString(branding.faviconUrl) || asString(old.faviconUrl) || DEFAULT_GLOBAL_SETTINGS.faviconUrl
    const oldSocial =
      (old.socialLinks as Record<string, unknown>) ||
      (old.social as Record<string, unknown>) ||
      {}
    const oldFooter = asString(old.footerText)

    function pickContact(field: string, cmsVal: string, oldVal: string): string {
      if (oldVal && cmsVal && oldVal !== cmsVal) {
        conflicts.push({
          field,
          cmsValue: cmsVal,
          oldValue: oldVal,
          used: oldVal,
          reason: 'Contact page overwrites CMS from settings/global when that fetch succeeds — using live Contact source',
        })
        return oldVal
      }
      return oldVal || cmsVal
    }

    function pickLogo(field: string, cmsVal: string, brandingVal: string, settingsVal: string): string {
      const live = brandingVal || settingsVal
      if (cmsVal && live && cmsVal !== live) {
        conflicts.push({
          field,
          cmsValue: cmsVal,
          oldValue: live,
          used: brandingVal || settingsVal,
          reason: brandingVal
            ? 'Public <Logo> reads siteSettings/branding — using branding'
            : 'Public metadata/settings logos — using settings/global',
        })
      }
      return live || cmsVal
    }

    const platformName = (() => {
      if (oldSiteName && cms.platformName && oldSiteName !== cms.platformName) {
        conflicts.push({
          field: 'platformName',
          cmsValue: cms.platformName,
          oldValue: oldSiteName,
          used: oldSiteName,
          reason: 'Metadata / settings/global is live site name source',
        })
        return oldSiteName
      }
      return oldSiteName || cms.platformName
    })()

    const siteDescription = (() => {
      if (oldDescription && cms.siteDescription && oldDescription !== cms.siteDescription) {
        conflicts.push({
          field: 'siteDescription',
          cmsValue: cms.siteDescription,
          oldValue: oldDescription,
          used: oldDescription,
          reason: 'Metadata reads settings/global description',
        })
        return oldDescription
      }
      return oldDescription || cms.siteDescription || DEFAULT_GLOBAL_SETTINGS.siteDescription
    })()

    const mergedSocial = {
      ...cms.socialLinks,
      ...Object.fromEntries(
        Object.entries(oldSocial).filter(([, v]) => typeof v === 'string' && String(v).trim())
      ),
    }

    const merged = sanitizeForFirestore({
      whatsappLink: cms.whatsappLink, // already live on WhatsApp button
      platformName,
      siteDescription,
      contactEmail: pickContact('contactEmail', cms.contactEmail, oldEmail) || DEFAULT_GLOBAL_SETTINGS.contactEmail,
      phone: pickContact('phone', cms.phone, oldPhone) || DEFAULT_GLOBAL_SETTINGS.phone,
      address: pickContact('address', cms.address, oldAddress) || DEFAULT_GLOBAL_SETTINGS.address,
      logoUrlLight: pickLogo('logoUrlLight', cms.logoUrlLight, asString(branding.lightLogoUrl), asString(old.logoUrl)),
      logoUrlDark: pickLogo('logoUrlDark', cms.logoUrlDark, asString(branding.darkLogoUrl), asString(old.logoUrlDark)),
      faviconUrl: oldFavicon || cms.faviconUrl || DEFAULT_GLOBAL_SETTINGS.faviconUrl,
      socialLinks: mergedSocial,
      footerText: oldFooter || cms.footerText || DEFAULT_GLOBAL_SETTINGS.footerText,
      migratedFrom: {
        settingsGlobal: settingsSnap.exists,
        siteSettingsBranding: brandingSnap.exists,
        siteSettingsDefault: defaultSnap.exists,
        at: new Date().toISOString(),
      },
      updatedAt: new Date(),
    })

    await db.collection('platformConfig').doc('globalSettings').set(merged, { merge: true })

    const pairs: Array<[string, string, string]> = [
      ['platformName', oldSiteName ? 'settings/global.siteName' : '(cms kept)', 'platformConfig/globalSettings.platformName'],
      ['siteDescription', 'settings/global.siteDescription', 'platformConfig/globalSettings.siteDescription'],
      ['contactEmail', 'settings/global.email', 'platformConfig/globalSettings.contactEmail'],
      ['phone', 'settings/global.phone', 'platformConfig/globalSettings.phone'],
      ['address', 'settings/global.address', 'platformConfig/globalSettings.address'],
      ['logoUrlLight', 'siteSettings/branding.lightLogoUrl | settings/global.logoUrl', 'platformConfig/globalSettings.logoUrlLight'],
      ['logoUrlDark', 'siteSettings/branding.darkLogoUrl | settings/global.logoUrlDark', 'platformConfig/globalSettings.logoUrlDark'],
      ['faviconUrl', 'siteSettings/branding.faviconUrl', 'platformConfig/globalSettings.faviconUrl'],
      ['socialLinks.*', 'settings/global.socialLinks', 'platformConfig/globalSettings.socialLinks'],
      ['footerText', 'settings/global.footerText', 'platformConfig/globalSettings.footerText'],
      ['whatsappLink', '(unchanged)', 'platformConfig/globalSettings.whatsappLink'],
    ]
    for (const [field, oldPath, newPath] of pairs) {
      const preview = String((merged as Record<string, unknown>)[field] ?? '')
      mapping.push({
        field,
        oldPath,
        newPath,
        valuePreview: preview.length > 80 ? `${preview.slice(0, 80)}…` : preview,
      })
    }

    return NextResponse.json({
      success: true,
      data: mergeGlobalSettings(merged as Record<string, unknown>),
      conflicts,
      mapping,
      leaveUnused: ['settings/global', 'siteSettings/branding', 'siteSettings/default'],
    })
  } catch (error) {
    console.error('[migrate-global-settings]', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Migration failed' },
      { status: 500 }
    )
  }
}
