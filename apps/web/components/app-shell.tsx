'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { isClerkConfigured } from '@/lib/clerk-config';
import { WorkspaceSwitcher } from '@/components/workspace-switcher';

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/language', label: 'Language' },
  { href: '/speech', label: 'Speech' },
  { href: '/voice-cloud', label: 'Voice' },
  { href: '/intelligence-cloud', label: 'Intelligence' },
  { href: '/knowledge-cloud', label: 'Knowledge Cloud' },
  { href: '/inference-cloud', label: 'Inference Cloud' },
  { href: '/gpu-platform', label: 'GPU Platform' },
  { href: '/model-serving', label: 'Model Serving' },
  { href: '/ai-router', label: 'AI Router' },
  { href: '/streaming-runtime', label: 'Streaming Runtime' },
  { href: '/batch-runtime', label: 'Batch Runtime' },
  { href: '/intelligent-cache', label: 'Intelligent Cache' },
  { href: '/knowledge-base', label: 'Knowledge Base' },
  { href: '/enterprise-search', label: 'Enterprise Search' },
  { href: '/ontology', label: 'Ontology' },
  { href: '/taxonomy', label: 'Taxonomy' },
  { href: '/enterprise-rag', label: 'Enterprise RAG' },
  { href: '/knowledge-memory', label: 'Knowledge Memory' },
  { href: '/knowledge-intelligence', label: 'Knowledge Intel' },
  { href: '/knowledge-apis', label: 'Knowledge APIs' },
  { href: '/knowledge-analytics', label: 'Knowledge Analytics' },
  { href: '/embedding-cloud', label: 'Embeddings' },
  { href: '/vector-cloud', label: 'Vectors' },
  { href: '/memory-cloud', label: 'Memory' },
  { href: '/knowledge-graph', label: 'Knowledge Graph' },
  { href: '/context-engine', label: 'Context' },
  { href: '/reasoning-cloud', label: 'Reasoning' },
  { href: '/recommendation-engine', label: 'Recommend' },
  { href: '/prompt-intelligence', label: 'Prompt Intel' },
  { href: '/decision-engine', label: 'Decisions' },
  { href: '/ai-orchestration', label: 'Orchestration' },
  { href: '/intelligence-analytics', label: 'Intel Analytics' },
  { href: '/neural-tts', label: 'Neural TTS' },
  { href: '/voice-cloning', label: 'Cloning' },
  { href: '/emotion-voice', label: 'Emotion Voice' },
  { href: '/speech-recognition', label: 'STT Engine' },
  { href: '/voice-biometrics', label: 'Biometrics' },
  { href: '/speaker-intelligence', label: 'Speakers' },
  { href: '/accent-intelligence', label: 'Accent AI' },
  { href: '/emotion-intelligence', label: 'Emotion AI' },
  { href: '/voice-enhancement', label: 'Enhancement' },
  { href: '/audio-intelligence', label: 'Audio AI' },
  { href: '/pronunciation-intelligence', label: 'Pronunciation' },
  { href: '/wake-word', label: 'Wake Word' },
  { href: '/call-intelligence', label: 'Calls' },
  { href: '/speech-analytics', label: 'Speech Analytics' },
  { href: '/language-intelligence', label: 'Lang Intel' },
  { href: '/registry', label: 'Registry' },
  { href: '/dialects', label: 'Dialects' },
  { href: '/accents', label: 'Accents' },
  { href: '/grammar', label: 'Grammar' },
  { href: '/grammar-intelligence', label: 'Grammar AI' },
  { href: '/style', label: 'Style' },
  { href: '/style-intelligence', label: 'Style AI' },
  { href: '/countries', label: 'Countries' },
  { href: '/graphql', label: 'GraphQL' },
  { href: '/developers', label: 'Developers' },
  { href: '/enterprise', label: 'Enterprise' },
  { href: '/gateway', label: 'AI Gateway' },
  { href: '/identity', label: 'Identity' },
  { href: '/chat', label: 'Chat' },
  { href: '/prompts', label: 'Prompts' },
  { href: '/knowledge', label: 'Knowledge' },
  { href: '/datasets', label: 'Datasets' },
  { href: '/finetunes', label: 'Fine-tunes' },
  { href: '/models', label: 'Models' },
  { href: '/coverage', label: 'Coverage' },
  { href: '/interpret', label: 'Interpreter' },
  { href: '/voice', label: 'Voice FAQ' },
  { href: '/translate', label: 'Translate' },
  { href: '/translate/formats', label: 'Formats' },
  { href: '/locales', label: 'Locales' },
  { href: '/glossary', label: 'Glossary' },
  { href: '/voice-marketplace', label: 'Voice market' },
  { href: '/voice-analytics', label: 'Voice Analytics' },
  { href: '/marketplace', label: 'Marketplace' },
  { href: '/tm', label: 'TM' },
  { href: '/reviews', label: 'Reviews' },
  { href: '/localize', label: 'Localize' },
  { href: '/localization', label: 'L10n' },
  { href: '/documents', label: 'Documents' },
  { href: '/ocr', label: 'OCR' },
  { href: '/voice-studio', label: 'Voice Studio' },
  { href: '/audio', label: 'Audio studio' },
  { href: '/playground', label: 'Playground' },
  { href: '/connectors', label: 'Connectors' },
  { href: '/workflows', label: 'Workflows' },
  { href: '/keys', label: 'API keys' },
  { href: '/usage', label: 'Usage' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/billing', label: 'Billing' },
  { href: '/data', label: 'Data' },
  { href: '/audit', label: 'Audit' },
  { href: '/admin', label: 'Admin' },
  { href: '/docs', label: 'Docs' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div style={{ minHeight: '100vh' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          padding: '0.9rem 1.5rem',
          borderBottom: '1px solid var(--line)',
          background: 'rgba(255,255,255,0.86)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.75rem' }}>
          <Link
            href="/dashboard"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 760,
              fontSize: '1.15rem',
              textDecoration: 'none',
              letterSpacing: '-0.02em',
            }}
          >
            VerbaLab
          </Link>
          <nav style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            {links.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    padding: '0.45rem 0.8rem',
                    borderRadius: '999px',
                    color: active ? 'var(--ink)' : 'var(--muted)',
                    background: active ? 'var(--bg-soft)' : 'transparent',
                    fontWeight: active ? 600 : 500,
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <WorkspaceSwitcher />
          {isClerkConfigured() ? <UserButton afterSignOutUrl="/" /> : null}
        </div>
      </header>
      <main className="vl-fade-up" style={{ maxWidth: '56rem', margin: '0 auto', padding: '2.25rem 1.5rem 4rem' }}>
        {children}
      </main>
    </div>
  );
}
