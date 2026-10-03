import { existsSync } from 'fs';
import { join } from 'path';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

const VOLUME22_HUBS = ['global-ai-standards', 'ai-certification-platform', 'ai-compliance-framework', 'reference-architectures', 'best-practices-library', 'enterprise-assessment-platform', 'standards-repository', 'global-partner-program', 'standards-analytics'];

describe('VGAS Production Audit (VL-373)', () => {
  let app: INestApplication;
  const root = join(__dirname, '../../..');
  const apiSrc = join(root, 'apps/api/src');
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });
  afterAll(async () => { await app.close(); });
  it('has audit pack + ADRs', () => {
    expect(existsSync(join(root, 'docs/adr/0275-vgas-production-audit.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/vgas-audit/PRODUCTION_READINESS.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/vgas-audit/CERTIFICATION_GUIDE.md'))).toBe(true);
    for (const hub of VOLUME22_HUBS) expect(existsSync(join(apiSrc, hub, `${hub}.catalog.ts`))).toBe(true);
    expect(existsSync(join(apiSrc, 'vgas-store/vgas-store.service.ts'))).toBe(true);
  });
  it('foundation products include all hubs and honesty', async () => {
    const res = await request(app.getHttpServer()).get('/v1/global-ai-standards/products').expect(200);
    const ids = (res.body.products as Array<{ id: string }>).map((p) => p.id);
    for (const hub of VOLUME22_HUBS) expect(ids).toContain(hub);
    expect(res.body.honesty.internationalStandardAdoption).toBe(false);
    expect(res.body.honesty.thirdPartyAccreditation).toBe(false);
  });
  it('verify demo certificate without claiming third-party accreditation', async () => {
    const res = await request(app.getHttpServer()).get('/v1/global-ai-standards/verify/VGAS-DEMO-ENGINEER-001').expect(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.thirdPartyAccreditation).toBe(false);
  });
  it('domain engines expose honesty', async () => {
    for (const hub of VOLUME22_HUBS.slice(1)) {
      const res = await request(app.getHttpServer()).get(`/v1/${hub}/engine`).expect(200);
      expect(res.body.honesty.internalStandardsPlatform).toBe(true);
      expect(res.body.honesty.thirdPartyAccreditation).toBe(false);
    }
  });
  it('overview requires auth', async () => {
    const res = await request(app.getHttpServer()).get('/v1/global-ai-standards/overview');
    expect([401, 403]).toContain(res.status);
  });
});
