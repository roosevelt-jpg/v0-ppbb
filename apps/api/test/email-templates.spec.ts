import { describe, expect, it } from 'vitest';
import {
  EMAIL_TEMPLATE_CATALOG,
  previewEmailTemplate,
  renderJobCompleteEmail,
  renderSecureAlertEmail,
} from '../src/notifications/email-templates';
import { NotificationsService } from '../src/notifications/notifications.service';

describe('Email templates + notifications engine', () => {
  it('renders HTML for every catalog template', () => {
    for (const row of EMAIL_TEMPLATE_CATALOG) {
      const preview = previewEmailTemplate(row.id);
      expect(preview.html).toContain('<!doctype html>');
      expect(preview.html).toContain('VerbaLab');
      expect(preview.text.length).toBeGreaterThan(10);
      expect(preview.subject.length).toBeGreaterThan(3);
    }
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
    );
    const engine = svc.engine();
    expect(engine.templates.length).toBe(EMAIL_TEMPLATE_CATALOG.length);
    expect(engine.jobs.cronOs).toBe(false);
    expect(engine.provider).toBe('resend');
  });
});
