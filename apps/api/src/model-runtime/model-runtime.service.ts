import { Injectable } from '@nestjs/common';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import {
  createVerbalabChat,
  createVerbalabDetect,
  createVerbalabEmbed,
  createVerbalabMt,
  createVerbalabOcr,
  createVerbalabStt,
  createVerbalabTts,
  ownAiStackSummary,
} from '../gateway/verbalab-own-ai';
import { developOwnModelEngine } from '../own-models/own-models.catalog';
import { engineManifest, listPacks, translateAfrican } from './african-linguistic-engine';
import { runAfricanQualityEval } from './african-quality-eval';
import {
  assertEnterpriseUnlock,
  evaluateAllEnterpriseUnlocks,
  evaluateSectorUnlock,
  type EnterpriseSector,
} from './enterprise-unlocks';
import { deployShape, modelRuntimeCatalog, modelRuntimeHonesty } from './model-runtime.catalog';
import { localRuntimeStatus } from './local-runtime';
import { probeWeightsDeploy } from './weights-deploy';

@Injectable()
export class ModelRuntimeService {
  async engine() {
    const weights = await probeWeightsDeploy();
    return developOwnModelEngine('model-runtime', {
      ...modelRuntimeCatalog(),
      ownAi: ownAiStackSummary(),
      local: localRuntimeStatus(),
      deploy: deployShape(),
      weights,
      africanEngine: engineManifest(),
      packs: listPacks(),
      safety: {
        ...modelRuntimeHonesty(),
        note:
          'Honest claim: multimodal local Own AI runtime + African eval harness + enterprise unlock gates ship in-product. Neural weight binaries remain deploy artifacts.',
      },
    });
  }

  async deploy() {
    const weights = await probeWeightsDeploy();
    return {
      ...deployShape(),
      weights,
      honesty: modelRuntimeHonesty(),
      docs: '/docs/MODEL_RUNTIME.md',
    };
  }

  packs() {
    return { packs: listPacks(), engine: engineManifest(), honesty: modelRuntimeHonesty() };
  }

  translate(body: { text: string; source: string; target: string; accent?: string }) {
    const out = translateAfrican(body);
    return { ...out, honesty: modelRuntimeHonesty() };
  }

  async gatewayTranslate(body: { text: string; source: string; target: string }) {
    const mt = createVerbalabMt();
    const out = await mt.translate(body);
    return { ...out, honesty: modelRuntimeHonesty() };
  }

  async gatewayChat(body: { message: string }) {
    const chat = createVerbalabChat();
    const out = await chat.complete({
      messages: [{ role: 'user', content: body.message }],
    });
    return { ...out, honesty: modelRuntimeHonesty() };
  }

  async gatewayDetect(body: { text: string }) {
    const detect = createVerbalabDetect();
    const out = await detect.detect({ text: body.text });
    return { ...out, honesty: modelRuntimeHonesty() };
  }

  async gatewayEmbed(body: { text: string }) {
    const embed = createVerbalabEmbed();
    const out = await embed.embed({ input: body.text });
    return {
      model: out.model,
      provider: out.provider,
      dimensions: out.data[0]?.embedding.length ?? 0,
      latencyMs: out.latencyMs,
      honesty: modelRuntimeHonesty(),
    };
  }

  async gatewaySttSmoke() {
    const stt = createVerbalabStt();
    const out = await stt.transcribe({
      buffer: Buffer.from('verbalab-local-runtime'),
      filename: 'smoke.wav',
      mimeType: 'audio/wav',
      language: 'sw',
    });
    return { ...out, honesty: modelRuntimeHonesty() };
  }

  async gatewayTtsSmoke() {
    const tts = createVerbalabTts();
    const voices = tts.listVoices();
    const out = await tts.synthesize({
      text: 'Karibu VerbaLab',
      voice: voices[0]?.id ?? 'own:sw-aisha',
      format: 'wav',
      language: 'sw',
    });
    return {
      provider: out.provider,
      voice: out.voice,
      format: out.format,
      bytes: out.audio.length,
      voices: voices.slice(0, 8).map((v) => ({ id: v.id, name: v.name, languages: v.languages })),
      honesty: modelRuntimeHonesty(),
    };
  }

  async gatewayOcrSmoke() {
    const ocr = createVerbalabOcr();
    const out = await ocr.extract({
      buffer: Buffer.from('VerbaLab OCR local runtime'),
      filename: 'smoke.png',
      mimeType: 'image/png',
    });
    return { ...out, honesty: modelRuntimeHonesty() };
  }

  async modalitiesSmoke() {
    const [mt, chat, detect, embed, stt, tts, ocr] = await Promise.all([
      this.gatewayTranslate({ text: 'hello', source: 'en', target: 'sw' }),
      this.gatewayChat({ message: 'Habari' }),
      this.gatewayDetect({ text: 'habari yako' }),
      this.gatewayEmbed({ text: 'VerbaLab Africa' }),
      this.gatewaySttSmoke(),
      this.gatewayTtsSmoke(),
      this.gatewayOcrSmoke(),
    ]);
    return {
      mt,
      chat,
      detect,
      embed,
      stt: { provider: stt.provider, language: stt.language, text: stt.text },
      tts,
      ocr: { provider: ocr.provider, text: ocr.text, pages: ocr.pages },
      honesty: modelRuntimeHonesty(),
    };
  }

  eval() {
    return runAfricanQualityEval();
  }

  unlocks() {
    return evaluateAllEnterpriseUnlocks();
  }

  unlockSector(sector: EnterpriseSector) {
    return evaluateSectorUnlock(sector);
  }

  assertUnlock(sector: EnterpriseSector, metIds: string[]) {
    return assertEnterpriseUnlock(sector, metIds);
  }

  async overview(session: SessionContext) {
    const evalReport = runAfricanQualityEval(6);
    const unlocks = evaluateAllEnterpriseUnlocks();
    const weights = await probeWeightsDeploy();
    const smoke = await this.modalitiesSmoke();
    return {
      session: {
        organizationId: session.organizationId,
        workspaceId: session.workspaceId,
        role: session.role,
      },
      engine: await this.engine(),
      eval: {
        ownWinRate: evalReport.ownWinRate,
        baselineWinRate: evalReport.baselineWinRate,
        total: evalReport.total,
        byPair: evalReport.byPair,
        honesty: evalReport.honesty,
      },
      unlocks,
      weights,
      modalitiesSmoke: {
        mt: smoke.mt.text,
        chat: smoke.chat.message.content.slice(0, 80),
        detect: smoke.detect.language,
        embedDims: smoke.embed.dimensions,
        stt: smoke.stt.provider,
        ttsBytes: smoke.tts.bytes,
        ocr: smoke.ocr.provider,
      },
      links: {
        self: '/model-runtime',
        modelKeys: '/model-keys',
        translateFm: '/translate-fm',
        credentials: '/credentials-readiness',
        enterpriseNation: '/enterprise-nation-platform',
        governmentIntelligence: '/government-intelligence',
      },
      honestToSayOutLoud: [
        'VerbaLab Own AI runs locally in-process across MT/STT/TTS/chat/embed/OCR/detect/clone without rented third-party AI vendors.',
        `African quality eval: Own AI exact-match ${(evalReport.ownWinRate * 100).toFixed(1)}% vs vendor baseline stub ${(evalReport.baselineWinRate * 100).toFixed(1)}% on ${evalReport.total} lexicon cases (incl. reverse pairs).`,
        'Gov / bank / hospital production unlocks are explicit checklist gates wired into Enterprise Nation + Government Intelligence (default locked until residency, DPA, and sector safety flags are set).',
        `Neural weights deploy status: ${weights.status} (${weights.mode}) via VERBALAB_WEIGHTS_URL — not claimed as git-shipped SOTA weights.`,
      ],
      docs: '/docs/MODEL_RUNTIME.md',
    };
  }

  async monitoring() {
    return {
      status: 'ready',
      local: localRuntimeStatus(),
      unlocks: evaluateAllEnterpriseUnlocks(),
      weights: await probeWeightsDeploy(),
      honesty: modelRuntimeHonesty(),
    };
  }
}
