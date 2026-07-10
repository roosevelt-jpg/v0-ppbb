import type { Page } from '@/lib/types'

/** Public CMS legal pages (editable in Admin → Pages) */
export const CMS_LEGAL_PAGE_URLS = {
  privacyPolicy: '/pages/privacy-policy',
  termsOfService: '/pages/terms-of-service',
  codeOfConduct: '/pages/code-of-conduct',
  dataProtection: '/pages/data-protection',
} as const

/** Public URL for a CMS menu entry */
export function getCmsPageHref(page: Pick<Page, 'slug' | 'externalHref'>): string {
  if (page.externalHref?.trim()) return page.externalHref.trim()
  return `/pages/${page.slug}`
}

export function getCmsPageLabel(page: Pick<Page, 'title' | 'menuLabel'>): string {
  return page.menuLabel?.trim() || page.title
}
