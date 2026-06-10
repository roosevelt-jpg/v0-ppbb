import { Analytics } from '@vercel/analytics/next'
import type { Metadata } from 'next'
import { DM_Sans, Playfair_Display } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const dmSans = DM_Sans({ variable: '--font-dm-sans', subsets: ['latin'] })
const playfairDisplay = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  weight: ['400', '700'],
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
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${playfairDisplay.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-foreground">
        <Providers>{children}</Providers>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
