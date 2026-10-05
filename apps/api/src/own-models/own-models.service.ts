import { HttpStatus, Injectable } from '@nestjs/common';
import { ApiException } from '../common/errors/api-exception';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { UsageService } from '../usage/usage.service';
import { CREDIT_RATES } from '../billing/credits';
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

@Injectable()
export class OwnModelsService {
  constructor(private readonly usage: UsageService) {}

  engine() {
    return {
      ...ownModelsCatalog(),
      safety: ownModelsHonesty(),
      routingTable: listRoutingTable(),
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
      links: ownModelsCatalog().related,
    };
  }
}
