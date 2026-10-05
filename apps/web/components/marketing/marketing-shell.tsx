import Link from 'next/link';
import type { ReactNode } from 'react';
import { ThemeSwitcher } from '@/components/theme-provider';
import { DEFAULT_SITE_FOOTER, SiteFooter } from '@/components/marketing/site-footer';

type MarketingShellProps = {
  brandName?: string;
  headerLogoUrl?: string;
  footerLogoUrl?: string;
  copyrightText?: string;
  navLinks?: ReactNode;
  actions?: ReactNode;
  className?: string;
  showFooter?: boolean;
  children: ReactNode;
};

const DEFAULT_ACTIONS = (
  <>
    <Link href="/sign-in" className="vl-mkt-link">
      Log in
    </Link>
    <Link href="/dev-login" className="vl-btn vl-btn-primary vl-mkt-cta">
      Open console
    </Link>
  </>
);

export function MarketingShell({
  brandName = 'VerbaLab',
  headerLogoUrl,
  footerLogoUrl,
  copyrightText,
  navLinks,
  actions = DEFAULT_ACTIONS,
  className,
  showFooter = true,
  children,
}: MarketingShellProps) {
  const rootClass = className ? `vl-mkt ${className}` : 'vl-mkt';

  return (
    <div className={rootClass}>
      <header className="vl-mkt-nav">
        <Link href="/" className="vl-mkt-brand">
          {headerLogoUrl ? (
            <img src={headerLogoUrl} alt={brandName} className="vl-mkt-brand-logo" />
          ) : (
            brandName
          )}
        </Link>
        {navLinks ? (
          <nav className="vl-mkt-nav-links" aria-label="Marketing">
            {navLinks}
          </nav>
        ) : null}
        <div className="vl-mkt-nav-actions">
          <ThemeSwitcher />
          {actions}
        </div>
      </header>
      {children}
      {showFooter ? (
        <SiteFooter
          content={{ ...DEFAULT_SITE_FOOTER, brand: brandName }}
          logoUrl={footerLogoUrl}
          copyright={copyrightText}
        />
      ) : null}
    </div>
  );
}
