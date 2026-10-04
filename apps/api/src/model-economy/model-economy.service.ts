import { HttpStatus, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../common/errors/api-exception';
import { modelEconomyCatalog, modelEconomyHonesty } from './model-economy.catalog';
import { SessionContext } from '../common/guards/clerk-auth.guard';

/** Speed tiers — faster = higher cost. */
export const SPEED_TIERS = [
  {
    id: 'eco',
    name: 'Eco',
    rank: 1,
    latencyMsP50: 1800,
    multiplier: 1,
    blurb: 'Lowest cost. Batch / async friendly. Best when productivity tolerates wait.',
  },
  {
    id: 'standard',
    name: 'Standard',
    rank: 2,
    latencyMsP50: 700,
    multiplier: 2.5,
    blurb: 'Balanced cost and speed for most product workloads.',
  },
  {
    id: 'turbo',
    name: 'Turbo',
    rank: 3,
    latencyMsP50: 280,
    multiplier: 5,
    blurb: 'Low latency for interactive UX. Higher unit price.',
  },
  {
    id: 'ultra',
    name: 'Ultra',
    rank: 4,
    latencyMsP50: 120,
    multiplier: 10,
    blurb: 'Fastest path for real-time voice and live meetings. Highest cost.',
  },
] as const;

type SpeedTierId = (typeof SPEED_TIERS)[number]['id'];

/**
 * USD unit costs aligned to ElevenLabs API pricing (elevenlabs.io/pricing/api):
 * TTS Multilingual $0.10 / 1k chars · Flash $0.05 / 1k · STT $0.22 / hour ≈ $0.00367 / min.
 * Speed tiers (eco→ultra) still scale cost for productivity latency.
 */
const USE_CASES = [
  {
    id: 'meeting-stt',
    name: 'Meeting transcription',
    modality: 'stt',
    family: 'echo',
    unit: 'audio_minute',
    baseUsdPerUnit: 0.00367, // $0.22/hr Scribe-class
    api: 'POST /v1/meeting-transcription/transcribe',
    productivity: 'Searchable meeting notes across African languages',
  },
  {
    id: 'field-notes-stt',
    name: 'Field / phone voice notes',
    modality: 'stt',
    family: 'echo',
    unit: 'audio_minute',
    baseUsdPerUnit: 0.00367,
    api: 'POST /v1/voice-recorder-plugin/transcribe',
    productivity: 'Record on phone → transcript for CRM and ops',
  },
  {
    id: 'call-center-stt',
    name: 'Call center transcription',
    modality: 'stt',
    family: 'echo',
    unit: 'audio_minute',
    baseUsdPerUnit: 0.00367,
    api: 'POST /v1/speech/recognize',
    productivity: 'QA and coaching at scale',
  },
  {
    id: 'stt-realtime',
    name: 'Realtime speech recognition',
    modality: 'stt',
    family: 'echo',
    unit: 'audio_minute',
    baseUsdPerUnit: 0.0065, // $0.39/hr realtime
    api: 'POST /v1/speech/recognize',
    productivity: 'Live captions and voice agents',
  },
  {
    id: 'voice-assist',
    name: 'Conversational voice assistant',
    modality: 'voice',
    family: 'verba-voice',
    unit: 'turn',
    baseUsdPerUnit: 0.012,
    api: 'POST /v1/verba-voice/turns',
    productivity: 'Grok-class voice mode for African languages',
  },
  {
    id: 'chat-assist',
    name: 'Text chat assistant',
    modality: 'chat',
    family: 'atlas',
    unit: '1k_tokens',
    baseUsdPerUnit: 0.002,
    api: 'POST /v1/chat/completions',
    productivity: 'Atlas African Voice LLM for apps and agents',
  },
  {
    id: 'tts-broadcast',
    name: 'Spoken replies / broadcast TTS',
    modality: 'tts',
    family: 'voice-fm',
    unit: '1k_chars',
    baseUsdPerUnit: 0.1, // Multilingual v2/v3 API
    api: 'POST /v1/audio/speech',
    productivity: 'Natural African speech for products and media',
  },
  {
    id: 'tts-flash',
    name: 'Flash / Turbo TTS',
    modality: 'tts',
    family: 'voice-fm',
    unit: '1k_chars',
    baseUsdPerUnit: 0.05,
    api: 'POST /v1/tts/synthesize',
    productivity: 'Low-latency spoken replies',
  },
  {
    id: 'translate',
    name: 'Translation',
    modality: 'translate',
    family: 'translate-fm',
    unit: '1k_chars',
    baseUsdPerUnit: 0.05,
    api: 'POST /v1/translate',
    productivity: 'Primary MT for African language pairs (shared credit pool)',
  },
  {
    id: 'media-caption',
    name: 'Media captioning',
    modality: 'stt',
    family: 'echo',
    unit: 'audio_minute',
    baseUsdPerUnit: 0.00367,
    api: 'POST /v1/speech/recognize',
    productivity: 'Captions for radio, video, and social',
  },
  {
    id: 'music',
    name: 'AI Music',
    modality: 'music',
    family: 'creative',
    unit: 'audio_minute',
    baseUsdPerUnit: 0.15,
    api: 'POST /v1/creative-media/music',
    productivity: 'Beds and motifs for African ads and podcasts',
  },
  {
    id: 'sfx',
    name: 'Sound effects',
    modality: 'sfx',
    family: 'creative',
    unit: 'generation',
    baseUsdPerUnit: 0.12,
    api: 'POST /v1/creative-media/sound-effects',
    productivity: 'SFX generations from the shared credit pool',
  },
] as const;

type Selection = {
  id: string;
  organizationId: string;
  useCaseId: string;
  tierId: SpeedTierId;
  sku: string;
  unitPriceUsd: number;
  selectedAt: string;
};

type MeterEvent = {
  id: string;
  organizationId: string;
  sku: string;
  units: number;
  amountUsd: number;
  at: string;
};

function priceFor(baseUsdPerUnit: number, multiplier: number): number {
  return Number((baseUsdPerUnit * multiplier).toFixed(6));
}

function skuFor(useCaseId: string, tierId: string): string {
  return `vlm.${useCaseId}.${tierId}`;
}

@Injectable()
export class ModelEconomyService {
  private readonly selections = new Map<string, Selection>();
  private readonly meters: MeterEvent[] = [];

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  engine() {
    return {
      ...modelEconomyCatalog(),
      safety: modelEconomyHonesty(),
      useCaseCount: USE_CASES.length,
      tierCount: SPEED_TIERS.length,
      principle: 'Pay for speed. Eco maximizes efficiency budget; Ultra maximizes productivity latency.',
    };
  }

  tiers() {
    return {
      tiers: SPEED_TIERS.map((t) => ({
        ...t,
        costRank: t.rank,
        fasterMeansHigherCost: true,
      })),
      count: SPEED_TIERS.length,
    };
  }

  catalog(useCaseFilter?: string) {
    const filter = useCaseFilter?.trim().toLowerCase();
    const useCases = USE_CASES.filter((u) => !filter || u.id === filter || u.modality === filter).map(
      (u) => ({
        ...u,
        skus: SPEED_TIERS.map((t) => ({
          sku: skuFor(u.id, t.id),
          tier: t.id,
          latencyMsP50: t.latencyMsP50,
          unitPriceUsd: priceFor(u.baseUsdPerUnit, t.multiplier),
          unit: u.unit,
        })),
      }),
    );
    return {
      useCases,
      count: useCases.length,
      tiers: this.tiers().tiers,
      currency: 'USD',
      note: 'Unit prices scale with speed tier multiplier (eco×1 → ultra×10).',
    };
  }

  async activity(organizationId: string) {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const rows = await this.prisma.auditEvent.findMany({
      where: { organizationId, createdAt: { gte: since }, action: { contains: 'model-economy' } },
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

  async overview(session: SessionContext) {
    return {
      session: {
        organizationId: session.organizationId,
        workspaceId: session.workspaceId,
        role: session.role,
      },
      engine: this.engine(),
      catalog: this.catalog(),
      activity: await this.activity(session.organizationId),
      links: {
        self: '/model-economy',
        docs: '/docs/MODEL_ECONOMY.md',
        modelKeys: '/model-keys',
      },
    };
  }

  monitoring() {
    return { status: 'ready', honesty: modelEconomyHonesty() };
  }

  private resolveUseCase(id: string) {
    const useCase = USE_CASES.find((u) => u.id === id);
    if (!useCase) {
      throw new ApiException(
        'validation_error',
        `Unknown useCase. Try: ${USE_CASES.map((u) => u.id).join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return useCase;
  }

  private resolveTier(id: string) {
    const tier = SPEED_TIERS.find((t) => t.id === id);
    if (!tier) {
      throw new ApiException(
        'validation_error',
        `Unknown tier. Try: ${SPEED_TIERS.map((t) => t.id).join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return tier;
  }

  async quote(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const useCase = this.resolveUseCase(String(body.useCase ?? body.useCaseId ?? 'meeting-stt'));
    const tier = this.resolveTier(String(body.tier ?? 'standard'));
    const unitPriceUsd = priceFor(useCase.baseUsdPerUnit, tier.multiplier);
    const quote = {
      id: randomUUID(),
      sku: skuFor(useCase.id, tier.id),
      useCase: { id: useCase.id, name: useCase.name, family: useCase.family, unit: useCase.unit },
      tier: { id: tier.id, name: tier.name, latencyMsP50: tier.latencyMsP50, multiplier: tier.multiplier },
      unitPriceUsd,
      currency: 'USD',
      productivity: useCase.productivity,
      quotedAt: new Date().toISOString(),
    };
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'model-economy.quote',
      route: 'POST /v1/model-economy/quote',
      ip,
      metadata: { sku: quote.sku, unitPriceUsd } as never,
    });
    return { quote };
  }

  async estimate(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const useCase = this.resolveUseCase(String(body.useCase ?? 'meeting-stt'));
    const tier = this.resolveTier(String(body.tier ?? 'standard'));
    const units = Math.max(0, Number(body.units ?? body.minutes ?? body.turns ?? 100));
    if (!Number.isFinite(units)) {
      throw new ApiException('validation_error', 'units must be a number', HttpStatus.BAD_REQUEST);
    }
    const unitPriceUsd = priceFor(useCase.baseUsdPerUnit, tier.multiplier);
    const amountUsd = Number((unitPriceUsd * units).toFixed(4));
    const ecoPrice = priceFor(useCase.baseUsdPerUnit, 1);
    const ultraPrice = priceFor(useCase.baseUsdPerUnit, 10);
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'model-economy.estimate',
      route: 'POST /v1/model-economy/estimate',
      ip,
      metadata: { useCase: useCase.id, tier: tier.id, units, amountUsd } as never,
    });
    return {
      estimate: {
        sku: skuFor(useCase.id, tier.id),
        units,
        unit: useCase.unit,
        unitPriceUsd,
        amountUsd,
        currency: 'USD',
        latencyMsP50: tier.latencyMsP50,
        compare: {
          ecoAmountUsd: Number((ecoPrice * units).toFixed(4)),
          ultraAmountUsd: Number((ultraPrice * units).toFixed(4)),
          note: 'Same workload: eco costs least / waits more; ultra costs most / responds fastest.',
        },
      },
    };
  }

  async select(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const useCase = this.resolveUseCase(String(body.useCase ?? 'field-notes-stt'));
    const tier = this.resolveTier(String(body.tier ?? 'turbo'));
    const unitPriceUsd = priceFor(useCase.baseUsdPerUnit, tier.multiplier);
    const selection: Selection = {
      id: randomUUID(),
      organizationId: session.organizationId,
      useCaseId: useCase.id,
      tierId: tier.id,
      sku: skuFor(useCase.id, tier.id),
      unitPriceUsd,
      selectedAt: new Date().toISOString(),
    };
    this.selections.set(selection.id, selection);
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'model-economy.select',
      route: 'POST /v1/model-economy/select',
      ip,
      metadata: { selectionId: selection.id, sku: selection.sku } as never,
    });
    return {
      selection,
      binding: {
        modelKeyScopes: [useCase.modality, '*'],
        api: useCase.api,
        headerHint: 'Authorization: Bearer vmod_live_… or vl_live_…',
      },
      note: 'Selection is the SKU your app should meter against for this use case.',
    };
  }

  async meter(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const sku = String(body.sku ?? '').trim();
    const units = Math.max(0, Number(body.units ?? 0));
    if (!sku) {
      throw new ApiException('validation_error', 'sku is required', HttpStatus.BAD_REQUEST);
    }
    if (!Number.isFinite(units) || units <= 0) {
      throw new ApiException('validation_error', 'units must be > 0', HttpStatus.BAD_REQUEST);
    }
    const parts = sku.split('.');
    const useCaseId = parts[1];
    const tierId = parts[2];
    const useCase = this.resolveUseCase(useCaseId);
    const tier = this.resolveTier(tierId);
    const unitPriceUsd = priceFor(useCase.baseUsdPerUnit, tier.multiplier);
    const amountUsd = Number((unitPriceUsd * units).toFixed(6));
    const event: MeterEvent = {
      id: randomUUID(),
      organizationId: session.organizationId,
      sku,
      units,
      amountUsd,
      at: new Date().toISOString(),
    };
    this.meters.push(event);
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'model-economy.meter',
      route: 'POST /v1/model-economy/meter',
      ip,
      metadata: { meterId: event.id, sku, units, amountUsd } as never,
    });
    return {
      meter: event,
      invoiceHint: {
        currency: 'USD',
        unit: useCase.unit,
        unitPriceUsd,
        amountUsd,
      },
    };
  }
}
