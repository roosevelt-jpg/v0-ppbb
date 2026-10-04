'use client';

import type { ReactNode } from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { SupportBot } from '@/components/support-bot';
import { BrandAssets } from '@/components/brand-assets';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider defaultTheme="system">
      <BrandAssets />
      {children}
      <SupportBot />
    </ThemeProvider>
  );
}
