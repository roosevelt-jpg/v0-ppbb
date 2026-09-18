import type { MetadataRoute } from 'next'
import { SITE_DESCRIPTION, SITE_NAME } from '@/lib/site-metadata'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: 'PB',
    description: SITE_DESCRIPTION,
    start_url: '/',
    scope: '/',
    id: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#f9f7f4',
    theme_color: '#111111',
    lang: 'en-AE',
    categories: ['lifestyle', 'social', 'community'],
    icons: [
      {
        src: '/api/pwa-icon?size=192',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/api/pwa-icon?size=512',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/api/pwa-icon?size=512&maskable=1',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Events',
        short_name: 'Events',
        url: '/events',
        description: 'See upcoming Passive Blessings events',
      },
      {
        name: 'Sign in',
        short_name: 'Sign in',
        url: '/login',
        description: 'Log in to your account',
      },
      {
        name: 'Donate',
        short_name: 'Donate',
        url: '/donate',
        description: 'Support the community',
      },
    ],
    related_applications: [],
    prefer_related_applications: false,
  }
}
