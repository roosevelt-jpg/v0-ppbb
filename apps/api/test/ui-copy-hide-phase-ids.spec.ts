import { hidePhaseIds, hidePhaseIdsInCopyFields } from '../src/common/ui-copy';
import { africanIntelligenceProductCatalog } from '../src/african-intelligence-cloud/african-intelligence-cloud.catalog';
import { africanLanguageRegistryEngineCatalog } from '../src/african-language-registry/african-language-registry.catalog';
import { culturalIntelligenceEngineCatalog } from '../src/cultural-intelligence/cultural-intelligence.catalog';
import { africanKnowledgeGraphEngineCatalog } from '../src/african-knowledge-graph/african-knowledge-graph.catalog';
import { governmentIntelligenceEngineCatalog } from '../src/government-intelligence/government-intelligence.catalog';
import { healthcareIntelligenceEngineCatalog } from '../src/healthcare-intelligence/healthcare-intelligence.catalog';
import { financialIntelligenceEngineCatalog } from '../src/financial-intelligence/financial-intelligence.catalog';
import { educationIntelligenceEngineCatalog } from '../src/education-intelligence/education-intelligence.catalog';
import { agriculturalIntelligenceEngineCatalog } from '../src/agricultural-intelligence/agricultural-intelligence.catalog';
import { tourismHeritageIntelligenceEngineCatalog } from '../src/tourism-heritage-intelligence/tourism-heritage-intelligence.catalog';
import { translateEngineCatalog } from '../src/translate/translate-engine.catalog';
import { researchCloudProductCatalog } from '../src/research-cloud/research-cloud.catalog';
import { experimentPlatformEngineCatalog } from '../src/experiment-platform/experiment-platform.catalog';
import { syntheticDataPlatformEngineCatalog } from '../src/synthetic-data-platform/synthetic-data-platform.catalog';
import { benchmarkPlatformEngineCatalog } from '../src/benchmark-platform/benchmark-platform.catalog';
import { evaluationPlatformEngineCatalog } from '../src/evaluation-platform/evaluation-platform.catalog';
import { aiPublicationPlatformEngineCatalog } from '../src/ai-publication-platform/ai-publication-platform.catalog';
import { patentInnovationPlatformEngineCatalog } from '../src/patent-innovation-platform/patent-innovation-platform.catalog';
import { openSciencePlatformEngineCatalog } from '../src/open-science-platform/open-science-platform.catalog';
import { researchAnalyticsEngineCatalog } from '../src/research-analytics/research-analytics.catalog';
import { mlopsLlmopsCloudProductCatalog } from '../src/mlops-llmops-cloud/mlops-llmops-cloud.catalog';
import { datasetPipelineEngineCatalog } from '../src/dataset-pipeline/dataset-pipeline.catalog';
import { foundationModelCloudCatalog } from '../src/foundation-model-cloud/foundation-model-cloud.catalog';
import { continuousEvaluationEngineCatalog } from '../src/continuous-evaluation/continuous-evaluation.catalog';
import { promptopsPlatformEngineCatalog } from '../src/promptops-platform/promptops-platform.catalog';
import { ragopsPlatformEngineCatalog } from '../src/ragops-platform/ragops-platform.catalog';
import { trustCloudProductCatalog, trustCloudHonesty } from '../src/trust-cloud/trust-cloud.catalog';
import { aiSafetyPlatformEngineCatalog } from '../src/ai-safety-platform/ai-safety-platform.catalog';
import { aiGovernancePlatformEngineCatalog, seedApprovalRequests } from '../src/ai-governance-platform/ai-governance-platform.catalog';
import { explainabilityPlatformEngineCatalog } from '../src/explainability-platform/explainability-platform.catalog';
import { privacyPlatformEngineCatalog } from '../src/privacy-platform/privacy-platform.catalog';
import { compliancePlatformEngineCatalog } from '../src/compliance-platform/compliance-platform.catalog';
import { identityFederationEngineCatalog } from '../src/identity-federation/identity-federation.catalog';
import { trustAnalyticsEngineCatalog } from '../src/trust-analytics/trust-analytics.catalog';

function expectNoVlInCatalog(catalog: {
  note?: string;
  notes?: string;
  capabilities?: Array<{ notes?: string }>;
  products?: Array<{ notes?: string }>;
  portfolio?: Array<{ notes?: string }>;
}) {
  if (catalog.note) expect(catalog.note).not.toMatch(/VL-\d{3}/i);
  if (catalog.notes) expect(catalog.notes).not.toMatch(/VL-\d{3}/i);
  for (const row of catalog.capabilities ?? []) {
    if (row.notes) expect(row.notes).not.toMatch(/VL-\d{3}/i);
  }
  for (const row of catalog.products ?? []) {
    if (row.notes) expect(row.notes).not.toMatch(/VL-\d{3}/i);
  }
  for (const row of catalog.portfolio ?? []) {
    if (row.notes) expect(row.notes).not.toMatch(/VL-\d{3}/i);
  }
}

describe('hidePhaseIds — console copy', () => {
  it('strips parenthetical and bare VL phase ids', () => {
    expect(hidePhaseIds('Financial Intelligence (VL-266). Domain terms.')).toBe(
      'Financial Intelligence. Domain terms.',
    );
    expect(hidePhaseIds('African Intelligence Cloud (VL-260–270). Discovery hub.')).toBe(
      'African Intelligence Cloud. Discovery hub.',
    );
    expect(hidePhaseIds('VL-261. Representative seed.')).toBe('Representative seed.');
    expect(hidePhaseIds('Scaffold (Phase 92 / VL-225).')).toBe('Scaffold (Phase 92).');
    expect(hidePhaseIds('Tracks honesty requirement from VL-273.')).toBe(
      'Tracks honesty requirement',
    );
  });

  it('strips ADR decision ids from console copy', () => {
    expect(hidePhaseIds('Versioned prompts with rollback (ADR-0030). Console /prompts.')).toBe(
      'Versioned prompts with rollback. Console /prompts.',
    );
    expect(hidePhaseIds('Product doc + ADR-0122.')).toBe('Product doc');
    expect(hidePhaseIds('See ADR-0086.')).toBe('See');
  });

  it('strips honesty denial tokens from console copy', () => {
    expect(hidePhaseIds('GitOps readiness. argoCdOs=false; fluxOs=false.')).toBe(
      'GitOps readiness.',
    );
    expect(
      hidePhaseIds('Architecture artifact store — not a full modeling suite (VL-359).'),
    ).toBe('Architecture artifact store — not a full modeling suite.');
    expect(hidePhaseIds('Control Plane rejected here (Volume 17+).')).toBe(
      'Control Plane (Volume 17+).',
    );
  });

  it('scrubs note/notes fields in nested objects', () => {
    const scrubbed = hidePhaseIdsInCopyFields({
      note: 'Hub (VL-260). Extends clouds.',
      products: [{ notes: 'VL-266. Fair lending flagged.' }],
      honesty: { coverageComplete: false },
    });
    expect(scrubbed.note).not.toMatch(/VL-\d{3}/i);
    expect(scrubbed.products[0].notes).not.toMatch(/VL-\d{3}/i);
    expect(scrubbed.honesty.coverageComplete).toBe(false);
  });

  it('keeps African Intelligence + Translate UI catalogs free of VL ids in notes', () => {
    for (const row of africanIntelligenceProductCatalog()) {
      expect(row.notes).not.toMatch(/VL-\d{3}/i);
    }
    for (const catalog of [
      africanLanguageRegistryEngineCatalog(),
      culturalIntelligenceEngineCatalog(),
      africanKnowledgeGraphEngineCatalog(),
      governmentIntelligenceEngineCatalog(),
      healthcareIntelligenceEngineCatalog(),
      financialIntelligenceEngineCatalog(),
      educationIntelligenceEngineCatalog(),
      agriculturalIntelligenceEngineCatalog(),
      tourismHeritageIntelligenceEngineCatalog(),
      translateEngineCatalog(),
    ]) {
      expectNoVlInCatalog(catalog as { note?: string; capabilities?: Array<{ notes?: string }> });
    }
  });

  it('keeps Research Cloud + MLOps UI catalogs free of VL ids in notes', () => {
    for (const row of researchCloudProductCatalog()) {
      expect(row.notes).not.toMatch(/VL-\d{3}/i);
    }
    for (const row of mlopsLlmopsCloudProductCatalog()) {
      expect(row.notes).not.toMatch(/VL-\d{3}/i);
    }
    for (const row of foundationModelCloudCatalog()) {
      expect(row.notes).not.toMatch(/VL-\d{3}/i);
      expect(row.notes).not.toMatch(/Phase \d+ \/ /);
    }
    for (const catalog of [
      experimentPlatformEngineCatalog(),
      syntheticDataPlatformEngineCatalog(),
      benchmarkPlatformEngineCatalog(),
      evaluationPlatformEngineCatalog(),
      aiPublicationPlatformEngineCatalog(),
      patentInnovationPlatformEngineCatalog(),
      openSciencePlatformEngineCatalog(),
      researchAnalyticsEngineCatalog(),
      datasetPipelineEngineCatalog(),
      continuousEvaluationEngineCatalog(),
      promptopsPlatformEngineCatalog(),
      ragopsPlatformEngineCatalog(),
      aiSafetyPlatformEngineCatalog(),
      aiGovernancePlatformEngineCatalog(seedApprovalRequests()),
      explainabilityPlatformEngineCatalog(),
      privacyPlatformEngineCatalog(),
      compliancePlatformEngineCatalog(),
      identityFederationEngineCatalog(),
      trustAnalyticsEngineCatalog(),
    ]) {
      expectNoVlInCatalog(catalog as { note?: string; capabilities?: Array<{ notes?: string }> });
    }
  });

  it('keeps Trust Cloud UI catalogs free of VL ids in notes', () => {
    for (const row of trustCloudProductCatalog()) {
      expect(row.notes).not.toMatch(/VL-\d{3}/i);
      expect(row.notes).not.toMatch(/^\/\d{3}/);
    }
    const honesty = trustCloudHonesty();
    expect(String(honesty.note)).not.toMatch(/VL-\d{3}/i);
    expect(String(honesty.note)).toMatch(/Platform Engineering Cloud deferred/);
  });
});
