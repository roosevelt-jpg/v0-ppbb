import { describe, expect, it } from 'vitest';
import { AgentVoiceTrainingService } from '../src/agent-voice-training/agent-voice-training.service';
import { agentSpeechModels } from '../src/agent-voice-training/agent-voice-training.catalog';

describe('Agent voice training', () => {
  const svc = new AgentVoiceTrainingService(
    { auditEvent: { findMany: async () => [] } } as never,
    { record: async () => ({}) } as never,
  );

  const auth = {
    organizationId: 'org_demo',
    workspaceId: 'ws_demo',
    userId: 'user_demo',
  };

  it('lists models and Africa+beyond languages', () => {
    expect(svc.models().count).toBe(agentSpeechModels().length);
    const langs = svc.languages();
    expect(langs.africaCount).toBeGreaterThan(10);
    expect(langs.beyondCount).toBeGreaterThan(3);
    expect(langs.languages.some((l) => l.code === 'sw')).toBe(true);
    expect(langs.languages.some((l) => l.code === 'en' && l.scope === 'beyond')).toBe(true);
  });

  it('creates, trains, previews, and exports a persona pack', async () => {
    const created = await svc.createPersona(auth, {
      name: 'East Africa support',
      baseModelId: 'atlas-tts',
      languages: 'sw,en,fr',
      style: 'warm-professional',
    });
    expect(created.persona.status).toBe('draft');
    expect(created.persona.languages).toEqual(['sw', 'en', 'fr']);

    const trained = await svc.trainPersona(auth, created.persona.id, { epochs: 2 });
    expect(trained.persona.status).toBe('ready');

    const preview = await svc.previewPersona(auth, created.persona.id, {
      language: 'sw',
      text: 'Habari!',
    });
    expect(preview.speak.model).toBe('atlas-tts');
    expect(preview.language).toBe('sw');

    const sdk = svc.sdkPack(auth, created.persona.id);
    expect(sdk.snippet).toContain('VerbaLab');
    expect(sdk.endpoints.tts).toContain('/v1/');

    const exported = await svc.exportPack(auth, { personaId: created.persona.id });
    expect(exported.exported).toBe(true);
  });
});
