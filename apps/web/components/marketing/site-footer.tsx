'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { getDevBearer, resolveApiToken } from '@/lib/dev-auth';

export type FooterLink = {
  label: string;
  href: string;
  adminOnly?: boolean;
  authOnly?: boolean;
};

export type FooterColumn = {
  title: string;
  links: FooterLink[];
};

export type SiteFooterContent = {
  brand?: string;
  blurb?: string;
  logoUrl?: string;
  copyright?: string;
  links?: FooterLink[];
  columns?: FooterColumn[];
};

/** Company links that must stay hidden until a user/admin session exists. */
export const AUTH_GATED_FOOTER_HREFS = new Set(['/cms', '/dashboard', '/dev-login']);
const AUTH_GATED_FOOTER_LABELS = new Set(['CMS', 'Console', 'Dashboard', 'Brand & Press']);

export function isAuthGatedFooterLink(link: FooterLink): boolean {
  if (link.authOnly || link.adminOnly) return true;
  if (AUTH_GATED_FOOTER_HREFS.has(link.href)) return true;
  return AUTH_GATED_FOOTER_LABELS.has(link.label);
}

/** Mirrors marketing CMS seed footer columns in marketing-cms.catalog.ts. */
export const DEFAULT_SITE_FOOTER: SiteFooterContent = {
  brand: 'VerbaLab',
  blurb: "Africa's own voice — for trade, learning, creation, and public life.",
  columns: [
    {
      title: 'VerbaCreative',
      links: [
        { label: 'Text to Speech', href: '/products/text-to-speech' },
        { label: 'Speech to Text', href: '/products/speech-to-text' },
        { label: 'Voice Changer', href: '/products/voice-changer' },
        { label: 'Text to Sound Effects', href: '/products/text-to-sound-effects' },
        { label: 'Voice Cloning', href: '/products/voice-cloning' },
        { label: 'Voice Isolator', href: '/products/voice-isolator' },
        { label: 'AI Music Generator', href: '/products/ai-music-generator' },
        { label: 'Studio', href: '/products/studio' },
        { label: 'Voice Design', href: '/products/voice-design' },
        { label: 'AI Voice Generator', href: '/products/ai-voice-generator' },
        { label: 'AI Image Generator', href: '/products/ai-image-generator' },
        { label: 'AI Video Generator', href: '/products/ai-video-generator' },
        { label: 'Ads Engine', href: '/products/ads-engine' },
        { label: 'Dubbing', href: '/products/dubbing' },
      ],
    },
    {
      title: 'VerbaAgents',
      links: [
        { label: 'Voice Agents', href: '/products/voice-agents' },
        { label: 'Agent Voice Training', href: '/products/agent-voice-training' },
        { label: 'Conversational AI', href: '/products/conversational-ai' },
        { label: 'Integrations', href: '/products/integrations' },
        { label: 'Telecommunications', href: '/products/telecommunications' },
        { label: 'Financial Services', href: '/products/financial-services' },
        { label: 'Healthcare', href: '/products/healthcare' },
        { label: 'Government', href: '/products/government' },
        { label: 'Technology', href: '/products/technology' },
        { label: 'Retail & E-commerce', href: '/products/retail-ecommerce' },
        { label: 'Travel & Hospitality', href: '/products/travel-hospitality' },
        { label: 'Customer Support', href: '/products/customer-support' },
        { label: 'Chatbots', href: '/products/chatbots' },
        { label: 'Education', href: '/products/education' },
      ],
    },
    {
      title: 'VerbaAPI',
      links: [
        { label: 'API Reference', href: '/products/api-reference' },
        { label: 'Agents API', href: '/products/agents-api' },
        { label: 'Speech Engine', href: '/products/speech-engine' },
        { label: 'Dubbing API', href: '/products/dubbing-api' },
        { label: 'Text to Speech API', href: '/products/text-to-speech-api' },
        { label: 'Speech to Text API', href: '/products/speech-to-text-api' },
        { label: 'Sound Effects API', href: '/products/sound-effects-api' },
        { label: 'Music API', href: '/products/music-api' },
        { label: 'Translate API', href: '/products/translate-api' },
        { label: 'iOS SDK', href: '/products/ios-sdk' },
        { label: 'Android SDK', href: '/products/android-sdk' },
        { label: 'API Key', href: '/products/api-key' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { label: 'Docs', href: '/products/docs' },
        { label: 'OpenAPI explorer', href: '/products/openapi-explorer' },
        { label: 'Playground', href: '/products/playground' },
        { label: 'Marketplace', href: '/products/marketplace' },
        { label: 'Enterprise', href: '/products/enterprise' },
        { label: 'Trust Center', href: '/products/trust-center' },
        { label: 'Coverage', href: '/products/coverage' },
        { label: 'Developers', href: '/products/developers' },
      ],
    },
    {
      title: 'Socials',
      links: [
        { label: 'X', href: 'https://x.com' },
        { label: 'LinkedIn', href: 'https://www.linkedin.com' },
        { label: 'GitHub', href: 'https://github.com/roosevelt-jpg/verbalab' },
        { label: 'YouTube', href: 'https://www.youtube.com' },
        { label: 'Discord', href: 'https://discord.com' },
        { label: 'TikTok', href: 'https://www.tiktok.com' },
        { label: 'Instagram', href: 'https://www.instagram.com' },
        { label: 'Facebook', href: 'https://www.facebook.com' },
        { label: 'Reddit', href: 'https://www.reddit.com' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About', href: '/' },
        { label: 'Log in', href: '/sign-in' },
        { label: 'Safety', href: '#safety' },
        { label: 'Policies', href: '/data' },
        { label: 'Console', href: '/dev-login', authOnly: true },
        { label: 'Brand & Press', href: '/cms', authOnly: true },
        { label: 'CMS', href: '/cms', authOnly: true },
        { label: 'Dashboard', href: '/dashboard', authOnly: true },
      ],
    },
  ],
  links: [
    { label: 'Log in', href: '/sign-in' },
    { label: 'Docs', href: '/docs' },
    { label: 'Console', href: '/dev-login', authOnly: true },
    { label: 'CMS', href: '/cms', authOnly: true },
    { label: 'Dashboard', href: '/dashboard', authOnly: true },
  ],
};

function FooterAnchor({ link }: { link: FooterLink }) {
  if (link.href.startsWith('#')) {
    return <a href={link.href}>{link.label}</a>;
  }
  if (link.href.startsWith('http://') || link.href.startsWith('https://')) {
    return (
      <a href={link.href} rel="noopener noreferrer" target="_blank">
        {link.label}
      </a>
    );
  }
  return <Link href={link.href}>{link.label}</Link>;
}

type SiteFooterProps = {
  content?: SiteFooterContent;
  logoUrl?: string;
  copyright?: string;
  className?: string;
};

export function SiteFooter({
  content = DEFAULT_SITE_FOOTER,
  logoUrl,
  copyright: copyrightProp,
  className = 'vl-mkt-footer',
}: SiteFooterProps) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    let cancelled = false;
    void (async () => {
      try {
        const token = await resolveApiToken(getToken);
        if (!cancelled) setIsAuthed(Boolean(token) || Boolean(isSignedIn) || Boolean(getDevBearer()));
      } catch {
        if (!cancelled) setIsAuthed(Boolean(isSignedIn) || Boolean(getDevBearer()));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, getToken]);

  const links = (content.links ?? []).filter((link) => !isAuthGatedFooterLink(link) || isAuthed);
  const columns = (content.columns ?? [])
    .map((col) => ({
      ...col,
      links: col.links.filter((link) => !isAuthGatedFooterLink(link) || isAuthed),
    }))
    .filter((col) => col.links.length > 0);

  const brand = content.brand ?? DEFAULT_SITE_FOOTER.brand ?? 'VerbaLab';
  const footerLogo = logoUrl ?? content.logoUrl;
  const copyright =
    copyrightProp?.trim() ||
    content.copyright?.trim() ||
    `© ${new Date().getFullYear()} ${brand}. All rights reserved.`;

  return (
    <footer className={className}>
      <div className="vl-mkt-footer-brand">
        {footerLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={footerLogo} alt={brand} className="vl-mkt-footer-logo" />
        ) : (
          <strong>{brand}</strong>
        )}
        <span>{content.blurb ?? DEFAULT_SITE_FOOTER.blurb}</span>
      </div>
      {columns.length ? (
        <div className="vl-mkt-footer-cols">
          {columns.map((col) => (
            <div key={col.title}>
              <h4>{col.title}</h4>
              {col.links.map((link) => (
                <FooterAnchor key={`${col.title}-${link.href}-${link.label}`} link={link} />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div>
          {links.map((link) => (
            <FooterAnchor key={`${link.href}-${link.label}`} link={link} />
          ))}
        </div>
      )}
      <div className="vl-mkt-footer-copyright">{copyright}</div>
    </footer>
  );
}
