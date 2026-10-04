import type { ComponentProps } from 'react';
import type { ClerkProvider } from '@clerk/nextjs';

type ClerkAppearance = NonNullable<ComponentProps<typeof ClerkProvider>['appearance']>;

/**
 * VerbaLab-branded Clerk UI. Vendor "Secured by Clerk" badge is controlled in the
 * Clerk Dashboard (Settings → Branding → Remove "Secured by Clerk") — required on
 * a paid plan for production. CSS in globals.css also hides remaining clerk.com chrome.
 */
export const verbalabClerkAppearance: ClerkAppearance = {
  layout: {
    logoImageUrl: '/email/verbalab-logo.svg',
    logoLinkUrl: '/',
    logoPlacement: 'inside',
    showOptionalFields: false,
    socialButtonsPlacement: 'bottom',
    socialButtonsVariant: 'blockButton',
  },
  variables: {
    colorPrimary: '#0f766e',
    colorTextOnPrimaryBackground: '#ffffff',
    borderRadius: '0.65rem',
    fontFamily: 'var(--font-body), ui-sans-serif, system-ui, sans-serif',
  },
  elements: {
    logoBox: { justifyContent: 'center' },
    logoImage: { height: '1.75rem', width: 'auto' },
    // Keep VerbaLab page-level sign-in/up links; hide Clerk's duplicate footer CTA row.
    footerAction: { display: 'none' },
    footer: { display: 'none' },
    badge: { display: 'none' },
  },
};
