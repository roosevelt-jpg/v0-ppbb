import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const root = join(__dirname, '../../..');

describe('Production deploy config (VL-074)', () => {
  it('ships API and web Dockerfiles', () => {
    expect(existsSync(join(root, 'apps/api/Dockerfile'))).toBe(true);
    expect(existsSync(join(root, 'apps/web/Dockerfile'))).toBe(true);
    expect(existsSync(join(root, '.dockerignore'))).toBe(true);
  });

  it('configures Fly API release migrate and health check', () => {
    const toml = readFileSync(join(root, 'infra/fly/api.toml'), 'utf8');
    expect(toml).toContain("app = 'verbalab-api'");
    expect(toml).toContain("primary_region = 'jnb'");
    expect(toml).toContain("VERBALAB_REGION = 'af'");
    expect(toml).toContain('prisma migrate deploy');
    expect(toml).toContain("path = '/health'");
  });

  it('documents deploy skip-without-token workflow', () => {
    const yml = readFileSync(join(root, '.github/workflows/deploy.yml'), 'utf8');
    expect(yml).toContain('FLY_API_TOKEN');
    expect(yml).toContain('skipping production deploy');
    expect(yml).toContain('infra/fly/api.toml');
  });

  it('ships EU and US residency island configs (VL-075)', () => {
    const eu = readFileSync(join(root, 'infra/fly/api.eu.toml'), 'utf8');
    expect(eu).toContain("app = 'verbalab-api-eu'");
    expect(eu).toContain("primary_region = 'ams'");
    expect(eu).toContain("VERBALAB_REGION = 'eu'");
    expect(existsSync(join(root, 'infra/fly/web.eu.toml'))).toBe(true);
    const us = readFileSync(join(root, 'infra/fly/api.us.toml'), 'utf8');
    expect(us).toContain("app = 'verbalab-api-us'");
    expect(us).toContain("VERBALAB_REGION = 'us'");
    expect(existsSync(join(root, 'infra/fly/web.us.toml'))).toBe(true);
    const yml = readFileSync(join(root, '.github/workflows/deploy.yml'), 'utf8');
    expect(yml).toContain('FLY_DEPLOY_EU');
    expect(yml).toContain('infra/fly/api.eu.toml');
    expect(yml).toContain('FLY_DEPLOY_US');
    expect(yml).toContain('infra/fly/api.us.toml');
  });

  it('configures web Fly health checks and smoke script', () => {
    const web = readFileSync(join(root, 'infra/fly/web.toml'), 'utf8');
    expect(web).toContain("path = '/health'");
    const webEu = readFileSync(join(root, 'infra/fly/web.eu.toml'), 'utf8');
    expect(webEu).toContain("path = '/health'");
    expect(existsSync(join(root, 'scripts/smoke-deploy.mjs'))).toBe(true);
    const apiDocker = readFileSync(join(root, 'apps/api/Dockerfile'), 'utf8');
    expect(apiDocker).toContain('HEALTHCHECK');
    const webDocker = readFileSync(join(root, 'apps/web/Dockerfile'), 'utf8');
    expect(webDocker).toContain('HEALTHCHECK');
    expect(webDocker).toContain('/health');
  });
});
