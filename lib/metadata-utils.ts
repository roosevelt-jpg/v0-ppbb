import { Metadata } from 'next'
import { getSiteSettings } from './admin'

export async function generateDynamicMetadata(): Promise<Partial<Metadata>> {
  try {
    const settings = await getSiteSettings()
    if (!settings) {
      return getDefaultMetadata()
    }

    return {
      title: settings.siteName || 'Passive Blessings',
      description: settings.siteDescription || 'Community platform for events, volunteering, and community support',
      openGraph: {
        title: settings.siteName || 'Passive Blessings',
        description: settings.siteDescription || 'Community platform for events, volunteering, and community support',
        type: 'website',
        images: settings.logoUrl ? [{ url: settings.logoUrl }] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: settings.siteName || 'Passive Blessings',
        description: settings.siteDescription || 'Community platform for events, volunteering, and community support',
      },
    }
  } catch (error) {
    console.error('[v0] Error generating dynamic metadata:', error)
    return getDefaultMetadata()
  }
}

export function getDefaultMetadata(): Partial<Metadata> {
  return {
    title: 'Passive Blessings',
    description: 'Community platform for events, volunteering, and community support',
    openGraph: {
      title: 'Passive Blessings',
      description: 'Community platform for events, volunteering, and community support',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Passive Blessings',
      description: 'Community platform for events, volunteering, and community support',
    },
  }
}
