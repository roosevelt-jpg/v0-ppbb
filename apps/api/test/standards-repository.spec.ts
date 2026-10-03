import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Standards Repository (VL-370)', () => {
  let app: INestApplication;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });
  afterAll(async () => { await app.close(); });
  it('exposes engine/products with honesty flags', async () => {
    const res = await request(app.getHttpServer()).get('/v1/standards-repository/engine').expect(200);
    expect(res.body.honesty.internalStandardsPlatform).toBe(true);
    expect(res.body.honesty.internationalStandardAdoption).toBe(false);
    expect(res.body.honesty.thirdPartyAccreditation).toBe(false);
    expect(res.body.note || res.body.product).toBeTruthy();
  });
});
