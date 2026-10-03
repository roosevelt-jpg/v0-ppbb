import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { IdentityModule } from '../identity/identity.module';
import { RateLimitModule } from '../rate-limit/rate-limit.module';
import { LanguageCloudApplicationModule } from '../language-cloud/application/language-cloud-application.module';
import { SpeechCloudApplicationModule } from '../speech-cloud/application/speech-cloud-application.module';
import { VoiceCloudApplicationModule } from '../voice-cloud/application/voice-cloud-application.module';
import { NeuralTtsModule } from '../neural-tts/neural-tts.module';
import { VoiceCloningModule } from '../voice-cloning/voice-cloning.module';
import { EmotionVoiceModule } from '../emotion-voice/emotion-voice.module';
import { VoiceStudioModule } from '../voice-studio/voice-studio.module';
import { VoiceEnhancementModule } from '../voice-enhancement/voice-enhancement.module';
import { SpeechRecognitionModule } from '../speech-recognition/speech-recognition.module';
import { SpeakerIntelligenceModule } from '../speaker-intelligence/speaker-intelligence.module';
import { AccentsModule } from '../accents/accents.module';
import { EmotionIntelligenceModule } from '../emotion-intelligence/emotion-intelligence.module';
import { AudioIntelligenceModule } from '../audio-intelligence/audio-intelligence.module';
import { PronunciationIntelligenceModule } from '../pronunciation-intelligence/pronunciation-intelligence.module';
import { WakeWordModule } from '../wake-word/wake-word.module';
import { CallIntelligenceModule } from '../call-intelligence/call-intelligence.module';
import { SpeechAnalyticsModule } from '../speech-analytics/speech-analytics.module';
import { TranslateModule } from '../translate/translate.module';
import { GrammarModule } from '../grammar/grammar.module';
import { LocalizeModule } from '../localize/localize.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';
import { LanguageCloudGraphqlResolver } from './language-cloud.resolver';
import { SpeechCloudGraphqlResolver } from './speech-cloud.resolver';
import { VoiceCloudGraphqlResolver } from './voice-cloud.resolver';
import { NeuralTtsGraphqlResolver } from './neural-tts.resolver';
import { VoiceCloningGraphqlResolver } from './voice-cloning.resolver';
import { EmotionVoiceGraphqlResolver } from './emotion-voice.resolver';
import { VoiceStudioGraphqlResolver } from './voice-studio.resolver';
import { VoiceEnhancementGraphqlResolver } from './voice-enhancement.resolver';
import { SpeechRecognitionGraphqlResolver } from './speech-recognition.resolver';
import { SpeakerIntelligenceGraphqlResolver } from './speaker-intelligence.resolver';
import { AccentIntelligenceGraphqlResolver } from './accent-intelligence.resolver';
import { EmotionIntelligenceGraphqlResolver } from './emotion-intelligence.resolver';
import { AudioIntelligenceGraphqlResolver } from './audio-intelligence.resolver';
import { PronunciationIntelligenceGraphqlResolver } from './pronunciation-intelligence.resolver';
import { WakeWordGraphqlResolver } from './wake-word.resolver';
import { CallIntelligenceGraphqlResolver } from './call-intelligence.resolver';
import { SpeechAnalyticsGraphqlResolver } from './speech-analytics.resolver';
import { TranslateGraphqlResolver } from './translate.resolver';
import { LocalizationGraphqlResolver } from './localization.resolver';
import { GrammarIntelligenceGraphqlResolver } from './grammar-intelligence.resolver';
import { StyleIntelligenceGraphqlResolver } from './style-intelligence.resolver';
import { LanguageIntelligenceGraphqlResolver } from './language-intelligence.resolver';
import { TmIntelligenceGraphqlResolver } from './tm-intelligence.resolver';
import { LanguageAnalyticsGraphqlResolver } from './language-analytics.resolver';
import { StyleModule } from '../style/style.module';
import { LanguageIntelligenceModule } from '../language-intelligence/language-intelligence.module';
import { TmModule } from '../tm/tm.module';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      sortSchema: true,
      path: '/graphql',
      playground: false,
      introspection: process.env.NODE_ENV !== 'production',
      csrfPrevention: true,
      context: ({ req, res }: { req: unknown; res: unknown }) => ({ req, res }),
    }),
    LanguageCloudApplicationModule,
    SpeechCloudApplicationModule,
    VoiceCloudApplicationModule,
    NeuralTtsModule,
    VoiceCloningModule,
    EmotionVoiceModule,
    VoiceStudioModule,
    VoiceEnhancementModule,
    SpeechRecognitionModule,
    SpeakerIntelligenceModule,
    AccentsModule,
    EmotionIntelligenceModule,
    AudioIntelligenceModule,
    PronunciationIntelligenceModule,
    WakeWordModule,
    CallIntelligenceModule,
    SpeechAnalyticsModule,
    TranslateModule,
    LocalizeModule,
    GrammarModule,
    StyleModule,
    LanguageIntelligenceModule,
    TmModule,
    AnalyticsModule,
    ApiKeysModule,
    IdentityModule,
    RateLimitModule,
  ],
  providers: [
    LanguageCloudGraphqlResolver,
    SpeechCloudGraphqlResolver,
    VoiceCloudGraphqlResolver,
    NeuralTtsGraphqlResolver,
    VoiceCloningGraphqlResolver,
    EmotionVoiceGraphqlResolver,
    VoiceStudioGraphqlResolver,
    VoiceEnhancementGraphqlResolver,
    SpeechRecognitionGraphqlResolver,
    SpeakerIntelligenceGraphqlResolver,
    AccentIntelligenceGraphqlResolver,
    EmotionIntelligenceGraphqlResolver,
    AudioIntelligenceGraphqlResolver,
    PronunciationIntelligenceGraphqlResolver,
    WakeWordGraphqlResolver,
    CallIntelligenceGraphqlResolver,
    SpeechAnalyticsGraphqlResolver,
    TranslateGraphqlResolver,
    LocalizationGraphqlResolver,
    GrammarIntelligenceGraphqlResolver,
    StyleIntelligenceGraphqlResolver,
    LanguageIntelligenceGraphqlResolver,
    TmIntelligenceGraphqlResolver,
    LanguageAnalyticsGraphqlResolver,
    TranslateAuthGuard,
  ],
})
export class GraphqlModule {}
