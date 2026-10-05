import { speechProductCatalog } from '../src/speech-cloud/speech-products.catalog';
import { voiceStudioEngineCatalog } from '../src/voice-studio/voice-studio.catalog';
import { speechEngineCatalog } from '../src/speech-recognition/speech-engine.catalog';

describe('Speech Cloud + Voice Studio shipped closeout', () => {
  it('marks all Speech Cloud hub products shipped with APIs/consoles', () => {
    const rows = speechProductCatalog();
    expect(rows.every((r) => r.status === 'shipped')).toBe(true);
    expect(rows.every((r) => r.api && r.console)).toBe(true);
    const bio = rows.find((r) => r.id === 'voice-biometrics')!;
    expect(bio.api).toBe('GET /v1/voice-biometrics/engine');
    expect(bio.console).toBe('/voice-biometrics');
    const stream = rows.find((r) => r.id === 'streaming-stt')!;
    expect(stream.api).toBe('POST /v1/speech/stream');
  });

  it('marks Voice Studio capabilities shipped (DAW extras deferred via honesty)', () => {
    const studio = voiceStudioEngineCatalog();
    expect(studio.capabilities.every((c) => c.status === 'shipped')).toBe(true);
    expect(studio.honesty.nonlinearDaw).toBe(false);
    expect(studio.honesty.waveformEditing).toBe(false);
    expect(studio.honesty.vendorSsmlPassthrough).toBe(false);
    for (const id of ['voice-editing', 'timeline-editing', 'ssml-editor', 'analytics']) {
      expect(studio.capabilities.find((c) => c.id === id)?.status).toBe('shipped');
    }
  });

  it('ships speech recognition streaming + realtime SSE paths', () => {
    const eng = speechEngineCatalog();
    expect(eng.capabilities.find((c) => c.id === 'streaming-stt')?.status).toBe('shipped');
    expect(eng.capabilities.find((c) => c.id === 'realtime')?.status).toBe('shipped');
    expect(eng.capabilities.every((c) => c.status !== 'partial')).toBe(true);
  });
});
