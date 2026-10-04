import { HttpStatus, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AudioService } from '../audio/audio.service';
import { ApiException } from '../common/errors/api-exception';
import { africanLanguageSeed } from '../african-language-registry/african-language-registry.catalog';
import {
  agentSpeechModels,
  agentVoiceTrainingCatalog,
  agentVoiceTrainingHonesty,
  BEYOND_AFRICA_LANGUAGES,
} from './agent-voice-training.catalog';

type OrgAuth = {
  organizationId: string;
  workspaceId: string;
  userId?: string;
  apiKeyId?: string;
  ip?: string;
};

type PersonaStatus = 'draft' | 'training' | 'ready';

type AgentSpeechPersona = {
  id: string;
  organizationId: string;
  workspaceId: string;
  name: string;
  baseModelId: string;
  languages: string[];
  style: string;
  systemPrompt: string;
  status: PersonaStatus;
  sampleLine: string;
  createdAt: string;
  trainedAt?: string;
};

const SAMPLE_LINES: Record<string, string> = {
  sw: 'Habari! Ninafurahi kukusaidia leo.',
  yo: 'Báwo ni? Mo ní inú dídùn láti ràn ọ́ lọ́wọ́.',
  ha: 'Sannu! Ina farin cikin taimaka muku.',
  am: 'ሰላም! ዛሬ ልረዳዎ ደስ ብሎኛል።',
  zu: 'Sawubona! Ngiyajabula ukukusiza namuhla.',
  en: 'Hello! I am glad to help you today.',
  fr: 'Bonjour ! Je suis ravi de vous aider aujourd’hui.',
  ar: 'مرحباً! يسعدني مساعدتك اليوم.',
  pt: 'Olá! Fico feliz em ajudar você hoje.',
};

@Injectable()
export class AgentVoiceTrainingService {
  private readonly personas = new Map<string, AgentSpeechPersona>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly audio: AudioService,
  ) {}

  engine() {
    return {
      ...agentVoiceTrainingCatalog(),
      safety: agentVoiceTrainingHonesty(),
      modelCount: agentSpeechModels().length,
      languageCount: this.languages().count,
      personas: this.personas.size,
    };
  }

  models() {
    return { models: agentSpeechModels(), count: agentSpeechModels().length };
  }

  languages(query?: string) {
    const q = (query ?? '').trim().toLowerCase();
    const africa = africanLanguageSeed().map((l) => ({
      code: l.code,
      name: l.name,
      region: l.regions[0] ?? 'Africa',
      scope: 'africa' as const,
      status: l.status,
      family: l.family,
    }));
    const beyond = BEYOND_AFRICA_LANGUAGES.map((l) => ({
      code: l.code,
      name: l.name,
      region: l.region,
      scope: 'beyond' as const,
      status: 'shipped' as const,
      family: 'global',
    }));
    const languages = [...africa, ...beyond].filter((l) => {
      if (!q) return true;
      return (
        l.code.toLowerCase().includes(q) ||
        l.name.toLowerCase().includes(q) ||
        l.region.toLowerCase().includes(q)
      );
    });
    return {
      languages,
      count: languages.length,
      africaCount: africa.length,
      beyondCount: beyond.length,
      note: 'Train agents to speak like VerbaLab models in these languages.',
    };
  }

  monitoring() {
    return { status: 'ready', honesty: agentVoiceTrainingHonesty() };
  }

  async activity(organizationId: string) {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const rows = await this.prisma.auditEvent.findMany({
      where: {
        organizationId,
        createdAt: { gte: since },
        action: { contains: 'agent-voice-training' },
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
      models: this.models(),
      languages: {
        africaCount: this.languages().africaCount,
        beyondCount: this.languages().beyondCount,
        count: this.languages().count,
      },
      personas: this.listPersonas(auth.organizationId),
      activity: await this.activity(auth.organizationId),
      links: {
        self: '/agent-voice-training',
        docs: '/docs/AGENT_VOICE_TRAINING.md',
        voiceCloning: '/voice-cloning',
        neuralTts: '/neural-tts',
        agentRuntime: '/agent-runtime',
      },
    };
  }

  listPersonas(organizationId: string) {
    const rows = [...this.personas.values()].filter((p) => p.organizationId === organizationId);
    return { personas: rows, count: rows.length };
  }

  private requireModel(id: string) {
    const model = agentSpeechModels().find((m) => m.id === id);
    if (!model) {
      throw new ApiException('validation_error', `Unknown baseModelId: ${id}`, HttpStatus.BAD_REQUEST);
    }
    return model;
  }

  private normalizeLanguages(input: unknown): string[] {
    const codes = Array.isArray(input)
      ? input.map((c) => String(c).trim().toLowerCase()).filter(Boolean)
      : String(input ?? '')
          .split(',')
          .map((c) => c.trim().toLowerCase())
          .filter(Boolean);
    if (codes.length === 0) {
      throw new ApiException(
        'validation_error',
        'languages required (e.g. sw,yo,en)',
        HttpStatus.BAD_REQUEST,
      );
    }
    const known = new Set(this.languages().languages.map((l) => l.code));
    for (const code of codes) {
      if (!known.has(code)) {
        throw new ApiException(
          'validation_error',
          `Unsupported language code: ${code}`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }
    return [...new Set(codes)];
  }

  async createPersona(auth: OrgAuth, body: Record<string, unknown>) {
    const name = String(body.name ?? '').trim();
    if (!name) {
      throw new ApiException('validation_error', 'name is required', HttpStatus.BAD_REQUEST);
    }
    const baseModelId = String(body.baseModelId ?? 'atlas-tts').trim();
    const model = this.requireModel(baseModelId);
    const languages = this.normalizeLanguages(body.languages ?? ['sw', 'en']);
    const style = String(body.style ?? 'warm-professional').trim() || 'warm-professional';
    const systemPrompt =
      String(body.systemPrompt ?? '').trim() ||
      `You are a VerbaLab-powered agent. Speak naturally in the user's language using the ${model.name} voice profile. Prefer African language registers when appropriate; stay clear, respectful, and culturally aware.`;

    const persona: AgentSpeechPersona = {
      id: `avp_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
      organizationId: auth.organizationId,
      workspaceId: auth.workspaceId,
      name,
      baseModelId: model.id,
      languages,
      style,
      systemPrompt,
      status: 'draft',
      sampleLine: SAMPLE_LINES[languages[0] ?? 'en'] ?? SAMPLE_LINES.en,
      createdAt: new Date().toISOString(),
    };
    this.personas.set(persona.id, persona);

    await this.audit.record({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'agent-voice-training.persona_created',
      route: 'POST /v1/agent-voice-training/personas',
      ip: auth.ip,
      metadata: {
        personaId: persona.id,
        baseModelId: persona.baseModelId,
        languages: persona.languages,
      } as never,
    });

    return { persona, next: 'POST /v1/agent-voice-training/personas/:id/train' };
  }

  private getOrgPersona(organizationId: string, id: string): AgentSpeechPersona {
    const persona = this.personas.get(id);
    if (!persona || persona.organizationId !== organizationId) {
      throw new ApiException('not_found', 'Persona not found', HttpStatus.NOT_FOUND);
    }
    return persona;
  }

  async trainPersona(auth: OrgAuth, id: string, body: Record<string, unknown> = {}) {
    const persona = this.getOrgPersona(auth.organizationId, id);
    persona.status = 'training';
    // Simulated training step — binds language routing + style pack to VerbaLab models.
    const epochs = Math.min(20, Math.max(1, Number(body.epochs ?? 3) || 3));
    persona.status = 'ready';
    persona.trainedAt = new Date().toISOString();
    this.personas.set(persona.id, persona);

    await this.audit.record({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'agent-voice-training.persona_trained',
      route: 'POST /v1/agent-voice-training/personas/:id/train',
      ip: auth.ip,
      metadata: {
        personaId: persona.id,
        epochs,
        languages: persona.languages,
        baseModelId: persona.baseModelId,
      } as never,
    });

    return {
      persona,
      training: {
        epochs,
        status: 'ready',
        note: 'Persona pack ready — agents can speak like this VerbaLab model set across selected languages.',
      },
    };
  }

  async previewPersona(auth: OrgAuth, id: string, body: Record<string, unknown>) {
    const persona = this.getOrgPersona(auth.organizationId, id);
    const language = String(body.language ?? persona.languages[0] ?? 'en').trim().toLowerCase();
    if (!persona.languages.includes(language)) {
      throw new ApiException(
        'validation_error',
        `language ${language} not in persona languages`,
        HttpStatus.BAD_REQUEST,
      );
    }
    const text =
      String(body.text ?? '').trim() || SAMPLE_LINES[language] || persona.sampleLine;
    const model = this.requireModel(persona.baseModelId);
    const voice = String(body.voice ?? 'alloy').trim() || 'alloy';

    const speech = await this.audio.speak({
      text,
      voice,
      language,
      format: 'mp3',
      organizationId: auth.organizationId,
      workspaceId: auth.workspaceId,
      apiKeyId: auth.apiKeyId,
      userId: auth.userId,
      ip: auth.ip,
    });

    await this.audit.record({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'agent-voice-training.persona_preview',
      route: 'POST /v1/agent-voice-training/personas/:id/preview',
      ip: auth.ip,
      metadata: {
        personaId: persona.id,
        language,
        baseModelId: persona.baseModelId,
        characters: speech.characters,
      } as never,
    });

    return {
      personaId: persona.id,
      language,
      text,
      style: persona.style,
      status: persona.status,
      speak: {
        model: model.id,
        api: model.api,
        voiceProfile: `${persona.id}:${language}`,
        voice,
        mimeType: speech.mimeType ?? 'audio/mpeg',
        audioBase64: speech.audio.toString('base64'),
        characters: speech.characters,
        provider: speech.provider,
        note:
          persona.status === 'ready'
            ? 'Preview audio synthesized via VerbaLab TTS (metered credits)'
            : 'Train the persona before production use — preview still returns audio',
      },
      agentHint: {
        systemPrompt: persona.systemPrompt,
        tts: { model: model.id, language, style: persona.style, voice },
      },
    };
  }

  sdkPack(auth: OrgAuth, id: string) {
    const persona = this.getOrgPersona(auth.organizationId, id);
    const model = this.requireModel(persona.baseModelId);
    const snippet = `// VerbaLab Agent Voice Training pack — ${persona.name}
const persona = {
  id: "${persona.id}",
  baseModel: "${persona.baseModelId}",
  languages: ${JSON.stringify(persona.languages)},
  style: "${persona.style}",
  systemPrompt: ${JSON.stringify(persona.systemPrompt)},
};

// 1) Listen (STT)
await fetch("https://api.verbalab.ai/v1/speech/recognize", {
  method: "POST",
  headers: { Authorization: "Bearer <VERBALAB_API_KEY>" },
  body: formData, // audio
});

// 2) Reason + reply text (optional LLM)
// Use persona.systemPrompt so the agent mirrors VerbaLab tone.

// 3) Speak like VerbaLab models (TTS)
await fetch("https://api.verbalab.ai${model.api.replace('POST ', '')}", {
  method: "POST",
  headers: {
    Authorization: "Bearer <VERBALAB_API_KEY>",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    text: replyText,
    language: userLanguage, // one of ${persona.languages.join(', ')}
    voiceProfile: "${persona.id}:" + userLanguage,
    style: "${persona.style}",
  }),
});
`;

    return {
      persona: {
        id: persona.id,
        name: persona.name,
        status: persona.status,
        baseModelId: persona.baseModelId,
        languages: persona.languages,
        style: persona.style,
      },
      model,
      systemPrompt: persona.systemPrompt,
      endpoints: {
        stt: 'POST /v1/speech/recognize',
        tts: model.api,
        preview: `POST /v1/agent-voice-training/personas/${persona.id}/preview`,
        train: `POST /v1/agent-voice-training/personas/${persona.id}/train`,
      },
      snippet,
      docs: '/docs/AGENT_VOICE_TRAINING.md',
    };
  }

  async exportPack(auth: OrgAuth, body: Record<string, unknown>) {
    const personaId = String(body.personaId ?? '').trim();
    if (!personaId) {
      throw new ApiException('validation_error', 'personaId is required', HttpStatus.BAD_REQUEST);
    }
    const pack = this.sdkPack(auth, personaId);
    await this.audit.record({
      organizationId: auth.organizationId,
      userId: auth.userId,
      action: 'agent-voice-training.export_pack',
      route: 'POST /v1/agent-voice-training/export-pack',
      ip: auth.ip,
      metadata: { personaId } as never,
    });
    return { exported: true, pack };
  }
}
