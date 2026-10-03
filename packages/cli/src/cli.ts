#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { VerbaLab } from '@verbalab/sdk';

function usage(): never {
  console.error(`Usage:
  verbalab translate --text <text> --target <lang> [--source <lang>]
  verbalab translate-format --format <html|markdown|xml|csv|srt> --file <path> --target <lang> [--source <lang>]
  verbalab translate-engine
  verbalab localize --format <json|yaml> --file <path> --target <lang> [--source <lang>]
  verbalab localize-qa --source-file <path> --target-file <path> [--format json|yaml]
  verbalab locales
  verbalab localization
  verbalab icu-validate --message <icu>
  verbalab languages
  verbalab speech-products
  verbalab voice-products
  verbalab neural-tts-engine
  verbalab neural-tts-voices
  verbalab voice-cloning-engine
  verbalab voice-cloning-consent
  verbalab emotion-voice-engine
  verbalab emotion-voice-profiles
  verbalab voice-studio-engine
  verbalab voice-studio-library
  verbalab speech-engine
  verbalab speaker-engine
  verbalab accent-engine
  verbalab emotion-engine
  verbalab audio-engine
  verbalab pronunciation-engine
  verbalab wake-word-engine
  verbalab call-engine
  verbalab speech-analytics
  verbalab whoami

Env:
  VERBALAB_API_KEY   vl_live_… or vl_test_… (required)
  VERBALAB_API_URL   API base (default https://api.verbalab.ai)
`);
  process.exit(1);
}

function argValue(argv: string[], name: string): string | undefined {
  const idx = argv.indexOf(name);
  if (idx === -1) return undefined;
  return argv[idx + 1];
}

function client() {
  const apiKey = process.env.VERBALAB_API_KEY?.trim();
  if (!apiKey) {
    console.error('Set VERBALAB_API_KEY to a vl_live_ or vl_test_ key');
    process.exit(1);
  }
  return new VerbaLab({
    apiKey,
    baseUrl: process.env.VERBALAB_API_URL?.trim() || undefined,
  });
}

async function main() {
  const [, , command, ...rest] = process.argv;
  if (!command || command === '-h' || command === '--help') usage();

  const vl = client();

  if (command === 'languages') {
    console.log(JSON.stringify(await vl.languages(), null, 2));
    return;
  }

  if (command === 'speech-products') {
    console.log(JSON.stringify(await vl.speechProducts(), null, 2));
    return;
  }

  if (command === 'voice-products') {
    console.log(JSON.stringify(await vl.voiceProducts(), null, 2));
    return;
  }

  if (command === 'neural-tts-engine') {
    console.log(JSON.stringify(await vl.neuralTtsEngine(), null, 2));
    return;
  }

  if (command === 'neural-tts-voices') {
    console.log(
      JSON.stringify(
        await vl.neuralTtsVoices({
          gender: argValue(argv, '--gender'),
          language: argValue(argv, '--language'),
          category: argValue(argv, '--category'),
        }),
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'voice-cloning-engine') {
    console.log(JSON.stringify(await vl.voiceCloningEngine(), null, 2));
    return;
  }

  if (command === 'voice-cloning-consent') {
    console.log(JSON.stringify(await vl.voiceCloningConsentPolicy(), null, 2));
    return;
  }

  if (command === 'emotion-voice-engine') {
    console.log(JSON.stringify(await vl.emotionVoiceEngine(), null, 2));
    return;
  }

  if (command === 'emotion-voice-profiles') {
    console.log(JSON.stringify(await vl.emotionVoiceProfiles(), null, 2));
    return;
  }

  if (command === 'voice-studio-engine') {
    console.log(JSON.stringify(await vl.voiceStudioEngine(), null, 2));
    return;
  }

  if (command === 'voice-studio-library') {
    console.log(JSON.stringify(await vl.voiceStudioLibrary(), null, 2));
    return;
  }

  if (command === 'speech-engine') {
    console.log(JSON.stringify(await vl.speechEngine(), null, 2));
    return;
  }

  if (command === 'speaker-engine') {
    console.log(JSON.stringify(await vl.speakerEngine(), null, 2));
    return;
  }

  if (command === 'accent-engine') {
    console.log(JSON.stringify(await vl.accentEngine(), null, 2));
    return;
  }

  if (command === 'emotion-engine') {
    console.log(JSON.stringify(await vl.emotionEngine(), null, 2));
    return;
  }

  if (command === 'audio-engine') {
    console.log(JSON.stringify(await vl.audioEngine(), null, 2));
    return;
  }

  if (command === 'pronunciation-engine') {
    console.log(JSON.stringify(await vl.pronunciationEngine(), null, 2));
    return;
  }

  if (command === 'wake-word-engine') {
    console.log(JSON.stringify(await vl.wakeWordEngine(), null, 2));
    return;
  }

  if (command === 'call-engine') {
    console.log(JSON.stringify(await vl.callIntelligenceEngine(), null, 2));
    return;
  }

  if (command === 'speech-analytics') {
    console.log(JSON.stringify(await vl.speechAnalyticsEngine(), null, 2));
    return;
  }

  if (command === 'whoami') {
    const key = process.env.VERBALAB_API_KEY!;
    console.log(
      JSON.stringify(
        {
          environment: key.startsWith('vl_test_') ? 'test' : 'live',
          baseUrl: process.env.VERBALAB_API_URL ?? 'https://api.verbalab.ai',
          keyPrefix: key.slice(0, 12) + '…',
        },
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'translate-engine') {
    console.log(JSON.stringify(await vl.translateEngine(), null, 2));
    return;
  }

  if (command === 'translate') {
    const text = argValue(rest, '--text');
    const target = argValue(rest, '--target');
    const source = argValue(rest, '--source') ?? 'auto';
    if (!text || !target) usage();
    console.log(JSON.stringify(await vl.translate({ text, source, target }), null, 2));
    return;
  }

  if (command === 'translate-format') {
    const format = argValue(rest, '--format');
    const file = argValue(rest, '--file');
    const target = argValue(rest, '--target');
    const source = argValue(rest, '--source') ?? 'en';
    if (!format || !file || !target) usage();
    const content = readFileSync(file, 'utf8');
    console.log(
      JSON.stringify(await vl.translateFormat({ format, content, source, target }), null, 2),
    );
    return;
  }

  if (command === 'localize') {
    const format = (argValue(rest, '--format') ?? 'json') as 'json' | 'yaml';
    const file = argValue(rest, '--file');
    const target = argValue(rest, '--target');
    const source = argValue(rest, '--source') ?? 'en';
    if (!file || !target) usage();
    const raw = readFileSync(file, 'utf8');
    const content = format === 'yaml' ? raw : JSON.parse(raw);
    console.log(JSON.stringify(await vl.localize({ format, content, source, target }), null, 2));
    return;
  }

  if (command === 'locales') {
    console.log(JSON.stringify(await vl.locales(), null, 2));
    return;
  }

  if (command === 'localization') {
    console.log(JSON.stringify(await vl.localizationPlatform(), null, 2));
    return;
  }

  if (command === 'icu-validate') {
    const message = argValue(rest, '--message');
    if (!message) usage();
    console.log(JSON.stringify(await vl.validateIcu(message), null, 2));
    return;
  }

  if (command === 'localize-qa') {
    const format = (argValue(rest, '--format') ?? 'json') as 'json' | 'yaml';
    const sourceFile = argValue(rest, '--source-file');
    const targetFile = argValue(rest, '--target-file');
    if (!sourceFile || !targetFile) usage();
    const sourceRaw = readFileSync(sourceFile, 'utf8');
    const targetRaw = readFileSync(targetFile, 'utf8');
    const sourceContent = format === 'yaml' ? sourceRaw : JSON.parse(sourceRaw);
    const targetContent = format === 'yaml' ? targetRaw : JSON.parse(targetRaw);
    console.log(
      JSON.stringify(
        await vl.localizeQa({ format, sourceContent, targetContent }),
        null,
        2,
      ),
    );
    return;
  }

  usage();
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
