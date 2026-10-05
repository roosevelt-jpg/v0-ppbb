'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { API_URL, apiFetch } from '@/lib/api';
import { getDevBearer, resolveApiToken } from '@/lib/dev-auth';
import { SupportBot } from '@/components/support-bot';
import { SiteFooter } from '@/components/marketing/site-footer';

type Language = { code: string; name: string };
type ChatTurn = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  via?: 'text' | 'voice';
  audioUrl?: string;
  /** Original mic capture (webm/m4a) — lets users replay what they said. */
  recordingUrl?: string;
  recordingFormat?: string;
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

/** Local Own-AI STT fixture markers — not real speech text. */
function isFixtureTranscript(text: string): boolean {
  return /^\[vl-stt(-fixture)?:/i.test(text.trim()) || /transcribed voice\.(webm|m4a|wav|mp3)/i.test(text);
}

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
  const [attachOpen, setAttachOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [lastCapture, setLastCapture] = useState<{ url: string; format: string; bytes: number } | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const attachMenuRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    if (!attachOpen) return;
    function onPointerDown(event: MouseEvent) {
      if (!attachMenuRef.current?.contains(event.target as Node)) {
        setAttachOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setAttachOpen(false);
    }
    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [attachOpen]);

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
      // Prefer wav — local fixture TTS always returns real WAV bytes; mp3 label was a lie before.
      body: JSON.stringify({ text, input: text, voice: voiceId || DEFAULT_VOICE, format: 'wav' }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.error?.message ?? `Voice reply failed (${res.status})`);
    }
    const mime = res.headers.get('Content-Type') || 'audio/wav';
    const raw = await res.arrayBuffer();
    const blob = new Blob([raw], { type: mime.split(';')[0] });
    const url = URL.createObjectURL(blob);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    const audio = new Audio(url);
    audioRef.current = audio;
    try {
      await audio.play();
    } catch (err) {
      URL.revokeObjectURL(url);
      throw new Error(err instanceof Error ? `Playback blocked: ${err.message}` : 'Playback failed');
    }
    return url;
  }

  async function sendMessage(
    text: string,
    via: 'text' | 'voice' = 'text',
    extras?: { recordingUrl?: string; recordingFormat?: string },
  ) {
    const trimmed = text.trim();
    if (!trimmed || loading || !activeId) return;
    if (isFixtureTranscript(trimmed)) {
      setError(
        'Speech-to-text is still in local demo mode, so your recording was not understood. Type your message, or set VERBALAB_STT_URL / enable Whisper (VERBALAB_ALLOW_VENDOR_FALLBACK=1 + OPENAI_API_KEY) for real voice.',
      );
      return;
    }

    setError(null);
    setLoading(true);
    const userTurn: ChatTurn = {
      id: uid(),
      role: 'user',
      content: trimmed,
      via,
      recordingUrl: extras?.recordingUrl,
      recordingFormat: extras?.recordingFormat,
    };
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
        } catch (ttsErr) {
          setError(ttsErr instanceof Error ? ttsErr.message : 'Could not speak the reply');
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
    let recordingUrl: string | undefined;
    try {
      const token = await ensureToken();
      const blob = new Blob(chunksRef.current, { type: mimeType });
      if (blob.size < 256) {
        throw new Error('Recording too short — hold the mic a moment longer');
      }
      const ext = mimeType.includes('mp4') ? 'm4a' : 'webm';
      recordingUrl = URL.createObjectURL(blob);
      if (lastCapture?.url) URL.revokeObjectURL(lastCapture.url);
      setLastCapture({ url: recordingUrl, format: ext, bytes: blob.size });
      const form = new FormData();
      form.append('file', blob, `voice.${ext}`);

      const res = await fetch(`${API_URL}/v1/audio/transcriptions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const payload = (await res.json().catch(() => ({}))) as {
        text?: string;
        error?: { message?: string };
        provider?: string;
      };
      if (!res.ok) throw new Error(payload.error?.message ?? `Transcription failed (${res.status})`);
      const transcript = payload.text?.trim();
      if (!transcript) throw new Error('Could not hear speech — try again closer to the mic');
      if (isFixtureTranscript(transcript)) {
        throw new Error(
          `Voice saved as .${ext} (${Math.round(blob.size / 1024)} KB), but STT is in local demo mode (${payload.provider ?? 'verbalab_own_ai'}). Use “Play last recording” to hear it, type what you said, or configure VERBALAB_STT_URL / Whisper for real transcription.`,
        );
      }
      await sendMessage(transcript, 'voice', { recordingUrl, recordingFormat: ext });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Voice capture failed');
    } finally {
      setTranscribing(false);
      chunksRef.current = [];
    }
  }

  async function playUrl(url: string) {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(url);
    audioRef.current = audio;
    try {
      await audio.play();
    } catch (err) {
      setError(err instanceof Error ? `Playback failed: ${err.message}` : 'Playback failed');
    }
  }

  async function replay(turn: ChatTurn) {
    if (turn.audioUrl) {
      await playUrl(turn.audioUrl);
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

  async function uploadDocument(file: File, mode: 'ask' | 'translate') {
    setUploading(true);
    setError(null);
    setAttachOpen(false);
    try {
      const token = await ensureToken();
      const form = new FormData();
      form.append('file', file);
      if (mode === 'translate') {
        form.append('translate', 'true');
        form.append('target', translateReplyTo || 'en');
        if (translateReplyTo) form.append('source', 'auto');
      }
      const res = await fetch(`${API_URL}/v1/chat/attachments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const payload = (await res.json().catch(() => ({}))) as {
        chatPrompt?: string;
        error?: { message?: string };
      };
      if (!res.ok) throw new Error(payload.error?.message ?? `Upload failed (${res.status})`);
      const prompt = payload.chatPrompt?.trim();
      if (!prompt) throw new Error('Could not prepare that document for chat');
      await sendMessage(prompt, 'text');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Document upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function connectWorkspaceTool(type: 'gmail' | 'google_drive' | 'office365') {
    setConnecting(type);
    setError(null);
    setAttachOpen(false);
    try {
      const token = await ensureToken();
      const accountHint =
        typeof window !== 'undefined'
          ? window.prompt(
              type === 'gmail'
                ? 'Gmail address to connect'
                : type === 'google_drive'
                  ? 'Google account email for Drive'
                  : 'Microsoft 365 account email',
              '',
            )
          : null;
      if (!accountHint?.trim()) {
        setConnecting(null);
        return;
      }
      await apiFetch(`/v1/connectors/${type}/install`, {
        method: 'POST',
        token,
        body: JSON.stringify({
          label: `${type} · ${accountHint.trim()}`,
          config: { account: accountHint.trim(), oauthMode: 'sandbox' },
        }),
      });
      const shared = await apiFetch<{
        result?: { sharePrompt?: string; items?: Array<{ title: string }> };
      }>(`/v1/connectors/${type}/invoke`, {
        method: 'POST',
        token,
        body: JSON.stringify({
          payload: {
            action: 'share',
            target: translateReplyTo || 'en',
            translate: Boolean(translateReplyTo),
          },
        }),
      });
      const prompt =
        shared.result?.sharePrompt ??
        `Connected ${type}. Share a file or email so I can translate or answer questions about it.`;
      await sendMessage(prompt, 'text');
    } catch (err) {
      setError(err instanceof Error ? err.message : `Could not connect ${type}`);
    } finally {
      setConnecting(null);
    }
  }

  const empty = messages.length === 0;
  const showMarketingFooter = !hasToken && !isSignedIn;

  return (
    <>
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
                  {msg.role === 'user' && msg.recordingUrl ? (
                    <button type="button" className="vl-avc-speak-btn" onClick={() => void playUrl(msg.recordingUrl!)}>
                      ▶ Play my recording{msg.recordingFormat ? ` (.${msg.recordingFormat})` : ''}
                    </button>
                  ) : null}
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
                Speak replies
              </label>
            </div>

            <div className="vl-avc-input-row">
              <div className="vl-avc-attach" ref={attachMenuRef}>
                <button
                  type="button"
                  className="vl-avc-plus"
                  aria-label="Attach or connect"
                  aria-expanded={attachOpen}
                  aria-haspopup="menu"
                  onClick={() => setAttachOpen((open) => !open)}
                  disabled={loading || recording || transcribing || uploading || Boolean(connecting)}
                >
                  +
                </button>
                {attachOpen ? (
                  <div className="vl-avc-attach-menu" role="menu">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        fileInputRef.current?.setAttribute('data-mode', 'ask');
                        fileInputRef.current?.click();
                      }}
                    >
                      Upload document
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        fileInputRef.current?.setAttribute('data-mode', 'translate');
                        fileInputRef.current?.click();
                      }}
                    >
                      Upload &amp; translate
                    </button>
                    <hr />
                    <button type="button" role="menuitem" onClick={() => void connectWorkspaceTool('gmail')}>
                      Connect Gmail
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => void connectWorkspaceTool('google_drive')}
                    >
                      Connect Google Drive
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => void connectWorkspaceTool('office365')}
                    >
                      Connect Microsoft 365
                    </button>
                  </div>
                ) : null}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="vl-sr-only"
                  accept=".txt,.md,.markdown,.html,.htm,.pdf,.docx,text/plain,text/markdown,text/html,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const mode =
                      event.currentTarget.getAttribute('data-mode') === 'translate' ? 'translate' : 'ask';
                    void uploadDocument(file, mode);
                  }}
                />
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  recording
                    ? 'Listening…'
                    : uploading
                      ? 'Uploading document…'
                      : connecting
                        ? `Connecting ${connecting}…`
                        : 'Ask VerbaLab — or hold the mic and speak'
                }
                rows={1}
                disabled={loading || recording || transcribing || uploading || Boolean(connecting)}
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
                disabled={loading || transcribing || uploading || Boolean(connecting)}
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
                disabled={
                  loading ||
                  recording ||
                  transcribing ||
                  uploading ||
                  Boolean(connecting) ||
                  !input.trim()
                }
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
            {lastCapture ? (
              <p className="vl-avc-status" style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
                Last mic capture: .{lastCapture.format} · {Math.round(lastCapture.bytes / 1024)} KB
                <button type="button" className="vl-avc-speak-btn" onClick={() => void playUrl(lastCapture.url)}>
                  ▶ Play last recording
                </button>
              </p>
            ) : null}
            <p className="vl-avc-fineprint">
              VerbaLab can make mistakes. Check important info.{' '}
              <Link href="/products/trust-center">Trust</Link> · <Link href="/data">Policies</Link>
            </p>
          </form>
        </div>
      </main>
      <SupportBot />
    </div>
    {showMarketingFooter ? <SiteFooter /> : null}
    </>
  );
}
