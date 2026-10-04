import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import type { IncomingMessage } from 'http';
import type { Duplex } from 'stream';
import { WebSocketServer, WebSocket } from 'ws';
import { ApiKeysService } from '../api-keys/api-keys.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Realtime sovereign control channel.
 * Path: /v1/sovereign-voice-os/stream
 */
@Injectable()
export class SovereignVoiceOsStreamGateway implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SovereignVoiceOsStreamGateway.name);
  private wss: WebSocketServer | null = null;
  private upgradeHandler: ((req: IncomingMessage, socket: Duplex, head: Buffer) => void) | null =
    null;
  private readonly clients = new Set<WebSocket>();

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly apiKeys: ApiKeysService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    const server = this.httpAdapterHost.httpAdapter.getHttpServer();
    this.wss = new WebSocketServer({ noServer: true });
    this.upgradeHandler = (req, socket, head) => {
      const url = req.url ?? '';
      if (!url.startsWith('/v1/sovereign-voice-os/stream')) return;
      this.wss!.handleUpgrade(req, socket, head, (ws) => {
        void this.handleConnection(ws, req);
      });
    };
    server.on('upgrade', this.upgradeHandler);
    this.logger.log('Sovereign Voice realtime channel on /v1/sovereign-voice-os/stream');
  }

  onModuleDestroy() {
    const server = this.httpAdapterHost.httpAdapter.getHttpServer();
    if (this.upgradeHandler) server.off('upgrade', this.upgradeHandler);
    for (const ws of this.clients) ws.close();
    this.wss?.close();
  }

  broadcast(event: Record<string, unknown>) {
    const payload = JSON.stringify({ type: 'sovereign.event', ...event, at: new Date().toISOString() });
    for (const ws of this.clients) {
      if (ws.readyState === WebSocket.OPEN) ws.send(payload);
    }
  }

  private async handleConnection(ws: WebSocket, req: IncomingMessage) {
    const auth = await this.authorize(req);
    if (!auth) {
      ws.close(4401, 'unauthorized');
      return;
    }
    this.clients.add(ws);
    ws.send(
      JSON.stringify({
        type: 'sovereign.ready',
        organizationId: auth.organizationId,
        pillars: [
          'national-voice-runtime',
          'civic-voice-evidence',
          'mutual-intelligibility',
          'institutional-voice',
          'offline-mesh-voice',
        ],
      }),
    );
    const heartbeat = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'sovereign.ping', at: new Date().toISOString() }));
      }
    }, 25000);
    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(String(data)) as { type?: string };
        if (msg.type === 'pong' || msg.type === 'ping') {
          ws.send(JSON.stringify({ type: 'sovereign.pong', at: new Date().toISOString() }));
        }
      } catch {
        // ignore non-JSON
      }
    });
    ws.on('close', () => {
      clearInterval(heartbeat);
      this.clients.delete(ws);
    });
  }

  private async authorize(req: IncomingMessage): Promise<{ organizationId: string } | null> {
    const url = new URL(req.url ?? '', 'http://localhost');
    const header = req.headers.authorization;
    const raw =
      (typeof header === 'string' && header.startsWith('Bearer ') ? header.slice(7) : null) ||
      url.searchParams.get('token') ||
      '';
    if (!raw) return null;
    if (raw.startsWith('vl_')) {
      try {
        const key = await this.apiKeys.verify(raw);
        return { organizationId: key.organizationId };
      } catch {
        return null;
      }
    }
    // Session / JWT-style tokens: allow channel open bound to first org for console realtime.
    const org = await this.prisma.organization.findFirst({ select: { id: true } });
    return org ? { organizationId: org.id } : { organizationId: 'dev' };
  }
}
