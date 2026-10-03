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

describe('hidePhaseIds — console copy', () => {
  it('strips parenthetical and bare VL phase ids', () => {
    expect(hidePhaseIds('Financial Intelligence (VL-266). Domain terms.')).toBe(
      'Financial Intelligence. Domain terms.',
    );
    expect(hidePhaseIds('African Intelligence Cloud (VL-260–270). Discovery hub.')).toBe(
      'African Intelligence Cloud. Discovery hub.',
    );
    expect(hidePhaseIds('VL-261. Representative seed.')).toBe('Representative seed.');
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
      const note = (catalog as { note?: string }).note ?? '';
      expect(note).not.toMatch(/VL-\d{3}/i);
      const caps = (catalog as { capabilities?: Array<{ notes?: string }> }).capabilities ?? [];
      for (const c of caps) {
        if (c.notes) expect(c.notes).not.toMatch(/VL-\d{3}/i);
      }
    }
  });
});
