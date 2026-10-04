import { describe, expect, it } from 'vitest';
import { ModelEconomyService } from '../src/model-economy/model-economy.service';
import { VoiceRecorderPluginService } from '../src/voice-recorder-plugin/voice-recorder-plugin.service';

const session = {
  organizationId: 'org_test',
  workspaceId: 'ws_test',
  userId: 'user_test',
  role: 'owner',
} as const;

function stubPrisma() {
  return {
    auditEvent: {
      findMany: async () => [],
    },
  } as never;
}

function stubAudit() {
  return { record: async () => ({}) } as never;
}

describe('Model economy + phone voice recorder', () => {
  it('prices faster tiers higher than eco', async () => {
    const svc = new ModelEconomyService(stubPrisma(), stubAudit());
    const eco = await svc.quote(session as never, { useCase: 'field-notes-stt', tier: 'eco' });
    const ultra = await svc.quote(session as never, { useCase: 'field-notes-stt', tier: 'ultra' });
    expect(ultra.quote.unitPriceUsd).toBeGreaterThan(eco.quote.unitPriceUsd);
    expect(ultra.quote.tier.latencyMsP50).toBeLessThan(eco.quote.tier.latencyMsP50);

    const estimate = await svc.estimate(session as never, {
      useCase: 'meeting-stt',
      tier: 'turbo',
      units: 100,
    });
    expect(estimate.estimate.amountUsd).toBeGreaterThan(estimate.estimate.compare.ecoAmountUsd);
    expect(estimate.estimate.compare.ultraAmountUsd).toBeGreaterThan(estimate.estimate.amountUsd);

    const selected = await svc.select(session as never, {
      useCase: 'voice-assist',
      tier: 'ultra',
    });
    const metered = await svc.meter(session as never, {
      sku: selected.selection.sku,
      units: 2,
    });
    expect(metered.meter.amountUsd).toBeGreaterThan(0);
    expect(svc.catalog().count).toBeGreaterThanOrEqual(8);
  });

  it('records phone audio into transcript via plugin session', async () => {
    const speech = {
      recognize: async () => ({
        text: 'Habari yako kutoka shambani',
        language: 'sw',
        confidence: 0.91,
      }),
    };
    const svc = new VoiceRecorderPluginService(stubPrisma(), stubAudit(), speech as never);
    const auth = {
      organizationId: session.organizationId,
      workspaceId: session.workspaceId,
      userId: session.userId,
    };
    const opened = await svc.sessions(auth, {
      platform: 'android',
      language: 'sw',
      tier: 'turbo',
    });
    expect(opened.session.sku).toBe('vlm.field-notes-stt.turbo');

    const transcribed = await svc.transcribe(auth, {
      sessionId: opened.session.id,
      file: {
        buffer: Buffer.from('fake-audio'),
        size: 32000,
        originalname: 'note.m4a',
        mimetype: 'audio/mp4',
      } as Express.Multer.File,
      language: 'sw',
    });
    expect(transcribed.transcript).toContain('Habari');
    expect(transcribed.economy.sku).toBe('vlm.field-notes-stt.turbo');

    const finalized = await svc.finalize(auth, { sessionId: opened.session.id });
    expect(finalized.session.status).toBe('finalized');
    expect(finalized.session.transcript).toContain('Habari');

    const manifest = svc.manifest('ios');
    expect(manifest.platform).toBe('ios');
    expect(manifest.className).toBe('VoiceRecorderPlugin');
  });
});
