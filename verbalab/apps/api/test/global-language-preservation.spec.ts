import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Global Language Preservation (VL-388)', () => {
  let app: INestApplication;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });
  afterAll(async () => { await app.close(); });
  it('exposes engine/products with honesty flags', async () => {
    const res = await request(app.getHttpServer()).get('/v1/global-language-preservation/engine').expect(200);
    expect(res.body.honesty.demoPublicSectorPlatform).toBe(true);
    expect(res.body.honesty.runsNationalInfrastructure).toBe(false);
    expect(res.body.honesty.productionGovernmentDeployment).toBe(false);
    expect(res.body.honesty.productionCourtPoliceMilitary).toBe(false);
    expect(res.body.honesty.productionEmergencyDispatch).toBe(false);
    expect(res.body.honesty.productionCitizenIdentityAuth).toBe(false);
    expect(res.body.honesty.civilizationInfrastructureOs).toBe(false);
  });
});
