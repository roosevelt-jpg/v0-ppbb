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
    expect(ids).toContain('iso-process-maturity');
    expect(res.body.honesty.isoProcessMaturity).toBe(true);
    expect(res.body.honesty.internationalStandardAdoption).toBe(false);
    expect(res.body.honesty.isoIeeeW3cRecognition).toBe(false);
    expect(res.body.honesty.thirdPartyAccreditation).toBe(false);
  });
  it('iso-process exposes maturity without claiming recognition', async () => {
    const res = await request(app.getHttpServer()).get('/v1/global-ai-standards/iso-process').expect(200);
    expect(res.body.honesty.isoProcessMaturity).toBe(true);
    expect(res.body.honesty.isoIeeeW3cRecognition).toBe(false);
    expect(res.body.honesty.thirdPartyAccreditation).toBe(false);
    expect(res.body.certificationScheme.schemeId).toBe('VGAS-PCS-001');
    expect(res.body.certificationScheme.accreditationStatus).toBe('not_accredited');
    expect(res.body.recognitionPathway.whatRequiresExternalBodies.length).toBeGreaterThan(0);
    expect(existsSync(join(root, 'docs/vgas-audit/ISO_PROCESS_MATURITY.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/adr/0276-vgas-iso-process-maturity.md'))).toBe(true);
  });
  it('verify demo certificate without claiming third-party accreditation', async () => {
    const res = await request(app.getHttpServer()).get('/v1/global-ai-standards/verify/VGAS-DEMO-ENGINEER-001').expect(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.schemeId).toBe('VGAS-PCS-001');
    expect(res.body.isoProcessMaturity).toBe(true);
    expect(res.body.thirdPartyAccreditation).toBe(false);
    expect(res.body.isoIeeeW3cRecognition).toBe(false);
  });
  it('certification scheme endpoint is not accredited', async () => {
    const res = await request(app.getHttpServer()).get('/v1/ai-certification-platform/scheme').expect(200);
    expect(res.body.scheme.schemeId).toBe('VGAS-PCS-001');
    expect(res.body.scheme.thirdPartyAccreditation).toBe(false);
    expect(res.body.honesty.isoProcessMaturity).toBe(true);
  });
  it('domain engines expose honesty', async () => {
    for (const hub of VOLUME22_HUBS.slice(1)) {
      const res = await request(app.getHttpServer()).get(`/v1/${hub}/engine`).expect(200);
      expect(res.body.honesty.internalStandardsPlatform).toBe(true);
      expect(res.body.honesty.isoProcessMaturity).toBe(true);
      expect(res.body.honesty.thirdPartyAccreditation).toBe(false);
      expect(res.body.honesty.isoIeeeW3cRecognition).toBe(false);
    }
  });
  it('overview requires auth', async () => {
    const res = await request(app.getHttpServer()).get('/v1/global-ai-standards/overview');
    expect([401, 403]).toContain(res.status);
  });
});
