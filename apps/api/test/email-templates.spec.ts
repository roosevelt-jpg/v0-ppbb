import { afterEach, describe, expect, it } from 'vitest';
import {
  EMAIL_TEMPLATE_CATALOG,
  emailAssetBaseUrl,
  previewEmailTemplate,
  renderJobCompleteEmail,
  renderSecureAlertEmail,
} from '../src/notifications/email-templates';
import { NotificationsService } from '../src/notifications/notifications.service';

describe('Email templates + notifications engine', () => {
  const prevAsset = process.env.EMAIL_ASSET_BASE_URL;
  const prevWeb = process.env.WEB_APP_URL;
  const prevNext = process.env.NEXT_PUBLIC_APP_URL;

  afterEach(() => {
    if (prevAsset === undefined) delete process.env.EMAIL_ASSET_BASE_URL;
    else process.env.EMAIL_ASSET_BASE_URL = prevAsset;
    if (prevWeb === undefined) delete process.env.WEB_APP_URL;
    else process.env.WEB_APP_URL = prevWeb;
    if (prevNext === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = prevNext;
  });

  it('renders HTML for every catalog template', () => {
    for (const row of EMAIL_TEMPLATE_CATALOG) {
      const preview = previewEmailTemplate(row.id);
      expect(preview.html).toContain('<!doctype html>');
      expect(preview.html).toContain('VerbaLab');
      expect(preview.html).toContain('/email/verbalab-logo.png');
      expect(preview.html).toContain('alt="VerbaLab"');
      expect(preview.html).toContain('/email/social-x.png');
      expect(preview.html).toContain('/email/social-linkedin.png');
      expect(preview.html).toContain('/email/social-github.png');
      expect(preview.html).toContain('https://x.com');
      expect(preview.html).toContain('All rights reserved');
      expect(preview.html).toMatch(/©\s*\d{4}/);
      expect(preview.text.length).toBeGreaterThan(10);
      expect(preview.subject.length).toBeGreaterThan(3);
    }
  });

  it('uses EMAIL_ASSET_BASE_URL for logo and social icons', () => {
    process.env.EMAIL_ASSET_BASE_URL = 'https://cdn.example.test';
    delete process.env.WEB_APP_URL;
    delete process.env.NEXT_PUBLIC_APP_URL;
    expect(emailAssetBaseUrl()).toBe('https://cdn.example.test');
    const html = previewEmailTemplate('member_added').html;
    expect(html).toContain('https://cdn.example.test/email/verbalab-logo.png');
    expect(html).toContain('https://cdn.example.test/email/social-instagram.png');
  });

  it('includes failure detail in job emails', () => {
    const rendered = renderJobCompleteEmail({
      jobId: 'j1',
      type: 'workflow',
      status: 'failed',
      error: 'upstream timeout',
    });
    expect(rendered.html).toContain('upstream timeout');
    expect(rendered.subject).toContain('failed');
  });

  it('secure alert template embeds receipt', () => {
    const rendered = renderSecureAlertEmail({
      protocol: 'trusted-contact',
      receiptToken: 'vsta.abc.def',
      summary: 'Help me',
    });
    expect(rendered.html).toContain('vsta.abc.def');
    expect(rendered.html).toContain('Help me');
  });

  it('engine reports template catalog and resend readiness flags', () => {
    const svc = new NotificationsService(
      { membership: { findMany: async () => [] } } as never,
      { record: async () => ({}) } as never,
      { deliverPartnerEvent: async () => ({ ok: true, skipped: true }) } as never,
    );
    const engine = svc.engine();
    expect(engine.templates.length).toBe(EMAIL_TEMPLATE_CATALOG.length);
    expect(engine.jobs.cronOs).toBe(false);
    expect(engine.provider).toBe('resend');
  });
});
