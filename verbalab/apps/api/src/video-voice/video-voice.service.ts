import { Injectable } from '@nestjs/common';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { ownAiStackSummary } from '../gateway/verbalab-own-ai';
import { videoVoiceCatalog } from './video-voice.catalog';

@Injectable()
export class VideoVoiceService {
  engine() {
    return {
      ...videoVoiceCatalog(),
      ownAi: ownAiStackSummary(),
      pipeline: [
        'upload_reference_samples',
        'consent_and_abuse_review',
        'clone_on_voice_fm',
        'synthesize_for_video_timeline',
        'optional_translate_fm_script',
        'watermark_export',
      ],
      apis: {
        clones: '/v1/voice-clones',
        speech: '/v1/audio/speech',
        translate: '/v1/translate',
        voiceFm: '/v1/voice-fm/engine',
      },
    };
  }

  overview(session: SessionContext) {
    return {
      session: {
        organizationId: session.organizationId,
        workspaceId: session.workspaceId,
      },
      engine: this.engine(),
      links: {
        voiceCloning: '/voice-cloning',
        voiceStudio: '/voice-studio',
        audio: '/audio',
        voiceFm: '/voice-fm',
        translateFm: '/translate-fm',
      },
      note: 'Video voice — end-to-end dubbing on VerbaLab-owned Voice FM + Translate FM.',
    };
  }
}
