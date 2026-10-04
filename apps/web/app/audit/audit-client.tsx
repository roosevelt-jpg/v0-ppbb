'use client';

import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { resolveApiToken } from '@/lib/dev-auth';
import { formatDateTime } from '@/lib/format-date';
import { AppShell } from '@/components/app-shell';

type AuditRow = {
  id: string;
  action: string;
  route: string | null;
  ip: string | null;
  apiKeyPrefix: string | null;
  createdAt: string;
  user: { id: string; email: string | null; name: string | null } | null;
  metadata: Record<string, unknown> | null;
};

export function AuditClient() {
  const { getToken, isLoaded } = useAuth();
  const [events, setEvents] = useState<AuditRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const token = await resolveApiToken(getToken);
    if (!token) throw new Error('Not signed in');
    const data = await apiFetch<AuditRow[]>('/v1/audit-events?limit=100', { token });
    setEvents(data);
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    setError(null);
    void load().catch((err: Error) => setError(err.message));
  }, [isLoaded, load]);

  async function onRefresh() {
    setRefreshing(true);
    setError(null);
    try {
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh audit log');
    } finally {
      setRefreshing(false);
    }
  }

  const filtered = useMemo(() => {
    if (!events) return [];
    const q = filter.trim().toLowerCase();
    if (!q) return events;
    return events.filter((event) => {
      const hay = [
        event.action,
        event.route ?? '',
        event.ip ?? '',
        event.apiKeyPrefix ?? '',
        event.user?.email ?? '',
        event.user?.name ?? '',
        event.createdAt,
        event.metadata ? JSON.stringify(event.metadata) : '',
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [events, filter]);

  return (
    <AppShell>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', fontSize: '2rem' }}>
            Audit log
          </h1>
          <p style={{ color: 'var(--muted)', margin: '0.5rem 0 0' }}>
            Sign-ins, API key changes, and translate calls for your organization (owners and admins).
            Timestamps are live from the server (ISO → local time).
          </p>
        </div>
        <button
          type="button"
          className="vl-btn vl-btn-secondary"
          disabled={!isLoaded || refreshing || events === null}
          onClick={() => void onRefresh()}
        >
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {error ? <p style={{ color: 'var(--bad)' }}>{error}</p> : null}

      {events === null && !error ? (
        <p style={{ color: 'var(--muted)', marginTop: '1.5rem' }}>Loading audit events…</p>
      ) : null}

      {events !== null ? (
        <>
          <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              className="vl-field"
              placeholder="Filter by action, route, user, IP…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ flex: '1 1 16rem', maxWidth: 420 }}
            />
            <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
              Showing {filtered.length} of {events.length} (limit 100)
            </span>
          </div>

          {filtered.length === 0 ? (
            <p style={{ color: 'var(--muted)', marginTop: '1.25rem' }}>
              {events.length === 0 ? 'No audit events yet.' : 'No events match this filter.'}
            </p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: '1.25rem 0 0', display: 'grid', gap: '0.65rem' }}>
              {filtered.map((event) => {
                const hasMeta = event.metadata && Object.keys(event.metadata).length > 0;
                const open = expandedId === event.id;
                return (
                  <li key={event.id} className="vl-panel" style={{ padding: '0.95rem 1.05rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontWeight: 650 }}>{event.action}</div>
                        <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                          {event.route ?? '—'}
                          {event.apiKeyPrefix ? ` · ${event.apiKeyPrefix}…` : ''}
                          {event.ip ? ` · ${event.ip}` : ''}
                        </div>
                        {event.user?.email ? (
                          <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                            {event.user.name ?? event.user.email}
                          </div>
                        ) : null}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="vl-code" style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>
                          {formatDateTime(event.createdAt)}
                        </div>
                        {hasMeta ? (
                          <button
                            type="button"
                            onClick={() => setExpandedId(open ? null : event.id)}
                            style={{
                              marginTop: '0.4rem',
                              fontSize: '0.8rem',
                              color: 'var(--accent)',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: 0,
                            }}
                          >
                            {open ? 'Hide metadata' : 'Show metadata'}
                          </button>
                        ) : null}
                      </div>
                    </div>
                    {open && hasMeta ? (
                      <pre
                        className="vl-code"
                        style={{
                          margin: '0.75rem 0 0',
                          padding: '0.75rem',
                          background: 'var(--bg-soft)',
                          borderRadius: 10,
                          overflow: 'auto',
                          fontSize: '0.8rem',
                        }}
                      >
                        {JSON.stringify(event.metadata, null, 2)}
                      </pre>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </>
      ) : null}
    </AppShell>
  );
}
