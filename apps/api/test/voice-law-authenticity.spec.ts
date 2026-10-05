import { createHash } from 'crypto';
import { assessAntiSpoof } from '../src/voice-biometrics/anti-spoof';
import { voiceLawAuthenticityCatalog, voiceLawAuthenticityHonesty } from '../src/voice-law-authenticity/voice-law-authenticity.catalog';

function pcmWav(seconds = 1.2, sampleRate = 16000): Buffer {
  const n = Math.floor(seconds * sampleRate);
  const dataSize = n * 2;
  const buf = Buffer.alloc(44 + dataSize);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate;
    const sample = Math.sin(2 * Math.PI * 220 * t) * 0.35;
    buf.writeInt16LE(Math.floor(sample * 32767), 44 + i * 2);
  }
  return buf;
}

describe('voice law authenticity', () => {
  it('catalog is honest about court limits', () => {
    const honesty = voiceLawAuthenticityHonesty();
    expect(honesty.courtSoleEvidence).toBe(false);
    expect(honesty.nistPadCertified).toBe(false);
    const catalog = voiceLawAuthenticityCatalog();
    expect(catalog.modelCard.id).toBe('vl-law-voice-auth-v1');
    expect(catalog.capabilities.some((c) => c.id === 'analyze')).toBe(true);
  });

  it('anti-spoof flags tone-like synthetic clips and stays uncertified', () => {
    const wav = pcmWav(1.5);
    const result = assessAntiSpoof(wav);
    expect(result.certifiedPad).toBe(false);
    expect(result.flags.length).toBeGreaterThan(0);
    expect(createHash('sha256').update(wav).digest('hex')).toHaveLength(64);
  });
});
