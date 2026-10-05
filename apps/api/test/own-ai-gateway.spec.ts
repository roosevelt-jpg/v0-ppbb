import { Test } from '@nestjs/testing';
import { GatewayService } from '../src/gateway/gateway.service';
import {
  FixtureVerbalabChatAdapter,
  FixtureVerbalabMtAdapter,
  FixtureVerbalabSttAdapter,
  FixtureVerbalabTtsAdapter,
  ownAiStackSummary,
} from '../src/gateway/verbalab-own-ai';

describe('VerbaLab Own AI gateway', () => {
  const prevFixture = process.env.VERBALAB_OWN_AI_FIXTURE;
  const prevFallback = process.env.VERBALAB_ALLOW_VENDOR_FALLBACK;

  beforeAll(() => {
    process.env.VERBALAB_OWN_AI_FIXTURE = '1';
    delete process.env.VERBALAB_ALLOW_VENDOR_FALLBACK;
  });

  afterAll(() => {
    if (prevFixture === undefined) delete process.env.VERBALAB_OWN_AI_FIXTURE;
    else process.env.VERBALAB_OWN_AI_FIXTURE = prevFixture;
    if (prevFallback === undefined) delete process.env.VERBALAB_ALLOW_VENDOR_FALLBACK;
    else process.env.VERBALAB_ALLOW_VENDOR_FALLBACK = prevFallback;
  });

  it('summarizes owned-model stack', () => {
    const summary = ownAiStackSummary();
    expect(summary.ownedModels).toBe(true);
    expect(summary.vendorRentalDefault).toBe(false);
    expect(summary.families).toContain('translate-fm');
    expect(summary.families).toContain('voice-fm');
  });

  it('translates via VerbaLab Translate FM fixture', async () => {
    const mt = new FixtureVerbalabMtAdapter();
    const out = await mt.translate({ text: 'hello', source: 'en', target: 'sw' });
    expect(out.provider).toBe('verbalab_own_ai');
    expect(out.text).toBe('habari');
  });

  it('transcribes via Echo fixture', async () => {
    const stt = new FixtureVerbalabSttAdapter();
    const out = await stt.transcribe({
      buffer: Buffer.from('x'),
      filename: 'a.wav',
      mimeType: 'audio/wav',
      language: 'yo',
    });
    expect(out.provider).toBe('verbalab_own_ai');
    expect(out.language).toBe('yo');
    expect(out.text).toContain('vl-stt-fixture');
    expect(out.text).not.toContain('a.wav');
  });

  it('synthesizes playable WAV via Voice FM fixture (even if mp3 requested)', async () => {
    const tts = new FixtureVerbalabTtsAdapter();
    const voices = tts.listVoices();
    expect(voices.some((v) => v.id.startsWith('own:'))).toBe(true);
    const out = await tts.synthesize({
      text: 'Karibu',
      voice: voices[0]!.id,
      format: 'mp3',
    });
    expect(out.provider).toBe('verbalab_own_ai');
    expect(out.format).toBe('wav');
    expect(out.mimeType).toBe('audio/wav');
    expect(out.audio.toString('ascii', 0, 4)).toBe('RIFF');
    expect(out.audio.length).toBeGreaterThan(1000);
  });

  it('chats via Atlas fixture', async () => {
    const chat = new FixtureVerbalabChatAdapter();
    const out = await chat.complete({
      messages: [{ role: 'user', content: 'Habari' }],
    });
    expect(out.provider).toBe('verbalab_own_ai');
    expect(out.message.content).toContain('Habari');
    expect(out.message.content).not.toMatch(/^\[vl-atlas\]/);
  });

  it('boots GatewayService on own AI primary', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [GatewayService],
    }).compile();
    const gateway = moduleRef.get(GatewayService);
    const voices = gateway.listVoices();
    expect(voices.length).toBeGreaterThan(0);
    expect(voices[0]!.id.startsWith('own:') || voices.some((v) => v.id.startsWith('own:'))).toBe(
      true,
    );
  });
});
