import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from 'next';
import { DM_Sans, Syne } from 'next/font/google';
import './globals.css';
import { isClerkConfigured } from '@/lib/clerk-config';
import { verbalabClerkAppearance } from '@/lib/clerk-appearance';
import { SentryInit } from '@/components/sentry-init';
import { Providers } from '@/components/providers';

const display = Syne({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['600', '700', '800'],
});

const body = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'),
  ),
  title: {
    default: "VerbaLab — Africa's voice intelligence platform",
    template: '%s | VerbaLab',
  },
  description:
    "Africa's voice intelligence platform — speak, translate, clone, and reason across African languages.",
  openGraph: {
    type: 'website',
    siteName: 'VerbaLab',
    title: "VerbaLab — Africa's voice intelligence platform",
    description:
      'Speak, translate, clone, and reason across African languages — creative, agents, and APIs.',
    images: [{ url: '/cms/og-default.svg', width: 1200, height: 630, alt: 'VerbaLab' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "VerbaLab — Africa's voice intelligence platform",
    description:
      'Speak, translate, clone, and reason across African languages — creative, agents, and APIs.',
    images: ['/cms/og-default.svg'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <body>
        <SentryInit />
        <Providers>
          {isClerkConfigured() ? (
            <ClerkProvider
              appearance={verbalabClerkAppearance}
              signInFallbackRedirectUrl="/dashboard"
              signUpFallbackRedirectUrl="/dashboard"
              afterSignOutUrl="/"
            >
              {children}
            </ClerkProvider>
          ) : (
            children
          )}
        </Providers>
      </body>
    </html>
  );
}
