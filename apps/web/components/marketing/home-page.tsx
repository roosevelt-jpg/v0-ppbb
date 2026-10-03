'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { API_URL } from '@/lib/api';
import { getDevBearer } from '@/lib/dev-auth';

const VOICES = [
  { id: 'alloy', label: 'Nia · Lagos', meta: 'Yoruba-English · warm' },
  { id: 'nova', label: 'Amina · Nairobi', meta: 'Swahili-English · clear' },
  { id: 'shimmer', label: 'Thandi · Johannesburg', meta: 'Zulu-English · bright' },
  { id: 'echo', label: 'Kwame · Accra', meta: 'Twi-English · grounded' },
] as const;

const USE_CASES = [
  { title: 'Trade & negotiations', body: 'Speak and translate across markets without losing tone, respect, or intent.' },
  { title: 'Education', body: 'Lessons, tutoring, and exams in the languages students actually live in.' },
  { title: 'Sales & marketing', body: 'Campaigns that sound local — accents, idioms, and cultural cues included.' },
  { title: 'Public speech', body: 'Addresses, broadcasts, and civic messaging that feel native, not imported.' },
  { title: 'Customer experience', body: 'Support and agents that hear African callers the way Africans speak.' },
  { title: 'Creative voice', body: 'Own your voice for podcasts, film, ads, and storytelling across the continent.' },
] as const;

const PRODUCTS = [
  {
    href: '/voice-studio',
    kicker: 'VerbaVoice',
    title: 'Text to speech & cloning',
    body: 'Generate and clone African voices for content, brands, and personal presence.',
  },
  {
    href: '/speech',
    kicker: 'VerbaSpeech',
    title: 'Speech to text',
    body: 'Transcribe accents, dialects, and code-switching with speech intelligence built for Africa.',
  },
  {
    href: '/translate',
    kicker: 'VerbaTranslate',
    title: 'Translate every tongue',
    body: 'Move meaning across ethnic languages and global markets with cultural context intact.',
  },
] as const;

const SAMPLE =
  'Karibu. Across Lagos, Nairobi, Accra, and Johannesburg — VerbaLab speaks with Africa, not at Africa.';

export function MarketingHomePage() {
  const [text, setText] = useState(SAMPLE);
  const [voice, setVoice] = useState<string>(VOICES[0].id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const activeVoice = useMemo(() => VOICES.find((v) => v.id === voice) ?? VOICES[0], [voice]);

  async function playDemo() {
    setBusy(true);
    setError(null);
    try {
      const token = getDevBearer();
      if (!token) {
        window.location.href = '/dev-login';
        return;
      }
      const res = await fetch(`${API_URL}/v1/audio/speech`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: text, voice, format: 'mp3' }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error?.message ?? `Could not generate speech (${res.status})`);
      }
      const blob = await res.blob();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      const audio = new Audio(url);
      void audio.play();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Playback failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="vl-mkt">
      <header className="vl-mkt-nav">
        <Link href="/" className="vl-mkt-brand">
          VerbaLab
        </Link>
        <nav className="vl-mkt-nav-links" aria-label="Marketing">
          <a href="#products">Products</a>
          <a href="#use-cases">Use cases</a>
          <a href="#platform">Platform</a>
          <Link href="/docs">Docs</Link>
        </nav>
        <div className="vl-mkt-nav-actions">
          <Link href="/sign-in" className="vl-mkt-link">
            Log in
          </Link>
          <Link href="/sign-up" className="vl-btn vl-btn-primary vl-mkt-cta">
            Sign up
          </Link>
        </div>
      </header>

      <section className="vl-mkt-hero">
        <div className="vl-mkt-hero-copy vl-fade-up">
          <p className="vl-mkt-kicker">AFRICA&apos;S VOICE INTELLIGENCE PLATFORM</p>
          <h1 className="vl-mkt-title">VerbaLab</h1>
          <p className="vl-mkt-lede">
            Own your voice. Speak, translate, and reason across every African language, accent, and culture —
            for trade, education, sales, speeches, and everyday problem-solving.
          </p>
          <div className="vl-mkt-hero-actions">
            <Link href="/sign-up" className="vl-btn vl-btn-primary vl-mkt-cta">
              Start free
            </Link>
            <Link href="/dev-login" className="vl-btn vl-btn-secondary vl-mkt-cta-ghost">
              Open console
            </Link>
          </div>
        </div>

        <div className="vl-mkt-playground vl-fade-up-delay" aria-label="Voice playground">
          <div className="vl-mkt-playground-top">
            <span>Text to speech</span>
            <span className="vl-mkt-pill">{activeVoice.label}</span>
          </div>
          <textarea
            className="vl-mkt-playground-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
          />
          <div className="vl-mkt-voice-row">
            {VOICES.map((v) => (
              <button
                key={v.id}
                type="button"
                className={`vl-mkt-voice${voice === v.id ? ' is-active' : ''}`}
                onClick={() => setVoice(v.id)}
              >
                <strong>{v.label}</strong>
                <span>{v.meta}</span>
              </button>
            ))}
          </div>
          <div className="vl-mkt-playground-foot">
            <button
              type="button"
              className="vl-btn vl-btn-primary"
              disabled={busy || !text.trim()}
              onClick={() => void playDemo()}
            >
              {busy ? 'Generating…' : 'Play'}
            </button>
            <p>Dialect-aware African voices · cultural tone · multilingual TTS</p>
          </div>
          {error ? <p className="vl-mkt-error">{error}</p> : null}
          {audioUrl ? <audio controls src={audioUrl} className="vl-mkt-audio" /> : null}
        </div>
      </section>

      <section className="vl-mkt-strip" aria-label="Coverage">
        <p>Built for Yoruba · Swahili · Zulu · Amharic · Hausa · Igbo · Twi · Wolof · Afrikaans · Arabic · French · Portuguese · and ethnic languages across Africa</p>
      </section>

      <section id="products" className="vl-mkt-section">
        <div className="vl-mkt-section-head">
          <h2>One platform for African voice, speech, and language</h2>
          <p>
            Like the world’s leading AI voice products — purpose-built so Africans can create, sell, teach, and negotiate
            in their own voices.
          </p>
        </div>
        <div className="vl-mkt-product-grid">
          {PRODUCTS.map((p) => (
            <Link key={p.href} href={p.href} className="vl-mkt-product">
              <span>{p.kicker}</span>
              <h3>{p.title}</h3>
              <p>{p.body}</p>
            </Link>
          ))}
        </div>
      </section>

      <section id="use-cases" className="vl-mkt-section">
        <div className="vl-mkt-section-head">
          <h2>Why Africans choose VerbaLab</h2>
          <p>Voice ownership for the moments that move economies and communities.</p>
        </div>
        <div className="vl-mkt-use-grid">
          {USE_CASES.map((item) => (
            <article key={item.title} className="vl-mkt-use">
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="platform" className="vl-mkt-section vl-mkt-section-split">
        <div>
          <h2>Culture-aware intelligence under the hood</h2>
          <p>
            Accents, dialects, registries, knowledge graphs, and reasoning layers — so models don’t just pronounce
            African languages, they understand context.
          </p>
          <div className="vl-mkt-hero-actions" style={{ marginTop: '1.25rem' }}>
            <Link href="/dashboard" className="vl-btn vl-btn-primary vl-mkt-cta">
              Enter dashboard
            </Link>
            <Link href="/docs" className="vl-btn vl-btn-secondary vl-mkt-cta-ghost">
              Explore API
            </Link>
          </div>
        </div>
        <ul className="vl-mkt-platform-list">
          <li>Voice cloning & neural TTS</li>
          <li>Speech recognition across accents</li>
          <li>Translation + localization memory</li>
          <li>African language & cultural registries</li>
          <li>Agents, workflows, and developer APIs</li>
          <li>Enterprise tenancy, metering, residency</li>
        </ul>
      </section>

      <footer className="vl-mkt-footer">
        <strong>VerbaLab</strong>
        <span>Africa’s own voice — for trade, learning, and creation.</span>
        <div>
          <Link href="/sign-in">Log in</Link>
          <Link href="/dev-login">Console</Link>
          <Link href="/docs">Docs</Link>
        </div>
      </footer>
    </div>
  );
}
