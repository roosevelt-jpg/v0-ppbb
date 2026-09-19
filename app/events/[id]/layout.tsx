import type { Metadata } from 'next'
import { getAdminDb } from '@/lib/firebase-admin'
import { getSiteUrl } from '@/lib/site-metadata'

export const dynamic = 'force-dynamic'

type Props = {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

/** Prefer absolute http(s) banner URL for WhatsApp / OG crawlers. */
function resolveEventOgImage(
  data: Record<string, unknown>,
  site: string,
  fallback: string
): string {
  const candidates = [
    data.bannerURL,
    data.bannerImage,
    data.bannerImageUrl,
    data.coverImage,
    data.imageURL,
  ]
  for (const raw of candidates) {
    const value = typeof raw === 'string' ? raw.trim() : ''
    if (!value) continue
    if (/^https?:\/\//i.test(value)) return value
    if (value.startsWith('//')) return `https:${value}`
    if (value.startsWith('/')) return `${site}${value}`
  }
  return fallback
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const site = getSiteUrl()
  const fallbackImage = `${site}/opengraph-image`

  try {
    const snap = await getAdminDb().collection('events').doc(id).get()
    if (!snap.exists) {
      return {
        title: 'Event',
        openGraph: { images: [{ url: fallbackImage, width: 1200, height: 630 }] },
      }
    }
    const data = snap.data() as Record<string, unknown>
    const title = (typeof data.title === 'string' && data.title) || 'Event'
    const description =
      (typeof data.description === 'string' && data.description.slice(0, 160)) ||
      'Join this event on Passive Blessings'
    const image = resolveEventOgImage(data, site, fallbackImage)
    const url = `${site}/events/${id}`

    // Single og:image only — WhatsApp often prefers a later logo over the banner
    // when multiple images are listed.
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
        url,
        siteName: 'Passive Blessings',
        images: [{ url: image, alt: title, width: 1200, height: 630 }],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [image],
      },
    }
  } catch {
    return {
      title: 'Event',
      openGraph: { images: [{ url: fallbackImage, width: 1200, height: 630 }] },
    }
  }
}

export default function EventIdLayout({ children }: { children: React.ReactNode }) {
  return children
}
