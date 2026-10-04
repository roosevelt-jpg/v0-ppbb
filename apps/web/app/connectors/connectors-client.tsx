'use client';

import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch, API_URL } from '@/lib/api';
import { resolveApiToken } from '@/lib/dev-auth';
import { AppShell } from '@/components/app-shell';

type ConnectorType = 'slack' | 'webhook' | 'http' | 'discord' | 'email';

type ConnectorDef = {
  type: ConnectorType;
  name: string;
  status: string;
  description: string;
  installPath: string;
  invokePath: string;
  notes: string;
};

type ConnectorsList = {
  types: ConnectorDef[];
  honesty?: Record<string, unknown>;
};

type SlackStatus = {
  provider: string;
  signingSecretConfigured: boolean;
  botTokenConfigured: boolean;
  disabled: boolean;
  commandsUrl: string;
  eventsUrl: string;
};

type Installation = {
  id: string;
  type?: string;
  teamId?: string;
  teamName?: string | null;
  label?: string;
  defaultTargetLang?: string;
  config?: Record<string, unknown>;
  createdAt: string;
};

const TYPE_DEFAULTS: Record<ConnectorType, { label: string; configHint: string }> = {
  slack: { label: 'Slack workspace', configHint: '{"teamId":"T…","teamName":"Acme","defaultTargetLang":"sw"}' },
  webhook: { label: 'Webhook endpoint', configHint: '{"url":"https://example.com/hooks/verbalab"}' },
  http: { label: 'HTTP API', configHint: '{"url":"https://api.example.com/hook","method":"POST"}' },
  discord: { label: 'Discord webhook', configHint: '{"url":"https://discord.com/api/webhooks/…"}' },
  email: { label: 'Email notify', configHint: '{"to":"ops@example.com"}' },
};

export function ConnectorsClient() {
  const { getToken, isLoaded } = useAuth();
  const [catalog, setCatalog] = useState<ConnectorsList | null>(null);
  const [status, setStatus] = useState<SlackStatus | null>(null);
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [selectedType, setSelectedType] = useState<ConnectorType>('slack');
  const [label, setLabel] = useState('');
  const [configJson, setConfigJson] = useState(TYPE_DEFAULTS.slack.configHint);
  const [invokeText, setInvokeText] = useState('Habari dunia');
  const [invokeTarget, setInvokeTarget] = useState('en');
  const [invokeResult, setInvokeResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const token = await resolveApiToken(getToken);
    if (!token) throw new Error('Not signed in');
    const [list, st, installPayload] = await Promise.all([
      apiFetch<ConnectorsList>('/v1/connectors', { token }),
      apiFetch<SlackStatus>('/v1/connectors/slack/status', { token }).catch(() => null),
      apiFetch<{ installations?: Installation[] } | Installation[]>('/v1/connectors/installations', {
        token,
      }).catch(() => ({ installations: [] as Installation[] })),
    ]);
    setCatalog(list);
    setStatus(st);
    const rows = Array.isArray(installPayload)
      ? installPayload
      : (installPayload.installations ?? []);
    setInstallations(rows);
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    void load().catch((err: Error) => setError(err.message));
  }, [isLoaded, load]);

  useEffect(() => {
    setConfigJson(TYPE_DEFAULTS[selectedType].configHint);
    setLabel('');
  }, [selectedType]);

  async function saveInstallation() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const token = await resolveApiToken(getToken);
      if (!token) throw new Error('Not signed in');
      let config: Record<string, unknown>;
      try {
        config = JSON.parse(configJson) as Record<string, unknown>;
      } catch {
        throw new Error('Config must be valid JSON');
      }
      await apiFetch(`/v1/connectors/${selectedType}/install`, {
        method: 'POST',
        token,
        body: JSON.stringify({
          label: label || undefined,
          config,
        }),
      });
      setMessage(`${selectedType} connector installed.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  async function invokeSelected() {
    setBusy(true);
    setError(null);
    setInvokeResult(null);
    try {
      const token = await resolveApiToken(getToken);
      if (!token) throw new Error('Not signed in');
      const payload: Record<string, unknown> =
        selectedType === 'slack' || selectedType === 'discord'
          ? { text: invokeText, target: invokeTarget, translate: true }
          : selectedType === 'email'
            ? { message: invokeText, subject: 'VerbaLab connector' }
            : selectedType === 'webhook'
              ? { event: 'connector.test', data: { text: invokeText } }
              : { body: { text: invokeText } };
      const out = await apiFetch<{ ok: boolean; result?: unknown }>(
        `/v1/connectors/${selectedType}/invoke`,
        {
          method: 'POST',
          token,
          body: JSON.stringify({ payload }),
        },
      );
      setInvokeResult(JSON.stringify(out, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invoke failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', fontSize: '2rem' }}>
        Connectors
      </h1>
      <p style={{ color: 'var(--muted)', margin: '0.5rem 0 0' }}>
        Install and invoke Slack, webhook, HTTP, Discord, and email connectors. Not a Zapier clone —
        each type has a focused install/invoke path.
      </p>

      {error ? <p style={{ color: 'var(--bad)' }}>{error}</p> : null}
      {message ? <p style={{ color: 'var(--muted)' }}>{message}</p> : null}

      <div style={{ marginTop: '1.5rem', display: 'grid', gap: '1.25rem', maxWidth: '46rem' }}>
        <section className="vl-panel" style={{ padding: '1.25rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Connector types</h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0.75rem 0 0', display: 'grid', gap: '0.65rem' }}>
            {(catalog?.types ?? []).map((row) => (
              <li key={row.type} style={{ borderTop: '1px solid var(--line)', paddingTop: '0.55rem' }}>
                <button
                  type="button"
                  className="vl-btn vl-btn-secondary"
                  style={{ marginRight: '0.5rem' }}
                  onClick={() => setSelectedType(row.type)}
                  disabled={busy}
                >
                  {row.name}
                </button>
                <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{row.description}</span>
                <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
                  <code className="vl-code">{row.installPath}</code>
                  {' · '}
                  <code className="vl-code">{row.invokePath}</code>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="vl-panel" style={{ padding: '1.25rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>
            Install {TYPE_DEFAULTS[selectedType].label}
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: '0.4rem 0 1rem' }}>
            Selected type: <strong style={{ color: 'var(--ink)' }}>{selectedType}</strong>
          </p>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <input
              className="vl-input"
              placeholder="Label (optional)"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              disabled={busy}
            />
            <textarea
              className="vl-input"
              rows={4}
              value={configJson}
              onChange={(e) => setConfigJson(e.target.value)}
              disabled={busy}
              style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.85rem' }}
            />
            <button
              type="button"
              className="vl-btn vl-btn-primary"
              disabled={busy}
              onClick={() => void saveInstallation()}
            >
              Install {selectedType}
            </button>
          </div>
        </section>

        <section className="vl-panel" style={{ padding: '1.25rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Invoke {selectedType}</h2>
          <div style={{ display: 'grid', gap: '0.75rem', marginTop: '0.75rem' }}>
            <input
              className="vl-input"
              value={invokeText}
              onChange={(e) => setInvokeText(e.target.value)}
              disabled={busy}
              placeholder="Text / message"
            />
            {(selectedType === 'slack' || selectedType === 'discord') && (
              <input
                className="vl-input"
                value={invokeTarget}
                onChange={(e) => setInvokeTarget(e.target.value)}
                disabled={busy}
                placeholder="Target lang"
              />
            )}
            <button
              type="button"
              className="vl-btn"
              disabled={busy}
              onClick={() => void invokeSelected()}
            >
              Invoke
            </button>
            {invokeResult ? (
              <pre
                style={{
                  margin: 0,
                  padding: '0.75rem',
                  background: 'var(--bg-soft)',
                  border: '1px solid var(--line)',
                  borderRadius: '0.4rem',
                  fontSize: '0.8rem',
                  overflow: 'auto',
                }}
              >
                {invokeResult}
              </pre>
            ) : null}
          </div>
        </section>

        {status ? (
          <section className="vl-panel" style={{ padding: '1.25rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Slack signing endpoints</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: '0.4rem 0 1rem' }}>
              Signing secret: {status.signingSecretConfigured ? 'configured' : 'missing'} · Bot token:{' '}
              {status.botTokenConfigured ? 'configured' : 'optional'}
              {status.disabled ? ' · DISABLED' : ''}
            </p>
            <div style={{ fontSize: '0.9rem', display: 'grid', gap: '0.35rem' }}>
              <div>
                Slash Request URL:{' '}
                <code className="vl-code">
                  {API_URL}
                  {status.commandsUrl}
                </code>
              </div>
              <div>
                Events URL:{' '}
                <code className="vl-code">
                  {API_URL}
                  {status.eventsUrl}
                </code>
              </div>
            </div>
          </section>
        ) : null}

        <section className="vl-panel" style={{ padding: '1.25rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Installations</h2>
          {installations.length === 0 ? (
            <p style={{ color: 'var(--muted)', marginBottom: 0 }}>None yet.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: '0.75rem 0 0', display: 'grid', gap: '0.5rem' }}>
              {installations.map((row) => (
                <li key={row.id} style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                  <strong style={{ color: 'var(--ink)' }}>{row.teamName ?? row.teamId ?? row.label}</strong>
                  {row.teamId ? ` · ${row.teamId}` : ''}
                  {row.defaultTargetLang ? ` · default ${row.defaultTargetLang}` : ''}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}
