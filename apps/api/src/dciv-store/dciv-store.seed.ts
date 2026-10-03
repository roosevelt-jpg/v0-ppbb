export type DcivSeed = {
  domain: string;
  kind: string;
  title: string;
  status: string;
  summary: string;
  ownerLabel: string;
  content: Record<string, unknown>;
};

export function dcivDefaultSeeds(): DcivSeed[] {
  return [
    { domain: 'foundation', kind: 'framework_map', title: 'Digital Civilization product map', status: 'active', summary: 'Maps public-sector, city, enterprise, preservation, grid, knowledge, federation hubs.', ownerLabel: 'Civilization Office (role)', content: { civilizationInfrastructureOs: false } },
    { domain: 'national', kind: 'gov_translation', title: 'Desk — Government translation (demo)', status: 'demo', summary: 'Demo public-sector translation desk. Not production government deployment.', ownerLabel: 'Public Sector (role)', content: { productionGovernmentDeployment: false } },
    { domain: 'national', kind: 'courts', title: 'Desk — Courts translation (demo)', status: 'demo', summary: 'Demo only. productionCourtPoliceMilitary=false — not for live proceedings.', ownerLabel: 'Public Sector (role)', content: { productionCourtPoliceMilitary: false, authoritativeOutput: false } },
    { domain: 'national', kind: 'digital_identity', title: 'Portal — Citizen digital identity (demo)', status: 'demo', summary: 'Demo portal shell. productionCitizenIdentityAuth=false.', ownerLabel: 'Public Sector (role)', content: { productionCitizenIdentityAuth: false } },
    { domain: 'city', kind: 'emergency_services', title: 'Integration — Emergency services (demo)', status: 'demo', summary: 'Demo integration catalog. productionEmergencyDispatch=false.', ownerLabel: 'Smart City (role)', content: { productionEmergencyDispatch: false } },
    { domain: 'city', kind: 'transport', title: 'Integration — City transport multilingual IVR', status: 'active', summary: 'City transport announcement/translation integration template.', ownerLabel: 'Smart City (role)', content: { channels: ['ivr', 'signage'] } },
    { domain: 'enterprise', kind: 'bank', title: 'Vertical — Bank KYC voice consent (template)', status: 'active', summary: 'Enterprise vertical template for regulated voice consent.', ownerLabel: 'Enterprise Solutions', content: { regulated: true } },
    { domain: 'enterprise', kind: 'hospital', title: 'Vertical — Hospital multilingual intake (template)', status: 'active', summary: 'Hospital vertical template — clinical use needs separate safety review.', ownerLabel: 'Enterprise Solutions', content: { clinicalProduction: false } },
    { domain: 'preservation', kind: 'endangered_language', title: 'Archive — Endangered language corpus (sample)', status: 'active', summary: 'Language preservation archive record with consent gates.', ownerLabel: 'Heritage (role)', content: { consentRequiredForCulturalArchives: true } },
    { domain: 'preservation', kind: 'digital_museum', title: 'Museum — Voice heritage exhibit (sample)', status: 'active', summary: 'Digital museum exhibit metadata for voice heritage.', ownerLabel: 'Heritage (role)', content: { provenanceRequired: true } },
    { domain: 'grid', kind: 'speech_channel', title: 'Grid channel — Speech translation', status: 'active', summary: 'Translation grid speech channel routing template.', ownerLabel: 'Grid Ops', content: { modality: 'speech' } },
    { domain: 'grid', kind: 'broadcast_channel', title: 'Grid channel — Broadcast captions', status: 'active', summary: 'Broadcast/streaming caption translation channel.', ownerLabel: 'Grid Ops', content: { modality: 'broadcast' } },
    { domain: 'knowledge', kind: 'university_node', title: 'Node — African language research university', status: 'active', summary: 'Knowledge network university node listing.', ownerLabel: 'Knowledge Net', content: { region: 'Africa' } },
    { domain: 'knowledge', kind: 'library_node', title: 'Node — National library partnership (sample)', status: 'prospect', summary: 'Library knowledge-sharing node.', ownerLabel: 'Knowledge Net', content: { focus: ['archives'] } },
    { domain: 'federation', kind: 'national_ai_node', title: 'Federation node — National AI registry (sample)', status: 'active', summary: 'Federated collaboration registry entry. Security review required before cross-border data.', ownerLabel: 'Federation (role)', content: { federationSecurityReviewRequired: true } },
    { domain: 'federation', kind: 'federated_learning', title: 'Job — Federated STT accent adaptation (demo)', status: 'planned', summary: 'Federated learning job template — no cross-border data movement without review.', ownerLabel: 'Federation (role)', content: { dataLeavesRegion: false } },
    { domain: 'intelligence', kind: 'country_metric', title: 'Metric — Countries with demo deployments', status: 'active', summary: 'Civilization intelligence dashboard metric.', ownerLabel: 'Civ Analytics', content: { value: 2 } },
    { domain: 'intelligence', kind: 'language_metric', title: 'Metric — Languages in preservation archive', status: 'active', summary: 'Language preservation coverage metric.', ownerLabel: 'Civ Analytics', content: { value: 5 } },
  ];
}
