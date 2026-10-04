'use client';

import { useEffect } from 'react';
import { API_URL } from '@/lib/api';

type BrandSettings = {
  brandName?: string;
  faviconUrl?: string;
  headerLogoUrl?: string;
  footerLogoUrl?: string;
  primaryColor?: string;
  accentColor?: string;
};

function ensureLink(rel: string, href: string, extra?: Record<string, string>) {
  const selector = `link[data-vl-brand="${rel}"]`;
  let el = document.head.querySelector(selector) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('data-vl-brand', rel);
    document.head.appendChild(el);
  }
  el.rel = rel === 'shortcut' ? 'shortcut icon' : rel;
  el.href = href;
  if (extra) {
    for (const [k, v] of Object.entries(extra)) el.setAttribute(k, v);
  }
}

/** Loads CMS brand settings and applies favicon + CSS brand variables site-wide. */
export function BrandAssets() {
  useEffect(() => {
    let cancelled = false;
    void fetch(`${API_URL}/v1/cms/settings`)
      .then(async (res) => {
        if (!res.ok) return null;
        return res.json() as Promise<BrandSettings>;
      })
      .then((settings) => {
        if (cancelled || !settings) return;
        if (settings.faviconUrl) {
          ensureLink('icon', settings.faviconUrl, { type: 'image/png' });
          ensureLink('shortcut', settings.faviconUrl);
          ensureLink('apple-touch-icon', settings.faviconUrl);
        }
        if (settings.primaryColor) {
          document.documentElement.style.setProperty('--brand', settings.primaryColor);
        }
        if (settings.accentColor) {
          document.documentElement.style.setProperty('--mkt-accent', settings.accentColor);
        }
        if (settings.brandName) {
          document.documentElement.dataset.brandName = settings.brandName;
        }
      })
      .catch(() => {
        /* public settings optional offline */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
