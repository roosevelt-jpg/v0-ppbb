'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

type Msg = { role: 'bot' | 'user'; text: string };

const STARTER: Msg = {
  role: 'bot',
  text:
    'Hi — I’m the VerbaLab support bot. Ask about free plan limits, API keys, voice generation, cloning, dashboards, or docs. For deeper product chat, open Chat.',
};

const REPLIES: Array<{ match: RegExp; answer: string }> = [
  {
    match: /sign.?up|register|create.?account|org(anization)?|login|sign.?in/i,
    answer:
      'Create an account with Sign up (Clerk). We auto-provision an Organization + Default workspace on Free plan (50k characters / month, rate-limited). Then open Dashboard to start.',
  },
  {
    match: /free|plan|quota|limit|upgrade|pro|billing/i,
    answer:
      'Free includes Translate, Voice Studio TTS, Speech, Playground, and API keys — metered by character quota and RPM. Voice cloning, marketplace, and fine-tunes need Pro. See Billing to upgrade.',
  },
  {
    match: /api.?key|integrat|sdk|builder|developer/i,
    answer:
      'Builders: open API keys in the console, mint a vl_live_ / vl_test_ key, then call docs at /docs or /docs/openapi. SDKs live under Developers.',
  },
  {
    match: /clone|voice.?clon/i,
    answer:
      'Generate stock African voices on Free in Voice Studio. Ethical voice cloning is Pro-gated (consent + watermark). Enroll from Voice Cloning → Audio studio when on Pro.',
  },
  {
    match: /voice|tts|generat|speech/i,
    answer:
      'Use Voice Studio to generate speech, Speech for STT/TTS hubs, and Playground for quick API trials. Free covers generation within your character quota.',
  },
  {
    match: /dashboard|console|product/i,
    answer:
      'Your dedicated Dashboard is the home for plan usage, product hubs (Translate, Voice, Speech, Playground), API keys, docs, and residency controls.',
  },
  {
    match: /doc|error|issue|help|support|openapi/i,
    answer:
      'Start with Developer docs (/docs) and the OpenAPI explorer (/docs/openapi). Still stuck? Stay here or open Chat for a longer technical session.',
  },
];

function answerFor(input: string): string {
  const hit = REPLIES.find((r) => r.match.test(input));
  if (hit) return hit.answer;
  return 'I can help with signup, Free vs Pro, API keys, voice generate/clone, dashboard, and docs. Try one of those topics, or open Docs / Chat for more.';
}

export function SupportBot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Msg[]>([STARTER]);

  const quick = useMemo(
    () => [
      'How does Free plan work?',
      'How do I get API keys?',
      'Can I clone a voice?',
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
              <p>Technical help · Free plan · Keys · Voice · Docs</p>
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
              placeholder="Ask about free plan, keys, voice…"
              aria-label="Support question"
            />
            <button type="submit">Send</button>
          </form>
          <footer className="vl-support-links">
            <Link href="/docs">Docs</Link>
            <Link href="/docs/openapi">OpenAPI</Link>
            <Link href="/chat">Chat</Link>
            <Link href="/billing">Billing</Link>
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
