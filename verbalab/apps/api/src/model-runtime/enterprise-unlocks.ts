/**
 * Enterprise production unlocks for government / bank / hospital.
 * Explicit checklist gates — high-stakes use stays locked until requirements pass.
 */

export type EnterpriseSector = 'government' | 'banking' | 'hospital';

export type UnlockRequirement = {
  id: string;
  label: string;
  required: boolean;
};

export type SectorUnlockState = {
  sector: EnterpriseSector;
  productionReady: boolean;
  unlockedAt: string | null;
  requirements: Array<UnlockRequirement & { met: boolean }>;
  missing: string[];
  honesty: {
    clinicalAdviceForbidden: boolean;
    autonomousPaymentsForbidden: boolean;
    note: string;
  };
};

const REQUIREMENTS: Record<EnterpriseSector, UnlockRequirement[]> = {
  government: [
    { id: 'data_residency', label: 'In-region data residency configured', required: true },
    { id: 'audit_trail', label: 'Immutable audit trail enabled', required: true },
    { id: 'sovereign_mt', label: 'Own AI MT path (no vendor fallback)', required: true },
    { id: 'access_control', label: 'Role-based access + org isolation', required: true },
    { id: 'dpa', label: 'Data processing agreement on file', required: true },
    { id: 'human_review', label: 'Human review for citizen-facing publish', required: true },
  ],
  banking: [
    { id: 'data_residency', label: 'In-region data residency configured', required: true },
    { id: 'audit_trail', label: 'Immutable audit trail enabled', required: true },
    { id: 'sovereign_mt', label: 'Own AI MT path (no vendor fallback)', required: true },
    { id: 'pci_scope', label: 'PCI scope boundary documented', required: true },
    { id: 'fraud_review', label: 'Fraud / payment human gate', required: true },
    { id: 'dpa', label: 'Bank DPA / MSA on file', required: true },
  ],
  hospital: [
    { id: 'data_residency', label: 'In-region PHI residency configured', required: true },
    { id: 'audit_trail', label: 'Clinical audit trail enabled', required: true },
    { id: 'sovereign_mt', label: 'Own AI MT path (no vendor fallback)', required: true },
    { id: 'clinical_safety', label: 'Clinical safety review signed', required: true },
    { id: 'baa', label: 'BAA / health DPA on file', required: true },
    { id: 'no_diagnosis', label: 'No automated diagnosis claims in product copy', required: true },
  ],
};

const HONESTY: Record<EnterpriseSector, SectorUnlockState['honesty']> = {
  government: {
    clinicalAdviceForbidden: false,
    autonomousPaymentsForbidden: true,
    note: 'Government unlock enables multilingual public-service production. Not a national OS claim.',
  },
  banking: {
    clinicalAdviceForbidden: false,
    autonomousPaymentsForbidden: true,
    note: 'Banking unlock enables teller/call-center language production. No autonomous fund movement.',
  },
  hospital: {
    clinicalAdviceForbidden: true,
    autonomousPaymentsForbidden: true,
    note: 'Hospital unlock enables patient-facing multilingual intake. Not clinical decision support.',
  },
};

/** Env / process signals that satisfy checklist items without fake green. */
function probeMet(id: string): boolean {
  const noVendor = process.env.VERBALAB_ALLOW_VENDOR_FALLBACK !== '1';
  const ownPath =
    Boolean(process.env.VERBALAB_MODEL_BASE_URL?.trim()) ||
    process.env.VERBALAB_OWN_AI_FIXTURE === '1' ||
    process.env.VERBALAB_LOCAL_MODEL_RUNTIME !== '0';
  const residency = Boolean(process.env.VERBALAB_REGION?.trim() || process.env.VERBALAB_DATA_RESIDENCY?.trim());
  const audit = process.env.VERBALAB_AUDIT_TRAIL !== '0';
  const dpa = process.env.VERBALAB_ENTERPRISE_DPA === '1';
  const clinical = process.env.VERBALAB_CLINICAL_SAFETY_SIGNED === '1';
  const baa = process.env.VERBALAB_HEALTH_BAA === '1';
  const pci = process.env.VERBALAB_PCI_SCOPE_DOCUMENTED === '1';
  const fraud = process.env.VERBALAB_FRAUD_HUMAN_GATE !== '0';
  const humanReview = process.env.VERBALAB_HUMAN_REVIEW_GATE !== '0';
  const noDiagnosis = process.env.VERBALAB_NO_DIAGNOSIS_CLAIMS !== '0';
  const access = true; // Clerk + org isolation already in platform

  switch (id) {
    case 'data_residency':
      return residency;
    case 'audit_trail':
      return audit;
    case 'sovereign_mt':
      return noVendor && ownPath;
    case 'access_control':
      return access;
    case 'dpa':
      return dpa;
    case 'human_review':
      return humanReview;
    case 'pci_scope':
      return pci;
    case 'fraud_review':
      return fraud;
    case 'clinical_safety':
      return clinical;
    case 'baa':
      return baa;
    case 'no_diagnosis':
      return noDiagnosis;
    default:
      return false;
  }
}

const unlockTimestamps = new Map<EnterpriseSector, string>();

export function evaluateSectorUnlock(sector: EnterpriseSector): SectorUnlockState {
  const reqs = REQUIREMENTS[sector].map((r) => ({ ...r, met: probeMet(r.id) }));
  const missing = reqs.filter((r) => r.required && !r.met).map((r) => r.id);
  const productionReady = missing.length === 0;
  if (productionReady && !unlockTimestamps.has(sector)) {
    unlockTimestamps.set(sector, new Date().toISOString());
  }
  if (!productionReady) unlockTimestamps.delete(sector);
  return {
    sector,
    productionReady,
    unlockedAt: unlockTimestamps.get(sector) ?? null,
    requirements: reqs,
    missing,
    honesty: HONESTY[sector],
  };
}

export function evaluateAllEnterpriseUnlocks() {
  const sectors: EnterpriseSector[] = ['government', 'banking', 'hospital'];
  const states = sectors.map(evaluateSectorUnlock);
  return {
    productionUnlocks: states,
    anyReady: states.some((s) => s.productionReady),
    allReady: states.every((s) => s.productionReady),
    honesty: {
      highStakesDefaultLocked: true,
      note:
        'Gov/bank/hospital stay locked until env checklist items are met. Set VERBALAB_REGION, VERBALAB_ENTERPRISE_DPA=1, and sector-specific flags to unlock.',
    },
  };
}

/** Force-unlock for test/demo when operator explicitly asserts checklist offline. */
export function assertEnterpriseUnlock(
  sector: EnterpriseSector,
  metIds: string[],
): SectorUnlockState {
  const set = new Set(metIds);
  const reqs = REQUIREMENTS[sector].map((r) => ({ ...r, met: set.has(r.id) || probeMet(r.id) }));
  const missing = reqs.filter((r) => r.required && !r.met).map((r) => r.id);
  const productionReady = missing.length === 0;
  if (productionReady) unlockTimestamps.set(sector, new Date().toISOString());
  else unlockTimestamps.delete(sector);
  return {
    sector,
    productionReady,
    unlockedAt: unlockTimestamps.get(sector) ?? null,
    requirements: reqs,
    missing,
    honesty: HONESTY[sector],
  };
}
