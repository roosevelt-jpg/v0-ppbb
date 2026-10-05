import Link from 'next/link';
import { SiteFooter } from '@/components/marketing/site-footer';

export const metadata = {
  title: '60-second quickstart',
  description: 'Translate and TTS with a VerbaLab Free or test API key in under a minute.',
};

export default function QuickstartPage() {
  return (
    <>
      <div className="vl-fade-up" style={{ maxWidth: '48rem', margin: '0 auto', padding: '2.25rem 1.5rem 4rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <Link href="/" style={{ fontFamily: 'var(--font-display)', fontWeight: 760, textDecoration: 'none', fontSize: '1.15rem' }}>
            VerbaLab
          </Link>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link href="/docs" style={{ color: 'var(--muted)', textDecoration: 'none' }}>
              Docs
            </Link>
            <Link href="/docs/openapi" style={{ color: 'var(--muted)', textDecoration: 'none' }}>
              OpenAPI
            </Link>
            <Link href="/keys" className="vl-btn vl-btn-secondary" style={{ textDecoration: 'none', padding: '0.45rem 0.9rem' }}>
              API keys
            </Link>
          </div>
        </div>

        <h1 style={{ margin: '1.75rem 0 0', fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', fontSize: '2.35rem' }}>
          60-second quickstart
        </h1>
        <p style={{ color: 'var(--muted)', lineHeight: 1.65, maxWidth: '36rem' }}>
          Sign up, grab a <code className="vl-code">vl_test_</code> key, then translate and speak. Full markdown:{' '}
          <code className="vl-code">docs/QUICKSTART.md</code>.
        </p>

        <ol style={{ lineHeight: 1.7, paddingLeft: '1.2rem', color: 'var(--fg)' }}>
          <li>
            Create an account at <Link href="/sign-up">/sign-up</Link> (Clerk webhook mints Free credits + a test key).
          </li>
          <li>
            Copy a key from <Link href="/keys">/keys</Link>.
          </li>
          <li>Run the snippets below.</li>
        </ol>

        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginTop: '2rem' }}>Environment</h2>
        <pre className="vl-code" style={{ whiteSpace: 'pre-wrap' }}>{`export VERBALAB_API_KEY=vl_test_…
export VERBALAB_BASE_URL=https://api.your-domain.com`}</pre>

        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginTop: '1.75rem' }}>Translate</h2>
        <pre className="vl-code" style={{ whiteSpace: 'pre-wrap' }}>{`curl -sS "$VERBALAB_BASE_URL/v1/translate" \\
  -H "Authorization: Bearer $VERBALAB_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"text":"Hello","source":"en","target":"sw"}'`}</pre>

        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginTop: '1.75rem' }}>Text to speech</h2>
        <pre className="vl-code" style={{ whiteSpace: 'pre-wrap' }}>{`curl -sS "$VERBALAB_BASE_URL/v1/audio/speech" \\
  -H "Authorization: Bearer $VERBALAB_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"text":"Habari","voice":"alloy"}' \\
  --output hello.mp3`}</pre>

        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginTop: '1.75rem' }}>TypeScript SDK</h2>
        <pre className="vl-code" style={{ whiteSpace: 'pre-wrap' }}>{`pnpm add @verbalab/sdk

import { VerbaLab } from '@verbalab/sdk';

const client = new VerbaLab({
  apiKey: process.env.VERBALAB_API_KEY!,
  baseUrl: process.env.VERBALAB_BASE_URL,
});

const mt = await client.translate({ text: 'Hello', source: 'en', target: 'sw' });
console.log(mt.text);

const speech = await client.speech({ text: 'Habari', voice: 'alloy' });
// speech.audio → Uint8Array`}</pre>

        <p style={{ color: 'var(--muted)', marginTop: '1.5rem', lineHeight: 1.6 }}>
          Long jobs: <code className="vl-code">POST /v1/jobs</code> with{' '}
          <code className="vl-code">Idempotency-Key</code>. Partner webhooks:{' '}
          <code className="vl-code">docs/PARTNER_WEBHOOKS.md</code>. Coverage:{' '}
          <Link href="/coverage">/coverage</Link>.
        </p>
      </div>
      <SiteFooter />
    </>
  );
}
