import type { Metadata, Viewport } from 'next'
import { Inter, Cormorant_Garamond } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { ChatWidget } from '@/components/chat/chat-widget'
import { EUDataProtectionPopup } from '@/components/eu-data-protection-popup'
import { PublicExtras } from '@/components/public-extras'
import { PublicContentGuard } from '@/components/content-protection'
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  getShareLogoUrl,
  getSiteUrl,
} from '@/lib/site-metadata'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
})

const cormorantGaramond = Cormorant_Garamond({
  variable: '--font-cormorant-garamond',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
})

const siteUrl = getSiteUrl()
const shareLogo = getShareLogoUrl()

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  icons: {
    icon: [
      {
        url: '/api/favicon',
        type: 'image/png',
      },
    ],
    apple: '/api/favicon',
  },
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    type: 'website',
    locale: 'en_AE',
    url: siteUrl,
    siteName: SITE_NAME,
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
      {
        url: shareLogo,
        alt: `${SITE_NAME} logo`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: ['/opengraph-image'],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#111111',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: siteUrl,
    logo: shareLogo,
    image: `${siteUrl}/opengraph-image`,
    description: SITE_DESCRIPTION,
  }

  return (
    <html lang="en" className={`${inter.variable} ${cormorantGaramond.variable}`} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={SITE_NAME} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body className="font-body antialiased bg-background text-foreground">
        <Providers>{children}</Providers>
        <PublicContentGuard />
        <PublicExtras />
        <EUDataProtectionPopup />
        <ChatWidget />
      </body>
    </html>
  )
}
