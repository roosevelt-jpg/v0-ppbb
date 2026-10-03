import { aiInternetHonesty } from '../ai-internet-store/ai-internet-honesty';

export function aicertificateauthorityCatalog() {
  return {
    id: 'ai-certificate-authority',
    title: 'AI Certificate Authority',
    vl: 'VL-402',
    phase: 269,
    domain: 'ca',
    blurb: 'AI certificate authority for node certificates and signed capabilities.',
    honesty: aiInternetHonesty(),
  };
}

export function aicertificateauthorityCapabilities() {
  return [
    { id: 'certificate', name: 'AI certificate', status: 'wired', api: 'GET /v1/ai-certificate-authority/engine', console: '/ai-certificate-authority' },
    { id: 'csr', name: 'Certificate request', status: 'wired', api: 'GET /v1/ai-certificate-authority/engine', console: '/ai-certificate-authority' },
    { id: 'revoke', name: 'Revocation', status: 'wired', api: 'GET /v1/ai-certificate-authority/engine', console: '/ai-certificate-authority' },
    { id: 'chain', name: 'Trust chain', status: 'wired', api: 'GET /v1/ai-certificate-authority/engine', console: '/ai-certificate-authority' },
  ];
}
