import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MembershipRole } from '@prisma/client';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { SpeechCloudService } from '../src/speech-cloud/speech-cloud.service';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';

const root = join(__dirname, '../../..');

async function seedOrg(prisma: PrismaService, name: string) {
  return prisma.organization.create({
    data: {
      name,
      memberships: {
        create: {
          role: MembershipRole.owner,
          user: {
            create: {
              clerkUserId: `clerk_speech_${name}_${Date.now()}_${Math.random()}`,
              email: `${name}@example.com`,
            },
          },
        },
      },
      workspaces: {
        create: { name: 'Default', defaultSourceLang: 'en', defaultTargetLang: 'sw' },
      },
    },
    include: { workspaces: true, memberships: true },
  });
}

describe('Speech Cloud Foundation (VL-150)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let speechCloud: SpeechCloudService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
    speechCloud = app.get(SpeechCloudService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('documents Speech Cloud mapping (no fake streaming/speaker OS)', () => {
    const doc = join(root, 'docs/SPEECH_CLOUD.md');
    const adr = join(root, 'docs/adr/0069-speech-cloud-foundation.md');
    expect(existsSync(doc)).toBe(true);
    expect(existsSync(adr)).toBe(true);
    const text = readFileSync(doc, 'utf8');
    expect(text).toContain('Batch STT');
    expect(text).toContain('Streaming STT');
    expect(text).toContain('CQRS');
    expect(text).toContain('Terraform');
    expect(text).toContain('af-south-1');
    expect(text).not.toMatch(/streaming STT.*shipped/i);
    expect(text).toMatch(/is \*\*not\*\* Deepgram/i);
  });

  it('exposes public product catalog with honest statuses', async () => {
    const res = await request(app.getHttpServer()).get('/v1/speech/products').expect(200);
    expect(res.body.architecture.graphql).toBe(true);
    expect(res.body.architecture.cqrs).toBe(true);
    expect(res.body.architecture.terraform).toBe(true);
    expect(res.body.architecture.kubernetes).toBe(true);
    expect(res.body.architecture.batch).toBe(true);
    expect(res.body.architecture.streaming).toBe(false);
    expect(res.body.architecture.billing).toBe(true);
    expect(res.body.architecture.monitoring).toBe(true);
    expect(res.body.architecture.primaryRegion).toBe('af-south-1');
    expect(res.body.docs).toBe('/docs/SPEECH_CLOUD.md');

    const ids = res.body.products.map((p: { id: string }) => p.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'speech',
        'batch-stt',
        'streaming-stt',
        'tts',
        'speaker-intelligence',
        'call-intelligence',
        'wake-word',
      ]),
    );

    const batch = res.body.products.find((p: { id: string }) => p.id === 'batch-stt');
    expect(batch.status).toBe('shipped');
    expect(batch.api).toContain('/v1/audio/transcriptions');

    const streaming = res.body.products.find((p: { id: string }) => p.id === 'streaming-stt');
    expect(streaming.status).toBe('deferred');

    const speaker = res.body.products.find((p: { id: string }) => p.id === 'speaker-intelligence');
    expect(speaker.status).toBe('deferred');

    const biometrics = res.body.products.find((p: { id: string }) => p.id === 'voice-biometrics');
    expect(biometrics.status).toBe('partial');
  });

  it('returns org speech overview with usage + deferred flags', async () => {
    const org = await seedOrg(prisma, `speech_${Date.now()}`);

    const overview = await speechCloud.overview({
      userId: org.memberships[0].userId,
      organizationId: org.id,
      workspaceId: org.workspaces[0].id,
      clerkUserId: 'clerk_speech',
      role: 'owner',
    });

    expect(overview.usage.stt).toBeDefined();
    expect(overview.usage.tts).toBeDefined();
    expect(overview.workspace.voiceClones).toBeGreaterThanOrEqual(0);
    expect(overview.deferred.streamingStt).toBe(true);
    expect(overview.deferred.speakerIntelligence).toBe(true);
    expect(overview.deferred.callIntelligence).toBe(true);
    expect(overview.deferred.speechAnalytics).toBe(true);
    expect(overview.links.audio).toBe('/audio');
    expect(overview.links.interpret).toBe('/interpret');
    expect(overview.links.graphql).toBe('/graphql');
    expect(overview.architecture.hexagonalRewrite).toBe(false);
  });

  it('exposes speechProducts via GraphQL CQRS façade', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: '{ speechProducts { id name status } }',
      })
      .expect(200);

    expect(res.body.errors).toBeUndefined();
    const products = res.body.data.speechProducts as Array<{ id: string; status: string }>;
    expect(products.length).toBeGreaterThan(5);
    expect(products.some((p) => p.id === 'batch-stt' && p.status === 'shipped')).toBe(true);
    expect(products.some((p) => p.id === 'streaming-stt' && p.status === 'deferred')).toBe(true);
  });
});
