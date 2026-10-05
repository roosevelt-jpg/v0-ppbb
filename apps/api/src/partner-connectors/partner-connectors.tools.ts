/**
 * MCP + partner tool surface over VerbaLab Own AI.
 */
import {
  createVerbalabChat,
  createVerbalabDetect,
  createVerbalabEmbed,
  createVerbalabMt,
  createVerbalabStt,
  createVerbalabTts,
  ownAiStackSummary,
} from '../gateway/verbalab-own-ai';
import { runAfricanQualityEval } from '../model-runtime/african-quality-eval';
import { localRuntimeStatus } from '../model-runtime/local-runtime';
import { evaluateAllEnterpriseUnlocks } from '../model-runtime/enterprise-unlocks';
import { SovereignVoiceOsService } from '../sovereign-voice-os/sovereign-voice-os.service';
import { CivicVoiceEvidenceService } from '../civic-voice-evidence/civic-voice-evidence.service';
import { MutualIntelligibilityService } from '../mutual-intelligibility/mutual-intelligibility.service';
import { InstitutionalVoiceService } from '../institutional-voice/institutional-voice.service';

const partnerAudit = { record: async () => ({}) } as any;
const partnerSession = {
  organizationId: 'partner_connectors',
  workspaceId: 'partner_connectors',
  userId: 'partner_tool',
  role: 'owner',
} as any;

export type McpTool = {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
};

export const PARTNER_TOOLS: McpTool[] = [
  {
    name: 'verbalab_translate',
    description: 'Translate text with VerbaLab Own AI (African linguistic runtime / Translate FM).',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string' },
        source: { type: 'string', description: 'Source language code, e.g. en' },
        target: { type: 'string', description: 'Target language code, e.g. sw' },
      },
      required: ['text', 'source', 'target'],
    },
  },
  {
    name: 'verbalab_detect_language',
    description: 'Detect language of text (African + Latin script heuristics).',
    inputSchema: {
      type: 'object',
      properties: { text: { type: 'string' } },
      required: ['text'],
    },
  },
  {
    name: 'verbalab_tts',
    description: 'Synthesize speech with VerbaLab Voice FM African voices.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string' },
        voice: { type: 'string', description: 'Voice id, e.g. own:sw-aisha' },
        language: { type: 'string' },
        format: { type: 'string', enum: ['wav', 'mp3'] },
      },
      required: ['text'],
    },
  },
  {
    name: 'verbalab_list_voices',
    description: 'List VerbaLab-owned TTS voices.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'verbalab_stt',
    description: 'Transcribe audio bytes (base64) with VerbaLab Echo.',
    inputSchema: {
      type: 'object',
      properties: {
        audioBase64: { type: 'string' },
        filename: { type: 'string' },
        mimeType: { type: 'string' },
        language: { type: 'string' },
      },
      required: ['audioBase64'],
    },
  },
  {
    name: 'verbalab_chat',
    description: 'Chat completion via VerbaLab Atlas Own AI.',
    inputSchema: {
      type: 'object',
      properties: { message: { type: 'string' } },
      required: ['message'],
    },
  },
  {
    name: 'verbalab_embed',
    description: 'Embed text via VerbaLab Vector FM.',
    inputSchema: {
      type: 'object',
      properties: { text: { type: 'string' } },
      required: ['text'],
    },
  },
  {
    name: 'verbalab_voice_clone',
    description: 'Create a local/fixture VerbaLab voice clone handle for video dubbing.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
      },
      required: ['name'],
    },
  },
  {
    name: 'verbalab_video_voice',
    description: 'Describe / plan a video-voice dubbing pipeline step for partner video platforms.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        sourceLang: { type: 'string' },
        targetLang: { type: 'string' },
        platform: { type: 'string', description: 'Partner platform id, e.g. higgsfield' },
      },
      required: ['title', 'targetLang'],
    },
  },
  {
    name: 'verbalab_african_eval',
    description: 'Run African quality eval harness (Own AI vs vendor baseline stub).',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'verbalab_runtime_status',
    description: 'Own AI + model runtime + enterprise unlock status snapshot.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'verbalab_sovereign_compose',
    description: 'Compose a Sovereign Voice OS deployment recipe for a country/ministry.',
    inputSchema: {
      type: 'object',
      properties: {
        countryCode: { type: 'string' },
        sectors: { type: 'string', description: 'Comma-separated sectors' },
        corridors: { type: 'string', description: 'Comma-separated corridor ids' },
      },
      required: ['countryCode'],
    },
  },
  {
    name: 'verbalab_evidence_append',
    description: 'Seal an official utterance into the Civic Voice Evidence hash chain.',
    inputSchema: {
      type: 'object',
      properties: {
        utterance: { type: 'string' },
        actor: { type: 'string' },
        consentId: { type: 'string' },
        watermarkTip: { type: 'string' },
      },
      required: ['utterance'],
    },
  },
  {
    name: 'verbalab_corridor_bridge',
    description: 'Bridge meaning across an African mutual-intelligibility corridor (Own AI).',
    inputSchema: {
      type: 'object',
      properties: {
        corridorId: { type: 'string' },
        sourceLocale: { type: 'string' },
        targetLocale: { type: 'string' },
        text: { type: 'string' },
      },
      required: ['corridorId', 'sourceLocale', 'targetLocale', 'text'],
    },
  },
  {
    name: 'verbalab_institutional_speak',
    description: 'Answer a citizen question from an approved institutional policy corpus.',
    inputSchema: {
      type: 'object',
      properties: {
        agencyId: { type: 'string' },
        question: { type: 'string' },
        policyTitle: { type: 'string' },
        policyBody: { type: 'string' },
      },
      required: ['agencyId', 'question'],
    },
  },
];

function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

export async function invokePartnerTool(
  name: string,
  args: Record<string, unknown> = {},
): Promise<{ ok: true; tool: string; result: unknown } | { ok: false; tool: string; error: string }> {
  try {
    switch (name) {
      case 'verbalab_translate': {
        const out = await createVerbalabMt().translate({
          text: asString(args.text),
          source: asString(args.source, 'en'),
          target: asString(args.target, 'sw'),
        });
        return { ok: true, tool: name, result: out };
      }
      case 'verbalab_detect_language': {
        const out = await createVerbalabDetect().detect({ text: asString(args.text) });
        return { ok: true, tool: name, result: out };
      }
      case 'verbalab_tts': {
        const tts = createVerbalabTts();
        const voices = tts.listVoices();
        const voice = asString(args.voice) || voices[0]?.id || 'own:sw-aisha';
        const format = asString(args.format, 'wav') === 'mp3' ? 'mp3' : 'wav';
        const out = await tts.synthesize({
          text: asString(args.text),
          voice,
          language: asString(args.language) || undefined,
          format,
        });
        return {
          ok: true,
          tool: name,
          result: {
            provider: out.provider,
            voice: out.voice,
            format: out.format,
            mimeType: out.mimeType,
            characters: out.characters,
            audioBase64: out.audio.toString('base64'),
            bytes: out.audio.length,
          },
        };
      }
      case 'verbalab_list_voices': {
        return {
          ok: true,
          tool: name,
          result: { voices: createVerbalabTts().listVoices() },
        };
      }
      case 'verbalab_stt': {
        const buf = Buffer.from(asString(args.audioBase64), 'base64');
        const out = await createVerbalabStt().transcribe({
          buffer: buf.length ? buf : Buffer.from('verbalab'),
          filename: asString(args.filename, 'audio.wav'),
          mimeType: asString(args.mimeType, 'audio/wav'),
          language: asString(args.language) || undefined,
        });
        return { ok: true, tool: name, result: out };
      }
      case 'verbalab_chat': {
        const out = await createVerbalabChat().complete({
          messages: [{ role: 'user', content: asString(args.message) }],
        });
        return { ok: true, tool: name, result: out };
      }
      case 'verbalab_embed': {
        const out = await createVerbalabEmbed().embed({ input: asString(args.text) });
        return {
          ok: true,
          tool: name,
          result: {
            model: out.model,
            provider: out.provider,
            dimensions: out.data[0]?.embedding.length ?? 0,
            embedding: out.data[0]?.embedding.slice(0, 16),
            latencyMs: out.latencyMs,
          },
        };
      }
      case 'verbalab_voice_clone': {
        const id = `vl_clone_${Buffer.from(asString(args.name, 'partner'))
          .toString('hex')
          .slice(0, 12)}`;
        return {
          ok: true,
          tool: name,
          result: {
            provider: 'verbalab_own_clone',
            providerVoiceId: id,
            voice: `clone:${id}`,
            name: asString(args.name),
            description: asString(args.description, 'Partner video dubbing clone'),
            useCase: 'video_dubbing',
          },
        };
      }
      case 'verbalab_video_voice': {
        const platform = asString(args.platform, 'custom');
        const sourceLang = asString(args.sourceLang, 'en');
        const targetLang = asString(args.targetLang, 'sw');
        const mt = await createVerbalabMt().translate({
          text: asString(args.title, 'Untitled clip'),
          source: sourceLang,
          target: targetLang,
        });
        return {
          ok: true,
          tool: name,
          result: {
            pipeline: 'video-voice',
            platform,
            steps: [
              { id: 'detect', status: 'ready' },
              { id: 'translate_subs', status: 'completed', output: mt.text },
              { id: 'tts_voiceover', status: 'ready', voiceHint: `own:${targetLang}` },
              { id: 'align_mux', status: 'ready' },
            ],
            title: asString(args.title),
            sourceLang,
            targetLang,
            translatedTitle: mt.text,
            provider: 'verbalab_own_ai',
          },
        };
      }
      case 'verbalab_african_eval': {
        const report = runAfricanQualityEval(8);
        return {
          ok: true,
          tool: name,
          result: {
            total: report.total,
            ownWinRate: report.ownWinRate,
            baselineWinRate: report.baselineWinRate,
            honesty: report.honesty,
            sample: report.sample,
          },
        };
      }
      case 'verbalab_runtime_status': {
        return {
          ok: true,
          tool: name,
          result: {
            ownAi: ownAiStackSummary(),
            local: localRuntimeStatus(),
            unlocks: evaluateAllEnterpriseUnlocks(),
          },
        };
      }
      case 'verbalab_sovereign_compose': {
        const svc = new SovereignVoiceOsService(partnerAudit);
        const recipe = await svc.compose(partnerSession, {
          countryCode: asString(args.countryCode, 'AF'),
          sectors: asString(args.sectors, 'health,justice'),
          corridors: asString(args.corridors, 'eac'),
        });
        return {
          ok: true,
          tool: name,
          result: {
            ...recipe,
            realtime: '/v1/sovereign-voice-os/stream',
            console: '/sovereign-voice-os',
            integrations: '/v1/sovereign-voice-os/integrations',
          },
        };
      }
      case 'verbalab_evidence_append': {
        const svc = new CivicVoiceEvidenceService(partnerAudit);
        const out = await svc.append(partnerSession, {
          utterance: asString(args.utterance),
          actor: asString(args.actor, 'official'),
          consentId: asString(args.consentId) || undefined,
          watermarkTip: asString(args.watermarkTip) || undefined,
        });
        return { ok: true, tool: name, result: out };
      }
      case 'verbalab_corridor_bridge': {
        const svc = new MutualIntelligibilityService(partnerAudit);
        const out = await svc.bridge(partnerSession, {
          corridorId: asString(args.corridorId, 'eac'),
          sourceLocale: asString(args.sourceLocale, 'en'),
          targetLocale: asString(args.targetLocale, 'sw'),
          text: asString(args.text),
        });
        return { ok: true, tool: name, result: out };
      }
      case 'verbalab_institutional_speak': {
        const svc = new InstitutionalVoiceService(partnerAudit);
        const agencyId = asString(args.agencyId, 'partner-agency');
        const question = asString(args.question);
        const policyBody = asString(args.policyBody);
        const policyTitle = asString(args.policyTitle, 'Approved policy');
        await svc.registerAgency(partnerSession, {
          agencyId,
          name: asString(args.agencyName, agencyId),
          voiceId: asString(args.voiceId, 'own:sw-aisha'),
        });
        if (policyBody) {
          await svc.ingest(partnerSession, {
            agencyId,
            title: policyTitle,
            body: policyBody,
          });
        }
        const out = await svc.speak(partnerSession, {
          agencyId,
          question,
          speak: 'false',
        });
        return { ok: true, tool: name, result: out };
      }
      default:
        return { ok: false, tool: name, error: `Unknown tool: ${name}` };
    }
  } catch (error) {
    return {
      ok: false,
      tool: name,
      error: error instanceof Error ? error.message : 'tool failed',
    };
  }
}
