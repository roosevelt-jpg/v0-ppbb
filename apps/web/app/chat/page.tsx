import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { isClerkConfigured } from '@/lib/clerk-config';
import { AfricanVoiceChat } from './african-voice-chat';

export const metadata: Metadata = {
  title: 'African Voice LLM',
  description:
    'Speak or type with VerbaLab — the African Voice LLM. Multilingual chat with voice replies across African languages.',
  openGraph: {
    title: 'African Voice LLM | VerbaLab',
    description:
      'Text or speak in any language. VerbaLab understands, translates, and answers back with voice.',
  },
};

export default function ChatPage() {
  if (!isClerkConfigured()) redirect('/setup');
  return <AfricanVoiceChat />;
}
