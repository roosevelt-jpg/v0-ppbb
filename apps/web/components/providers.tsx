'use client';

import type { ReactNode } from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { SupportBot } from '@/components/support-bot';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider defaultTheme="system">
      {children}
      <SupportBot />
    </ThemeProvider>
  );
}
