'use client';

import { useMemo, useState } from 'react';
import { API_URL, apiFetch } from '@/lib/api';
import { getDevBearer } from '@/lib/dev-auth';
import type { ProductApiEndpoint } from '@/lib/product-stories';

type Props = {
  endpoints: ProductApiEndpoint[];
  sampleCode: string;
  productName: string;
};

export function ProductApiGuide({ endpoints, sampleCode, productName }: Props) {
  const [apiKey, setApiKey] = useState('');
  const [active, setActive] = useState(endpoints[0]?.path ?? '');
  const [result, setResult] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selected = useMemo(
    () => endpoints.find((e) => e.path === active) ?? endpoints[0],
    [active, endpoints],
  );

  const curl = useMemo(() => {
    if (!selected) return '';
    const auth =
      selected.method === 'GET' && selected.path === '/v1/languages'
        ? ''
        : ` \\\n  -H "Authorization: Bearer ${apiKey || getDevBearer() || 'vl_test_...'}"`;
    if (selected.method === 'GET') {
      return `curl "${API_URL}${selected.path}"${auth}`;
    }
    const body =
      selected.path.includes('translate')
        ? `{"text":"Goods leave Lagos tomorrow","source":"en","target":"sw"}`
        : selected.path.includes('detect')
          ? `{"text":"Sannu da zuwa"}`
          : selected.path.includes('chat')
            ? `{"messages":[{"role":"user","content":"Habari"}]}`
            : selected.path.includes('speech')
              ? `{"text":"Karibu","voice":"own:sw-aisha","format":"mp3"}`
              : `{}`;
    return `curl -X ${selected.method} "${API_URL}${selected.path}"${auth} \\\n  -H "Content-Type: application/json" \\\n  -d '${body}'`;
  }, [selected, apiKey]);

  async function runSelected() {
    if (!selected) return;
    setLoading(true);
    setError(null);
    setResult('');
    try {
      const token =
        getDevBearer() ||
        (apiKey.startsWith('vl_') ? apiKey.trim() : undefined) ||
        undefined;
      if (selected.method === 'GET') {
        const res = await apiFetch<unknown>(selected.path, token ? { token } : {});
        setResult(JSON.stringify(res, null, 2).slice(0, 4000));
        return;
      }
      if (!token) throw new Error('Paste a vl_test_ key or log in for authenticated endpoints');
      let body: string | undefined;
      if (selected.path.includes('translate')) {
        body = JSON.stringify({ text: 'Goods leave Lagos tomorrow', source: 'en', target: 'sw' });
      } else if (selected.path.includes('detect')) {
        body = JSON.stringify({ text: 'Sannu da zuwa' });
      } else if (selected.path.includes('chat')) {
        body = JSON.stringify({ messages: [{ role: 'user', content: 'Habari from product API guide' }] });
      } else if (selected.path.includes('speech')) {
        const res = await fetch(`${API_URL}${selected.path}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: 'Karibu', input: 'Karibu', voice: 'own:sw-aisha', format: 'mp3' }),
        });
        setResult(`HTTP ${res.status} · ${res.headers.get('content-type') || 'audio'} · ${res.ok ? 'seamless speech call ok' : 'failed'}`);
        return;
      } else {
        body = JSON.stringify({});
      }
      const res = await apiFetch<unknown>(selected.path, { method: selected.method, token, body });
      setResult(JSON.stringify(res, null, 2).slice(0, 4000));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'API call failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="vl-prod-api" id="api-guide">
      <div className="vl-prod-api-head">
        <div>
          <p className="vl-mkt-kicker">APIs made obvious</p>
          <h2>{productName} endpoints</h2>
          <p>
            Same routes your app will call — copy the curl, or run a seamless live request from this page.
          </p>
        </div>
      </div>

      <div className="vl-prod-api-grid">
        <ul className="vl-prod-api-list">
          {endpoints.map((endpoint) => (
            <li key={`${endpoint.method}-${endpoint.path}`}>
              <button
                type="button"
                className={endpoint.path === selected?.path ? 'is-active' : undefined}
                onClick={() => setActive(endpoint.path)}
              >
                <code>
                  <span>{endpoint.method}</span> {endpoint.path}
                </code>
                <small>{endpoint.summary}</small>
              </button>
            </li>
          ))}
        </ul>

        <div className="vl-prod-api-panel">
          <label className="vl-prod-demo-field">
            API key (optional if you used /dev-login)
            <input
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="vl_test_…"
              autoComplete="off"
            />
          </label>
          <pre className="vl-prod-code-block">{curl}</pre>
          <div className="vl-prod-demo-actions">
            <button type="button" className="vl-btn vl-btn-primary" disabled={loading} onClick={() => void runSelected()}>
              {loading ? 'Calling…' : 'Run seamless API call'}
            </button>
            <button
              type="button"
              className="vl-btn vl-btn-secondary"
              onClick={() => void navigator.clipboard.writeText(curl)}
            >
              Copy curl
            </button>
          </div>
          {error ? <p className="vl-prod-demo-error">{error}</p> : null}
          {result ? <pre className="vl-prod-demo-result">{result}</pre> : null}
          <details className="vl-prod-api-sdk">
            <summary>SDK snippet</summary>
            <pre className="vl-prod-code-block">{sampleCode}</pre>
          </details>
        </div>
      </div>
    </section>
  );
}
