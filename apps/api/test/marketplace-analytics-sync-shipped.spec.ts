import { voiceMarketplaceEngineCatalog } from '../src/voice-marketplace/voice-marketplace.catalog';
import { voiceAnalyticsCatalog } from '../src/voice-analytics/voice-analytics.catalog';
import { speechAnalyticsCatalog } from '../src/speech-analytics/speech-analytics.catalog';
import { wakeWordEngineCatalog } from '../src/wake-word/wake-word-engine.catalog';
import { callIntelligenceEngineCatalog } from '../src/call-intelligence/call-engine.catalog';

describe('Marketplace + analytics sync shipped closeout', () => {
  it('ships marketplace/analytics/wake/call catalogs without partial', () => {
    for (const catalog of [
      voiceMarketplaceEngineCatalog(),
      voiceAnalyticsCatalog(),
      speechAnalyticsCatalog(),
      wakeWordEngineCatalog(),
      callIntelligenceEngineCatalog(),
    ]) {
      const caps = (catalog as { capabilities: Array<{ id: string; status: string }> }).capabilities;
      expect(caps.every((c) => c.status !== 'partial')).toBe(true);
    }
    const billing = voiceMarketplaceEngineCatalog().capabilities.find((c) => c.id === 'billing');
    expect(billing?.api).toBe('GET /v1/voice-marketplace/access');
    expect(billing?.notes).toMatch(/Free browse/i);
  });

  it('keeps expected OS deferrals only', () => {
    expect(wakeWordEngineCatalog().capabilities.find((c) => c.id === 'on-device-dnn')?.status).toBe(
      'deferred',
    );
    expect(
      callIntelligenceEngineCatalog().capabilities.find((c) => c.id === 'realtime-ccaas')?.status,
    ).toBe('deferred');
    expect(speechAnalyticsCatalog().capabilities.find((c) => c.id === 'wer-lab')?.status).toBe(
      'deferred',
    );
    expect(voiceAnalyticsCatalog().capabilities.find((c) => c.id === 'bi-dashboard')?.status).toBe(
      'deferred',
    );
  });
});
