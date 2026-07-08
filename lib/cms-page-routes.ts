import type { Page } from '@/lib/types'

/** Public URL for a CMS menu entry */
export function getCmsPageHref(page: Pick<Page, 'slug' | 'externalHref'>): string {
  if (page.externalHref?.trim()) return page.externalHref.trim()
  return `/pages/${page.slug}`
}

export function getCmsPageLabel(page: Pick<Page, 'title' | 'menuLabel'>): string {
  return page.menuLabel?.trim() || page.title
}
