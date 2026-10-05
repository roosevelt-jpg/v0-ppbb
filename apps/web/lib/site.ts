/** Public site origin for canonical URLs, sitemap, and Open Graph. */
export function getSiteUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (fromEnv) {
    return fromEnv.startsWith('http') ? fromEnv.replace(/\/$/, '') : `https://${fromEnv.replace(/\/$/, '')}`;
  }
  if (process.env.VERCEL_URL?.trim()) {
    return `https://${process.env.VERCEL_URL.trim().replace(/\/$/, '')}`;
  }
  return 'http://localhost:3000';
}
