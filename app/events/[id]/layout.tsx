import type { Metadata } from 'next'
import { getAdminDb } from '@/lib/firebase-admin'
import { getShareLogoUrl, getSiteUrl } from '@/lib/site-metadata'

export const dynamic = 'force-dynamic'

type Props = {
  children: React.ReactNode
  params: Promise<{ id: string }>
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
    const data = snap.data()!
    const title = (data.title as string) || 'Event'
    const description =
      (typeof data.description === 'string' && data.description.slice(0, 160)) ||
      'Join this event on Passive Blessings'
    const image =
      (data.bannerURL as string) ||
      (data.bannerImage as string) ||
      (data.bannerImageUrl as string) ||
      fallbackImage
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
        images: [
          { url: image, alt: title },
          { url: getShareLogoUrl(), alt: 'Passive Blessings logo' },
        ],
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
