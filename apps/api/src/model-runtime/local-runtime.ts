/**
 * In-process VerbaLab Own AI runtime — no rented vendors, no remote pods required.
 */
import { TranslateInput, TranslateOutput, TranslationProvider } from '../gateway/translation-provider';
import { engineManifest, translateAfrican } from './african-linguistic-engine';

export const VERBALAB_RUNTIME_PROVIDER = 'verbalab_model_runtime';

export function localModelRuntimeEnabled(): boolean {
  if (process.env.VERBALAB_LOCAL_MODEL_RUNTIME === '0') return false;
  // Default on: Own AI always has a local path when HTTP pods are absent.
  return true;
}

export class LocalRuntimeMtAdapter implements TranslationProvider {
  readonly name = 'verbalab_own_ai';

  async translate(input: TranslateInput): Promise<TranslateOutput> {
    const started = Date.now();
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
    engine: manifest,
    honesty: {
      weightBinariesInRepo: false,
      neuralWeightsInProcess: manifest.neuralWeightsInProcess,
      note: 'Local lexicon runtime is production-callable today. Neural decode activates when VERBALAB_WEIGHTS_URL is set on model pods.',
    },
  };
}
