import { HttpStatus, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { SpeechRecognitionService } from '../speech-recognition/speech-recognition.service';
import { ChatService } from '../chat/chat.service';
import { AudioService } from '../audio/audio.service';
import { ApiException } from '../common/errors/api-exception';
import { LANGUAGE_SEEDS } from '../languages/language-seeds';
import { verbaVoiceCatalog, verbaVoiceHonesty } from './verba-voice.catalog';

type OrgAuth = {
  organizationId: string;
  workspaceId: string;
  userId?: string;
  apiKeyId?: string;
  ip?: string;
};

type VoiceTurn = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  language?: string;
  audioBase64?: string;
  mimeType?: string;
  at: string;
};

type VoiceSession = {
  id: string;
  organizationId: string;
  workspaceId: string;
  language?: string;
  voice: string;
  systemPrompt: string;
  createdAt: string;
  turns: VoiceTurn[];
  events: Array<{ type: string; payload: Record<string, unknown>; at: string }>;
};

const DEFAULT_SYSTEM =
  'You are Verba Voice, VerbaLab’s African language voice assistant. Reply concisely, warmly, and in the user’s language when possible.';

@Injectable()
export class VerbaVoiceService {
  private readonly sessionStore = new Map<string, VoiceSession>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly speech: SpeechRecognitionService,
    private readonly chat: ChatService,
    private readonly audio: AudioService,
  ) {}

  engine() {
    return {
      ...verbaVoiceCatalog(),
      safety: verbaVoiceHonesty(),
      languageCount: LANGUAGE_SEEDS.length,
      africanLanguageCount: LANGUAGE_SEEDS.filter((l) => l.tier === 'strategic_african').length,
      developerGuide: {
        auth: 'Authorization: Bearer vl_live_… or Clerk session',
        compare: 'Grok Voice / ChatGPT Advanced Voice — Verba Voice for African languages',
        outputs: ['transcript', 'assistant_text', 'spoken_audio_base64'],
      },
    };
  }

  monitoring() {
    return { status: 'ready', honesty: verbaVoiceHonesty() };
  }

  async activity(organizationId: string) {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const rows = await this.prisma.auditEvent.findMany({
      where: { organizationId, createdAt: { gte: since }, action: { contains: 'verba-voice' } },
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: { id: true, action: true, createdAt: true },
    });
    return {
      window: '7d',
      count: rows.length,
      events: rows.map((r) => ({ id: r.id, action: r.action, at: r.createdAt.toISOString() })),
    };
  }

  async overview(auth: OrgAuth) {
    return {
      session: {
        organizationId: auth.organizationId,
        workspaceId: auth.workspaceId,
      },
      engine: this.engine(),
      activity: await this.activity(auth.organizationId),
      links: { self: '/verba-voice', docs: '/docs/VERBA_VOICE.md' },
    };
  }

  private assertLanguage(code?: string) {
    if (!code) return;
    const ok = LANGUAGE_SEEDS.some((l) => l.code === code || l.code === code.split('-')[0]);
    if (!ok) {
      throw new ApiException(
        'validation_error',
        `Unsupported language "${code}". Use GET /v1/meeting-transcription/languages for Africa-wide codes.`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private getOwnedSession(auth: OrgAuth, sessionId: string): VoiceSession {
    const row = this.sessionStore.get(sessionId);
    if (!row || row.organizationId !== auth.organizationId) {
      throw new ApiException('not_found', 'Verba Voice session not found', HttpStatus.NOT_FOUND);
    }
    return row;
  }

  private pushEvent(session: VoiceSession, type: string, payload: Record<string, unknown>) {
    session.events.push({ type, payload, at: new Date().toISOString() });
    if (session.events.length > 200) session.events.splice(0, session.events.length - 200);
  }

  async sessions(auth: OrgAuth, body: Record<string, unknown>) {
    const language = body.language ? String(body.language) : undefined;
    this.assertLanguage(language);
    const row: VoiceSession = {
      id: randomUUID(),
      organizationId: auth.organizationId,
      workspaceId: auth.workspaceId,
      language,
      voice: String(body.voice ?? 'alloy'),
      systemPrompt: String(body.systemPrompt ?? DEFAULT_SYSTEM).trim() || DEFAULT_SYSTEM,
      createdAt: new Date().toISOString(),
      turns: [],
      events: [],
    };
    this.pushEvent(row, 'session.created', { language: language ?? null, voice: row.voice });
    this.sessionStore.set(row.id, row);
    await this.audit.record({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'verba-voice.sessions',
      route: 'POST /v1/verba-voice/sessions',
      ip: auth.ip,
      metadata: { sessionId: row.id, language: language ?? null } as never,
    });
    return {
      session: {
        id: row.id,
        language: row.language,
        voice: row.voice,
        createdAt: row.createdAt,
      },
    };
  }

  getSession(auth: OrgAuth, sessionId: string) {
    const row = this.getOwnedSession(auth, sessionId);
    return {
      session: {
        id: row.id,
        language: row.language,
        voice: row.voice,
        createdAt: row.createdAt,
        turnCount: row.turns.length,
        turns: row.turns.map(({ id, role, text, language, at, mimeType }) => ({
          id,
          role,
          text,
          language,
          at,
          hasAudio: Boolean(mimeType),
        })),
      },
    };
  }

  private async assistantReply(
    auth: OrgAuth,
    session: VoiceSession,
    userText: string,
    language?: string,
  ) {
    const history = session.turns.slice(-12).map((t) => ({
      role: t.role as 'user' | 'assistant',
      content: t.text,
    }));
    const completion = await this.chat.completions({
      messages: [
        { role: 'system', content: session.systemPrompt },
        ...history,
        { role: 'user', content: userText },
      ],
      translateReplyTo: language && language !== 'en' ? language : undefined,
      organizationId: auth.organizationId,
      workspaceId: auth.workspaceId,
      apiKeyId: auth.apiKeyId,
      userId: auth.userId,
      ip: auth.ip,
    });

    const assistantText =
      typeof completion?.choices?.[0]?.message?.content === 'string'
        ? completion.choices[0].message.content
        : String((completion as { reply?: string }).reply ?? '').trim();

    if (!assistantText) {
      throw new ApiException('upstream_error', 'Empty assistant reply', HttpStatus.BAD_GATEWAY);
    }

    let spoken: { audioBase64?: string; mimeType?: string; voice?: string } | null = null;
    try {
      const speech = await this.audio.speak({
        text: assistantText,
        voice: session.voice,
        language: language ?? session.language ?? 'en',
        organizationId: auth.organizationId,
        workspaceId: auth.workspaceId,
        apiKeyId: auth.apiKeyId,
        userId: auth.userId,
        ip: auth.ip,
      });
      spoken = {
        audioBase64: speech.audio.toString('base64'),
        mimeType: speech.mimeType,
        voice: speech.voice,
      };
    } catch {
      spoken = null;
    }

    return { assistantText, spoken };
  }

  async textTurn(auth: OrgAuth, body: Record<string, unknown>) {
    const sessionId = String(body.sessionId ?? '').trim();
    if (!sessionId) {
      throw new ApiException('validation_error', 'sessionId is required', HttpStatus.BAD_REQUEST);
    }
    const text = String(body.text ?? '').trim();
    if (!text) {
      throw new ApiException('validation_error', 'text is required', HttpStatus.BAD_REQUEST);
    }
    const session = this.getOwnedSession(auth, sessionId);
    const language = body.language ? String(body.language) : session.language;
    this.assertLanguage(language);

    const userTurn: VoiceTurn = {
      id: randomUUID(),
      role: 'user',
      text,
      language,
      at: new Date().toISOString(),
    };
    session.turns.push(userTurn);
    this.pushEvent(session, 'turn.user', { turnId: userTurn.id, text, language: language ?? null });

    const { assistantText, spoken } = await this.assistantReply(auth, session, text, language);
    const assistantTurn: VoiceTurn = {
      id: randomUUID(),
      role: 'assistant',
      text: assistantText,
      language,
      audioBase64: spoken?.audioBase64,
      mimeType: spoken?.mimeType,
      at: new Date().toISOString(),
    };
    session.turns.push(assistantTurn);
    this.pushEvent(session, 'turn.assistant', {
      turnId: assistantTurn.id,
      text: assistantText,
      spoken: Boolean(spoken),
    });
    this.sessionStore.set(session.id, session);

    await this.audit.record({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'verba-voice.text-turns',
      route: 'POST /v1/verba-voice/text-turns',
      ip: auth.ip,
      metadata: { sessionId: session.id, language: language ?? null } as never,
    });

    return {
      sessionId: session.id,
      user: userTurn,
      assistant: {
        id: assistantTurn.id,
        text: assistantText,
        language,
        spoken,
        at: assistantTurn.at,
      },
    };
  }

  async audioTurn(
    auth: OrgAuth,
    input: {
      file: Express.Multer.File;
      sessionId: string;
      language?: string;
    },
  ) {
    const session = this.getOwnedSession(auth, input.sessionId);
    const language = input.language ?? session.language;
    this.assertLanguage(language);

    const recognized = await this.speech.recognize({
      file: input.file,
      language,
      punctuate: true,
      capitalize: true,
      useWorkspaceVocabulary: true,
      organizationId: auth.organizationId,
      workspaceId: auth.workspaceId,
      apiKeyId: auth.apiKeyId,
      userId: auth.userId,
      ip: auth.ip,
    });

    const userText = String(recognized.text ?? '').trim();
    if (!userText) {
      throw new ApiException('validation_error', 'Could not transcribe audio', HttpStatus.BAD_REQUEST);
    }

    const userTurn: VoiceTurn = {
      id: randomUUID(),
      role: 'user',
      text: userText,
      language: language ?? recognized.language ?? undefined,
      at: new Date().toISOString(),
    };
    session.turns.push(userTurn);
    this.pushEvent(session, 'turn.user', {
      turnId: userTurn.id,
      text: userText,
      via: 'audio',
      confidence: recognized.confidence ?? null,
    });

    const { assistantText, spoken } = await this.assistantReply(
      auth,
      session,
      userText,
      language ?? recognized.language ?? undefined,
    );
    const assistantTurn: VoiceTurn = {
      id: randomUUID(),
      role: 'assistant',
      text: assistantText,
      language: language ?? recognized.language ?? undefined,
      audioBase64: spoken?.audioBase64,
      mimeType: spoken?.mimeType,
      at: new Date().toISOString(),
    };
    session.turns.push(assistantTurn);
    this.pushEvent(session, 'turn.assistant', {
      turnId: assistantTurn.id,
      text: assistantText,
      spoken: Boolean(spoken),
    });
    this.sessionStore.set(session.id, session);

    await this.audit.record({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'verba-voice.turns',
      route: 'POST /v1/verba-voice/turns',
      ip: auth.ip,
      metadata: {
        sessionId: session.id,
        language: language ?? null,
        chars: userText.length,
      } as never,
    });

    return {
      sessionId: session.id,
      transcript: {
        text: userText,
        language: language ?? recognized.language ?? null,
        confidence: recognized.confidence ?? null,
      },
      assistant: {
        id: assistantTurn.id,
        text: assistantText,
        spoken,
        at: assistantTurn.at,
      },
    };
  }

  events(auth: OrgAuth, sessionId: string, after?: string) {
    const session = this.getOwnedSession(auth, sessionId);
    const idx = after ? session.events.findIndex((e) => e.at > after) : 0;
    const start = idx >= 0 ? idx : session.events.length;
    return {
      sessionId: session.id,
      events: session.events.slice(start),
    };
  }
}
