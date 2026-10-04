import { HttpStatus, Injectable } from '@nestjs/common';
import { AudioService } from '../audio/audio.service';
import { GatewayService } from '../gateway/gateway.service';
import { ApiException } from '../common/errors/api-exception';
import { voiceBridgesCatalog, voiceBridgesHonesty } from './voice-bridges.catalog';
import { audioToRawPcm16, pcm16ToWav } from './voice-bridges.pcm';

type OrgMeta = {
  organizationId: string;
  workspaceId: string;
  apiKeyId?: string;
  userId?: string;
  ip?: string;
};

@Injectable()
export class VoiceBridgesService {
  constructor(
    private readonly audio: AudioService,
    private readonly gateway: GatewayService,
  ) {}

  engine() {
    const catalog = voiceBridgesCatalog();
    return {
      ...catalog,
      honesty: voiceBridgesHonesty(),
      score: {
        total: catalog.platforms.length,
        shipped: catalog.platforms.filter((p) => p.status === 'shipped').length,
        yes: catalog.platforms.filter((p) => p.verdict === 'yes').length,
      },
      links: {
        console: '/voice-bridges',
        docs: '/docs/VOICE_PLATFORM_BRIDGES.md',
        twilioVoice: '/voice',
        verbaVoice: '/verba-voice',
        partnerConnectors: '/partner-connectors',
      },
    };
  }

  platform(id: string) {
    const row = voiceBridgesCatalog().platforms.find((p) => p.id === id);
    if (!row) {
      throw new ApiException('not_found', `Unknown bridge platform: ${id}`, HttpStatus.NOT_FOUND);
    }
    return { ...row, honesty: voiceBridgesHonesty() };
  }

  vapiAssistantSnippet(baseUrl: string) {
    const root = baseUrl.replace(/\/$/, '');
    return {
      platform: 'vapi',
      assistant: {
        voice: {
          provider: 'custom-voice',
          server: {
            url: `${root}/v1/voice-bridges/vapi/tts`,
            headers: {
              Authorization: 'Bearer vl_live_YOUR_KEY',
            },
            timeoutSeconds: 45,
          },
        },
        transcriber: {
          provider: 'custom-transcriber',
          server: {
            url: `${root.replace(/^http/, 'ws')}/v1/voice-bridges/vapi/stt`,
            headers: {
              Authorization: 'Bearer vl_live_YOUR_KEY',
            },
          },
        },
        firstMessage: 'Habari! VerbaLab African voice is connected.',
      },
      note: 'Paste into VAPI assistant config (API). Use wss:// in production.',
    };
  }

  async vapiTts(
    body: Record<string, unknown>,
    meta: OrgMeta,
    voiceHint?: string,
  ): Promise<{ pcm: Buffer; sampleRate: number }> {
    const message = (body.message ?? body) as Record<string, unknown>;
    const type = String(message.type ?? 'voice-request');
    if (type !== 'voice-request') {
      throw new ApiException('validation_error', 'message.type must be voice-request', HttpStatus.BAD_REQUEST);
    }
    const text = String(message.text ?? '').trim();
    if (!text) {
      throw new ApiException('validation_error', 'message.text required', HttpStatus.BAD_REQUEST);
    }
    const sampleRate = Number(message.sampleRate ?? 24000) || 24000;
    const voice = voiceHint || String(body.voice ?? message.voice ?? 'alloy');
    const speech = await this.audio.speak({
      text,
      voice,
      format: 'wav',
      organizationId: meta.organizationId,
      workspaceId: meta.workspaceId,
      apiKeyId: meta.apiKeyId,
      userId: meta.userId,
      ip: meta.ip,
    });
    return { pcm: audioToRawPcm16(speech.audio, sampleRate), sampleRate };
  }

  async vapiSttHttp(
    input: { buffer: Buffer; filename: string; mimeType: string; language?: string },
    meta: OrgMeta,
  ) {
    const result = await this.audio.transcribe({
      file: {
        buffer: input.buffer,
        originalname: input.filename,
        mimetype: input.mimeType,
        size: input.buffer.length,
      } as Express.Multer.File,
      language: input.language,
      organizationId: meta.organizationId,
      workspaceId: meta.workspaceId,
      apiKeyId: meta.apiKeyId,
      userId: meta.userId,
      ip: meta.ip,
    });
    return {
      type: 'transcriber-response',
      transcription: result.text,
      channel: 'customer',
      transcriptType: 'final',
      language: result.language,
      provider: result.provider,
    };
  }

  async amazonPollySpeech(body: Record<string, unknown>, meta: OrgMeta) {
    const text = String(body.Text ?? body.text ?? '').trim();
    if (!text) {
      throw new ApiException('validation_error', 'Text required', HttpStatus.BAD_REQUEST);
    }
    const voiceId = String(body.VoiceId ?? body.voice ?? 'alloy');
    const outputFormat = String(body.OutputFormat ?? body.outputFormat ?? 'mp3').toLowerCase();
    const format = outputFormat === 'pcm' || outputFormat === 'wav' ? 'wav' : 'mp3';
    const sampleRate = Number(body.SampleRate ?? 24000) || 24000;
    const speech = await this.audio.speak({
      text,
      voice: voiceId,
      language: typeof body.LanguageCode === 'string' ? body.LanguageCode.split('-')[0] : undefined,
      format,
      organizationId: meta.organizationId,
      workspaceId: meta.workspaceId,
      apiKeyId: meta.apiKeyId,
      userId: meta.userId,
      ip: meta.ip,
    });
    if (outputFormat === 'pcm') {
      return {
        kind: 'pcm' as const,
        contentType: 'audio/pcm',
        audio: audioToRawPcm16(speech.audio, sampleRate),
        VoiceId: voiceId,
        RequestCharacters: speech.characters,
      };
    }
    return {
      kind: 'audio' as const,
      contentType: speech.mimeType,
      audio: speech.audio,
      VoiceId: voiceId,
      RequestCharacters: speech.characters,
    };
  }

  amazonPollyVoices() {
    const voices = this.gateway.listVoices();
    return {
      Voices: voices.map((v) => ({
        Id: v.id,
        Name: v.name ?? v.id,
        Gender: (v as { gender?: string }).gender ?? 'Neutral',
        LanguageCode: (v as { language?: string }).language ?? 'en-US',
        SupportedEngines: ['standard', 'neural'],
        provider: v.provider ?? 'verbalab',
      })),
      note: 'Polly-shaped catalog over VerbaLab Own AI voices.',
    };
  }

  async amazonLexFulfillment(body: Record<string, unknown>, meta: OrgMeta) {
    const intent = (body.sessionState as { intent?: { name?: string; slots?: Record<string, unknown> } })
      ?.intent;
    const inputTranscript = String(
      body.inputTranscript ?? body.inputText ?? intent?.name ?? 'Hello',
    );
    const sessionAttrs =
      ((body.sessionState as { sessionAttributes?: Record<string, string> })?.sessionAttributes ??
        {}) as Record<string, string>;
    const target = sessionAttrs.targetLanguage ?? 'en';
    const source = sessionAttrs.sourceLanguage ?? 'auto';
    const translated = await this.gateway.translate({
      text: inputTranscript,
      source: source === 'auto' ? 'en' : source,
      target,
    });
    const reply = `VerbaLab: ${translated.text}`;
    let ssml: string | undefined;
    if (sessionAttrs.speak === '1' || sessionAttrs.speak === 'true') {
      const speech = await this.audio.speak({
        text: reply,
        voice: sessionAttrs.voice ?? 'alloy',
        language: target,
        format: 'mp3',
        organizationId: meta.organizationId,
        workspaceId: meta.workspaceId,
        apiKeyId: meta.apiKeyId,
        userId: meta.userId,
        ip: meta.ip,
      });
      ssml = `<speak>${escapeXml(reply)}</speak>`;
      return {
        sessionState: {
          dialogAction: { type: 'Close' },
          intent: { name: intent?.name ?? 'VerbaLabHelp', state: 'Fulfilled' },
          sessionAttributes: sessionAttrs,
        },
        messages: [
          { contentType: 'PlainText', content: reply },
          { contentType: 'SSML', content: ssml },
        ],
        verbalab: {
          audioBase64: speech.audio.toString('base64'),
          mimeType: speech.mimeType,
          provider: speech.provider,
        },
      };
    }
    return {
      sessionState: {
        dialogAction: { type: 'Close' },
        intent: { name: intent?.name ?? 'VerbaLabHelp', state: 'Fulfilled' },
        sessionAttributes: sessionAttrs,
      },
      messages: [{ contentType: 'PlainText', content: reply }],
    };
  }

  async amazonConnectContact(body: Record<string, unknown>, meta: OrgMeta) {
    const details = (body.Details ?? body) as Record<string, unknown>;
    const params = (details.Parameters ?? body.Parameters ?? {}) as Record<string, string>;
    const text = String(params.text ?? params.Text ?? body.text ?? 'Karibu VerbaLab').trim();
    const target = params.targetLanguage ?? 'sw';
    const translated = await this.gateway.translate({
      text,
      source: params.sourceLanguage ?? 'en',
      target,
    });
    const speech = await this.audio.speak({
      text: translated.text,
      voice: params.voice ?? 'alloy',
      language: target,
      format: 'mp3',
      organizationId: meta.organizationId,
      workspaceId: meta.workspaceId,
      apiKeyId: meta.apiKeyId,
      userId: meta.userId,
      ip: meta.ip,
    });
    return {
      replyText: translated.text,
      ssml: `<speak>${escapeXml(translated.text)}</speak>`,
      audioUrlHint: 'Return audioBase64 to Connect Lex/Lambda prompt or store in S3 from your Lambda.',
      audioBase64: speech.audio.toString('base64'),
      mimeType: speech.mimeType,
      characters: speech.characters,
      provider: speech.provider,
    };
  }

  async googleTts(body: Record<string, unknown>, meta: OrgMeta) {
    const input = (body.input ?? {}) as { text?: string; ssml?: string };
    const text = String(input.text ?? input.ssml ?? body.text ?? '').replace(/<\/?speak>/g, '').trim();
    if (!text) {
      throw new ApiException('validation_error', 'input.text required', HttpStatus.BAD_REQUEST);
    }
    const voiceName = String((body.voice as { name?: string })?.name ?? body.voice ?? 'alloy');
    const languageCode = String(
      (body.voice as { languageCode?: string })?.languageCode ?? 'en-US',
    );
    const audioEncoding = String(
      (body.audioConfig as { audioEncoding?: string })?.audioEncoding ?? 'MP3',
    ).toUpperCase();
    const format = audioEncoding.includes('LINEAR') || audioEncoding === 'PCM' ? 'wav' : 'mp3';
    const speech = await this.audio.speak({
      text,
      voice: voiceName.includes('/') ? voiceName.split('/').pop()! : voiceName,
      language: languageCode.split('-')[0],
      format,
      organizationId: meta.organizationId,
      workspaceId: meta.workspaceId,
      apiKeyId: meta.apiKeyId,
      userId: meta.userId,
      ip: meta.ip,
    });
    let audioContent = speech.audio;
    if (audioEncoding.includes('LINEAR') || audioEncoding === 'PCM') {
      audioContent = audioToRawPcm16(speech.audio, Number((body.audioConfig as { sampleRateHertz?: number })?.sampleRateHertz ?? 24000));
    }
    return {
      audioContent: audioContent.toString('base64'),
      verbalab: { provider: speech.provider, characters: speech.characters, mimeType: speech.mimeType },
    };
  }

  async googleSpeechRecognize(body: Record<string, unknown>, meta: OrgMeta) {
    const audio = (body.audio ?? {}) as { content?: string; uri?: string };
    const config = (body.config ?? {}) as { languageCode?: string; encoding?: string; sampleRateHertz?: number };
    if (!audio.content) {
      throw new ApiException(
        'validation_error',
        'audio.content (base64) required — uri fetch is not enabled on this bridge',
        HttpStatus.BAD_REQUEST,
      );
    }
    const raw = Buffer.from(audio.content, 'base64');
    const sampleRate = Number(config.sampleRateHertz ?? 16000) || 16000;
    const encoding = String(config.encoding ?? 'LINEAR16').toUpperCase();
    const fileBuffer =
      encoding.includes('LINEAR') || encoding === 'PCM' ? pcm16ToWav(raw, sampleRate) : raw;
    const result = await this.audio.transcribe({
      file: {
        buffer: fileBuffer,
        originalname: encoding.includes('LINEAR') ? 'speech.wav' : 'speech.webm',
        mimetype: encoding.includes('LINEAR') ? 'audio/wav' : 'application/octet-stream',
        size: fileBuffer.length,
      } as Express.Multer.File,
      language: config.languageCode?.split('-')[0],
      organizationId: meta.organizationId,
      workspaceId: meta.workspaceId,
      apiKeyId: meta.apiKeyId,
      userId: meta.userId,
      ip: meta.ip,
    });
    return {
      results: [
        {
          alternatives: [
            {
              transcript: result.text,
              confidence: result.confidence ?? 0.9,
            },
          ],
          languageCode: result.language ?? config.languageCode ?? null,
        },
      ],
      verbalab: { provider: result.provider, durationSeconds: result.durationSeconds },
    };
  }

  async dialogflowWebhook(body: Record<string, unknown>, meta: OrgMeta) {
    const queryText = String(
      body.queryResult
        ? (body.queryResult as { queryText?: string }).queryText
        : body.text ?? 'Hello',
    );
    const params =
      ((body.queryResult as { parameters?: Record<string, string> })?.parameters ??
        (body.sessionInfo as { parameters?: Record<string, string> })?.parameters ??
        {}) as Record<string, string>;
    const target = params['target-language'] ?? params.targetLanguage ?? 'en';
    const sourceLang =
      params.sourceLanguage && params.sourceLanguage !== 'auto' ? params.sourceLanguage : 'en';
    const mt = await this.gateway.translate({
      text: queryText || 'Karibu',
      source: sourceLang,
      target,
    });
    const fulfillmentText = mt.text;
    const payload: Record<string, unknown> = {
      fulfillmentText,
      fulfillmentMessages: [{ text: { text: [fulfillmentText] } }],
      sessionInfo: {
        parameters: { ...params, lastReply: fulfillmentText },
      },
    };
    if (params.speak === 'true' || params.speak === '1') {
      const speech = await this.audio.speak({
        text: fulfillmentText,
        voice: params.voice ?? 'alloy',
        language: target,
        format: 'mp3',
        organizationId: meta.organizationId,
        workspaceId: meta.workspaceId,
        apiKeyId: meta.apiKeyId,
        userId: meta.userId,
        ip: meta.ip,
      });
      payload.payload = {
        verbalab: {
          audioBase64: speech.audio.toString('base64'),
          mimeType: speech.mimeType,
        },
      };
    }
    return payload;
  }

  googleVoiceStatus() {
    return {
      platform: 'google-voice',
      verdict: 'yes',
      path: 'Dialogflow CX phone gateway or Twilio PSTN → VerbaLab bridges',
      endpoints: {
        dialogflowWebhook: 'POST /v1/voice-bridges/google/dialogflow/webhook',
        cloudTts: 'POST /v1/voice-bridges/google/texttospeech/v1/synthesize',
        cloudStt: 'POST /v1/voice-bridges/google/speech/v1/recognize',
      },
      note:
        'Consumer Google Voice has no third-party TTS provider API. Complete builder path is Dialogflow telephony or Twilio with VerbaLab TTS/STT bridges.',
    };
  }

  async elevenLabsTts(voiceId: string, body: Record<string, unknown>, meta: OrgMeta) {
    const text = String(body.text ?? '').trim();
    if (!text) {
      throw new ApiException('validation_error', 'text required', HttpStatus.BAD_REQUEST);
    }
    const speech = await this.audio.speak({
      text,
      voice: voiceId || 'alloy',
      language: typeof body.language_code === 'string' ? body.language_code : undefined,
      format: 'mp3',
      organizationId: meta.organizationId,
      workspaceId: meta.workspaceId,
      apiKeyId: meta.apiKeyId,
      userId: meta.userId,
      ip: meta.ip,
    });
    return speech;
  }

  elevenLabsVoices() {
    const voices = this.gateway.listVoices();
    return {
      voices: voices.map((v) => ({
        voice_id: v.id,
        name: v.name ?? v.id,
        category: 'verbalab',
        labels: { provider: v.provider ?? 'verbalab' },
      })),
    };
  }

  twilioStatus(baseUrl: string) {
    const root = baseUrl.replace(/\/$/, '');
    return {
      platform: 'twilio',
      verdict: 'yes',
      inboundUrl: `${root}/v1/voice/twilio/inbound`,
      turnUrl: `${root}/v1/voice/twilio/turn`,
      simulate: `${root}/v1/voice/simulate`,
      sip: `${root}/v1/voice-bridges/sip/trunk`,
      note: 'Configure phone number voice webhook or Elastic SIP Trunk origin to inboundUrl.',
    };
  }

  sipTrunk(baseUrl: string) {
    const root = baseUrl.replace(/\/$/, '');
    return {
      platform: 'sip',
      verdict: 'yes',
      recipe: 'twilio-elastic-sip-trunk',
      termination: {
        twimlUrl: `${root}/v1/voice/twilio/inbound`,
        inviteHook: `${root}/v1/voice-bridges/sip/invite-hook`,
      },
      steps: [
        'Create Twilio Elastic SIP Trunk (or carrier SIP → Twilio).',
        `Set origination/TwiML voice URL to ${root}/v1/voice/twilio/inbound`,
        'Or POST SIP invite metadata to invite-hook for JSON agent replies.',
        'VerbaLab runs STT → FAQ/agent → TTS on the media path Twilio delivers.',
      ],
      honesty: 'No in-process SBC — SIP signaling terminates at Twilio/carrier.',
    };
  }

  async sipInviteHook(body: Record<string, unknown>, meta: OrgMeta) {
    const text = String(body.speechResult ?? body.text ?? body.sdpHint ?? 'Hello from SIP').trim();
    const target = String(body.targetLanguage ?? 'en');
    const translated = await this.gateway.translate({
      text,
      source: String(body.sourceLanguage ?? 'en'),
      target,
    });
    const speech = await this.audio.speak({
      text: translated.text,
      voice: String(body.voice ?? 'alloy'),
      language: target,
      format: 'mp3',
      organizationId: meta.organizationId,
      workspaceId: meta.workspaceId,
      apiKeyId: meta.apiKeyId,
      userId: meta.userId,
      ip: meta.ip,
    });
    return {
      replyText: translated.text,
      audioBase64: speech.audio.toString('base64'),
      mimeType: speech.mimeType,
      next: 'Play audio on the SIP media leg via your SBC/Twilio TwiML Play verb.',
      twimlHint: `<Response><Say>${escapeXml(translated.text)}</Say></Response>`,
    };
  }

  webrtcStatus(baseUrl: string) {
    const root = baseUrl.replace(/\/$/, '');
    return {
      platform: 'webrtc',
      verdict: 'yes',
      endpoints: {
        session: `${root}/v1/verba-voice/sessions`,
        webrtc: `${root}/v1/verba-voice/webrtc`,
        signal: `${root}/v1/verba-voice/webrtc/signal`,
        bargeIn: `${root}/v1/verba-voice/webrtc/barge-in`,
      },
      stun: process.env.WEBRTC_STUN_URLS ?? 'stun:stun.l.google.com:19302',
      turnConfigured: Boolean(process.env.WEBRTC_TURN_URLS),
      note: 'Duplex signaling + barge-in shipped. Configure WEBRTC_TURN_URLS for restrictive NATs.',
    };
  }
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
