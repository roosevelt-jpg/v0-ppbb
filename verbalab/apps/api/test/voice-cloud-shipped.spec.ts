import { voiceProductCatalog } from '../src/voice-cloud/voice-products.catalog';
import { neuralTtsEngineCatalog } from '../src/neural-tts/neural-tts.catalog';
import { voiceCloningEngineCatalog } from '../src/voice-cloning/voice-cloning.catalog';
import { emotionVoiceEngineCatalog } from '../src/emotion-voice/emotion-voice.catalog';
import { voiceEnhancementEngineCatalog } from '../src/voice-enhancement/voice-enhancement.catalog';
import { voiceMarketplaceEngineCatalog } from '../src/voice-marketplace/voice-marketplace.catalog';
import { voiceAnalyticsCatalog } from '../src/voice-analytics/voice-analytics.catalog';
import { voiceBiometricsEngineCatalog } from '../src/voice-biometrics/voice-biometrics.catalog';

describe('Voice Cloud shipped closeout', () => {
  it('ships all Voice Cloud hub products except deferred voice-conversion', () => {
    const rows = voiceProductCatalog();
    const deferred = rows.filter((r) => r.status === 'deferred');
    expect(deferred.map((r) => r.id)).toEqual(['voice-conversion']);
    expect(rows.filter((r) => r.status === 'partial')).toHaveLength(0);
    expect(rows.filter((r) => r.status === 'shipped').every((r) => r.api && r.console)).toBe(true);
    expect(rows.find((r) => r.id === 'voice-faq')?.api).toBe('GET /v1/voice/status');
    expect(rows.find((r) => r.id === 'emotion-voice')?.console).toBe('/emotion-voice');
  });

  it('ships Neural TTS / Cloning / Emotion Voice capability catalogs without partial', () => {
    for (const catalog of [
      neuralTtsEngineCatalog(),
      voiceCloningEngineCatalog(),
      emotionVoiceEngineCatalog(),
      voiceEnhancementEngineCatalog(),
      voiceMarketplaceEngineCatalog(),
      voiceAnalyticsCatalog(),
      voiceBiometricsEngineCatalog(),
    ]) {
      const caps = (catalog as { capabilities: Array<{ status: string }> }).capabilities;
      expect(caps.every((c) => c.status !== 'partial')).toBe(true);
    }
    expect(neuralTtsEngineCatalog().capabilities.find((c) => c.id === 'children-voices')?.status).toBe(
      'deferred',
    );
    expect(emotionVoiceEngineCatalog().architecture.trainedExpressiveModel).toBe(false);
  });
});
