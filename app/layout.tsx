import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter, Cormorant_Garamond } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { ChatWidget } from '@/components/chat/chat-widget'
import { EUDataProtectionPopup } from '@/components/eu-data-protection-popup'
import { PublicExtras } from '@/components/public-extras'
import { PublicContentGuard } from '@/components/content-protection'

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

export const metadata: Metadata = {
  title: 'Passive Blessings',
  description: 'Community platform for events, volunteering, and community support',
  generator: 'v0.app',
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
    title: 'Passive Blessings',
    description: 'Community platform for events, volunteering, and community support',
    type: 'website',
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
  return (
    <html lang="en" className={`${inter.variable} ${cormorantGaramond.variable}`} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Passive Blessings" />
      </head>
      <body className="font-body antialiased bg-background text-foreground">
        <Providers>{children}</Providers>
        <PublicContentGuard />
        <PublicExtras />
        <EUDataProtectionPopup />
        <ChatWidget />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
