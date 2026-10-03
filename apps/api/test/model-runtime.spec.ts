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
import { FixtureVerbalabMtAdapter, ownAiStackSummary } from '../src/gateway/verbalab-own-ai';

describe('VerbaLab model runtime honesty closeout', () => {
  it('ships African linguistic engine with multi-pair packs', () => {
    const m = engineManifest();
    expect(m.ownedModels).toBe(true);
    expect(m.lexiconPairs).toEqual(expect.arrayContaining(['en-sw', 'en-yo', 'en-am', 'en-ha', 'en-zu']));
    expect(m.lexiconEntries).toBeGreaterThan(50);
  });

  it('translates African phrases via local runtime', async () => {
    const hit = translateAfrican({ text: 'hello', source: 'en', target: 'sw' });
    expect(hit.matched).toBe(true);
    expect(hit.text).toBe('habari');

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

  it('quality eval beats English-centric vendor baseline stub', () => {
    expect(vendorBaselineTranslate({ text: 'hello', source: 'en', target: 'yo' })).toBe('hello');
    const report = runAfricanQualityEval();
    expect(report.total).toBeGreaterThan(40);
    expect(report.ownWinRate).toBeGreaterThan(0.8);
    expect(report.ownWinRate).toBeGreaterThan(report.baselineWinRate);
    expect(report.honesty.sotaClaimsForbidden).toBe(true);
  });

  it('enterprise unlocks stay locked until checklist met', () => {
    const before = evaluateAllEnterpriseUnlocks();
    expect(before.allReady).toBe(false);
    expect(before.productionUnlocks.every((s) => s.sector)).toBe(true);

    const gov = assertEnterpriseUnlock('government', [
      'data_residency',
      'audit_trail',
      'sovereign_mt',
      'access_control',
      'dpa',
      'human_review',
    ]);
    expect(gov.productionReady).toBe(true);
    expect(gov.unlockedAt).toBeTruthy();

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

  it('overview exposes honest-to-say-out-loud claims', async () => {
    const service = new ModelRuntimeService();
    const overview = await service.overview({
      organizationId: 'org_test',
      workspaceId: 'ws_test',
      userId: 'user_test',
      clerkUserId: 'clerk_test',
      role: 'owner',
    });
    expect(overview.honestToSayOutLoud.length).toBeGreaterThanOrEqual(3);
    expect(overview.eval.ownWinRate).toBeGreaterThan(overview.eval.baselineWinRate);
    expect(ownAiStackSummary().localModelRuntime).toBe(true);
  });
});
