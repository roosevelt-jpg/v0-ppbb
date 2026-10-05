export type BridgeStatus = 'shipped' | 'partial';

export type VoiceBridgePlatform = {
  id: string;
  name: string;
  status: BridgeStatus;
  verdict: 'yes';
  protocols: string[];
  endpoints: string[];
  console: string;
  setup: string;
  honesty: string;
};

export function voiceBridgesCatalog() {
  return {
    id: 'voice-bridges',
    title: 'Voice platform bridges',
    blurb:
      'Use VerbaLab Own AI TTS/STT/agents inside VAPI, Twilio, Amazon, Google, Drop-in TTS clients, SIP trunks, and WebRTC.',
    platforms: [
      platform(
        'vapi',
        'VAPI',
        ['http', 'websocket'],
        [
          'POST /v1/voice-bridges/vapi/tts',
          'WS /v1/voice-bridges/vapi/stt',
          'POST /v1/voice-bridges/vapi/stt',
          'GET /v1/voice-bridges/vapi/assistant-snippet',
        ],
        'Point VAPI custom-voice / custom-transcriber at these URLs with your vl_* key.',
        'Custom TTS returns raw PCM16 mono; STT WebSocket follows VAPI custom-transcriber frames.',
      ),
      platform(
        'twilio',
        'Twilio',
        ['twiml', 'http', 'sip'],
        [
          'POST /v1/voice/twilio/inbound',
          'POST /v1/voice/twilio/turn',
          'GET /v1/voice-bridges/twilio/status',
          'GET /v1/voice-bridges/sip/trunk',
        ],
        'Configure Twilio phone webhooks or Elastic SIP Trunk → existing TwiML FAQ loop.',
        'Shipped FAQ telephony + SIP trunk recipe into the same STT→agent→TTS path.',
      ),
      platform(
        'amazon-polly',
        'Amazon Polly (compatible)',
        ['http'],
        ['POST /v1/voice-bridges/amazon/polly/speech', 'GET /v1/voice-bridges/amazon/polly/voices'],
        'Drop-in Polly-shaped SynthesizeSpeech JSON for apps already coded against Polly.',
        'VerbaLab Own AI voices — not AWS Polly model weights.',
      ),
      platform(
        'amazon-lex',
        'Amazon Lex',
        ['webhook'],
        ['POST /v1/voice-bridges/amazon/lex/fulfillment'],
        'Lex fulfillment Lambda/webhook → VerbaLab translate/TTS/FAQ reply.',
        'Text/SSML fulfillment bridge; Lex NLU still runs in AWS.',
      ),
      platform(
        'amazon-connect',
        'Amazon Connect',
        ['webhook'],
        ['POST /v1/voice-bridges/amazon/connect/contact'],
        'Connect contact-flow Lambda webhook for African voice replies.',
        'Contact attributes in / TTS or text reply out; Connect media plane stays in AWS.',
      ),
      platform(
        'google-cloud-tts',
        'Google Cloud TTS (compatible)',
        ['http'],
        [
          'POST /v1/voice-bridges/google/texttospeech/v1/synthesize',
          'POST /v1/voice-bridges/google/texttospeech/v1/text/synthesize',
        ],
        'Cloud Text-to-Speech shaped synthesize for Google-client SDKs.',
        'Returns base64 audio from VerbaLab Own AI — not Google WaveNet weights.',
      ),
      platform(
        'google-speech',
        'Google Cloud Speech (compatible)',
        ['http'],
        [
          'POST /v1/voice-bridges/google/speech/v1/recognize',
          'POST /v1/voice-bridges/google/speech/v1/speech/recognize',
        ],
        'Speech-to-Text shaped recognize for Google-client SDKs.',
        'Uses VerbaLab Echo STT — not Google Chirp model weights.',
      ),
      platform(
        'dialogflow',
        'Dialogflow CX / ES',
        ['webhook'],
        ['POST /v1/voice-bridges/google/dialogflow/webhook'],
        'Dialogflow fulfillment webhook for multilingual African replies + optional TTS.',
        'Dialogflow NLU remains Google; VerbaLab supplies MT/TTS/FAQ content.',
      ),
      platform(
        'google-voice',
        'Google Voice / telephony',
        ['webhook', 'http'],
        [
          'POST /v1/voice-bridges/google/dialogflow/webhook',
          'GET /v1/voice-bridges/google/voice/status',
        ],
        'Consumer Google Voice has no public voice-provider API — use Dialogflow CX phone / Twilio PSTN with VerbaLab bridges.',
        'Complete builder path via Dialogflow phone gateway or Twilio; not a Google Voice consumer plugin.',
      ),
      platform(
        'compatible-tts',
        'Drop-in TTS clients',
        ['http'],
        [
          'POST /v1/voice-bridges/compatible-tts/v1/text-to-speech/{voiceId}',
          'GET /v1/voice-bridges/compatible-tts/v1/voices',
        ],
        'Drop-in TTS URL shape for tools that hardcode that path pattern.',
        'Own AI synthesis (+ optional clone adapter) — not a third-party hosted TTS product.',
      ),
      platform(
        'sip',
        'SIP trunks',
        ['sip', 'twiml'],
        ['GET /v1/voice-bridges/sip/trunk', 'POST /v1/voice-bridges/sip/invite-hook'],
        'Point Twilio Elastic SIP / carrier SIP → invite-hook or TwiML inbound for African voice agents.',
        'SIP signaling via Twilio/carrier; VerbaLab owns STT/TTS/agent. No in-process SBC.',
      ),
      platform(
        'webrtc',
        'WebRTC',
        ['webrtc', 'http', 'sse'],
        [
          'POST /v1/verba-voice/webrtc',
          'POST /v1/verba-voice/webrtc/signal',
          'POST /v1/verba-voice/webrtc/barge-in',
          'GET /v1/voice-bridges/webrtc/status',
        ],
        'Use VerbaVoice duplex sessions with SDP/ICE signaling + barge-in.',
        'Signaling + barge-in shipped; TURN is deploy-configured; not a hosted SFU cloud.',
      ),
    ] satisfies VoiceBridgePlatform[],
  };
}

function platform(
  id: string,
  name: string,
  protocols: string[],
  endpoints: string[],
  setup: string,
  honesty: string,
): VoiceBridgePlatform {
  return {
    id,
    name,
    status: 'shipped',
    verdict: 'yes',
    protocols,
    endpoints,
    console: '/voice-bridges',
    setup,
    honesty,
  };
}

export function voiceBridgesHonesty() {
  return {
    replacesAwsGoogleMediaPlanes: false,
    ownAiPrimary: true,
    note:
      'Bridges let builders plug VerbaLab Own AI into VAPI/Twilio/Amazon/Google/Drop-in TTS clients. We do not host AWS Connect media, Google WaveNet weights, or a carrier SBC — those platforms keep their control planes; VerbaLab supplies African voice intelligence.',
  };
}
