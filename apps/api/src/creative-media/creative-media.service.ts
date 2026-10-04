import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { creativeMediaEngineCatalog } from './creative-media.catalog';
import {
  changeVoicePitch,
  isolateSpeech,
  renderCampaignSvg,
  synthesizeMusicBed,
  synthesizeSoundEffect,
} from './creative-synth';

@Injectable()
export class CreativeMediaService {
  constructor(private readonly prisma: PrismaService) {}

  engine() {
    return creativeMediaEngineCatalog();
  }

  products() {
    const catalog = creativeMediaEngineCatalog();
    return {
      product: catalog.product,
      note: catalog.note,
      products: catalog.capabilities.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        api: c.api,
        console: c.console,
        notes: c.notes,
      })),
    };
  }

  async voiceChanger(
    file: Buffer,
    opts: { pitchSemitones?: number; rate?: number },
    meta: { organizationId: string },
  ) {
    const result = changeVoicePitch(file, opts);
    await this.audit(meta.organizationId, 'creative_media.voice_changer', {
      pitchSemitones: result.pitchSemitones,
      rate: result.rate,
      bytes: result.wav.length,
    });
    return {
      ...result,
      audioBase64: result.wav.toString('base64'),
      mimeType: 'audio/wav',
    };
  }

  async isolate(
    file: Buffer,
    meta: { organizationId: string },
  ) {
    const result = isolateSpeech(file);
    await this.audit(meta.organizationId, 'creative_media.isolate', {
      speechRatio: result.speechRatio,
      bytes: result.wav.length,
    });
    return {
      ...result,
      audioBase64: result.wav.toString('base64'),
      mimeType: 'audio/wav',
    };
  }

  async soundEffects(
    input: { prompt: string; durationSeconds?: number },
    meta: { organizationId: string },
  ) {
    const result = synthesizeSoundEffect(input.prompt, input.durationSeconds);
    await this.audit(meta.organizationId, 'creative_media.sound_effects', {
      prompt: input.prompt.slice(0, 120),
      kind: result.kind,
    });
    return {
      prompt: input.prompt,
      kind: result.kind,
      note: result.note,
      audioBase64: result.wav.toString('base64'),
      mimeType: 'audio/wav',
    };
  }

  async music(
    input: { prompt: string; durationSeconds?: number },
    meta: { organizationId: string },
  ) {
    const result = synthesizeMusicBed(input.prompt, input.durationSeconds);
    await this.audit(meta.organizationId, 'creative_media.music', {
      prompt: input.prompt.slice(0, 120),
      bpm: result.bpm,
    });
    return {
      prompt: input.prompt,
      bpm: result.bpm,
      note: result.note,
      audioBase64: result.wav.toString('base64'),
      mimeType: 'audio/wav',
    };
  }

  async voiceDesign(
    input: {
      name: string;
      description: string;
      language?: string;
      gender?: string;
      accent?: string;
    },
    meta: { organizationId: string },
  ) {
    const design = {
      id: `vd_${hashId(input.name + input.description)}`,
      name: input.name,
      description: input.description,
      language: input.language ?? 'en',
      gender: input.gender ?? 'neutral',
      accent: input.accent ?? 'african-neutral',
      ttsHints: {
        voice: 'alloy',
        style: input.description.slice(0, 160),
      },
      speechPath: 'POST /v1/audio/speech',
      note: 'Design profile for TTS / clone enrollment — not a trained proprietary speaker embedding.',
    };
    await this.audit(meta.organizationId, 'creative_media.voice_design', {
      id: design.id,
      name: design.name,
    });
    return design;
  }

  async image(
    input: { prompt: string; title?: string },
    meta: { organizationId: string },
  ) {
    const svg = renderCampaignSvg(input.prompt, input.title ?? 'VerbaCreative');
    await this.audit(meta.organizationId, 'creative_media.image', {
      prompt: input.prompt.slice(0, 120),
    });
    return {
      prompt: input.prompt,
      mimeType: 'image/svg+xml',
      imageBase64: Buffer.from(svg, 'utf8').toString('base64'),
      note: 'On-platform campaign still for marketing/CMS — swap via /cms assets anytime.',
      console: '/creative-media',
    };
  }

  async video(
    input: { prompt: string; durationSeconds?: number; language?: string },
    meta: { organizationId: string },
  ) {
    const duration = Math.max(3, Math.min(60, input.durationSeconds ?? 12));
    const frames = [0, 0.33, 0.66, 1].map((p, idx) => ({
      index: idx,
      atSeconds: Math.round(duration * p * 10) / 10,
      svgBase64: Buffer.from(
        renderCampaignSvg(`${input.prompt} · beat ${idx + 1}`, 'VerbaVideo'),
        'utf8',
      ).toString('base64'),
    }));
    await this.audit(meta.organizationId, 'creative_media.video', {
      prompt: input.prompt.slice(0, 120),
      duration,
    });
    return {
      prompt: input.prompt,
      language: input.language ?? 'en',
      durationSeconds: duration,
      frames,
      partnerPaths: {
        videoVoice: '/video-voice',
        partnerConnectors: '/partner-connectors',
        tools: ['higgsfield', 'runway'],
      },
      note: 'Storyboard package + partner dubbing/video connectors — full render via Voice FM / partner tools.',
    };
  }

  async ads(
    input: {
      product: string;
      script: string;
      language?: string;
      mood?: string;
    },
    meta: { organizationId: string },
  ) {
    const mood = input.mood ?? 'warm afrobeat';
    const sfx = synthesizeSoundEffect(`${mood} whoosh intro`, 1.5);
    const music = synthesizeMusicBed(`${mood} ${input.product}`, 10);
    const image = renderCampaignSvg(input.script.slice(0, 100), input.product);
    await this.audit(meta.organizationId, 'creative_media.ads', {
      product: input.product,
      language: input.language ?? 'en',
    });
    return {
      product: input.product,
      language: input.language ?? 'en',
      script: input.script,
      package: {
        voice: {
          api: 'POST /v1/audio/speech',
          body: { text: input.script, voice: 'alloy' },
        },
        sfx: {
          mimeType: 'audio/wav',
          audioBase64: sfx.wav.toString('base64'),
          kind: sfx.kind,
        },
        music: {
          mimeType: 'audio/wav',
          audioBase64: music.wav.toString('base64'),
          bpm: music.bpm,
        },
        still: {
          mimeType: 'image/svg+xml',
          imageBase64: Buffer.from(image, 'utf8').toString('base64'),
        },
        videoStoryboard: 'POST /v1/creative-media/video',
      },
      note: 'Ads Engine package: script → TTS + SFX + music bed + still. Dub via /video-voice.',
    };
  }

  private async audit(organizationId: string, action: string, meta: Record<string, unknown>) {
    try {
      await this.prisma.auditEvent.create({
        data: {
          organizationId,
          action,
          metadata: meta as object,
        },
      });
    } catch {
      /* audit best-effort */
    }
  }
}

function hashId(input: string): string {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}
