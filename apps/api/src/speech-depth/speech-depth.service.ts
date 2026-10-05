import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { ownAiStackSummary } from '../gateway/verbalab-own-ai';
import { developOwnModelEngine } from '../own-models/own-models.catalog';
import { speechDepthCapabilities, speechDepthCatalog } from './speech-depth.catalog';

@Injectable()
export class SpeechDepthService {
  constructor(private readonly prisma: PrismaService) {}

  engine() {
    return developOwnModelEngine('speech-depth', {
      ...speechDepthCatalog(),
      capabilities: speechDepthCapabilities(),
      ownAi: ownAiStackSummary(),
      dialects: ['sw-KE', 'sw-TZ', 'yo-NG', 'ha-NG', 'am-ET', 'zu-ZA', 'af-ZA', 'ar-EG', 'fr-SN'],
      note: 'Speech depth — streaming + African dialect hints on VerbaLab Echo.',
    });
  }

  async overview(session: SessionContext) {
    const sessions = await this.prisma.streamingSession.count({
      where: { organizationId: session.organizationId, workspaceId: session.workspaceId },
    }).catch(() => 0);
    return {
      engine: this.engine(),
      streamingSessions: sessions,
      links: {
        speechRecognition: '/speech-recognition',
        streamingRuntime: '/streaming-runtime',
        echo: '/echo',
        audio: '/audio',
      },
    };
  }

  async startStream(session: SessionContext, body: { language?: string; dialect?: string }) {
    const row = await this.prisma.streamingSession.create({
      data: {
        organizationId: session.organizationId,
        workspaceId: session.workspaceId,
        kind: 'speech',
        status: 'open',
        metadata: {
          language: body.language ?? 'sw',
          dialect: body.dialect ?? null,
          provider: 'verbalab_own_ai',
          model: 'echo',
        },
      },
    });
    return {
      sessionId: row.id,
      kind: 'speech',
      language: body.language ?? 'sw',
      dialect: body.dialect ?? null,
      streamPath: `/v1/streaming-runtime/stream?sessionId=${row.id}`,
      provider: 'verbalab_own_ai',
      model: 'echo',
    };
  }
}
