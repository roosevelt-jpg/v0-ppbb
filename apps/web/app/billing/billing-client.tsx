'use client';

import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { resolveApiToken } from '@/lib/dev-auth';
import { formatDateTime, formatUtc } from '@/lib/format-date';
import { AppShell } from '@/components/app-shell';

type BillingSummary = {
  plan: string;
  planName: string;
  billingStatus: string;
  characterQuota: number;
  charactersUsed: number;
  charactersRemaining: number;
  periodStart: string;
  requests: number;
  stripeConfigured: boolean;
  hasCustomer: boolean;
  hasDefaultPaymentMethod?: boolean;
  autoDebitEnabled?: boolean;
  cardBrand?: string | null;
  cardLast4?: string | null;
  paymentFailureCount?: number;
  fraudHold?: boolean;
};

type MemberRow = {
  id: string;
  role: string;
  createdAt: string;
  user: { id: string; email: string | null; name: string | null };
};

export function BillingClient() {
  const { getToken, isLoaded } = useAuth();
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const token = await resolveApiToken(getToken);
    if (!token) throw new Error('Not signed in');
    const [billing, memberRows] = await Promise.all([
      apiFetch<BillingSummary>('/v1/billing/summary', { token }),
      apiFetch<MemberRow[]>('/v1/organization/members', { token }),
    ]);
    setSummary(billing);
    setMembers(memberRows);
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') setNotice('Upgrade complete — your card is saved for auto-debit renewals.');
    if (params.get('card') === 'saved') setNotice('Card saved. Future invoices auto-debit this payment method.');
    if (params.get('checkout') === 'cancel') setNotice('Checkout canceled — no charge was made.');
    void load().catch((err: Error) => setError(err.message));
  }, [isLoaded, load]);

  async function startCheckout() {
    setError(null);
    setBusy(true);
    try {
      const token = await resolveApiToken(getToken);
      if (!token) throw new Error('Not signed in');
      const res = await apiFetch<{ url: string | null }>('/v1/billing/checkout', {
        method: 'POST',
        token,
      });
      if (!res.url) throw new Error('Stripe did not return a checkout URL');
      window.location.href = res.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
      setBusy(false);
    }
  }

  async function saveCard() {
    setError(null);
    setBusy(true);
    try {
      const token = await resolveApiToken(getToken);
      if (!token) throw new Error('Not signed in');
      const res = await apiFetch<{ url: string | null }>('/v1/billing/setup-card', {
        method: 'POST',
        token,
      });
      if (!res.url) throw new Error('Stripe did not return a setup URL');
      window.location.href = res.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start card setup');
      setBusy(false);
    }
  }

  async function openPortal() {
    setError(null);
    setBusy(true);
    try {
      const token = await resolveApiToken(getToken);
      if (!token) throw new Error('Not signed in');
      const res = await apiFetch<{ url: string }>('/v1/billing/portal', {
        method: 'POST',
        token,
      });
      window.location.href = res.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Portal failed');
      setBusy(false);
    }
  }

  async function syncCard() {
    setError(null);
    setBusy(true);
    try {
      const token = await resolveApiToken(getToken);
      if (!token) throw new Error('Not signed in');
      await apiFetch('/v1/billing/sync-payment-method', { method: 'POST', token });
      await load();
      setNotice('Synced default card from Stripe for auto-debit.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setBusy(false);
    }
  }

  const cardLabel =
    summary?.cardBrand && summary?.cardLast4
      ? `${summary.cardBrand.toUpperCase()} •••• ${summary.cardLast4}`
      : summary?.hasDefaultPaymentMethod
        ? 'Card on file'
        : 'No card on file';

  return (
    <AppShell>
      <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', fontSize: '2rem' }}>
        Billing
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0.5rem 0 0' }}>
        Upgrade with Stripe Checkout. Your card is saved as the default payment method and used for every
        auto-debit renewal — VerbaLab never stores raw card numbers.
      </p>

      {error ? <p style={{ color: 'var(--bad)' }}>{error}</p> : null}
      {notice ? <p style={{ color: 'var(--brand)' }}>{notice}</p> : null}

      {summary ? (
        <div style={{ marginTop: '1.5rem', display: 'grid', gap: '1rem' }}>
          <div
            className="vl-panel"
            style={{
              padding: '1.35rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              gap: '1rem',
              background: 'var(--bg-soft)',
              border: 'none',
            }}
          >
            <Stat label="Plan" value={summary.planName} />
            <Stat label="Used" value={`${summary.charactersUsed.toLocaleString()} chars`} />
            <Stat label="Quota" value={`${summary.characterQuota.toLocaleString()} / mo`} />
            <Stat label="Requests" value={summary.requests.toLocaleString()} />
          </div>

          <div className="vl-panel" style={{ padding: '1.25rem' }}>
            <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
              Status: <strong style={{ color: 'var(--ink)' }}>{summary.billingStatus}</strong>
              {' · '}
              Remaining this period: {summary.charactersRemaining.toLocaleString()} characters
            </div>
            <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '0.45rem' }}>
              Period started: {formatUtc(summary.periodStart)}
            </div>

            <div
              style={{
                marginTop: '1rem',
                padding: '0.9rem 1rem',
                borderRadius: 12,
                border: '1px solid var(--line)',
                background: 'var(--bg-soft)',
                display: 'grid',
                gap: '0.35rem',
              }}
            >
              <div style={{ fontWeight: 700 }}>Auto-debit card</div>
              <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                {cardLabel}
                {summary.autoDebitEnabled ? ' · auto-debit on' : ' · add a card to enable auto-debit'}
              </div>
              {summary.fraudHold ? (
                <div style={{ color: 'var(--bad)', fontSize: '0.9rem' }}>
                  Fraud hold active — API metering and upgrades are blocked until a valid card clears the hold.
                </div>
              ) : null}
              {(summary.paymentFailureCount ?? 0) > 0 && !summary.fraudHold ? (
                <div style={{ color: 'var(--bad)', fontSize: '0.9rem' }}>
                  Payment failures: {summary.paymentFailureCount}. Update your card to resume auto-debit.
                </div>
              ) : null}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.1rem', flexWrap: 'wrap' }}>
              {summary.plan !== 'pro' ? (
                <button
                  type="button"
                  className="vl-btn vl-btn-primary"
                  disabled={busy || !summary.stripeConfigured || summary.fraudHold}
                  onClick={() => void startCheckout()}
                >
                  Upgrade to Pro
                </button>
              ) : null}
              <button
                type="button"
                className="vl-btn vl-btn-primary"
                disabled={busy || !summary.stripeConfigured || summary.fraudHold}
                onClick={() => void saveCard()}
              >
                {summary.hasDefaultPaymentMethod ? 'Update card on file' : 'Add card for auto-debit'}
              </button>
              <button
                type="button"
                className="vl-btn vl-btn-secondary"
                disabled={busy || !summary.stripeConfigured || !summary.hasCustomer}
                onClick={() => void openPortal()}
              >
                Manage in Stripe portal
              </button>
              <button
                type="button"
                className="vl-btn vl-btn-secondary"
                disabled={busy || !summary.stripeConfigured || !summary.hasCustomer}
                onClick={() => void syncCard()}
              >
                Sync card status
              </button>
            </div>
            {!summary.stripeConfigured ? (
              <p style={{ color: 'var(--muted)', marginBottom: 0, marginTop: '1rem' }}>
                Stripe is not configured yet. Add <code className="vl-code">STRIPE_SECRET_KEY</code>,{' '}
                <code className="vl-code">STRIPE_PRICE_ID_PRO</code>,{' '}
                <code className="vl-code">STRIPE_WEBHOOK_SECRET</code>, and billing URLs to{' '}
                <code className="vl-code">apps/api/.env</code>. Webhooks must include{' '}
                <code className="vl-code">checkout.session.completed</code>,{' '}
                <code className="vl-code">invoice.paid</code>,{' '}
                <code className="vl-code">invoice.payment_failed</code>, and Radar/dispute events.
              </p>
            ) : (
              <p style={{ color: 'var(--muted)', marginBottom: 0, marginTop: '1rem', fontSize: '0.88rem' }}>
                Fraud controls: checkout rate limits, payment-failure locks, Radar early-fraud warnings, and
                dispute holds block abusive billing automatically.
              </p>
            )}
          </div>

          <div className="vl-panel" style={{ padding: '1.25rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Members</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: '0.4rem 0 1rem' }}>
              Invite teammates in Clerk Organizations. Manage roles on{' '}
              <a href="/identity" style={{ color: 'var(--accent)' }}>
                Identity
              </a>
              .
            </p>
            {members.length === 0 ? (
              <p style={{ color: 'var(--muted)', margin: 0 }}>No members loaded.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.5rem' }}>
                {members.map((m) => (
                  <li
                    key={m.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '1rem',
                      flexWrap: 'wrap',
                      padding: '0.65rem 0',
                      borderTop: '1px solid var(--line)',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>{m.user.name ?? m.user.email ?? m.user.id}</div>
                      <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{m.user.email}</div>
                      <div style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: '0.15rem' }}>
                        Joined {formatDateTime(m.createdAt)}
                      </div>
                    </div>
                    <div className="vl-code" style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                      {m.role}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : !error ? (
        <p style={{ color: 'var(--muted)' }}>Loading…</p>
      ) : null}
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: 'var(--bg)', borderRadius: 14, padding: '1rem', border: '1px solid var(--line)' }}>
      <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 700, marginTop: 4 }}>
        {value}
      </div>
    </div>
  );
}
