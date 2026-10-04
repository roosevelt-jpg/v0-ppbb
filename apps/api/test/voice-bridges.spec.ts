import { describe, expect, it } from 'vitest';
import { voiceBridgesCatalog, voiceBridgesHonesty } from '../src/voice-bridges/voice-bridges.catalog';
import { pcm16ToWav } from '../src/voice-bridges/voice-bridges.pcm';
import { productFamiliesCatalog } from '../src/product-families/product-families.catalog';

describe('voice platform bridges', () => {
  it('marks every platform Yes + shipped (closes NO/Partial gaps)', () => {
    const catalog = voiceBridgesCatalog();
    expect(catalog.platforms.length).toBeGreaterThanOrEqual(12);
    for (const p of catalog.platforms) {
      expect(p.verdict, p.id).toBe('yes');
      expect(p.status, p.id).toBe('shipped');
      expect(p.endpoints.length, p.id).toBeGreaterThan(0);
      expect(p.setup.length, p.id).toBeGreaterThan(10);
    }
    const ids = catalog.platforms.map((p) => p.id);
    for (const required of [
      'vapi',
      'twilio',
      'amazon-polly',
      'amazon-lex',
      'amazon-connect',
      'google-cloud-tts',
      'google-speech',
      'dialogflow',
      'google-voice',
      'elevenlabs',
      'sip',
      'webrtc',
    ]) {
      expect(ids).toContain(required);
    }
    expect(voiceBridgesHonesty().ownAiPrimary).toBe(true);
    expect(voiceBridgesHonesty().replacesAwsGoogleMediaPlanes).toBe(false);
  });

  it('builds valid WAV headers for VAPI STT flush', () => {
    const pcm = Buffer.alloc(320); // 10ms @ 16k mono PCM16
    const wav = pcm16ToWav(pcm, 16000);
    expect(wav.toString('ascii', 0, 4)).toBe('RIFF');
    expect(wav.toString('ascii', 8, 12)).toBe('WAVE');
    expect(wav.readUInt32LE(24)).toBe(16000);
    expect(wav.length).toBe(44 + pcm.length);
  });

  it('registers voice-bridges as shipped_e2e in product families', () => {
    const row = productFamiliesCatalog().products.find((p) => p.slug === 'voice-bridges');
    expect(row?.status).toBe('shipped_e2e');
    expect(row?.api).toBe('GET /v1/voice-bridges/engine');
    expect(row?.consoleHref).toBe('/voice-bridges');
  });
});
