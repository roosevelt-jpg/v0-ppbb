'use client';

import { MoonshotConsole } from '@/components/moonshot-console';

export function NotificationsClient() {
  return (
    <MoonshotConsole
      title="Notifications & email"
      apiBase="/v1/notifications"
      actions={[
        {
          id: 'templates',
          label: 'List email templates',
          path: 'templates',
          method: 'GET',
          fields: [],
        },
        {
          id: 'preview-job',
          label: 'Preview job_complete',
          path: 'templates/job_complete/preview',
          method: 'GET',
          fields: [],
        },
        {
          id: 'preview-usage',
          label: 'Preview usage_threshold',
          path: 'templates/usage_threshold/preview',
          method: 'GET',
          fields: [],
        },
        {
          id: 'preview-secure',
          label: 'Preview secure_alert',
          path: 'templates/secure_alert/preview',
          method: 'GET',
          fields: [],
        },
        {
          id: 'test',
          label: 'Send test email (Resend)',
          path: 'test',
          fields: [
            { name: 'to', label: 'To email', placeholder: 'you@example.com' },
            {
              name: 'templateId',
              label: 'Template id',
              placeholder: 'member_added',
            },
          ],
        },
        {
          id: 'monitoring',
          label: 'Monitoring',
          path: 'monitoring',
          method: 'GET',
          fields: [],
        },
      ]}
    />
  );
}
