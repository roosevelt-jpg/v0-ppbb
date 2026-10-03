'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { useEffect, useMemo, useState } from 'react';
import { isClerkConfigured } from '@/lib/clerk-config';
import { WorkspaceSwitcher } from '@/components/workspace-switcher';
import {
  CONSOLE_NAV,
  filterNav,
  groupHasActive,
  isNavItemActive,
  type NavGroup,
} from '@/lib/console-nav';

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      aria-hidden
      style={{
        transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
        transition: 'transform 0.15s ease',
        opacity: 0.55,
        flexShrink: 0,
      }}
    >
      <path d="M4 2.5L8 6L4 9.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function NavGroupBlock({
  group,
  pathname,
  searching,
}: {
  group: NavGroup;
  pathname: string;
  searching: boolean;
}) {
  const activeInGroup = groupHasActive(pathname, group);
  const [open, setOpen] = useState(!group.collapsible || activeInGroup);

  useEffect(() => {
    if (searching || activeInGroup) setOpen(true);
  }, [searching, activeInGroup]);

  const showItems = !group.collapsible || open || searching;

  return (
    <div className="vl-nav-group">
      <button
        type="button"
        className="vl-nav-group-label"
        onClick={() => group.collapsible && setOpen((v) => !v)}
        aria-expanded={showItems}
        style={{ cursor: group.collapsible ? 'pointer' : 'default' }}
      >
        {group.collapsible ? <Chevron open={showItems} /> : <span style={{ width: 12 }} />}
        <span>{group.label}</span>
      </button>
      {showItems ? (
        <ul className="vl-nav-list">
          {group.items.map((item) => {
            const active =
              pathname === item.href || isNavItemActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link href={item.href} className={`vl-nav-link${active ? ' is-active' : ''}`}>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [query, setQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const groups = useMemo(() => filterNav(query), [query]);
  const searching = query.trim().length > 0;

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="vl-console">
      <aside className={`vl-sidebar${mobileOpen ? ' is-open' : ''}`}>
        <div className="vl-sidebar-top">
          <Link href="/dashboard" className="vl-brand">
            VerbaLab
          </Link>
          <p className="vl-brand-sub">Language intelligence console</p>
          <label className="vl-sidebar-search">
            <span className="vl-sr-only">Search console</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products…"
              className="vl-field vl-sidebar-search-input"
            />
          </label>
        </div>

        <nav className="vl-sidebar-nav" aria-label="Console">
          {groups.map((group) => (
            <NavGroupBlock
              key={group.id}
              group={group}
              pathname={pathname}
              searching={searching}
            />
          ))}
          {groups.length === 0 ? (
            <p className="vl-nav-empty">No matches for “{query.trim()}”.</p>
          ) : null}
        </nav>

        <div className="vl-sidebar-foot">
          <WorkspaceSwitcher />
          {isClerkConfigured() ? <UserButton afterSignOutUrl="/" /> : null}
        </div>
      </aside>

      {mobileOpen ? (
        <button
          type="button"
          className="vl-sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <div className="vl-console-main">
        <header className="vl-console-topbar">
          <button
            type="button"
            className="vl-btn vl-btn-secondary vl-mobile-nav-btn"
            onClick={() => setMobileOpen((v) => !v)}
          >
            Menu
          </button>
          <div className="vl-topbar-links">
            {(CONSOLE_NAV.find((g) => g.id === 'products')?.items ?? []).slice(0, 4).map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`vl-topbar-link${active ? ' is-active' : ''}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
          <Link href="/docs" className="vl-topbar-docs">
            Docs
          </Link>
        </header>
        <main className="vl-console-content vl-fade-up">{children}</main>
      </div>
    </div>
  );
}
