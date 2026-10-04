import { HttpStatus, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { SpeechRecognitionService } from '../speech-recognition/speech-recognition.service';
import { ApiException } from '../common/errors/api-exception';
import {
  voiceRecorderPluginCatalog,
  voiceRecorderPluginHonesty,
} from './voice-recorder-plugin.catalog';
import { LANGUAGE_SEEDS } from '../languages/language-seeds';

type OrgAuth = {
  organizationId: string;
  workspaceId: string;
  userId?: string;
  apiKeyId?: string;
  ip?: string;
};

type Clip = {
  id: string;
  title?: string;
  language?: string;
  text: string;
  confidence?: number | null;
  durationHintSec?: number;
  tier: string;
  sku: string;
  at: string;
};

type RecorderSession = {
  id: string;
  organizationId: string;
  workspaceId: string;
  platform: string;
  language?: string;
  tier: string;
  label?: string;
  status: 'recording' | 'transcribing' | 'ready' | 'finalized';
  createdAt: string;
  clips: Clip[];
};

@Injectable()
export class VoiceRecorderPluginService {
  private readonly sessionStore = new Map<string, RecorderSession>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly speech: SpeechRecognitionService,
  ) {}

  engine() {
    return {
      ...voiceRecorderPluginCatalog(),
      safety: voiceRecorderPluginHonesty(),
      languageCount: LANGUAGE_SEEDS.length,
      defaultTier: 'standard',
      recommendedSku: 'vlm.field-notes-stt.standard',
      mobile: {
        ios: 'packages/sdk-ios — VoiceRecorderPlugin',
        android: 'packages/sdk-android — VoiceRecorderPlugin',
        install: 'GET /v1/voice-recorder-plugin/manifest?platform=ios|android',
      },
    };
  }

  monitoring() {
    return { status: 'ready', honesty: voiceRecorderPluginHonesty() };
  }

  manifest(platform?: string) {
    const plat = (platform ?? 'android').toLowerCase();
    const common = {
      pluginId: 'ai.verbalab.voice-recorder',
      name: 'VerbaLab Voice Recorder',
      version: '1.0.0',
      permissions: ['microphone', 'network'],
      endpoints: {
        sessions: 'POST /v1/voice-recorder-plugin/sessions',
        transcribe: 'POST /v1/voice-recorder-plugin/transcribe',
        finalize: 'POST /v1/voice-recorder-plugin/finalize',
      },
      auth: 'Authorization: Bearer vl_live_…',
      defaultLanguage: 'auto',
      economy: {
        useCase: 'field-notes-stt',
        tiers: ['eco', 'standard', 'turbo', 'ultra'],
        note: 'Faster tiers cost more — quote via POST /v1/model-economy/quote',
      },
    };
    if (plat === 'ios') {
      return {
        ...common,
        platform: 'ios',
        package: 'packages/sdk-ios',
        className: 'VoiceRecorderPlugin',
        install: [
          'Add packages/sdk-ios via Swift Package Manager',
          'import VerbaLab',
          'let plugin = VoiceRecorderPlugin(client: VerbaLabClient(apiKey: "vl_live_…"))',
          'try await plugin.startSession(language: "sw")',
          'let transcript = try await plugin.stopAndTranscribe()',
        ],
        infoPlist: ['NSMicrophoneUsageDescription'],
      };
    }
    return {
      ...common,
      platform: 'android',
      package: 'packages/sdk-android',
      className: 'ai.verbalab.sdk.VoiceRecorderPlugin',
      install: [
        'implementation("ai.verbalab:sdk:0.1.0")',
        'val plugin = VoiceRecorderPlugin(client)',
        'plugin.startSession(language = "yo")',
        'val transcript = plugin.stopAndTranscribe()',
      ],
      permissions: ['android.permission.RECORD_AUDIO', 'android.permission.INTERNET'],
    };
  }

  async activity(organizationId: string) {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const rows = await this.prisma.auditEvent.findMany({
      where: {
        organizationId,
        createdAt: { gte: since },
        action: { contains: 'voice-recorder-plugin' },
      },
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
      links: {
        self: '/voice-recorder-plugin',
        docs: '/docs/VOICE_RECORDER_PLUGIN.md',
        economy: '/model-economy',
      },
    };
  }

  private getOwned(auth: OrgAuth, sessionId: string): RecorderSession {
    const row = this.sessionStore.get(sessionId);
    if (!row || row.organizationId !== auth.organizationId) {
      throw new ApiException('not_found', 'recorder session not found', HttpStatus.NOT_FOUND);
    }
    return row;
  }

  async sessions(auth: OrgAuth, body: Record<string, unknown>) {
    const tier = String(body.tier ?? 'standard').toLowerCase();
    const allowed = ['eco', 'standard', 'turbo', 'ultra'];
    if (!allowed.includes(tier)) {
      throw new ApiException(
        'validation_error',
        `tier must be one of ${allowed.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    const language = body.language ? String(body.language) : undefined;
    if (language && language !== 'auto') {
      const ok = LANGUAGE_SEEDS.some((l) => l.code === language || l.code === language.split('-')[0]);
      if (!ok) {
        throw new ApiException('validation_error', `Unsupported language "${language}"`, HttpStatus.BAD_REQUEST);
      }
    }
    const row: RecorderSession = {
      id: randomUUID(),
      organizationId: auth.organizationId,
      workspaceId: auth.workspaceId,
      platform: String(body.platform ?? 'android'),
      language,
      tier,
      label: body.label ? String(body.label) : undefined,
      status: 'recording',
      createdAt: new Date().toISOString(),
      clips: [],
    };
    this.sessionStore.set(row.id, row);
    await this.audit.record({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'voice-recorder-plugin.sessions',
      route: 'POST /v1/voice-recorder-plugin/sessions',
      ip: auth.ip,
      metadata: { sessionId: row.id, tier, platform: row.platform } as never,
    });
    return {
      session: {
        id: row.id,
        platform: row.platform,
        language: row.language ?? 'auto',
        tier: row.tier,
        sku: `vlm.field-notes-stt.${row.tier}`,
        status: row.status,
        createdAt: row.createdAt,
      },
      ui: {
        recordButton: 'Hold to record / tap to stop',
        uploadOnStop: true,
      },
    };
  }

  getSession(auth: OrgAuth, sessionId: string) {
    const row = this.getOwned(auth, sessionId);
    return {
      session: {
        id: row.id,
        platform: row.platform,
        language: row.language ?? 'auto',
        tier: row.tier,
        status: row.status,
        clipCount: row.clips.length,
        clips: row.clips,
        transcript: row.clips.map((c) => c.text).join('\n\n'),
        createdAt: row.createdAt,
      },
    };
  }

  async transcribe(
    auth: OrgAuth,
    input: {
      file: Express.Multer.File;
      sessionId?: string;
      language?: string;
      tier?: string;
      title?: string;
    },
  ) {
    let session: RecorderSession;
    if (input.sessionId?.trim()) {
      session = this.getOwned(auth, input.sessionId.trim());
    } else {
      const opened = await this.sessions(auth, {
        platform: 'upload',
        language: input.language,
        tier: input.tier ?? 'standard',
        label: input.title,
      });
      session = this.getOwned(auth, opened.session.id);
    }
    session.status = 'transcribing';
    this.sessionStore.set(session.id, session);

    const language = input.language ?? session.language;
    const recognized = await this.speech.recognize({
      file: input.file,
      language: language && language !== 'auto' ? language : undefined,
      punctuate: true,
      capitalize: true,
      useWorkspaceVocabulary: true,
      organizationId: auth.organizationId,
      workspaceId: auth.workspaceId,
      apiKeyId: auth.apiKeyId,
      userId: auth.userId,
      ip: auth.ip,
    });

    const text = String(recognized.text ?? '').trim();
    if (!text) {
      throw new ApiException('validation_error', 'Could not transcribe audio', HttpStatus.BAD_REQUEST);
    }

    const clip: Clip = {
      id: randomUUID(),
      title: input.title,
      language: language ?? recognized.language ?? undefined,
      text,
      confidence: recognized.confidence ?? null,
      durationHintSec: Math.max(1, Math.round((input.file.size || 16000) / 16000)),
      tier: session.tier,
      sku: `vlm.field-notes-stt.${session.tier}`,
      at: new Date().toISOString(),
    };
    session.clips.push(clip);
    session.status = 'ready';
    this.sessionStore.set(session.id, session);

    await this.audit.record({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'voice-recorder-plugin.transcribe',
      route: 'POST /v1/voice-recorder-plugin/transcribe',
      ip: auth.ip,
      metadata: {
        sessionId: session.id,
        clipId: clip.id,
        chars: text.length,
        tier: session.tier,
      } as never,
    });

    return {
      sessionId: session.id,
      clip,
      transcript: text,
      fullTranscript: session.clips.map((c) => c.text).join('\n\n'),
      economy: {
        sku: clip.sku,
        meterHint: 'POST /v1/model-economy/meter with units ≈ audio minutes',
        unitsHint: Number((clip.durationHintSec! / 60).toFixed(3)),
      },
    };
  }

  async finalize(auth: OrgAuth, body: Record<string, unknown>) {
    const sessionId = String(body.sessionId ?? '').trim();
    if (!sessionId) {
      throw new ApiException('validation_error', 'sessionId is required', HttpStatus.BAD_REQUEST);
    }
    const session = this.getOwned(auth, sessionId);
    session.status = 'finalized';
    this.sessionStore.set(session.id, session);
    const transcript = session.clips.map((c) => c.text).join('\n\n');
    await this.audit.record({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'voice-recorder-plugin.finalize',
      route: 'POST /v1/voice-recorder-plugin/finalize',
      ip: auth.ip,
      metadata: { sessionId, clips: session.clips.length } as never,
    });
    return {
      session: {
        id: session.id,
        status: session.status,
        clipCount: session.clips.length,
        transcript,
        tier: session.tier,
        sku: `vlm.field-notes-stt.${session.tier}`,
      },
    };
  }
}
