'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { API_URL, apiFetch } from '@/lib/api';
import { getDevBearer, resolveApiToken } from '@/lib/dev-auth';
import { SupportBot } from '@/components/support-bot';

type Language = { code: string; name: string };
type ChatTurn = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  via?: 'text' | 'voice';
  audioUrl?: string;
};
type ChatSession = { id: string; title: string; updatedAt: number; messages: ChatTurn[] };

type ChatCompletion = {
  choices: Array<{ message: { role: string; content: string } }>;
  translated?: boolean;
  translateReplyTo?: string | null;
  provider?: string;
  model?: string;
};

const STORAGE_KEY = 'verbalab_african_voice_sessions_v1';
const DEFAULT_VOICE = 'alloy';

function uid() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function loadSessions(): ChatSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatSession[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: ChatSession[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(0, 40)));
}

export function AfricanVoiceChat() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [voices, setVoices] = useState<Array<{ id: string; name?: string }>>([]);
  const [input, setInput] = useState('');
  const [translateReplyTo, setTranslateReplyTo] = useState('');
  const [voiceId, setVoiceId] = useState(DEFAULT_VOICE);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const active = useMemo(
    () => sessions.find((s) => s.id === activeId) ?? null,
    [sessions, activeId],
  );
  const messages = active?.messages ?? [];

  useEffect(() => {
    const existing = loadSessions();
    if (existing.length) {
      setSessions(existing);
      setActiveId(existing[0].id);
    } else {
      const fresh: ChatSession = { id: uid(), title: 'New chat', updatedAt: Date.now(), messages: [] };
      setSessions([fresh]);
      setActiveId(fresh.id);
    }
  }, []);

  useEffect(() => {
    if (!sessions.length) return;
    saveSessions(sessions);
  }, [sessions]);

  useEffect(() => {
    void apiFetch<{ data: Language[] }>('/v1/languages')
      .then((res) => setLanguages(res.data ?? []))
      .catch(() => undefined);
    void apiFetch<{ data: Array<{ id: string; name?: string }> }>('/v1/audio/voices')
      .then((res) => {
        const list = res.data ?? [];
        setVoices(list);
        if (list[0]?.id) setVoiceId(list[0].id);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    void resolveApiToken(getToken).then((token) => setHasToken(Boolean(token || getDevBearer())));
  }, [isLoaded, isSignedIn, getToken]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, recording, transcribing]);

  const patchActive = useCallback(
    (updater: (session: ChatSession) => ChatSession) => {
      setSessions((prev) =>
        prev.map((session) => (session.id === activeId ? updater(session) : session)),
      );
    },
    [activeId],
  );

  function newChat() {
    const fresh: ChatSession = { id: uid(), title: 'New chat', updatedAt: Date.now(), messages: [] };
    setSessions((prev) => [fresh, ...prev]);
    setActiveId(fresh.id);
    setInput('');
    setError(null);
  }

  async function ensureToken() {
    const token = await resolveApiToken(getToken);
    if (!token) throw new Error('Sign in to talk with VerbaLab');
    return token;
  }

  async function speakText(text: string, token: string) {
    const res = await fetch(`${API_URL}/v1/audio/speech`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, input: text, voice: voiceId || DEFAULT_VOICE, format: 'mp3' }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.error?.message ?? `Voice reply failed (${res.status})`);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(url);
    audioRef.current = audio;
    void audio.play().catch(() => undefined);
    return url;
  }

  async function sendMessage(text: string, via: 'text' | 'voice' = 'text') {
    const trimmed = text.trim();
    if (!trimmed || loading || !activeId) return;

    setError(null);
    setLoading(true);
    const userTurn: ChatTurn = { id: uid(), role: 'user', content: trimmed, via };
    const nextMessages = [...messages, userTurn];
    patchActive((session) => ({
      ...session,
      title: session.messages.length === 0 ? trimmed.slice(0, 48) : session.title,
      updatedAt: Date.now(),
      messages: nextMessages,
    }));
    setInput('');

    try {
      const token = await ensureToken();
      const res = await apiFetch<ChatCompletion>('/v1/chat/completions', {
        method: 'POST',
        token,
        body: JSON.stringify({
          messages: nextMessages.map(({ role, content }) => ({ role, content })),
          ...(translateReplyTo ? { translateReplyTo } : {}),
        }),
      });
      const reply = res.choices?.[0]?.message?.content ?? '';
      let audioUrl: string | undefined;
      if (autoSpeak && reply) {
        try {
          audioUrl = await speakText(reply, token);
        } catch {
          /* keep text reply if TTS fails */
        }
      }
      const assistantTurn: ChatTurn = {
        id: uid(),
        role: 'assistant',
        content: reply,
        via: audioUrl ? 'voice' : 'text',
        audioUrl,
      };
      patchActive((session) => ({
        ...session,
        updatedAt: Date.now(),
        messages: [...session.messages, assistantTurn],
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chat failed');
      patchActive((session) => ({
        ...session,
        messages: session.messages.filter((m) => m.id !== userTurn.id),
      }));
      setInput(trimmed);
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    await sendMessage(input, 'text');
  }

  async function startRecording() {
    setError(null);
    if (!hasToken) {
      setError('Sign in to use voice — then speak in any African language.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4';
      const recorder = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        void finishRecording(recorder.mimeType || mime);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Microphone permission denied');
    }
  }

  function stopRecording() {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') recorder.stop();
    setRecording(false);
  }

  async function finishRecording(mimeType: string) {
    setTranscribing(true);
    setError(null);
    try {
      const token = await ensureToken();
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const ext = mimeType.includes('mp4') ? 'm4a' : 'webm';
      const form = new FormData();
      form.append('file', blob, `voice.${ext}`);
      if (translateReplyTo) form.append('language', translateReplyTo);

      const res = await fetch(`${API_URL}/v1/audio/transcriptions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const payload = (await res.json().catch(() => ({}))) as {
        text?: string;
        error?: { message?: string };
      };
      if (!res.ok) throw new Error(payload.error?.message ?? `Transcription failed (${res.status})`);
      const transcript = payload.text?.trim();
      if (!transcript) throw new Error('Could not hear speech — try again closer to the mic');
      await sendMessage(transcript, 'voice');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Voice capture failed');
    } finally {
      setTranscribing(false);
      chunksRef.current = [];
    }
  }

  async function replay(turn: ChatTurn) {
    if (turn.audioUrl) {
      const audio = new Audio(turn.audioUrl);
      void audio.play().catch(() => undefined);
      return;
    }
    try {
      const token = await ensureToken();
      const url = await speakText(turn.content, token);
      patchActive((session) => ({
        ...session,
        messages: session.messages.map((m) => (m.id === turn.id ? { ...m, audioUrl: url } : m)),
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Playback failed');
    }
  }

  const empty = messages.length === 0;

  return (
    <div className="vl-avc">
      <aside className={`vl-avc-sidebar${sidebarOpen ? '' : ' is-collapsed'}`}>
        <div className="vl-avc-sidebar-top">
          <Link href="/" className="vl-avc-brand">
            VerbaLab
          </Link>
          <button type="button" className="vl-avc-icon-btn" onClick={() => setSidebarOpen(false)} aria-label="Collapse sidebar">
            «
          </button>
        </div>
        <button type="button" className="vl-avc-new" onClick={newChat}>
          + New chat
        </button>
        <nav className="vl-avc-nav">
          <Link href="/products/voice-agents">Voice agents</Link>
          <Link href="/products/conversational-ai">Conversational AI</Link>
          <Link href="/voice-studio">Voice Studio</Link>
          <Link href="/docs">Docs</Link>
          <Link href="/billing">Plans</Link>
        </nav>
        <div className="vl-avc-history">
          <p>Chats</p>
          <ul>
            {sessions.map((session) => (
              <li key={session.id}>
                <button
                  type="button"
                  className={session.id === activeId ? 'is-active' : undefined}
                  onClick={() => setActiveId(session.id)}
                >
                  {session.title || 'New chat'}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="vl-avc-sidebar-foot">
          <p>African Voice LLM — speak or type in any language.</p>
          {!hasToken ? (
            <Link href="/dev-login" className="vl-btn vl-btn-primary">
              Log in
            </Link>
          ) : (
            <Link href="/dashboard" className="vl-btn vl-btn-secondary">
              Open console
            </Link>
          )}
        </div>
      </aside>

      <main className="vl-avc-main">
        <header className="vl-avc-topbar">
          {!sidebarOpen ? (
            <button type="button" className="vl-avc-icon-btn" onClick={() => setSidebarOpen(true)} aria-label="Open sidebar">
              »
            </button>
          ) : (
            <span />
          )}
          <div className="vl-avc-model">
            <strong>VerbaLab</strong>
            <span>African Voice LLM</span>
          </div>
          <div className="vl-avc-top-actions">
            {!hasToken ? (
              <>
                <Link href="/sign-in">Log in</Link>
                <Link href="/sign-up" className="vl-btn vl-btn-primary">
                  Sign up free
                </Link>
              </>
            ) : (
              <Link href="/dashboard">Dashboard</Link>
            )}
          </div>
        </header>

        <div className={`vl-avc-stage${empty ? ' is-empty' : ''}`}>
          {empty ? (
            <div className="vl-avc-hero">
              <p className="vl-avc-kicker">First African Voice LLM</p>
              <h1>Where should we begin?</h1>
              <p>
                Speak or type in Yoruba, Swahili, Zulu, Hausa, Amharic, French, Arabic, English — VerbaLab
                understands, translates, and answers back like a voice agent you can talk to.
              </p>
            </div>
          ) : (
            <div className="vl-avc-thread">
              {messages.map((msg) => (
                <div key={msg.id} className={`vl-avc-bubble is-${msg.role}`}>
                  <div className="vl-avc-bubble-meta">
                    {msg.role === 'user' ? 'You' : 'VerbaLab'}
                    {msg.via === 'voice' ? ' · voice' : ''}
                  </div>
                  <div className="vl-avc-bubble-body">{msg.content}</div>
                  {msg.role === 'assistant' ? (
                    <button type="button" className="vl-avc-speak-btn" onClick={() => void replay(msg)}>
                      ▶ Speak reply
                    </button>
                  ) : null}
                </div>
              ))}
              {loading ? <p className="vl-avc-status">Thinking…</p> : null}
              {transcribing ? <p className="vl-avc-status">Hearing you…</p> : null}
              <div ref={bottomRef} />
            </div>
          )}

          <form className="vl-avc-composer" onSubmit={onSubmit}>
            <div className="vl-avc-composer-tools">
              <label>
                Reply language
                <select value={translateReplyTo} onChange={(e) => setTranslateReplyTo(e.target.value)}>
                  <option value="">Auto / same language</option>
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Voice
                <select value={voiceId} onChange={(e) => setVoiceId(e.target.value)}>
                  {(voices.length ? voices : [{ id: DEFAULT_VOICE, name: 'Default' }]).map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name ?? v.id}
                    </option>
                  ))}
                </select>
              </label>
              <label className="vl-avc-check">
                <input
                  type="checkbox"
                  checked={autoSpeak}
                  onChange={(e) => setAutoSpeak(e.target.checked)}
                />
                Speak replies (Jarvis mode)
              </label>
            </div>

            <div className="vl-avc-input-row">
              <button type="button" className="vl-avc-plus" aria-label="New chat" onClick={newChat}>
                +
              </button>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={recording ? 'Listening…' : 'Ask VerbaLab — or hold the mic and speak'}
                rows={1}
                disabled={loading || recording || transcribing}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void sendMessage(input, 'text');
                  }
                }}
              />
              <button
                type="button"
                className={`vl-avc-mic${recording ? ' is-hot' : ''}`}
                aria-label={recording ? 'Stop recording' : 'Speak'}
                onClick={() => (recording ? stopRecording() : void startRecording())}
                disabled={loading || transcribing}
              >
                {recording ? (
                  <span aria-hidden="true">■</span>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <rect x="9" y="3" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.8" />
                    <path
                      d="M5 11a7 7 0 0 0 14 0M12 18v3"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </button>
              <button
                type="submit"
                className="vl-avc-send"
                disabled={loading || recording || transcribing || !input.trim()}
                aria-label="Send"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M12 19V5M12 5l-6 6M12 5l6 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
            {error ? <p className="vl-avc-error">{error}</p> : null}
            <p className="vl-avc-fineprint">
              VerbaLab can make mistakes. Check important info.{' '}
              <Link href="/products/trust-center">Trust</Link> · <Link href="/data">Policies</Link>
            </p>
          </form>
        </div>
      </main>
      <SupportBot />
    </div>
  );
}
