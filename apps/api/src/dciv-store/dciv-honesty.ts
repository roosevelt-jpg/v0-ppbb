/**
 * Shared Digital Civilization honesty flags (Volume 24 README).
 */
export function dcivHonesty() {
  return {
    demoPublicSectorPlatform: true,
    runsNationalInfrastructure: false,
    productionGovernmentDeployment: false,
    productionCourtPoliceMilitary: false,
    productionEmergencyDispatch: false,
    productionCitizenIdentityAuth: false,
    civilizationInfrastructureOs: false,
    consentRequiredForCulturalArchives: true,
    federationSecurityReviewRequired: true,
    note:
      'Volume 24 README: VerbaLab platform products for public-sector/city/enterprise demos. Not civilization infrastructure already in production; court/police/military/emergency/citizen-ID must not go live without legal/gov/safety review.',
  };
}
