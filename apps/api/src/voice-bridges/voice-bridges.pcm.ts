import { extractPcmMono } from '../speaker-intelligence/fingerprint';

/** Resample float mono PCM to target Hz and encode as little-endian PCM16 (no WAV header). */
export function audioToRawPcm16(audio: Buffer, targetSampleRate: number): Buffer {
  const { samples, sampleRate } = extractPcmMono(audio);
  const rate = Math.max(8000, Math.min(48000, Math.floor(targetSampleRate) || 24000));
  const resampled =
    rate === sampleRate ? samples : resampleLinear(samples, sampleRate, rate);
  const out = Buffer.alloc(resampled.length * 2);
  for (let i = 0; i < resampled.length; i++) {
    const s = Math.max(-1, Math.min(1, resampled[i] ?? 0));
    out.writeInt16LE(Math.round(s * 32767), i * 2);
  }
  return out;
}

export function pcm16ToWav(pcm: Buffer, sampleRate: number): Buffer {
  const dataSize = pcm.length;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  pcm.copy(buffer, 44);
  return buffer;
}

function resampleLinear(samples: Float32Array, fromRate: number, toRate: number): Float32Array {
  const ratio = toRate / fromRate;
  const outLen = Math.max(1, Math.floor(samples.length * ratio));
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const src = i / ratio;
    const i0 = Math.floor(src);
    const i1 = Math.min(samples.length - 1, i0 + 1);
    const t = src - i0;
    out[i] = (samples[i0] ?? 0) * (1 - t) + (samples[i1] ?? 0) * t;
  }
  return out;
}
