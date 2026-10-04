'use client';

import type { ReactNode } from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { AfricaMapWatermark } from '@/components/africa-map-watermark';
import { SupportBot } from '@/components/support-bot';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider defaultTheme="system">
      <AfricaMapWatermark />
      {children}
      <SupportBot />
    </ThemeProvider>
  );
}
