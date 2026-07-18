export interface NavLink {
  label: string
  href: string
  order: number
  isVisible: boolean
}

function communityLinkOrder(links: NavLink[]): number {
  const opportunitiesIdx = links.findIndex(
    (l) => l.href.replace(/\/$/, '').toLowerCase() === '/opportunities'
  )
  const partnersIdx = links.findIndex(
    (l) => l.href.replace(/\/$/, '').toLowerCase() === '/partners'
  )

  if (opportunitiesIdx >= 0 && partnersIdx >= 0) {
    const oOrder = links[opportunitiesIdx].order
    const pOrder = links[partnersIdx].order
    return oOrder < pOrder ? (oOrder + pOrder) / 2 : oOrder + 1
  }
  if (opportunitiesIdx >= 0) return links[opportunitiesIdx].order + 1
  if (partnersIdx >= 0) return links[partnersIdx].order - 0.5
  if (links.length > 0) return Math.max(...links.map((l) => l.order)) + 1
  return 4
}

function isCommunityNavLink(link: NavLink): boolean {
  const href = link.href.replace(/\/$/, '').toLowerCase()
  const label = link.label.trim().toLowerCase()
  return href === '/communities' || href === '/community' || label === 'community'
}

/** Always keep a visible Community → /communities item (CMS often omits or hides it). */
export function ensureCommunityNavLink(links: NavLink[]): NavLink[] {
  const order = communityLinkOrder(links)
  const existingIdx = links.findIndex(isCommunityNavLink)

  if (existingIdx >= 0) {
    return links
      .map((link, i) =>
        i === existingIdx
          ? {
              ...link,
              label: link.label.trim() || 'Community',
              href: '/communities',
              isVisible: true,
              order: typeof link.order === 'number' ? link.order : order,
            }
          : link
      )
      .sort((a, b) => a.order - b.order)
  }

  return [
    ...links,
    { label: 'Community', href: '/communities', order, isVisible: true },
  ].sort((a, b) => a.order - b.order)
}
