import type { Metadata } from 'next'
import { getAdminDb } from '@/lib/firebase-admin'
import { getSiteUrl } from '@/lib/site-metadata'

export const dynamic = 'force-dynamic'

type Props = {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const site = getSiteUrl()
  const fallbackImage = `${site}/opengraph-image`
  // Same-origin compressed JPEG under WhatsApp's ~600KB limit.
  // Raw Firebase/GCS banners are often 1–2MB+ and get dropped from previews.
  const image = `${site}/api/og/event/${encodeURIComponent(id)}`

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
    const url = `${site}/events/${id}`

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
        url,
        siteName: 'Passive Blessings',
        images: [{ url: image, alt: title, width: 1200, height: 630, type: 'image/jpeg' }],
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