import { encodeWavPcm16, isolateVoice } from '../audio-intelligence/audio-dsp';
import { extractPcmMono } from '../speaker-intelligence/fingerprint';

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pitch/tempo voice change via resampling + gain. */
export function changeVoicePitch(
  buffer: Buffer,
  opts: { pitchSemitones?: number; rate?: number } = {},
): { wav: Buffer; pitchSemitones: number; rate: number; note: string } {
  const { samples, sampleRate } = extractPcmMono(buffer);
  const semitones = Math.max(-12, Math.min(12, opts.pitchSemitones ?? 4));
  const rate = Math.max(0.5, Math.min(2, opts.rate ?? 1));
  const ratio = Math.pow(2, semitones / 12) * rate;
  const outLen = Math.max(1, Math.floor(samples.length / ratio));
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const src = i * ratio;
    const i0 = Math.floor(src);
    const i1 = Math.min(samples.length - 1, i0 + 1);
    const t = src - i0;
    out[i] = ((samples[i0] ?? 0) * (1 - t) + (samples[i1] ?? 0) * t) * 0.95;
  }
  return {
    wav: encodeWavPcm16(out, sampleRate),
    pitchSemitones: semitones,
    rate,
    note: 'Resample pitch/tempo voice change — not a neural voice conversion model.',
  };
}

export function synthesizeSoundEffect(
  prompt: string,
  durationSeconds = 2,
): { wav: Buffer; kind: string; note: string } {
  const sampleRate = 22050;
  const seconds = Math.max(0.4, Math.min(8, durationSeconds));
  const n = Math.floor(sampleRate * seconds);
  const out = new Float32Array(n);
  const rnd = mulberry32(hashSeed(prompt.toLowerCase()));
  const p = prompt.toLowerCase();
  let kind = 'texture';
  if (/drum|knock|tap|clap/.test(p)) kind = 'percussion';
  else if (/whoosh|wind|air/.test(p)) kind = 'whoosh';
  else if (/beep|alert|chime|bell/.test(p)) kind = 'tonal';
  else if (/crowd|market|city/.test(p)) kind = 'ambience';

  for (let i = 0; i < n; i++) {
    const t = i / sampleRate;
    const env = Math.min(1, t * 8) * Math.max(0, 1 - t / seconds);
    if (kind === 'percussion') {
      out[i] = (rnd() * 2 - 1) * env * Math.exp(-t * 12);
    } else if (kind === 'whoosh') {
      const f = 200 + t * 1200;
      out[i] = Math.sin(2 * Math.PI * f * t) * env * 0.35 + (rnd() * 2 - 1) * env * 0.15;
    } else if (kind === 'tonal') {
      const f = 440 + (hashSeed(prompt) % 400);
      out[i] = Math.sin(2 * Math.PI * f * t) * env * 0.45;
    } else if (kind === 'ambience') {
      out[i] = (rnd() * 2 - 1) * env * 0.12;
    } else {
      const f = 180 + (hashSeed(prompt) % 600);
      out[i] = Math.sin(2 * Math.PI * f * t) * env * 0.3 + (rnd() * 2 - 1) * env * 0.08;
    }
  }
  return {
    wav: encodeWavPcm16(out, sampleRate),
    kind,
    note: 'On-platform procedural SFX bed from prompt — not a licensed sample library.',
  };
}

export function synthesizeMusicBed(
  prompt: string,
  durationSeconds = 8,
): { wav: Buffer; bpm: number; scale: string[]; note: string } {
  const sampleRate = 22050;
  const seconds = Math.max(2, Math.min(30, durationSeconds));
  const n = Math.floor(sampleRate * seconds);
  const out = new Float32Array(n);
  const bpm = /calm|soft|lull/.test(prompt.toLowerCase()) ? 72 : /hype|energy|afro/.test(prompt.toLowerCase()) ? 112 : 96;
  const scale = [261.63, 293.66, 329.63, 392.0, 440.0]; // C major pentatonic
  const beat = 60 / bpm;
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate;
    const step = Math.floor(t / (beat / 2)) % scale.length;
    const f = scale[step] ?? 261.63;
    const bass = scale[0]! / 2;
    const env = 0.55 + 0.45 * Math.sin((Math.PI * (t % beat)) / beat);
    out[i] =
      Math.sin(2 * Math.PI * f * t) * 0.18 * env +
      Math.sin(2 * Math.PI * bass * t) * 0.12 +
      Math.sin(2 * Math.PI * (f * 2) * t) * 0.05 * env;
  }
  return {
    wav: encodeWavPcm16(out, sampleRate),
    bpm,
    scale: scale.map(String),
    note: 'Procedural music bed for ads/education — not a commercial generative music model claim.',
  };
}

export function isolateSpeech(buffer: Buffer) {
  return isolateVoice(buffer);
}

export function renderCampaignSvg(prompt: string, title = 'VerbaLab Creative'): string {
  const safe = prompt.replace(/[<>&]/g, '').slice(0, 120);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f766e"/>
      <stop offset="55%" stop-color="#134e4a"/>
      <stop offset="100%" stop-color="#1c1917"/>
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#g)"/>
  <circle cx="980" cy="160" r="120" fill="#f59e0b" opacity="0.35"/>
  <circle cx="220" cy="560" r="180" fill="#f8fafc" opacity="0.08"/>
  <text x="80" y="160" fill="#f8fafc" font-family="Georgia, serif" font-size="54">${title}</text>
  <text x="80" y="240" fill="#ccfbf1" font-family="ui-sans-serif, system-ui" font-size="28">${safe}</text>
  <text x="80" y="660" fill="#a8a29e" font-family="ui-sans-serif, system-ui" font-size="20">Africa-owned creative media · VerbaLab</text>
</svg>`;
}
