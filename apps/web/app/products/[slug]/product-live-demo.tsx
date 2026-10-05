'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { API_URL, apiFetch } from '@/lib/api';
import { getDevBearer } from '@/lib/dev-auth';
import type { ProductDemoKind } from '@/lib/product-stories';

type Language = { code: string; name: string };
type Voice = { id: string; name?: string };

type Props = {
  demoKind: ProductDemoKind;
  demoTitle: string;
  demoBlurb: string;
  samplePrompt: string;
  consoleHref: string;
  productName: string;
};

function isApiKey(value: string) {
  return value.startsWith('vl_live_') || value.startsWith('vl_test_') || value.startsWith('vl_dev_');
}

export function ProductLiveDemo({
  demoKind,
  demoTitle,
  demoBlurb,
  samplePrompt,
  consoleHref,
  productName,
}: Props) {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [apiKey, setApiKey] = useState('');
  const [text, setText] = useState(samplePrompt);
  const [source, setSource] = useState('en');
  const [target, setTarget] = useState('sw');
  const [voiceId, setVoiceId] = useState('own:sw-aisha');
  const [result, setResult] = useState<string>('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [liveMeta, setLiveMeta] = useState<string>('');
  const [hasSession, setHasSession] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    void apiFetch<{ data: Language[] }>('/v1/languages')
      .then((res) => {
        const list = res.data ?? [];
        setLanguages(list);
        setLiveMeta(`${list.length} languages live in inventory`);
      })
      .catch(() => undefined);
    void apiFetch<{ data: Voice[] }>('/v1/audio/voices')
      .then((res) => {
        const list = res.data ?? [];
        setVoices(list);
        if (list[0]?.id) setVoiceId(list[0].id);
      })
      .catch(() => undefined);
    setHasSession(Boolean(getDevBearer()));
  }, []);

  const needsAuth = demoKind !== 'languages' && demoKind !== 'coverage' && demoKind !== 'voices';

  const authHint = useMemo(() => {
    if (!needsAuth) return null;
    if (hasSession) return 'Using your local review session.';
    if (apiKey) return 'Using pasted API key.';
    return 'Paste a vl_test_ key or log in to run the live call.';
  }, [needsAuth, hasSession, apiKey]);

  async function resolveToken() {
    const session = getDevBearer();
    if (session) return session;
    if (isApiKey(apiKey.trim())) return apiKey.trim();
    throw new Error('Sign in or paste a vl_test_ / vl_live_ API key to run this live demo');
  }

  async function runTranslate() {
    const token = await resolveToken();
    const res = await apiFetch<{
      translatedText?: string;
      text?: string;
      data?: { translatedText?: string };
    }>('/v1/translate', {
      method: 'POST',
      token,
      body: JSON.stringify({ text, source, target }),
    });
    const out = res.translatedText ?? res.text ?? res.data?.translatedText ?? JSON.stringify(res, null, 2);
    setResult(typeof out === 'string' ? out : JSON.stringify(out, null, 2));
  }

  async function runDetect() {
    const token = await resolveToken();
    const res = await apiFetch<unknown>('/v1/detect', {
      method: 'POST',
      token,
      body: JSON.stringify({ text }),
    });
    setResult(JSON.stringify(res, null, 2));
  }

  async function runChat() {
    const token = await resolveToken();
    const res = await apiFetch<{
      choices?: Array<{ message?: { content?: string } }>;
    }>('/v1/chat/completions', {
      method: 'POST',
      token,
      body: JSON.stringify({
        messages: [{ role: 'user', content: text }],
        ...(target ? { translateReplyTo: target } : {}),
      }),
    });
    setResult(res.choices?.[0]?.message?.content ?? JSON.stringify(res, null, 2));
  }

  async function runTts() {
    const token = await resolveToken();
    const res = await fetch(`${API_URL}/v1/audio/speech`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, input: text, voice: voiceId, format: 'mp3' }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.error?.message ?? `Speech failed (${res.status})`);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    setAudioUrl(url);
    setResult(`Generated ${blob.size} bytes of speech with voice ${voiceId}`);
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(url);
    audioRef.current = audio;
    void audio.play().catch(() => undefined);
  }

  async function runLanguages() {
    const res = await apiFetch<{ data: Language[] }>('/v1/languages');
    const list = res.data ?? [];
    setLanguages(list);
    setResult(
      list
        .slice(0, 24)
        .map((l) => `${l.code}\t${l.name}`)
        .join('\n') + (list.length > 24 ? `\n… +${list.length - 24} more` : ''),
    );
    setLiveMeta(`${list.length} languages returned just now`);
  }

  async function runVoices() {
    const res = await apiFetch<{ data: Voice[] }>('/v1/audio/voices');
    const list = res.data ?? [];
    setVoices(list);
    setResult(list.map((v) => `${v.id}\t${v.name ?? v.id}`).join('\n'));
    setLiveMeta(`${list.length} voices available`);
  }

  async function runCoverage() {
    await runLanguages();
  }

  async function runApiSandbox() {
    if (demoKind === 'api' && text.trim().startsWith('{')) {
      // treat as translate default when JSON-ish not needed
    }
    const token = await resolveToken().catch(() => null);
    if (!token) {
      await runLanguages();
      setResult((prev) => `${prev}\n\n(Authenticated endpoints unlock after login / API key.)`);
      return;
    }
    const res = await apiFetch<unknown>('/v1/translate', {
      method: 'POST',
      token,
      body: JSON.stringify({ text, source, target }),
    });
    setResult(JSON.stringify(res, null, 2));
  }

  async function runConsolePreview() {
    setResult(
      [
        `${productName} is wired to ${consoleHref}.`,
        'Open the console to operate the full surface with your workspace.',
        liveMeta || 'Language inventory is already live above.',
      ].join('\n'),
    );
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    setAudioUrl(null);
    try {
      switch (demoKind) {
        case 'translate':
          await runTranslate();
          break;
        case 'detect':
          await runDetect();
          break;
        case 'chat':
          await runChat();
          break;
        case 'tts':
          await runTts();
          break;
        case 'languages':
          await runLanguages();
          break;
        case 'voices':
          await runVoices();
          break;
        case 'coverage':
          await runCoverage();
          break;
        case 'api':
          await runApiSandbox();
          break;
        case 'stt':
          setError('Use the microphone button to capture speech for live STT.');
          break;
        case 'console':
          await runConsolePreview();
          break;
        default:
          await runLanguages();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo failed');
    } finally {
      setLoading(false);
    }
  }

  async function startRecording() {
    setError(null);
    try {
      const token = await resolveToken();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      const recorder = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        void (async () => {
          setLoading(true);
          try {
            const blob = new Blob(chunksRef.current, { type: mime });
            const form = new FormData();
            form.append('file', blob, 'demo.webm');
            const res = await fetch(`${API_URL}/v1/audio/transcriptions`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
              body: form,
            });
            const payload = await res.json();
            if (!res.ok) throw new Error(payload?.error?.message ?? `STT failed (${res.status})`);
            setResult(payload.text ?? JSON.stringify(payload, null, 2));
            setLiveMeta(`Detected language: ${payload.language ?? 'auto'} · provider ${payload.provider ?? '—'}`);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Transcription failed');
          } finally {
            setLoading(false);
          }
        })();
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Microphone unavailable');
    }
  }

  function stopRecording() {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') recorder.stop();
    setRecording(false);
  }

  const showTextArea = demoKind !== 'voices' && demoKind !== 'languages' && demoKind !== 'coverage';
  const showLangPair = demoKind === 'translate' || demoKind === 'api' || demoKind === 'chat';
  const showVoice = demoKind === 'tts';

  return (
    <section className="vl-prod-demo" id="live-demo">
      <div className="vl-prod-demo-head">
        <div>
          <p className="vl-mkt-kicker">Realtime capability</p>
          <h2>{demoTitle}</h2>
          <p>{demoBlurb}</p>
          {liveMeta ? <p className="vl-prod-demo-meta">{liveMeta}</p> : null}
        </div>
        <Link href={consoleHref} className="vl-btn vl-btn-secondary">
          Open full console
        </Link>
      </div>

      <form className="vl-prod-demo-panel" onSubmit={onSubmit}>
        {needsAuth ? (
          <label className="vl-prod-demo-field">
            API key (optional if signed in)
            <input
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="vl_test_… or leave blank when logged in"
              autoComplete="off"
            />
            <span>{authHint}</span>
          </label>
        ) : null}

        {showLangPair ? (
          <div className="vl-prod-demo-row">
            <label className="vl-prod-demo-field">
              Source
              <select value={source} onChange={(e) => setSource(e.target.value)}>
                {(languages.length ? languages : [{ code: 'en', name: 'English' }]).map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="vl-prod-demo-field">
              {demoKind === 'chat' ? 'Reply language' : 'Target'}
              <select value={target} onChange={(e) => setTarget(e.target.value)}>
                {(languages.length ? languages : [{ code: 'sw', name: 'Swahili' }]).map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}

        {showVoice ? (
          <label className="vl-prod-demo-field">
            Voice
            <select value={voiceId} onChange={(e) => setVoiceId(e.target.value)}>
              {(voices.length ? voices : [{ id: 'own:sw-aisha', name: 'Aisha (Swahili)' }]).map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name ?? v.id}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {showTextArea ? (
          <label className="vl-prod-demo-field">
            {demoKind === 'stt' ? 'Prompt / notes' : 'Try it'}
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} />
          </label>
        ) : null}

        <div className="vl-prod-demo-actions">
          {demoKind === 'stt' ? (
            <button
              type="button"
              className={`vl-btn ${recording ? 'vl-btn-secondary' : 'vl-btn-primary'}`}
              onClick={() => (recording ? stopRecording() : void startRecording())}
              disabled={loading}
            >
              {recording ? 'Stop & transcribe' : 'Record microphone'}
            </button>
          ) : (
            <button type="submit" className="vl-btn vl-btn-primary" disabled={loading}>
              {loading ? 'Running…' : 'Run live demo'}
            </button>
          )}
          {!hasSession && needsAuth ? (
            <Link href="/dev-login" className="vl-btn vl-btn-secondary">
              Log in for one-click demos
            </Link>
          ) : null}
        </div>

        {error ? <p className="vl-prod-demo-error">{error}</p> : null}
        {audioUrl ? (
          <audio className="vl-prod-demo-audio" controls src={audioUrl}>
            <track kind="captions" />
          </audio>
        ) : null}
        {result ? (
          <pre className="vl-prod-demo-result" tabIndex={0}>
            {result}
          </pre>
        ) : (
          <p className="vl-prod-demo-idle">Results appear here in realtime after you run the demo.</p>
        )}
      </form>
    </section>
  );
}
