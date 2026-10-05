import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import type { IncomingMessage } from 'http';
import type { Duplex } from 'stream';
import { WebSocketServer, WebSocket } from 'ws';
import { PrismaService } from '../prisma/prisma.service';
import { ApiKeysService } from '../api-keys/api-keys.service';
import { AudioService } from '../audio/audio.service';
import { pcm16ToWav } from './voice-bridges.pcm';

/**
 * VAPI custom-transcriber WebSocket bridge.
 * Path: /v1/voice-bridges/vapi/stt
 */
@Injectable()
export class VoiceBridgesVapiSttGateway implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(VoiceBridgesVapiSttGateway.name);
  private wss: WebSocketServer | null = null;
  private upgradeHandler: ((req: IncomingMessage, socket: Duplex, head: Buffer) => void) | null =
    null;

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly apiKeys: ApiKeysService,
    private readonly prisma: PrismaService,
    private readonly audio: AudioService,
  ) {}

  onModuleInit() {
    const server = this.httpAdapterHost.httpAdapter.getHttpServer();
    this.wss = new WebSocketServer({ noServer: true });
    this.upgradeHandler = (req, socket, head) => {
      const url = req.url ?? '';
      if (!url.startsWith('/v1/voice-bridges/vapi/stt')) return;
      this.wss!.handleUpgrade(req, socket, head, (ws) => {
        void this.handleConnection(ws, req);
      });
    };
    server.on('upgrade', this.upgradeHandler);
    this.logger.log('VAPI STT WebSocket bridge listening on /v1/voice-bridges/vapi/stt');
  }

  onModuleDestroy() {
    const server = this.httpAdapterHost.httpAdapter.getHttpServer();
    if (this.upgradeHandler) server.off('upgrade', this.upgradeHandler);
    this.wss?.close();
  }

  private async handleConnection(ws: WebSocket, req: IncomingMessage) {
    const auth = await this.authorize(req);
    if (!auth) {
      ws.close(4401, 'unauthorized');
      return;
    }

    let sampleRate = 16000;
    const chunks: Buffer[] = [];
    let language: string | undefined;

    ws.on('message', (data, isBinary) => {
      void (async () => {
        try {
          if (!isBinary) {
            const msg = JSON.parse(String(data)) as {
              type?: string;
              sampleRate?: number;
              encoding?: string;
              language?: string;
              channels?: number;
            };
            if (msg.type === 'start') {
              sampleRate = Number(msg.sampleRate ?? 16000) || 16000;
              language = msg.language;
              ws.send(JSON.stringify({ type: 'transcriber-ready' }));
              return;
            }
            if (msg.type === 'stop' || msg.type === 'end') {
              await this.flush(ws, chunks, sampleRate, language, auth);
              chunks.length = 0;
              return;
            }
            return;
          }
          chunks.push(Buffer.isBuffer(data) ? data : Buffer.from(data as ArrayBuffer));
          // Periodic finals every ~3s of audio at 16k PCM16 mono (~96KB)
          const bytes = chunks.reduce((n, c) => n + c.length, 0);
          if (bytes >= sampleRate * 2 * 3) {
            await this.flush(ws, chunks, sampleRate, language, auth);
            chunks.length = 0;
          }
        } catch (err) {
          this.logger.warn(
            `vapi stt frame error: ${err instanceof Error ? err.message : 'unknown'}`,
          );
          ws.send(
            JSON.stringify({
              type: 'error',
              error: err instanceof Error ? err.message : 'stt_failed',
            }),
          );
        }
      })();
    });
  }

  private async flush(
    ws: WebSocket,
    chunks: Buffer[],
    sampleRate: number,
    language: string | undefined,
    auth: { organizationId: string; workspaceId: string; apiKeyId?: string },
  ) {
    if (!chunks.length) return;
    const pcm = Buffer.concat(chunks);
    const wav = pcm16ToWav(pcm, sampleRate);
    const result = await this.audio.transcribe({
      file: {
        buffer: wav,
        originalname: 'vapi.wav',
        mimetype: 'audio/wav',
        size: wav.length,
      } as Express.Multer.File,
      language,
      organizationId: auth.organizationId,
      workspaceId: auth.workspaceId,
      apiKeyId: auth.apiKeyId,
    });
    ws.send(
      JSON.stringify({
        type: 'transcriber-response',
        transcription: result.text,
        channel: 'customer',
        transcriptType: 'final',
      }),
    );
  }

  private async authorize(req: IncomingMessage) {
    const header = req.headers.authorization;
    const secret = req.headers['x-vapi-secret'];
    const token =
      (typeof header === 'string' && header.startsWith('Bearer ')
        ? header.slice(7).trim()
        : '') || (typeof secret === 'string' ? secret.trim() : '');
    if (!token) return null;
    if (token.startsWith('vl_')) {
      try {
        const key = await this.apiKeys.verify(token);
        return {
          organizationId: key.organizationId,
          workspaceId: key.workspaceId,
          apiKeyId: key.apiKeyId,
        };
      } catch {
        return null;
      }
    }
    // Allow Clerk-less fixture org when explicitly configured for partner demos.
    const orgId = process.env.VOICE_BRIDGE_DEMO_ORG_ID;
    const wsId = process.env.VOICE_BRIDGE_DEMO_WORKSPACE_ID;
    if (orgId && wsId && token === process.env.VOICE_BRIDGE_DEMO_SECRET) {
      return { organizationId: orgId, workspaceId: wsId };
    }
    return null;
  }
}
