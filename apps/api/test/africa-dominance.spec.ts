import { describe, expect, it } from 'vitest';
import { MeetingTranscriptionService } from '../src/meeting-transcription/meeting-transcription.service';
import { VerbaVoiceService } from '../src/verba-voice/verba-voice.service';
import { ModelKeysService } from '../src/model-keys/model-keys.service';
import { meetingTranscriptionLanguages } from '../src/meeting-transcription/meeting-transcription.catalog';
import { ApiProtectionInterceptor } from '../src/common/security/api-protection.interceptor';
import { of } from 'rxjs';

const auth = {
  organizationId: 'org_test',
  workspaceId: 'ws_test',
  userId: 'user_test',
};

function stubPrisma() {
  return {
    auditEvent: { findMany: async () => [] },
  } as never;
}

function stubAudit() {
  return { record: async () => ({}) } as never;
}

describe('Africa language dominance surfaces', () => {
  it('exposes Africa-wide meeting transcription languages from seeds', () => {
    const langs = meetingTranscriptionLanguages();
    expect(langs.count).toBeGreaterThan(100);
    expect(langs.africanCount).toBeGreaterThan(100);
    expect(langs.languages.every((l) => l.stt && l.meeting)).toBe(true);
  });

  it('creates meeting sessions and spoken recaps', async () => {
    const audio = {
      speak: async () => ({
        audio: Buffer.from('recap'),
        mimeType: 'audio/mpeg',
        voice: 'alloy',
      }),
    };
    const svc = new MeetingTranscriptionService(
      stubPrisma(),
      stubAudit(),
      { recognize: async () => ({ text: 'hello', language: 'en', confidence: 0.9 }) } as never,
      { translate: async () => ({ text: 'hola', source: 'en', target: 'es', provider: 'stub' }) } as never,
      audio as never,
    );
    const session = await svc.sessions(auth, { title: 'Standup', language: 'en' });
    expect(session.session.id).toBeTruthy();
    const recap = await svc.recap(auth, { text: 'We shipped STT. Next is Voice. Done.' });
    expect(recap.summary).toBeTruthy();
    expect(recap.spoken?.audioBase64).toBeTruthy();
    expect(svc.engine().languageCount).toBeGreaterThan(100);
  });

  it('runs Verba Voice text turns with spoken replies', async () => {
    const chat = {
      completions: async () => ({
        choices: [{ message: { content: 'Karibu! Markets are strong today.' } }],
      }),
    };
    const audio = {
      speak: async () => ({
        audio: Buffer.from('voice'),
        mimeType: 'audio/mpeg',
        voice: 'alloy',
      }),
    };
    const svc = new VerbaVoiceService(
      stubPrisma(),
      stubAudit(),
      { recognize: async () => ({ text: 'habari', language: 'sw' }) } as never,
      chat as never,
      audio as never,
    );
    const opened = await svc.sessions(auth, { language: 'sw' });
    const turn = await svc.textTurn(auth, {
      sessionId: opened.session.id,
      text: 'Habari yako?',
      language: 'sw',
    });
    expect(turn.assistant.text).toContain('Karibu');
    expect(turn.assistant.spoken?.audioBase64).toBeTruthy();
    expect(svc.engine().capabilities.some((c) => c.id === 'turn-audio')).toBe(true);
  });

  it('publishes developer model family catalog like Claude/GPT lineups', () => {
    const svc = new ModelKeysService({} as never, stubAudit());
    const catalog = svc.modelsCatalog();
    expect(catalog.families.length).toBeGreaterThanOrEqual(7);
    expect(catalog.families.map((f) => f.id)).toEqual(
      expect.arrayContaining(['atlas', 'echo', 'voice-fm', 'translate-fm', 'verba-voice']),
    );
    const guide = svc.guide();
    expect(guide.models.families.length).toBe(catalog.families.length);
    expect(guide.productApiKeys.prefix).toContain('vl_live_');
  });

  it('watermarks API responses with trademark headers', () =>
    new Promise<void>((resolve, reject) => {
      const interceptor = new ApiProtectionInterceptor();
      const headers: Record<string, string> = {};
      const context = {
        getType: () => 'http',
        switchToHttp: () => ({
          getRequest: () => ({ headers: {} }),
          getResponse: () => ({
            setHeader: (k: string, v: string) => {
              headers[k] = v;
            },
          }),
        }),
      } as never;
      interceptor.intercept(context, { handle: () => of({ ok: true }) }).subscribe({
        complete: () => {
          try {
            expect(headers['X-VerbaLab-Trademark']).toMatch(/VerbaLab/);
            expect(headers['X-VerbaLab-Watermark']).toMatch(/^vl:/);
            expect(headers['X-Robots-Tag']).toContain('noindex');
            resolve();
          } catch (err) {
            reject(err);
          }
        },
        error: reject,
      });
    }));
});
