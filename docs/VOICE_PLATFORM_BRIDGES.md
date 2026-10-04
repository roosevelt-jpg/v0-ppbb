# Voice platform bridges

Use **VerbaLab Own AI** TTS, STT, and agents inside VAPI, Twilio, Amazon, Google, Drop-in TTS clients, SIP trunks, and WebRTC — without claiming we host AWS/Google media planes.

## Console

`/voice-bridges` · API `GET /v1/voice-bridges/engine`

## Platforms (all Yes / shipped)

| Platform | How |
| --- | --- |
| **VAPI** | Custom voice `POST …/vapi/tts` (PCM16) + custom transcriber `WS …/vapi/stt` or HTTP POST. Snippet: `GET …/vapi/assistant-snippet`. |
| **Twilio** | Existing TwiML FAQ loop + `GET …/twilio/status` + SIP trunk recipe. |
| **Amazon Polly** | Polly-shaped `SynthesizeSpeech` JSON → Own AI audio. |
| **Amazon Lex** | Fulfillment webhook → MT/TTS/FAQ close response. |
| **Amazon Connect** | Contact-flow Lambda webhook → text/SSML/audioBase64. |
| **Google Cloud TTS** | Cloud TTS–shaped synthesize (base64 audio). |
| **Google Speech** | Speech–shaped recognize (Echo STT). |
| **Dialogflow** | CX/ES fulfillment webhook. |
| **Google Voice** | No consumer plugin API — complete path via Dialogflow phone or Twilio + bridges. |
| **Drop-in TTS** | `/compatible-tts/v1/text-to-speech/{voiceId}` + voices list. |
| **SIP** | Twilio Elastic SIP / carrier → TwiML inbound or `sip/invite-hook`. |
| **WebRTC** | VerbaVoice `webrtc` / `signal` / `barge-in` (+ status). |

Auth on mutating bridges: `Authorization: Bearer vl_live_…` (or `vl_test_…`).

## Honesty

- Bridges adapt **request shapes** so builders can plug VerbaLab into existing stacks.
- We do **not** replace AWS Connect media, Google WaveNet weights, or a carrier SBC.
- Own AI remains primary; model quality still depends on configured Own AI / optional vendor keys.

## Related

- Twilio agents: `docs/adr/0028-voice-agents.md`
- Verba Voice WebRTC: `docs/VERBA_VOICE.md`
- Partner MCP (creative/LLM tools): `docs/PARTNER_CONNECTORS.md`
