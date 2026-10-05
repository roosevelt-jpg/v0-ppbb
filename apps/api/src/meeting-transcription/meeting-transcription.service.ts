import { HttpStatus, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { SpeechRecognitionService } from '../speech-recognition/speech-recognition.service';
import { TranslateService } from '../translate/translate.service';
import { AudioService } from '../audio/audio.service';
import { ApiException } from '../common/errors/api-exception';
import {
  meetingTranscriptionCatalog,
  meetingTranscriptionHonesty,
  meetingTranscriptionLanguages,
} from './meeting-transcription.catalog';
import { LANGUAGE_SEEDS } from '../languages/language-seeds';

type OrgAuth = {
  organizationId: string;
  workspaceId: string;
  userId?: string;
  role?: string;
  apiKeyId?: string;
  ip?: string;
};

type MeetingSession = {
  id: string;
  organizationId: string;
  workspaceId: string;
  title: string;
  language?: string;
  translateTo?: string;
  createdAt: string;
  transcripts: Array<Record<string, unknown>>;
};

@Injectable()
export class MeetingTranscriptionService {
  private readonly sessionStore = new Map<string, MeetingSession>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly speech: SpeechRecognitionService,
    private readonly translate: TranslateService,
    private readonly audio: AudioService,
  ) {}

  engine() {
    const langs = meetingTranscriptionLanguages();
    return {
      ...meetingTranscriptionCatalog(),
      safety: meetingTranscriptionHonesty(),
      languageCount: langs.count,
      africanLanguageCount: langs.africanCount,
      developerGuide: {
        auth: 'Authorization: Bearer vl_live_… or Clerk session',
        meetingPlatforms: ['Zoom apps', 'Google Meet bots', 'custom WebRTC SFUs', 'Twilio rooms'],
        outputs: ['text', 'srt', 'vtt', 'translated_text', 'spoken_recap_audio'],
      },
    };
  }

  languages() {
    return meetingTranscriptionLanguages();
  }

  monitoring() {
    return { status: 'ready', honesty: meetingTranscriptionHonesty() };
  }

  async activity(organizationId: string) {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const rows = await this.prisma.auditEvent.findMany({
      where: { organizationId, createdAt: { gte: since }, action: { contains: 'meeting-transcription' } },
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
        role: auth.role ?? null,
      },
      engine: this.engine(),
      languages: this.languages(),
      activity: await this.activity(auth.organizationId),
      links: { self: '/meeting-transcription', docs: '/docs/MEETING_TRANSCRIPTION.md' },
    };
  }

  private assertLanguage(code?: string) {
    if (!code) return;
    const ok = LANGUAGE_SEEDS.some((l) => l.code === code || l.code === code.split('-')[0]);
    if (!ok) {
      throw new ApiException(
        'validation_error',
        `Unsupported language "${code}". See GET /v1/meeting-transcription/languages for Africa-wide coverage.`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async sessions(auth: OrgAuth, body: Record<string, unknown>) {
    const language = body.language ? String(body.language) : undefined;
    const translateTo = body.translateTo ? String(body.translateTo) : undefined;
    this.assertLanguage(language);
    this.assertLanguage(translateTo);
    const row: MeetingSession = {
      id: randomUUID(),
      organizationId: auth.organizationId,
      workspaceId: auth.workspaceId,
      title: String(body.title ?? 'Meeting').trim() || 'Meeting',
      language,
      translateTo,
      createdAt: new Date().toISOString(),
      transcripts: [],
    };
    this.sessionStore.set(row.id, row);
    await this.audit.record({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'meeting-transcription.sessions',
      route: 'POST /v1/meeting-transcription/sessions',
      ip: auth.ip,
      metadata: { sessionId: row.id, language, translateTo } as never,
    });
    return { session: row };
  }

  getSession(auth: OrgAuth, sessionId: string) {
    const row = this.sessionStore.get(sessionId);
    if (!row || row.organizationId !== auth.organizationId) {
      throw new ApiException('not_found', 'Meeting session not found', HttpStatus.NOT_FOUND);
    }
    return { session: row };
  }

  async transcribe(
    auth: OrgAuth,
    input: {
      file: Express.Multer.File;
      language?: string;
      translateTo?: string;
      sessionId?: string;
      industryPacks?: string[];
      vocabulary?: string[];
    },
  ) {
    this.assertLanguage(input.language);
    this.assertLanguage(input.translateTo);
    const packs =
      input.industryPacks && input.industryPacks.length > 0
        ? (input.industryPacks as ('medical' | 'legal' | 'financial' | 'government')[])
        : (['government'] as const);
    const recognized = await this.speech.recognize({
      file: input.file,
      language: input.language,
      industryPacks: [...packs],
      vocabulary: input.vocabulary,
      punctuate: true,
      capitalize: true,
      useWorkspaceVocabulary: true,
      organizationId: auth.organizationId,
      workspaceId: auth.workspaceId,
      apiKeyId: auth.apiKeyId,
      userId: auth.userId,
      ip: auth.ip,
    });

    let translated: { text: string; source: string; target: string; provider: string } | null = null;
    if (input.translateTo && recognized.text) {
      translated = await this.translate.translate({
        text: recognized.text,
        source: input.language || 'auto',
        target: input.translateTo,
        organizationId: auth.organizationId,
        workspaceId: auth.workspaceId,
        apiKeyId: auth.apiKeyId,
        skipReview: true,
      });
    }

    const payload = {
      id: randomUUID(),
      meeting: true,
      language: input.language ?? recognized.language ?? 'auto',
      text: recognized.text,
      segments: recognized.segments ?? null,
      confidence: recognized.confidence ?? null,
      translated,
      africaCoverage: true,
      languageCatalog: 'GET /v1/meeting-transcription/languages',
    };

    if (input.sessionId) {
      const sess = this.sessionStore.get(input.sessionId);
      if (sess && sess.organizationId === auth.organizationId) {
        sess.transcripts.push(payload);
        this.sessionStore.set(input.sessionId, sess);
      }
    }

    await this.audit.record({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'meeting-transcription.transcribe',
      route: 'POST /v1/meeting-transcription/transcribe',
      ip: auth.ip,
      metadata: {
        language: payload.language,
        translateTo: input.translateTo ?? null,
        chars: recognized.text?.length ?? 0,
      } as never,
    });

    return payload;
  }

  async recap(auth: OrgAuth, body: Record<string, unknown>) {
    const text = String(body.text ?? body.transcript ?? '').trim();
    if (!text) {
      throw new ApiException('validation_error', 'text or transcript is required', HttpStatus.BAD_REQUEST);
    }
    const language = body.language ? String(body.language) : 'en';
    this.assertLanguage(language);
    const sentences = text
      .split(/(?<=[.!?。])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const summary =
      sentences.length <= 3
        ? text
        : `${sentences.slice(0, 2).join(' ')} … (${sentences.length} points discussed).`;

    let spoken: { audioBase64?: string; mimeType?: string; voice?: string } | null = null;
    if (body.speak !== false && body.speak !== 'false') {
      try {
        const speech = await this.audio.speak({
          text: summary,
          voice: String(body.voice ?? 'alloy'),
          language,
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
    }

    await this.audit.record({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'meeting-transcription.recap',
      route: 'POST /v1/meeting-transcription/recap',
      ip: auth.ip,
      metadata: { language, spoken: Boolean(spoken) } as never,
    });

    return {
      id: randomUUID(),
      summary,
      language,
      spoken,
      note: 'Spoken recap uses VerbaLab TTS — meeting platforms can play it back to attendees.',
    };
  }
}
