/**
 * One-off diagnostic: list menu pages and duplicate hrefs per menuLocation.
 * Run: npx tsx scripts/audit-menu-pages.ts
 */
import { getAdminDb } from '../lib/firebase-admin'
import { getCmsPageHref } from '../lib/cms-page-routes'

const MENU_LOCATIONS = [
  'footer-quicklinks',
  'footer-getinvolved',
  'footer-legal',
  'navbar',
] as const

async function main() {
  const db = getAdminDb()
  const snap = await db.collection('pages').get()

  const all = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Array<Record<string, unknown> & { id: string }>

  console.log(`\n=== Total pages in Firestore: ${all.length} ===\n`)

  for (const loc of MENU_LOCATIONS) {
    const inMenu = all
      .filter(
        (p) =>
          p.status === 'published' &&
          p.showInMenu === true &&
          p.menuLocation === loc
      )
      .map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        menuLabel: p.menuLabel,
        externalHref: p.externalHref,
        href: getCmsPageHref({
          slug: String(p.slug || ''),
          externalHref: p.externalHref as string | undefined,
        }),
        menuOrder: p.menuOrder,
        headerSection: p.headerSection,
      }))
      .sort((a, b) => (Number(a.menuOrder) || 0) - (Number(b.menuOrder) || 0))

    console.log(`--- ${loc} (${inMenu.length} entries) ---`)
    for (const p of inMenu) {
      console.log(`  [${p.id}] slug=${p.slug} href=${p.href} label=${p.menuLabel || p.title}`)
    }

    const byHref = new Map<string, typeof inMenu>()
    for (const p of inMenu) {
      const list = byHref.get(p.href) || []
      list.push(p)
      byHref.set(p.href, list)
    }
    const dups = [...byHref.entries()].filter(([, list]) => list.length > 1)
    if (dups.length) {
      console.log(`  DUPLICATES by href:`)
      for (const [href, list] of dups) {
        console.log(`    ${href}:`)
        for (const p of list) {
          console.log(`      - id=${p.id} slug=${p.slug} label=${p.menuLabel || p.title}`)
        }
      }
    }
    console.log()
  }

  // Cross-check: pages with same externalHref in same menuLocation
  const menuPages = all.filter((p) => p.showInMenu && p.status === 'published' && p.menuLocation !== 'none')
  const slugGroups = new Map<string, typeof menuPages>()
  for (const p of menuPages) {
    const key = `${p.menuLocation}|${getCmsPageHref({ slug: String(p.slug), externalHref: p.externalHref as string })}`
    const list = slugGroups.get(key) || []
    list.push(p)
    slugGroups.set(key, list)
  }
  const allDups = [...slugGroups.entries()].filter(([, l]) => l.length > 1)
  console.log(`=== Summary: ${allDups.length} duplicate href+location groups ===`)
  for (const [key, list] of allDups) {
    console.log(`  ${key}:`)
    for (const p of list) {
      console.log(`    id=${p.id} slug=${p.slug} title=${p.title}`)
    }
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
