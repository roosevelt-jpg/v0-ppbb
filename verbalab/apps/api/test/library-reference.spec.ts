import { existsSync } from 'fs';
import { join } from 'path';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Library Reference Pack (ADR-0297)', () => {
  let app: INestApplication;
  const root = join(__dirname, '../../..');

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });
  afterAll(async () => {
    await app.close();
  });

  it('has reference docs + ADR', () => {
    expect(existsSync(join(root, 'docs/library-reference/MASTER_PHASE_INDEX.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/library-reference/DEEPER_RISK_NOTES.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/library-reference/AI_INTERNET_AND_BEYOND_RAW.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/adr/0297-library-reference-pack.md'))).toBe(true);
  });

  it('products expose honesty and deferred vision', async () => {
    const res = await request(app.getHttpServer()).get('/v1/library-reference/products').expect(200);
    expect(res.body.honesty.libraryIndexOnly).toBe(true);
    expect(res.body.honesty.aiInternetExecutablePhases).toBe(false);
    expect(res.body.honesty.missionControlOs).toBe(false);
    expect(res.body.summary.executableThroughPhase).toBe(260);
    expect(res.body.summary.volumeCount).toBe(24);
    const ids = (res.body.products as Array<{ id: string; status: string }>).map((p) => p.id);
    expect(ids).toContain('master-phase-index');
    expect(ids).toContain('ai-internet-vision');
    const vision = (res.body.products as Array<{ id: string; status: string }>).find((p) => p.id === 'ai-internet-vision');
    expect(vision?.status).toBe('deferred');
  });

  it('index lists all 24 volumes', async () => {
    const res = await request(app.getHttpServer()).get('/v1/library-reference/index').expect(200);
    expect(res.body.volumes).toHaveLength(24);
    expect(res.body.volumes[0].volume).toBe(1);
    expect(res.body.volumes[23].volume).toBe(24);
  });

  it('index can filter by volume', async () => {
    const res = await request(app.getHttpServer()).get('/v1/library-reference/index?volume=24').expect(200);
    expect(res.body.volumes).toHaveLength(1);
    expect(res.body.volumes[0].title).toMatch(/DIGITAL CIVILIZATION/i);
  });

  it('risks list five flagged areas', async () => {
    const res = await request(app.getHttpServer()).get('/v1/library-reference/risks').expect(200);
    expect(res.body.areas).toHaveLength(5);
    expect(res.body.areas.map((a: { id: string }) => a.id)).toEqual(
      expect.arrayContaining([
        'vol11-creator-economy',
        'vol12-cultural-consent',
        'vol17-control-plane-blast',
        'vol23-investment-platform',
        'vol24-public-safety',
      ]),
    );
  });

  it('vision is explicitly non-executable', async () => {
    const res = await request(app.getHttpServer()).get('/v1/library-reference/vision').expect(200);
    expect(res.body.executablePhases).toBe(false);
    expect(res.body.features.length).toBeGreaterThan(20);
    expect(res.body.honesty.aiInternetExecutablePhases).toBe(false);
  });

  it('serves markdown documents', async () => {
    const res = await request(app.getHttpServer()).get('/v1/library-reference/documents/deeper-risk-notes').expect(200);
    expect(res.body.markdown).toContain('Deeper Risk Notes');
    expect(res.body.honesty.libraryIndexOnly).toBe(true);
  });
});
