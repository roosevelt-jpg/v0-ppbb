
import { HttpStatus, Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../common/errors/api-exception';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import {
  nationalVoiceRuntimeCatalog,
  nationalVoiceRuntimeHonesty,
} from './national-voice-runtime.catalog';

type Zone = {
  id: string;
  organizationId: string;
  countryCode: string;
  ministry: string;
  region: string;
  dialects: string[];
  killSwitchArmed: boolean;
  killSwitchReason?: string;
  createdAt: string;
  updatedAt: string;
};

@Injectable()
export class NationalVoiceRuntimeService {
  private readonly zones = new Map<string, Zone>();

  constructor(private readonly audit: AuditService) {}

  engine() {
    return {
      ...nationalVoiceRuntimeCatalog(),
      safety: nationalVoiceRuntimeHonesty(),
      zones: this.zones.size,
      defaultRegion: process.env.VERBALAB_REGION ?? 'af',
    };
  }

  monitoring() {
    return { status: 'ready', honesty: nationalVoiceRuntimeHonesty() };
  }

  async overview(session: SessionContext) {
    return {
      session: {
        organizationId: session.organizationId,
        role: session.role,
      },
      engine: this.engine(),
      zones: this.listZones(session.organizationId),
      links: { self: '/national-voice-runtime', docs: '/docs/NATIONAL_VOICE_RUNTIME.md' },
    };
  }

  listZones(organizationId: string) {
    const zones = [...this.zones.values()].filter((z) => z.organizationId === organizationId);
    return { zones, count: zones.length };
  }

  getZone(organizationId: string, id: string) {
    const zone = this.zones.get(id);
    if (!zone || zone.organizationId !== organizationId) {
      throw new ApiException('not_found', 'Zone not found', HttpStatus.NOT_FOUND);
    }
    return zone;
  }

  async createZone(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const countryCode = String(body.countryCode ?? '').trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(countryCode)) {
      throw new ApiException('validation_error', 'countryCode must be ISO-3166 alpha-2', HttpStatus.BAD_REQUEST);
    }
    const region = String(body.region ?? process.env.VERBALAB_REGION ?? 'af').trim().toLowerCase();
    const zone: Zone = {
      id: randomUUID(),
      organizationId: session.organizationId,
      countryCode,
      ministry: String(body.ministry ?? 'ICT').trim() || 'ICT',
      region,
      dialects: [],
      killSwitchArmed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.zones.set(zone.id, zone);
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'national-voice-runtime.zone.create',
      ip,
      metadata: { zoneId: zone.id, countryCode, region },
    });
    return {
      zone,
      residencyNote:
        region === (process.env.VERBALAB_REGION ?? 'af')
          ? 'Zone region matches this island.'
          : 'Zone region differs from VERBALAB_REGION — live speech routes may return residency_mismatch until deployed on the matching island.',
    };
  }

  async enableDialect(session: SessionContext, zoneId: string, body: Record<string, unknown>, ip?: string) {
    const zone = this.getZone(session.organizationId, zoneId);
    if (zone.killSwitchArmed) {
      throw new ApiException('zone_killed', 'Kill-switch is armed; dialect changes blocked', HttpStatus.FORBIDDEN);
    }
    const dialect = String(body.dialect ?? '').trim();
    if (!dialect) {
      throw new ApiException('validation_error', 'dialect is required', HttpStatus.BAD_REQUEST);
    }
    if (!zone.dialects.includes(dialect)) zone.dialects.push(dialect);
    zone.updatedAt = new Date().toISOString();
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'national-voice-runtime.dialect.enable',
      ip,
      metadata: { zoneId, dialect },
    });
    return { zone };
  }

  async killSwitch(session: SessionContext, zoneId: string, body: Record<string, unknown>, ip?: string) {
    const zone = this.getZone(session.organizationId, zoneId);
    const armed = String(body.armed ?? 'true').toLowerCase() !== 'false';
    zone.killSwitchArmed = armed;
    zone.killSwitchReason = String(body.reason ?? (armed ? 'ministry_hold' : '')).trim() || undefined;
    zone.updatedAt = new Date().toISOString();
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: armed ? 'national-voice-runtime.kill_switch.arm' : 'national-voice-runtime.kill_switch.disarm',
      ip,
      metadata: { zoneId, reason: zone.killSwitchReason },
    });
    return { zone, effect: armed ? 'All zone dialect/live speech mutations blocked' : 'Zone live again' };
  }

  async auditExport(session: SessionContext, zoneId: string, ip?: string) {
    const zone = this.getZone(session.organizationId, zoneId);
    const payload = {
      exportId: randomUUID(),
      exportedAt: new Date().toISOString(),
      zone,
      integrity: createHash('sha256').update(JSON.stringify(zone)).digest('hex'),
      note: 'Ministry-facing sovereignty audit package (control-plane state).',
    };
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'national-voice-runtime.audit.export',
      ip,
      metadata: { zoneId, exportId: payload.exportId },
    });
    return payload;
  }
}
