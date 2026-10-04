'use client';

import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { resolveApiToken } from '@/lib/dev-auth';
import { formatDateTime, formatUtc } from '@/lib/format-date';
import { AppShell } from '@/components/app-shell';

type PlanCard = {
  id: string;
  name: string;
  monthlyCredits: number;
  priceUsdMonthly: number | null;
  priceUsdAnnualEffective: number | null;
  seats: number;
  concurrency: number;
  commercialLicense: boolean;
  instantVoiceCloning: boolean;
  professionalVoiceCloning: boolean;
  blurb: string;
  highlights: string[];
  stripeConfigured: boolean;
};

type BillingSummary = {
  plan: string;
  planName: string;
  billingStatus: string;
  characterQuota: number;
  charactersUsed: number;
  charactersRemaining: number;
  monthlyCredits?: number;
  creditsUsed?: number;
  creditsRemaining?: number;
  priceUsdMonthly?: number | null;
  commercialLicense?: boolean;
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
  pricingModel?: string;
};

type MemberRow = {
  id: string;
  role: string;
  createdAt: string;
  user: { id: string; email: string | null; name: string | null };
};

type Catalog = {
  plans: PlanCard[];
  credits: { note: string; rates: Record<string, { creditsPerUnit: number; unit: string; note: string }> };
};

export function BillingClient() {
  const { getToken, isLoaded } = useAuth();
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const token = await resolveApiToken(getToken);
    if (!token) throw new Error('Not signed in');
    const [billing, memberRows, plans] = await Promise.all([
      apiFetch<BillingSummary>('/v1/billing/summary', { token }),
      apiFetch<MemberRow[]>('/v1/organization/members', { token }),
      apiFetch<Catalog>('/v1/billing/plans', { token }),
    ]);
    setSummary(billing);
    setMembers(memberRows);
    setCatalog(plans);
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') setNotice('Upgrade complete — your card is saved for auto-debit renewals.');
    if (params.get('card') === 'saved') setNotice('Card saved. Future invoices auto-debit this payment method.');
    if (params.get('checkout') === 'cancel') setNotice('Checkout canceled — no charge was made.');
    void load().catch((err: Error) => setError(err.message));
  }, [isLoaded, load]);

  async function startCheckout(planId = 'pro') {
    setError(null);
    setBusy(true);
    try {
      const token = await resolveApiToken(getToken);
      if (!token) throw new Error('Not signed in');
      const res = await apiFetch<{ url: string | null }>('/v1/billing/checkout', {
        method: 'POST',
        token,
        body: JSON.stringify({ planId }),
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

  const creditsUsed = summary?.creditsUsed ?? summary?.charactersUsed ?? 0;
  const creditsQuota = summary?.monthlyCredits ?? summary?.characterQuota ?? 0;
  const creditsRemaining = summary?.creditsRemaining ?? summary?.charactersRemaining ?? 0;

  const cardLabel =
    summary?.cardBrand && summary?.cardLast4
      ? `${summary.cardBrand.toUpperCase()} •••• ${summary.cardLast4}`
      : summary?.hasDefaultPaymentMethod
        ? 'Card on file'
        : 'No card on file';

  const selfServePlans = (catalog?.plans ?? []).filter((p) => p.id !== 'enterprise');

  return (
    <AppShell>
      <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', fontSize: '2rem' }}>
        Billing
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0.5rem 0 0', maxWidth: '46rem' }}>
        Shared monthly credits across TTS, STT, music, SFX, dubbing, and translate — with one VerbaLab Creative Platform credit pool. Your card stays on file for auto-debit; VerbaLab never stores raw card numbers.
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
            <Stat label="Credits used" value={creditsUsed.toLocaleString()} />
            <Stat label="Credits / mo" value={creditsQuota.toLocaleString()} />
            <Stat label="Requests" value={summary.requests.toLocaleString()} />
          </div>

          <div className="vl-panel" style={{ padding: '1.25rem' }}>
            <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
              Status: <strong style={{ color: 'var(--ink)' }}>{summary.billingStatus}</strong>
              {' · '}
              Remaining this period: {creditsRemaining.toLocaleString()} credits
              {summary.commercialLicense ? ' · commercial license' : ' · non-commercial'}
            </div>
            <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '0.45rem' }}>
              Period started: {formatUtc(summary.periodStart)}
              {summary.pricingModel ? ` · model: ${summary.pricingModel}` : null}
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
                Stripe is not configured yet. Add <code className="vl-code">STRIPE_SECRET_KEY</code>, price IDs (
                <code className="vl-code">STRIPE_PRICE_ID_STARTER</code> … <code className="vl-code">PRO</code>),{' '}
                <code className="vl-code">STRIPE_WEBHOOK_SECRET</code>, and billing URLs to{' '}
                <code className="vl-code">apps/api/.env</code>.
              </p>
            ) : null}
          </div>

          <div className="vl-panel" style={{ padding: '1.25rem' }}>
            <h2 style={{ margin: '0 0 0.35rem', fontSize: '1.15rem' }}>Plans</h2>
            <p style={{ color: 'var(--muted)', margin: '0 0 1rem', fontSize: '0.9rem' }}>
              Free → Starter → Creator → Pro → Scale → Business (Enterprise custom). Credits are shared across every
              product.
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '0.85rem',
              }}
            >
              {selfServePlans.map((plan) => {
                const current = summary.plan === plan.id;
                const price =
                  plan.priceUsdMonthly == null
                    ? 'Custom'
                    : plan.priceUsdMonthly === 0
                      ? '$0'
                      : `$${plan.priceUsdMonthly}`;
                return (
                  <div
                    key={plan.id}
                    style={{
                      border: current ? '2px solid var(--brand)' : '1px solid var(--line)',
                      borderRadius: 14,
                      padding: '1rem',
                      display: 'grid',
                      gap: '0.55rem',
                      background: 'var(--bg)',
                    }}
                  >
                    <div style={{ fontWeight: 750, fontFamily: 'var(--font-display)' }}>{plan.name}</div>
                    <div style={{ fontSize: '1.45rem', fontWeight: 700 }}>
                      {price}
                      {plan.priceUsdMonthly != null && plan.priceUsdMonthly > 0 ? (
                        <span style={{ fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 500 }}> / mo</span>
                      ) : null}
                    </div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                      {plan.monthlyCredits.toLocaleString()} credits / month
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.82rem', color: 'var(--ink)' }}>
                      {plan.highlights.slice(0, 4).map((h) => (
                        <li key={h}>{h}</li>
                      ))}
                    </ul>
                    {plan.id === 'free' ? (
                      <button type="button" className="vl-btn vl-btn-secondary" disabled>
                        {current ? 'Current plan' : 'Included'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={`vl-btn ${current ? 'vl-btn-secondary' : 'vl-btn-primary'}`}
                        disabled={
                          busy ||
                          current ||
                          !summary.stripeConfigured ||
                          summary.fraudHold ||
                          !plan.stripeConfigured
                        }
                        onClick={() => void startCheckout(plan.id)}
                      >
                        {current ? 'Current plan' : `Upgrade to ${plan.name}`}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            {catalog?.credits?.note ? (
              <p style={{ color: 'var(--muted)', fontSize: '0.82rem', margin: '1rem 0 0' }}>{catalog.credits.note}</p>
            ) : null}
          </div>

          <div className="vl-panel" style={{ padding: '1.25rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Members</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: '0.4rem 0 1rem' }}>
              Invite teammates in Clerk Organizations. Seat limits follow your plan (Scale 3 · Business 10). Manage roles
              on{' '}
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
