import type { Metadata } from 'next'
import { getAdminDb } from '@/lib/firebase-admin'

export const dynamic = 'force-dynamic'

type Props = {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  try {
    const snap = await getAdminDb().collection('events').doc(id).get()
    if (!snap.exists) {
      return { title: 'Event | Passive Blessings' }
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
      undefined
    const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://test.myflynai.com'
    const url = `${site}/events/${id}`

    return {
      title: `${title} | Passive Blessings`,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
        url,
        images: image ? [{ url: image }] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: image ? [image] : [],
      },
    }
  } catch {
    return { title: 'Event | Passive Blessings' }
  }
}

export default function EventIdLayout({ children }: { children: React.ReactNode }) {
  return children
}
