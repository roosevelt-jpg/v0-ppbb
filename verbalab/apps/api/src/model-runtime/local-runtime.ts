/**
 * In-process VerbaLab Own AI runtime — all gateway modalities, no rented vendors.
 */
import { TranslateInput, TranslateOutput, TranslationProvider } from '../gateway/translation-provider';
import { engineManifest, translateAfrican } from './african-linguistic-engine';
import { neuralTranslate } from './weights-deploy';

export const VERBALAB_RUNTIME_PROVIDER = 'verbalab_model_runtime';

export function localModelRuntimeEnabled(): boolean {
  if (process.env.VERBALAB_LOCAL_MODEL_RUNTIME === '0') return false;
  return true;
}

export class LocalRuntimeMtAdapter implements TranslationProvider {
  readonly name = 'verbalab_own_ai';

  async translate(input: TranslateInput): Promise<TranslateOutput> {
    const started = Date.now();
    const neural = await neuralTranslate({
      text: input.text,
      source: input.source,
      target: input.target,
    });
    if (neural) {
      return {
        text: neural,
        source: input.source,
        target: input.target,
        provider: this.name,
        characters: [...input.text].length,
        latencyMs: Date.now() - started,
      };
    }
    const out = translateAfrican({
      text: input.text,
      source: input.source,
      target: input.target,
    });
    const text = out.matched
      ? out.text
      : `[vl:${input.source}→${input.target}] ${input.text}`;
    return {
      text,
      source: input.source,
      target: input.target,
      provider: this.name,
      characters: [...input.text].length,
      latencyMs: Date.now() - started,
    };
  }
}

export function localRuntimeStatus() {
  const manifest = engineManifest();
  return {
    provider: VERBALAB_RUNTIME_PROVIDER,
    gatewayProvider: 'verbalab_own_ai',
    enabled: localModelRuntimeEnabled(),
    inProcess: true,
    modalities: {
      mt: true,
      stt: true,
      tts: true,
      chat: true,
      embed: true,
      ocr: true,
      detect: true,
      clone: true,
    },
    engine: manifest,
    honesty: {
      weightBinariesInRepo: false,
      neuralWeightsInProcess: manifest.neuralWeightsInProcess,
      note:
        'Local Own AI covers MT/STT/TTS/chat/embed/OCR/detect/clone in-process. Neural decode activates when VERBALAB_WEIGHTS_URL responds; otherwise lexicon/fixture path stays live.',
    },
  };
}
