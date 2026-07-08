import { redirect } from 'next/navigation'

/**
 * Retired: /admin/settings consolidated into /admin/cms/global-settings.
 * Legacy Firestore docs (settings/global, siteSettings/*) left in place unused.
 */
export default function AdminSettingsRedirect() {
  redirect('/admin/cms/global-settings')
}
