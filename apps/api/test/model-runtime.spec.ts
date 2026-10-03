import {
  engineManifest,
  translateAfrican,
} from '../src/model-runtime/african-linguistic-engine';
import { runAfricanQualityEval, vendorBaselineTranslate } from '../src/model-runtime/african-quality-eval';
import {
  assertEnterpriseUnlock,
  evaluateAllEnterpriseUnlocks,
} from '../src/model-runtime/enterprise-unlocks';
import { LocalRuntimeMtAdapter } from '../src/model-runtime/local-runtime';
import { ModelRuntimeService } from '../src/model-runtime/model-runtime.service';
import { probeWeightsDeploy } from '../src/model-runtime/weights-deploy';
import { EnterpriseNationPlatformService } from '../src/enterprise-nation-platform/enterprise-nation-platform.service';
import { GovernmentIntelligenceService } from '../src/government-intelligence/government-intelligence.service';
import {
  createVerbalabChat,
  createVerbalabDetect,
  createVerbalabEmbed,
  createVerbalabOcr,
  createVerbalabStt,
  createVerbalabTts,
  FixtureVerbalabMtAdapter,
  ownAiStackSummary,
} from '../src/gateway/verbalab-own-ai';

describe('VerbaLab model runtime honesty closeout', () => {
  it('ships African linguistic engine with forward + reverse packs', () => {
    const m = engineManifest();
    expect(m.ownedModels).toBe(true);
    expect(m.lexiconPairs).toEqual(
      expect.arrayContaining(['en-sw', 'sw-en', 'en-yo', 'yo-en', 'en-am', 'am-en', 'en-ha', 'ha-en', 'en-zu', 'zu-en']),
    );
    expect(m.lexiconEntries).toBeGreaterThan(100);
  });

  it('translates African phrases via local runtime', async () => {
    const hit = translateAfrican({ text: 'hello', source: 'en', target: 'sw' });
    expect(hit.matched).toBe(true);
    expect(hit.text).toBe('habari');

    const back = translateAfrican({ text: 'habari', source: 'sw', target: 'en' });
    expect(back.matched).toBe(true);
    expect(back.text).toBe('hello');

    const mt = new LocalRuntimeMtAdapter();
    const out = await mt.translate({ text: 'send money', source: 'en', target: 'ha' });
    expect(out.provider).toBe('verbalab_own_ai');
    expect(out.text).toBe('aika kudi');
  });

  it('gateway fixture MT uses African runtime', async () => {
    const mt = new FixtureVerbalabMtAdapter();
    const out = await mt.translate({ text: 'hello', source: 'en', target: 'zu' });
    expect(out.text).toBe('sawubona');
  });

  it('local runtime covers all Own AI modalities without HTTP pods', async () => {
    const summary = ownAiStackSummary();
    expect(summary.localModelRuntime).toBe(true);
    expect(summary.modalities.mt).toBe(true);
    expect(summary.modalities.stt).toBe(true);
    expect(summary.modalities.tts).toBe(true);
    expect(summary.modalities.chat).toBe(true);
    expect(summary.modalities.embed).toBe(true);
    expect(summary.modalities.ocr).toBe(true);
    expect(summary.modalities.detect).toBe(true);
    expect(summary.modalities.clone).toBe(true);

    const stt = await createVerbalabStt().transcribe({
      buffer: Buffer.from('x'),
      filename: 'a.wav',
      mimeType: 'audio/wav',
      language: 'yo',
    });
    expect(stt.provider).toBe('verbalab_own_ai');

    const tts = await createVerbalabTts().synthesize({
      text: 'Karibu',
      voice: createVerbalabTts().listVoices()[0]!.id,
      format: 'wav',
    });
    expect(tts.audio.length).toBeGreaterThan(10);

    const chat = await createVerbalabChat().complete({
      messages: [{ role: 'user', content: 'Habari' }],
    });
    expect(chat.message.content).toContain('Habari');

    const embed = await createVerbalabEmbed().embed({ input: 'Africa' });
    expect(embed.data[0]!.embedding.length).toBeGreaterThan(8);

    const ocr = await createVerbalabOcr().extract({
      buffer: Buffer.from('img'),
      filename: 'x.png',
      mimeType: 'image/png',
    });
    expect(ocr.provider).toBe('verbalab_own_ai');

    const detect = await createVerbalabDetect().detect({ text: 'na ya wa ni kwa' });
    expect(detect.language).toBe('sw');
  });

  it('weights deploy probe reports absent local mode by default', async () => {
    const prev = process.env.VERBALAB_WEIGHTS_URL;
    delete process.env.VERBALAB_WEIGHTS_URL;
    const probe = await probeWeightsDeploy();
    expect(probe.status).toBe('absent');
    expect(probe.mode).toBe('local_lexicon');
    expect(probe.honesty.weightBinariesInRepo).toBe(false);
    if (prev === undefined) delete process.env.VERBALAB_WEIGHTS_URL;
    else process.env.VERBALAB_WEIGHTS_URL = prev;
  });

  it('quality eval beats English-centric vendor baseline stub', () => {
    expect(vendorBaselineTranslate({ text: 'hello', source: 'en', target: 'yo' })).toBe('hello');
    const report = runAfricanQualityEval();
    expect(report.total).toBeGreaterThan(80);
    expect(report.ownWinRate).toBeGreaterThan(0.8);
    expect(report.ownWinRate).toBeGreaterThan(report.baselineWinRate);
    expect(report.honesty.sotaClaimsForbidden).toBe(true);
  });

  it('enterprise unlocks stay locked until checklist met', () => {
    const before = evaluateAllEnterpriseUnlocks();
    expect(before.allReady).toBe(false);

    const gov = assertEnterpriseUnlock('government', [
      'data_residency',
      'audit_trail',
      'sovereign_mt',
      'access_control',
      'dpa',
      'human_review',
    ]);
    expect(gov.productionReady).toBe(true);

    const bank = assertEnterpriseUnlock('banking', [
      'data_residency',
      'audit_trail',
      'sovereign_mt',
      'pci_scope',
      'fraud_review',
      'dpa',
    ]);
    expect(bank.productionReady).toBe(true);

    const hospital = assertEnterpriseUnlock('hospital', [
      'data_residency',
      'audit_trail',
      'sovereign_mt',
      'clinical_safety',
      'baa',
      'no_diagnosis',
    ]);
    expect(hospital.productionReady).toBe(true);
    expect(hospital.honesty.clinicalAdviceForbidden).toBe(true);
  });

  it('wires unlock overlay into enterprise nation + government intelligence', () => {
    const nation = new EnterpriseNationPlatformService({} as never);
    const engine = nation.engine();
    expect(engine.verticalProduction.banking).toBeTruthy();
    expect(engine.honesty.unlockGates).toBe(true);
    expect(engine.capabilities.some((c: { id: string }) => c.id === 'bank')).toBe(true);

    const gov = new GovernmentIntelligenceService().engine();
    expect(gov.productionUnlock.sector).toBe('government');
    expect(gov.honesty.unlockGates).toBe(true);
  });

  it('overview exposes honest-to-say-out-loud claims + modality smoke', async () => {
    const service = new ModelRuntimeService();
    const overview = await service.overview({
      organizationId: 'org_test',
      workspaceId: 'ws_test',
      userId: 'user_test',
      clerkUserId: 'clerk_test',
      role: 'owner',
    });
    expect(overview.honestToSayOutLoud.length).toBeGreaterThanOrEqual(4);
    expect(overview.eval.ownWinRate).toBeGreaterThan(overview.eval.baselineWinRate);
    expect(overview.modalitiesSmoke.mt).toBeTruthy();
    expect(overview.modalitiesSmoke.ttsBytes).toBeGreaterThan(10);
    expect(overview.weights.status).toBe('absent');
  });
});
