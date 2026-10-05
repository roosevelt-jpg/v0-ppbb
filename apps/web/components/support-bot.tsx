'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

type Msg = { role: 'bot' | 'user'; text: string };

const STARTER: Msg = {
  role: 'bot',
  text:
    'Hi — I’m the VerbaLab support bot. I can walk you through API keys, first translate/TTS calls, 401/429 errors, webhooks, SDK setup, and Free plan limits — without paging the VerbaLab team. Ask a question or tap a quick topic.',
};

const REPLIES: Array<{ match: RegExp; answer: string }> = [
  {
    match: /sign.?up|register|create.?account|org(anization)?|login|sign.?in|bootstrap/i,
    answer:
      'Sign up at /sign-up (Clerk). Production orgs should use a Clerk production instance (pk_live_/sk_live_) with webhook → POST /v1/clerk/webhooks for user.created / organization.created / organizationMembership.created. That auto-creates your org + Default workspace, Free credits, a vl_test_ key, and a welcome email. Locally you can also use /dev-login when sk_test_ is configured. Then open Dashboard → API keys.',
  },
  {
    match: /free|plan|quota|limit|upgrade|pro|billing|credit/i,
    answer:
      'Free includes Translate, Voice Studio TTS, Speech, Playground, and API keys — metered by monthly credits/characters and per-key/org RPM. Voice cloning and marketplace need Pro/Creator. If calls fail with quota errors, check Billing / usage, wait for the monthly reset, or upgrade. Rate-limit 429 is separate from quota (see “429” below).',
  },
  {
    match: /401|unauthorized|invalid.?api.?key|revoked|bearer|auth(entication)?|forbidden|403/i,
    answer:
      '401 unauthorized usually means: (1) missing Authorization: Bearer vl_test_… / vl_live_… header, (2) typo/truncated key, (3) key revoked in /keys, or (4) wrong environment prefix. Copy a fresh key from /keys, retry in Playground (/playground), then curl from docs/QUICKSTART or /docs/quickstart. Never put Clerk session JWTs in the API Bearer header for product routes — use a vl_* key. Org disabled → contact an org owner (billing hold).',
  },
  {
    match: /429|rate.?limit|too many|rpm|retry-after/i,
    answer:
      '429 means you hit per-key or per-org RPM. Read Retry-After and X-RateLimit-* headers, back off, and reuse Idempotency-Key on mutating POSTs so retries don’t double-charge. Free tiers are tighter than Pro. If every call 429s immediately, confirm you aren’t sharing one test key across a hot loop — mint a second key or upgrade plan.',
  },
  {
    match: /cors|origin|browser|preflight/i,
    answer:
      'Browser apps must call the API from an origin listed in the API CORS_ORIGIN secret (comma-separated). Local default allows http://localhost:3000. Server-side / mobile / curl have no CORS. If the console works but your site fails, add your https origin on the API and redeploy — not a VerbaLab code bug.',
  },
  {
    match: /webhook|svix|partner.?hook|signing|whsec|idempotenc/i,
    answer:
      'Inbound Clerk: Dashboard → Webhooks → https://<api>/v1/clerk/webhooks with CLERK_WEBHOOK_SIGNING_SECRET (Svix). Missing secret returns misconfigured (not a crash). Outbound partner events: owner/admin PUT /v1/partner-webhooks with https URL, then POST /v1/webhooks/signing-secret to reveal whsec_…. Verify X-VerbaLab-Timestamp + X-VerbaLab-Signature (docs/PARTNER_WEBHOOKS.md). Long jobs: POST /v1/jobs with Idempotency-Key; poll GET /v1/jobs/:id for status.',
  },
  {
    match: /quickstart|first.?call|getting.?started|hello.?world|60.?second|integrat|sdk|builder|developer|typescript|python|curl/i,
    answer:
      '60-second path: (1) Get vl_test_ from /keys or welcome email. (2) export VERBALAB_API_KEY + VERBALAB_BASE_URL. (3) curl POST /v1/translate {"text":"Hello","source":"en","target":"sw"}. (4) curl POST /v1/audio/speech → mp3. TypeScript: pnpm add @verbalab/sdk then new VerbaLab({ apiKey }). Full copy: /docs/quickstart and docs/QUICKSTART.md. Try the same calls in /playground before wiring your app.',
  },
  {
    match: /api.?key|vl_test|vl_live|mint.?key/i,
    answer:
      'Open /keys (or Developers). Mint vl_test_ for sandbox-style calls (same cluster/quota) or vl_live_ for production. Store the secret once — it is only shown at mint time. Pass Authorization: Bearer <secret> on every product call. Revoking a key fires partner event api_key.revoked if you configured partner webhooks.',
  },
  {
    match: /no.?response|timeout|5\d\d|502|503|gateway|not.?working|failed|error|issue|debug|troubleshoot|stuck/i,
    answer:
      'Self-serve checklist: (1) Hit GET /health — expect {"status":"ok"}. (2) GET /v1/languages (public). (3) Replay the failing call in /playground with your key. (4) Read JSON error.code + request_id (share request_id only if you escalate). (5) 401 → key; 429 → backoff; validation_error → fix body vs OpenAPI (/docs/openapi); misconfigured → missing server secret (Clerk/Stripe/weights). (6) Confirm NEXT_PUBLIC_API_URL points at the API you deployed. Most integration issues resolve with keys + CORS + correct base URL — no ticket needed.',
  },
  {
    match: /clone|voice.?clon/i,
    answer:
      'Stock African voices: Free via Voice Studio / TTS. Ethical voice cloning is Pro-gated (consent + watermark). Async: POST /v1/jobs type=clone reserves enrollment; finish with multipart POST /v1/voice-clones (consentAttested + samples).',
  },
  {
    match: /dub|job.?status|long.?job|batch/i,
    answer:
      'Long work uses POST /v1/jobs (batch_translate, document_translate, workflow, dub, clone). Send Idempotency-Key to avoid duplicates. Poll GET /v1/jobs/:id until succeeded/failed. Optional per-job webhookUrl (https) or org partner webhook for job.succeeded / job.failed.',
  },
  {
    match: /voice|tts|generat|speech|stt|transcri/i,
    answer:
      'TTS: POST /v1/audio/speech or /v1/tts/synthesize with text + voice. STT/Speech hubs live under Speech. Use Playground mode “speech” to hear a result before coding. Neural weights (VERBALAB_WEIGHTS_URL) upgrade hero langs when mounted; otherwise local Own AI lexicon still responds.',
  },
  {
    match: /translate|language|swahili|coverage|registry/i,
    answer:
      'POST /v1/translate with source/target registry codes (en→sw, th, vi, hi, ht, qu, …). List codes via GET /v1/languages or /coverage. Unsupported language returns a clear validation error — pick a registry code from the list rather than guessing ISO names.',
  },
  {
    match: /dashboard|console|product/i,
    answer:
      'Dashboard is home for usage, Translate / Voice / Speech hubs, API keys, docs, and residency. Developers hub lists SDKs/CLI. Credentials readiness shows whether Clerk/Stripe/weights/webhooks are configured for production.',
  },
  {
    match: /doc|openapi|support|help|human|team|email/i,
    answer:
      'Start with /docs/quickstart, /docs, and /docs/openapi (copy paths/values). Partner webhooks: docs/PARTNER_WEBHOOKS.md. Credentials/Fly: docs/CREDENTIALS.md + infra/DEPLOY.md. For product language chat open /chat. Escalate to humans only if /health is down or request_id shows a 5xx after you verified key + body + CORS.',
  },
];

function answerFor(input: string): string {
  const hit = REPLIES.find((r) => r.match.test(input));
  if (hit) return hit.answer;
  return 'I can troubleshoot signup/bootstrap, Free vs Pro, API keys, 401/429, CORS, webhooks/idempotency, first translate/TTS calls, jobs/dub/clone, and docs. Ask e.g. “why 401?” or “how do I call translate?”, or open /docs/quickstart and /playground.';
}

export function SupportBot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Msg[]>([STARTER]);

  const quick = useMemo(
    () => [
      'How do I make my first API call?',
      'Why am I getting 401?',
      'What does 429 mean?',
      'How do webhooks work?',
      'Where are the docs?',
    ],
    [],
  );

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((prev) => [
      ...prev,
      { role: 'user', text: trimmed },
      { role: 'bot', text: answerFor(trimmed) },
    ]);
    setInput('');
  }

  return (
    <div className="vl-support-bot">
      {open ? (
        <div className="vl-support-panel" role="dialog" aria-label="VerbaLab support bot">
          <header className="vl-support-head">
            <div>
              <strong>Support bot</strong>
              <p>Integrations · Keys · Errors · Webhooks · Docs</p>
            </div>
            <button type="button" className="vl-support-close" onClick={() => setOpen(false)} aria-label="Close">
              ×
            </button>
          </header>
          <div className="vl-support-messages">
            {messages.map((m, i) => (
              <div key={`${m.role}-${i}`} className={`vl-support-msg is-${m.role}`}>
                {m.text}
              </div>
            ))}
          </div>
          <div className="vl-support-quick">
            {quick.map((q) => (
              <button key={q} type="button" onClick={() => send(q)}>
                {q}
              </button>
            ))}
          </div>
          <form
            className="vl-support-form"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask: why 401? first translate? webhooks…"
              aria-label="Support question"
            />
            <button type="submit">Send</button>
          </form>
          <footer className="vl-support-links">
            <Link href="/docs/quickstart">Quickstart</Link>
            <Link href="/docs">Docs</Link>
            <Link href="/docs/openapi">OpenAPI</Link>
            <Link href="/playground">Playground</Link>
            <Link href="/keys">API keys</Link>
          </footer>
        </div>
      ) : null}
      <button
        type="button"
        className="vl-support-fab"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {open ? 'Close help' : 'Chat for support'}
      </button>
    </div>
  );
}
