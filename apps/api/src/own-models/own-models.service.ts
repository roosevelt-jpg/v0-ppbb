import { HttpStatus, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ApiException } from '../common/errors/api-exception';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { UsageService } from '../usage/usage.service';
import { CREDIT_RATES } from '../billing/credits';
import { GatewayService } from '../gateway/gateway.service';
import {
  costCard,
  getOwnModelFamily,
  ownModelFamilies,
  ownModelsCatalog,
  ownModelsHonesty,
} from './own-models.catalog';
import {
  compareFamilies,
  listRoutingTable,
  routeOwnModel,
  type BudgetPref,
  type RouteIntent,
} from './own-models.router';
import { labRecipes, recommendForGoal } from './own-models.lab';

type LabPreference = {
  id: string;
  organizationId: string;
  goal: string;
  winnerId: string;
  loserId?: string;
  note?: string;
  createdAt: string;
};

@Injectable()
export class OwnModelsService {
  private readonly preferences = new Map<string, LabPreference[]>();

  constructor(
    private readonly usage: UsageService,
    private readonly gateway: GatewayService,
  ) {}

  engine() {
    return {
      ...ownModelsCatalog(),
      safety: ownModelsHonesty(),
      routingTable: listRoutingTable(),
      lab: {
        docs: '/docs/MODEL_LAB.md',
        console: '/model-lab',
        recipes: labRecipes().map((r) => ({ id: r.id, title: r.title, blurb: r.blurb })),
      },
      families: ownModelFamilies().map((f) => ({
        id: f.id,
        title: f.title,
        modality: f.modality,
        costTier: f.costTier,
        sharpness: f.sharpness,
        consolePath: f.consolePath,
        marketingLine: f.marketingLine,
        openGaps: f.missing.filter((m) => m.status === 'open').length,
      })),
    };
  }

  list() {
    return {
      count: ownModelFamilies().length,
      families: ownModelFamilies().map((f) => ({
        ...f,
        cost: costCard(f),
      })),
    };
  }

  get(id: string) {
    const family = getOwnModelFamily(id);
    if (!family) {
      throw new ApiException('not_found', `Own model family not found: ${id}`, HttpStatus.NOT_FOUND);
    }
    return {
      family,
      cost: costCard(family),
      honesty: ownModelsHonesty(),
      links: {
        self: family.consolePath,
        api: family.apiBase,
        modelRelease: '/model-release',
        hub: '/own-models',
        lab: '/model-lab',
        try: family.try.href,
      },
    };
  }

  route(body: Record<string, unknown>) {
    const intent = String(body.intent ?? 'chat') as RouteIntent;
    const budget = (body.budget ? String(body.budget) : 'balanced') as BudgetPref;
    const result = routeOwnModel({
      intent,
      budget,
      language: body.language ? String(body.language) : undefined,
      preferOffline: body.preferOffline === true || body.preferOffline === 'true',
    });
    return {
      ...result,
      primary: {
        id: result.primary.id,
        title: result.primary.title,
        consolePath: result.primary.consolePath,
        costTier: result.primary.costTier,
        try: result.primary.try,
        marketingLine: result.primary.marketingLine,
      },
      alternates: result.alternates.map((a) => ({
        id: a.id,
        title: a.title,
        costTier: a.costTier,
        consolePath: a.consolePath,
      })),
      cost: costCard(result.primary),
    };
  }

  estimate(body: Record<string, unknown>) {
    const familyId = String(body.familyId ?? body.model ?? '');
    const family = getOwnModelFamily(familyId);
    if (!family) {
      throw new ApiException('validation_error', 'familyId is required', HttpStatus.BAD_REQUEST);
    }
    const units = Math.max(0, Number(body.units ?? 1));
    const product = family.creditProduct;
    if (!product) {
      return {
        familyId: family.id,
        units,
        credits: 0,
        note: 'This family is pack/fabric priced — not per-unit cloud credits.',
        cost: costCard(family),
      };
    }
    const rate = CREDIT_RATES[product];
    const credits = Number((units * rate.creditsPerUnit).toFixed(4));
    return {
      familyId: family.id,
      product,
      units,
      unit: rate.unit,
      creditsPerUnit: rate.creditsPerUnit,
      credits,
      note: rate.note,
      tip: costCard(family).tip,
      cheaperAlternative:
        family.siblings.find((s) => s.relation === 'cheaper')?.id ??
        (family.costTier === 'premium' ? 'Prefer specialist or frugal budget route' : null),
    };
  }

  compare(ids: string[]) {
    return compareFamilies(ids);
  }

  gaps() {
    const rows = ownModelFamilies().flatMap((f) =>
      f.missing
        .filter((m) => m.status === 'open')
        .map((m) => ({ familyId: f.id, title: f.title, ...m })),
    );
    return { count: rows.length, gaps: rows };
  }

  labRecipes() {
    return {
      count: labRecipes().length,
      recipes: labRecipes(),
      note: 'Pick a recipe or describe your project — then live-try before you commit to a stack.',
    };
  }

  labRecommend(body: Record<string, unknown>) {
    return recommendForGoal({
      goal: body.goal ? String(body.goal) : undefined,
      recipeId: body.recipeId ? String(body.recipeId) : undefined,
      budget: (body.budget ? String(body.budget) : 'balanced') as BudgetPref,
      language: body.language ? String(body.language) : undefined,
    });
  }

  async labTry(body: Record<string, unknown>) {
    const familyId = String(body.familyId ?? '').trim();
    const family = getOwnModelFamily(familyId);
    if (!family) {
      throw new ApiException('validation_error', 'familyId is required', HttpStatus.BAD_REQUEST);
    }
    const text = String(body.text ?? '').trim();
    if (!text) {
      throw new ApiException('validation_error', 'text is required for live try', HttpStatus.BAD_REQUEST);
    }
    const source = String(body.source ?? 'en');
    const target = String(body.target ?? 'sw');
    const started = Date.now();

    const base = {
      familyId: family.id,
      title: family.title,
      costTier: family.costTier,
      modality: family.modality,
      costHint: this.estimate({ familyId: family.id, units: Math.max(1, text.length) }),
    };

    try {
      if (family.modality === 'chat' || family.id === 'reason-fm' || family.id === 'baobab') {
        const out = await this.gateway.chat({
          messages: [
            {
              role: 'system',
              content:
                family.id === 'reason-fm'
                  ? 'You are VerbaLab Reason FM. Be structured and careful. Prefer African-context answers.'
                  : 'You are VerbaLab Baobab, an African language specialist. Answer clearly in the user’s language when possible.',
            },
            { role: 'user', content: text },
          ],
        });
        return {
          ...base,
          kind: 'chat',
          latencyMs: Date.now() - started,
          output: {
            text: out.message.content,
            model: out.model,
            provider: out.provider,
            tokens: out.totalTokens,
          },
        };
      }

      if (family.modality === 'mt' || family.id === 'translate-fm') {
        const out = await this.gateway.translate({ text, source, target });
        return {
          ...base,
          kind: 'mt',
          latencyMs: Date.now() - started,
          output: {
            text: out.text,
            source: out.source,
            target: out.target,
            provider: out.provider,
          },
        };
      }

      if (family.modality === 'tts' || family.id === 'voice-fm') {
        const out = await this.gateway.synthesize({
          text,
          voice: 'alloy',
          language: target,
          format: 'mp3',
        });
        return {
          ...base,
          kind: 'tts',
          latencyMs: Date.now() - started,
          output: {
            mimeType: out.mimeType ?? 'audio/mpeg',
            audioBase64: out.audio.toString('base64'),
            provider: out.provider,
            characters: text.length,
          },
        };
      }

      if (family.modality === 'embed' || family.id === 'vector-fm') {
        const out = await this.gateway.embed({ input: text });
        const vec = out.data?.[0]?.embedding ?? [];
        return {
          ...base,
          kind: 'embed',
          latencyMs: Date.now() - started,
          output: {
            dimensions: vec.length,
            preview: vec.slice(0, 8),
            provider: out.provider,
            model: out.model,
          },
        };
      }

      if (family.modality === 'stt' || family.id === 'echo' || family.id === 'speech-depth') {
        return {
          ...base,
          kind: 'stt',
          latencyMs: Date.now() - started,
          output: {
            text,
            note:
              'Live STT needs an audio upload on /speech or /echo. This lab pass treats your sample as reference transcript text so you can still compare downstream chat/MT pairs.',
            next: '/speech',
          },
        };
      }

      if (family.modality === 'ocr' || family.id === 'vision-fm') {
        return {
          ...base,
          kind: 'ocr',
          latencyMs: Date.now() - started,
          output: {
            text,
            note: 'Upload a page in Vision FM / playground for real OCR. Sample text shown for pair testing with Translate FM.',
            next: family.try.href,
          },
        };
      }

      if (family.modality === 'dubbing' || family.id === 'video-voice') {
        const mt = await this.gateway.translate({ text, source, target });
        const tts = await this.gateway.synthesize({
          text: mt.text,
          voice: 'alloy',
          language: target,
          format: 'mp3',
        });
        return {
          ...base,
          kind: 'dub',
          latencyMs: Date.now() - started,
          output: {
            translatedText: mt.text,
            mimeType: tts.mimeType ?? 'audio/mpeg',
            audioBase64: tts.audio.toString('base64'),
            pipeline: ['translate-fm', 'voice-fm'],
          },
        };
      }

      return {
        ...base,
        kind: 'guide',
        latencyMs: Date.now() - started,
        output: {
          text: `${family.title} is a ${family.sharpness} surface (${family.costTier}). ${family.marketingLine}`,
          useWhen: family.useWhen,
          pipelineHint: family.siblings,
          next: family.consolePath,
        },
      };
    } catch (err) {
      throw new ApiException(
        'provider_error',
        err instanceof Error ? err.message : 'Live try failed',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async labCompare(body: Record<string, unknown>) {
    const leftId = String(body.leftFamilyId ?? body.primaryId ?? '').trim();
    const rightId = String(body.rightFamilyId ?? body.compareId ?? '').trim();
    if (!leftId || !rightId) {
      throw new ApiException(
        'validation_error',
        'leftFamilyId and rightFamilyId are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    const shared = {
      text: body.text,
      source: body.source,
      target: body.target,
    };
    const [left, right] = await Promise.all([
      this.labTry({ ...shared, familyId: leftId }),
      this.labTry({ ...shared, familyId: rightId }),
    ]);
    return {
      left,
      right,
      tip: 'Prefer the clearer result at the lower cost tier. Escalate to premium only when quality fails.',
    };
  }

  labPrefer(session: SessionContext, body: Record<string, unknown>) {
    const winnerId = String(body.winnerId ?? '').trim();
    if (!winnerId || !getOwnModelFamily(winnerId)) {
      throw new ApiException('validation_error', 'winnerId must be a known family', HttpStatus.BAD_REQUEST);
    }
    const row: LabPreference = {
      id: `lab_${randomUUID().replace(/-/g, '').slice(0, 12)}`,
      organizationId: session.organizationId,
      goal: String(body.goal ?? ''),
      winnerId,
      loserId: body.loserId ? String(body.loserId) : undefined,
      note: body.note ? String(body.note) : undefined,
      createdAt: new Date().toISOString(),
    };
    const list = this.preferences.get(session.organizationId) ?? [];
    list.push(row);
    this.preferences.set(session.organizationId, list);
    return {
      saved: row,
      next: getOwnModelFamily(winnerId)?.consolePath ?? '/own-models',
      message: `Locked in ${winnerId} for this project style — open its console or keep comparing.`,
    };
  }

  labPreferences(organizationId: string) {
    const rows = this.preferences.get(organizationId) ?? [];
    return { count: rows.length, preferences: [...rows].reverse().slice(0, 20) };
  }

  async overview(session: SessionContext) {
    const usage = await this.usage.summary(session.organizationId);
    const breakdown = usage.creditsBreakdown ?? {};
    const suggested = routeOwnModel({
      intent:
        (breakdown.stt ?? 0) >= (breakdown.tts ?? 0) && (breakdown.stt ?? 0) >= (breakdown.translate ?? 0)
          ? 'stt'
          : (breakdown.tts ?? 0) >= (breakdown.translate ?? 0)
            ? 'tts'
            : (breakdown.translate ?? 0) > 0
              ? 'mt'
              : 'chat',
      budget: 'balanced',
    });
    return {
      session: {
        organizationId: session.organizationId,
        role: session.role,
      },
      engine: this.engine(),
      usagePriority: {
        creditsUsed: usage.creditsUsed,
        suggestedFamily: suggested.primary.id,
        reason: suggested.reason,
      },
      openGaps: this.gaps().count,
      links: { ...ownModelsCatalog().related, lab: '/model-lab' },
    };
  }
}
