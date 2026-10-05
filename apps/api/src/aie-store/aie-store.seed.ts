export type AieSeed = {
  domain: string;
  kind: string;
  title: string;
  status: string;
  summary: string;
  ownerLabel: string;
  content: Record<string, unknown>;
};

export function aieDefaultSeeds(): AieSeed[] {
  return [
    { domain: 'foundation', kind: 'ecosystem_map', title: 'AI Economy ecosystem map (VerbaLab)', status: 'active', summary: 'Internal map of marketplace, licensing, talent, community, and intelligence hubs.', ownerLabel: 'Economy Office (role)', content: { worldsLargestAiEconomy: false } },
    { domain: 'commerce', kind: 'product', title: 'Listing — African Language STT API', status: 'active', summary: 'Catalog row for STT product; checkout via existing Stripe billing.', ownerLabel: 'Commerce (role)', content: { processor: 'stripe', handRolledCardHandling: false } },
    { domain: 'commerce', kind: 'subscription_plan', title: 'Plan — Voice Studio Pro (catalog)', status: 'active', summary: 'Subscription catalog entry; billed through Volume 11 Monetization Cloud / Stripe.', ownerLabel: 'Commerce (role)', content: { usesExistingBillingProcessor: true } },
    { domain: 'licensing', kind: 'voice_license', title: 'License — Voice clone commercial (template)', status: 'draft', summary: 'Entitlement template for commercial voice use with consent gates.', ownerLabel: 'Licensing (role)', content: { requiresConsent: true } },
    { domain: 'licensing', kind: 'dataset_license', title: 'License — Yoruba speech dataset research', status: 'active', summary: 'Research-use dataset entitlement record.', ownerLabel: 'Licensing (role)', content: { use: 'research' } },
    { domain: 'revenue', kind: 'royalty_accrual', title: 'Accrual — Voice artist share (demo)', status: 'pending_review', summary: 'Ledger accrual awaiting finance approval. autonomousPayouts=false.', ownerLabel: 'Finance (role)', content: { amountUsd: 0, autonomousPayouts: false } },
    { domain: 'revenue', kind: 'payout_request', title: 'Payout request — partner royalty (demo)', status: 'draft', summary: 'Workflow record only; Stripe Connect / tax reporting need human + provider.', ownerLabel: 'Finance (role)', content: { revenueShareLedgerOnly: true } },
    { domain: 'talent', kind: 'linguist', title: 'Talent — Swahili linguist (sample)', status: 'active', summary: 'Marketplace profile for language specialist matching.', ownerLabel: 'Talent Ops (role)', content: { languages: ['sw'] } },
    { domain: 'talent', kind: 'voice_artist', title: 'Talent — Yoruba voice artist (sample)', status: 'active', summary: 'Voice artist profile for consented recording work.', ownerLabel: 'Talent Ops (role)', content: { languages: ['yo'] } },
    { domain: 'funding', kind: 'grant', title: 'Grant track — African STT research (sample)', status: 'open', summary: 'Grant tracking record — disbursement outside autonomous code.', ownerLabel: 'Research Office (role)', content: { trackingOnly: true } },
    { domain: 'funding', kind: 'scholarship', title: 'Scholarship — Language tech fellows (sample)', status: 'active', summary: 'Scholarship program tracking.', ownerLabel: 'Research Office (role)', content: { trackingOnly: true } },
    { domain: 'community', kind: 'hackathon', title: 'Event — African Voice Hackathon (sample)', status: 'planned', summary: 'Community hackathon listing.', ownerLabel: 'Community (role)', content: { region: 'Africa' } },
    { domain: 'community', kind: 'language_community', title: 'Community — Amharic builders', status: 'active', summary: 'Language community hub listing.', ownerLabel: 'Community (role)', content: { language: 'am' } },
    { domain: 'investment', kind: 'portfolio_snapshot', title: 'Portfolio snapshot — strategic partners (dashboard)', status: 'active', summary: 'Reporting-only investment dashboard row. fundingPortalOs=false.', ownerLabel: 'Investment Committee (role)', content: { fundingPortalOs: false, securitiesOfferingOs: false, investmentDashboardOnly: true } },
    { domain: 'investment', kind: 'startup_investment', title: 'Record — Language startup partnership (offline deal)', status: 'tracked', summary: 'Tracks an investment made through normal legal/financial channels — not executed in-app.', ownerLabel: 'Investment Committee (role)', content: { executedInApp: false } },
    { domain: 'intelligence', kind: 'marketplace_revenue', title: 'Metric — Marketplace GMV (demo)', status: 'active', summary: 'Executive dashboard metric placeholder.', ownerLabel: 'Economy Analytics', content: { value: 0, currency: 'USD' } },
    { domain: 'intelligence', kind: 'language_preservation', title: 'Metric — Languages with active talent (demo)', status: 'active', summary: 'Language preservation proxy metric.', ownerLabel: 'Economy Analytics', content: { value: 3 } },
    { domain: 'intelligence', kind: 'country_adoption', title: 'Metric — Countries with partners (demo)', status: 'active', summary: 'Country adoption dashboard metric.', ownerLabel: 'Economy Analytics', content: { value: 4 } },
  ];
}
