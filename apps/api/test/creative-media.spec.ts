import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MembershipRole } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ApiKeysService } from '../src/api-keys/api-keys.service';
import { ApiExceptionFilter } from '../src/common/errors/api-exception.filter';
import { encodeWavPcm16 } from '../src/audio-intelligence/audio-dsp';

async function seedOrg(prisma: PrismaService, name: string) {
  return prisma.organization.create({
    data: {
      name,
      memberships: {
        create: {
          role: MembershipRole.owner,
          user: {
            create: {
              clerkUserId: `clerk_cm_${name}_${Date.now()}_${Math.random()}`,
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

function toneWav(): Buffer {
  const sampleRate = 8000;
  const n = sampleRate;
  const samples = new Float32Array(n);
  for (let i = 0; i < n; i++) samples[i] = Math.sin((i / sampleRate) * Math.PI * 2 * 220) * 0.3;
  return encodeWavPcm16(samples, sampleRate);
}

describe('Creative Media (VerbaCreative parity)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let apiKeys: ApiKeysService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
    prisma = app.get(PrismaService);
    apiKeys = app.get(ApiKeysService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('exposes engine with shipped ElevenCreative-class capabilities', async () => {
    const res = await request(app.getHttpServer()).get('/v1/creative-media/engine').expect(200);
    expect(res.body.product).toContain('VerbaCreative');
    const ids = (res.body.capabilities as Array<{ id: string; status: string }>).map((c) => c.id);
    for (const id of [
      'text-to-speech',
      'speech-to-text',
      'voice-changer',
      'sound-effects',
      'voice-cloning',
      'voice-isolator',
      'music',
      'studio',
      'voice-design',
      'image',
      'video',
      'ads',
      'dubbing',
    ]) {
      expect(ids).toContain(id);
    }
    expect(res.body.capabilities.every((c: { status: string }) => c.status === 'shipped')).toBe(true);
  });

  it('generates SFX, music, image, voice design, changer, and ads for an API key', async () => {
    const org = await seedOrg(prisma, `creative_${Date.now()}`);
    const key = await apiKeys.create({
      organizationId: org.id,
      workspaceId: org.workspaces[0]!.id,
      userId: org.memberships[0]!.userId,
      name: 'creative-key',
    });

    const sfx = await request(app.getHttpServer())
      .post('/v1/creative-media/sound-effects')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ prompt: 'market whoosh', durationSeconds: 1 })
      .expect(200);
    expect(sfx.body.audioBase64).toBeTruthy();

    const music = await request(app.getHttpServer())
      .post('/v1/creative-media/music')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ prompt: 'warm afrobeat', durationSeconds: 3 })
      .expect(200);
    expect(music.body.bpm).toBeGreaterThan(60);

    const image = await request(app.getHttpServer())
      .post('/v1/creative-media/image')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ prompt: 'Nairobi skyline campaign' })
      .expect(200);
    expect(image.body.imageBase64).toBeTruthy();

    const design = await request(app.getHttpServer())
      .post('/v1/creative-media/voice-design')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({ name: 'Amina', description: 'Warm East African narrator', language: 'sw' })
      .expect(200);
    expect(design.body.id).toMatch(/^vd_/);

    const changer = await request(app.getHttpServer())
      .post('/v1/creative-media/voice-changer')
      .set('Authorization', `Bearer ${key.secret}`)
      .attach('file', toneWav(), 'tone.wav')
      .field('pitchSemitones', '3')
      .expect(200);
    expect(changer.body.audioBase64).toBeTruthy();

    const ads = await request(app.getHttpServer())
      .post('/v1/creative-media/ads')
      .set('Authorization', `Bearer ${key.secret}`)
      .send({
        product: 'VerbaMarket',
        script: 'Karibu — shop in your language.',
        language: 'sw',
        mood: 'warm afrobeat',
      })
      .expect(200);
    expect(ads.body.package.music.audioBase64).toBeTruthy();
    expect(ads.body.package.still.imageBase64).toBeTruthy();
  });
});
