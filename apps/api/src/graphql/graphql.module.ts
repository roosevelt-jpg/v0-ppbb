import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { IdentityModule } from '../identity/identity.module';
import { RateLimitModule } from '../rate-limit/rate-limit.module';
import { LanguageCloudApplicationModule } from '../language-cloud/application/language-cloud-application.module';
import { SpeechCloudApplicationModule } from '../speech-cloud/application/speech-cloud-application.module';
import { VoiceCloudApplicationModule } from '../voice-cloud/application/voice-cloud-application.module';
import { IntelligenceCloudApplicationModule } from '../intelligence-cloud/application/intelligence-cloud-application.module';
import { KnowledgeCloudApplicationModule } from '../knowledge-cloud/application/knowledge-cloud-application.module';
import { KnowledgeBaseModule } from '../knowledge-base/knowledge-base.module';
import { EnterpriseSearchModule } from '../enterprise-search/enterprise-search.module';
import { OntologyPlatformModule } from '../ontology-platform/ontology-platform.module';
import { TaxonomyPlatformModule } from '../taxonomy-platform/taxonomy-platform.module';
import { EnterpriseRagModule } from '../enterprise-rag/enterprise-rag.module';
import { KnowledgeMemoryModule } from '../knowledge-memory/knowledge-memory.module';
import { KnowledgeIntelligenceModule } from '../knowledge-intelligence/knowledge-intelligence.module';
import { EmbeddingCloudModule } from '../embedding-cloud/embedding-cloud.module';
import { VectorCloudModule } from '../vector-cloud/vector-cloud.module';
import { MemoryCloudModule } from '../memory-cloud/memory-cloud.module';
import { KnowledgeGraphModule } from '../knowledge-graph/knowledge-graph.module';
import { ContextEngineModule } from '../context-engine/context-engine.module';
import { ReasoningCloudModule } from '../reasoning-cloud/reasoning-cloud.module';
import { RecommendationEngineModule } from '../recommendation-engine/recommendation-engine.module';
import { PromptIntelligenceModule } from '../prompt-intelligence/prompt-intelligence.module';
import { DecisionEngineModule } from '../decision-engine/decision-engine.module';
import { AiOrchestrationModule } from '../ai-orchestration/ai-orchestration.module';
import { IntelligenceAnalyticsModule } from '../intelligence-analytics/intelligence-analytics.module';
import { NeuralTtsModule } from '../neural-tts/neural-tts.module';
import { VoiceCloningModule } from '../voice-cloning/voice-cloning.module';
import { EmotionVoiceModule } from '../emotion-voice/emotion-voice.module';
import { VoiceStudioModule } from '../voice-studio/voice-studio.module';
import { VoiceEnhancementModule } from '../voice-enhancement/voice-enhancement.module';
import { VoiceBiometricsModule } from '../voice-biometrics/voice-biometrics.module';
import { VoiceMarketplaceModule } from '../voice-marketplace/voice-marketplace.module';
import { VoiceAnalyticsModule } from '../voice-analytics/voice-analytics.module';
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
import { IntelligenceCloudGraphqlResolver } from './intelligence-cloud.resolver';
import { KnowledgeCloudGraphqlResolver } from './knowledge-cloud.resolver';
import { KnowledgeBaseGraphqlResolver } from './knowledge-base.resolver';
import { EnterpriseSearchGraphqlResolver } from './enterprise-search.resolver';
import { OntologyPlatformGraphqlResolver } from './ontology-platform.resolver';
import { TaxonomyPlatformGraphqlResolver } from './taxonomy-platform.resolver';
import { EnterpriseRagGraphqlResolver } from './enterprise-rag.resolver';
import { KnowledgeMemoryGraphqlResolver } from './knowledge-memory.resolver';
import { KnowledgeIntelligenceGraphqlResolver } from './knowledge-intelligence.resolver';
import { EmbeddingCloudGraphqlResolver } from './embedding-cloud.resolver';
import { VectorCloudGraphqlResolver } from './vector-cloud.resolver';
import { MemoryCloudGraphqlResolver } from './memory-cloud.resolver';
import { KnowledgeGraphGraphqlResolver } from './knowledge-graph.resolver';
import { ContextEngineGraphqlResolver } from './context-engine.resolver';
import { ReasoningCloudGraphqlResolver } from './reasoning-cloud.resolver';
import { RecommendationEngineGraphqlResolver } from './recommendation-engine.resolver';
import { PromptIntelligenceGraphqlResolver } from './prompt-intelligence.resolver';
import { DecisionEngineGraphqlResolver } from './decision-engine.resolver';
import { AiOrchestrationGraphqlResolver } from './ai-orchestration.resolver';
import { IntelligenceAnalyticsGraphqlResolver } from './intelligence-analytics.resolver';
import { NeuralTtsGraphqlResolver } from './neural-tts.resolver';
import { VoiceCloningGraphqlResolver } from './voice-cloning.resolver';
import { EmotionVoiceGraphqlResolver } from './emotion-voice.resolver';
import { VoiceStudioGraphqlResolver } from './voice-studio.resolver';
import { VoiceEnhancementGraphqlResolver } from './voice-enhancement.resolver';
import { VoiceBiometricsGraphqlResolver } from './voice-biometrics.resolver';
import { VoiceMarketplaceGraphqlResolver } from './voice-marketplace.resolver';
import { VoiceAnalyticsGraphqlResolver } from './voice-analytics.resolver';
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
    IntelligenceCloudApplicationModule,
    KnowledgeCloudApplicationModule,
    KnowledgeBaseModule,
    EnterpriseSearchModule,
    OntologyPlatformModule,
    TaxonomyPlatformModule,
    EnterpriseRagModule,
    KnowledgeMemoryModule,
    KnowledgeIntelligenceModule,
    EmbeddingCloudModule,
    VectorCloudModule,
    MemoryCloudModule,
    KnowledgeGraphModule,
    ContextEngineModule,
    ReasoningCloudModule,
    RecommendationEngineModule,
    PromptIntelligenceModule,
    DecisionEngineModule,
    AiOrchestrationModule,
    IntelligenceAnalyticsModule,
    NeuralTtsModule,
    VoiceCloningModule,
    EmotionVoiceModule,
    VoiceStudioModule,
    VoiceEnhancementModule,
    VoiceBiometricsModule,
    VoiceMarketplaceModule,
    VoiceAnalyticsModule,
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
    IntelligenceCloudGraphqlResolver,
    KnowledgeCloudGraphqlResolver,
    KnowledgeBaseGraphqlResolver,
    EnterpriseSearchGraphqlResolver,
    OntologyPlatformGraphqlResolver,
    TaxonomyPlatformGraphqlResolver,
    EnterpriseRagGraphqlResolver,
    KnowledgeMemoryGraphqlResolver,
    KnowledgeIntelligenceGraphqlResolver,
    EmbeddingCloudGraphqlResolver,
    VectorCloudGraphqlResolver,
    MemoryCloudGraphqlResolver,
    KnowledgeGraphGraphqlResolver,
    ContextEngineGraphqlResolver,
    ReasoningCloudGraphqlResolver,
    RecommendationEngineGraphqlResolver,
    PromptIntelligenceGraphqlResolver,
    DecisionEngineGraphqlResolver,
    AiOrchestrationGraphqlResolver,
    IntelligenceAnalyticsGraphqlResolver,
    NeuralTtsGraphqlResolver,
    VoiceCloningGraphqlResolver,
    EmotionVoiceGraphqlResolver,
    VoiceStudioGraphqlResolver,
    VoiceEnhancementGraphqlResolver,
    VoiceBiometricsGraphqlResolver,
    VoiceMarketplaceGraphqlResolver,
    VoiceAnalyticsGraphqlResolver,
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
