'use client';

import { MoonshotConsole } from '@/components/moonshot-console';

export function ModelEconomyClient() {
  return (
    <MoonshotConsole
      title="Model Economy"
      apiBase="/v1/model-economy"
      actions={[
        {
          id: 'catalog',
          label: 'Browse use-case catalog',
          path: 'catalog',
          method: 'GET',
          fields: [],
        },
        {
          id: 'tiers',
          label: 'Speed tiers',
          path: 'tiers',
          method: 'GET',
          fields: [],
        },
        {
          id: 'quote',
          label: 'Quote price',
          path: 'quote',
          fields: [
            { name: 'useCase', label: 'Use case', placeholder: 'field-notes-stt' },
            { name: 'tier', label: 'Speed tier (eco|standard|turbo|ultra)', placeholder: 'turbo' },
          ],
        },
        {
          id: 'estimate',
          label: 'Estimate workload cost',
          path: 'estimate',
          fields: [
            { name: 'useCase', label: 'Use case', placeholder: 'meeting-stt' },
            { name: 'tier', label: 'Speed tier', placeholder: 'standard' },
            { name: 'units', label: 'Units (minutes/turns/1k)', placeholder: '100' },
          ],
        },
        {
          id: 'select',
          label: 'Select SKU',
          path: 'select',
          fields: [
            { name: 'useCase', label: 'Use case', placeholder: 'voice-assist' },
            { name: 'tier', label: 'Speed tier', placeholder: 'ultra' },
          ],
        },
        {
          id: 'meter',
          label: 'Meter usage',
          path: 'meter',
          fields: [
            { name: 'sku', label: 'SKU', placeholder: 'vlm.field-notes-stt.turbo' },
            { name: 'units', label: 'Units', placeholder: '3.5' },
          ],
        },
      ]}
    />
  );
}
