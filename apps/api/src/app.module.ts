import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { IdentityModule } from './identity/identity.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { RegistryModule } from './registry/registry.module';
import { LanguagesModule } from './languages/languages.module';
import { GatewayModule } from './gateway/gateway.module';
import { TranslateModule } from './translate/translate.module';
import { UsageModule } from './usage/usage.module';
import { OpenApiModule } from './openapi/openapi.module';
import { AuditModule } from './audit/audit.module';
import { AuditCoreModule } from './audit/audit-core.module';
import { BillingModule } from './billing/billing.module';
import { JobsModule } from './jobs/jobs.module';
import { DocumentsModule } from './documents/documents.module';
import { AudioModule } from './audio/audio.module';
import { OcrModule } from './ocr/ocr.module';
import { GlossaryModule } from './glossary/glossary.module';
import { TmModule } from './tm/tm.module';
import { QualityModule } from './quality/quality.module';
import { LocalizeModule } from './localize/localize.module';
import { ChatModule } from './chat/chat.module';
import { InterpretModule } from './interpret/interpret.module';
import { EmbeddingsModule } from './embeddings/embeddings.module';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { ObservabilityModule } from './observability/observability.module';
import { GovernanceModule } from './governance/governance.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AdminModule } from './admin/admin.module';
import { ConnectorsModule } from './connectors/connectors.module';
import { WorkflowsModule } from './workflows/workflows.module';
import { VoiceModule } from './voice/voice.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { PromptsModule } from './prompts/prompts.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { EvalModule } from './eval/eval.module';
import { DatasetsModule } from './datasets/datasets.module';
import { LocalesModule } from './locales/locales.module';
import { VerticalGlossariesModule } from './vertical-glossaries/vertical-glossaries.module';
import { FineTunesModule } from './finetunes/finetunes.module';
import { ModelsModule } from './models/models.module';
import { TrainingModule } from './training/training.module';
import { VoiceClonesModule } from './voice-clones/voice-clones.module';
import { RegionsModule } from './regions/regions.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { CloudFoundationModule } from './cloud-foundation/cloud-foundation.module';
import { DeveloperCloudModule } from './developer-cloud/developer-cloud.module';
import { EnterpriseCloudModule } from './enterprise-cloud/enterprise-cloud.module';
import { GatewayCloudModule } from './gateway-cloud/gateway-cloud.module';
import { LanguageCloudModule } from './language-cloud/language-cloud.module';
import { SpeechCloudModule } from './speech-cloud/speech-cloud.module';
import { VoiceCloudModule } from './voice-cloud/voice-cloud.module';
import { IntelligenceCloudModule } from './intelligence-cloud/intelligence-cloud.module';
import { KnowledgeCloudModule } from './knowledge-cloud/knowledge-cloud.module';
import { InferenceCloudModule } from './inference-cloud/inference-cloud.module';
import { GpuPlatformModule } from './gpu-platform/gpu-platform.module';
import { ModelServingModule } from './model-serving/model-serving.module';
import { AiRouterModule } from './ai-router/ai-router.module';
import { StreamingRuntimeModule } from './streaming-runtime/streaming-runtime.module';
import { BatchRuntimeModule } from './batch-runtime/batch-runtime.module';
import { IntelligentCacheModule } from './intelligent-cache/intelligent-cache.module';
import { CostOptimizationModule } from './cost-optimization/cost-optimization.module';
import { AiRuntimeAnalyticsModule } from './ai-runtime-analytics/ai-runtime-analytics.module';
import { AiKernelModule } from './ai-kernel/ai-kernel.module';
import { FoundationModelCloudModule } from './foundation-model-cloud/foundation-model-cloud.module';
import { ModelTrainingPlatformModule } from './model-training-platform/model-training-platform.module';
import { ModelEvaluationPlatformModule } from './model-evaluation-platform/model-evaluation-platform.module';
import { ModelRegistryModule } from './model-registry/model-registry.module';
import { AtlasModule } from './atlas/atlas.module';
import { AiFabricModule } from './ai-fabric/ai-fabric.module';
import { EventFabricModule } from './event-fabric/event-fabric.module';
import { ContextFabricModule } from './context-fabric/context-fabric.module';
import { KnowledgeFabricModule } from './knowledge-fabric/knowledge-fabric.module';
import { PromptFabricModule } from './prompt-fabric/prompt-fabric.module';
import { ReasoningFabricModule } from './reasoning-fabric/reasoning-fabric.module';
import { MemoryFabricModule } from './memory-fabric/memory-fabric.module';
import { AgentFabricModule } from './agent-fabric/agent-fabric.module';
import { PolicyFabricModule } from './policy-fabric/policy-fabric.module';
import { EcosystemCloudModule } from './ecosystem-cloud/ecosystem-cloud.module';
import { PluginMarketplaceModule } from './plugin-marketplace/plugin-marketplace.module';
import { ModelMarketplaceModule } from './model-marketplace/model-marketplace.module';
import { DatasetMarketplaceModule } from './dataset-marketplace/dataset-marketplace.module';
import { PromptMarketplaceModule } from './prompt-marketplace/prompt-marketplace.module';
import { AgentMarketplaceModule } from './agent-marketplace/agent-marketplace.module';
import { WorkflowMarketplaceModule } from './workflow-marketplace/workflow-marketplace.module';
import { ConnectorMarketplaceModule } from './connector-marketplace/connector-marketplace.module';
import { VoiceLanguageMarketplaceModule } from './voice-language-marketplace/voice-language-marketplace.module';
import { CreatorEconomyModule } from './creator-economy/creator-economy.module';
import { TourismHeritageIntelligenceModule } from './tourism-heritage-intelligence/tourism-heritage-intelligence.module';
import { AgriculturalIntelligenceModule } from './agricultural-intelligence/agricultural-intelligence.module';
import { EducationIntelligenceModule } from './education-intelligence/education-intelligence.module';
import { FinancialIntelligenceModule } from './financial-intelligence/financial-intelligence.module';
import { HealthcareIntelligenceModule } from './healthcare-intelligence/healthcare-intelligence.module';
import { GovernmentIntelligenceModule } from './government-intelligence/government-intelligence.module';
import { AfricanKnowledgeGraphModule } from './african-knowledge-graph/african-knowledge-graph.module';
import { CulturalIntelligenceModule } from './cultural-intelligence/cultural-intelligence.module';
import { AfricanLanguageRegistryModule } from './african-language-registry/african-language-registry.module';
import { AfricanIntelligenceCloudModule } from './african-intelligence-cloud/african-intelligence-cloud.module';
import { MemoryRuntimeModule } from './memory-runtime/memory-runtime.module';
import { PromptRuntimeModule } from './prompt-runtime/prompt-runtime.module';
import { ContextRuntimeModule } from './context-runtime/context-runtime.module';
import { ReasoningRuntimeModule } from './reasoning-runtime/reasoning-runtime.module';
import { AgentRuntimeModule } from './agent-runtime/agent-runtime.module';
import { WorkflowRuntimeModule } from './workflow-runtime/workflow-runtime.module';
import { PluginRuntimeModule } from './plugin-runtime/plugin-runtime.module';
import { PolicyRuntimeModule } from './policy-runtime/policy-runtime.module';
import { KnowledgeBaseModule } from './knowledge-base/knowledge-base.module';
import { EnterpriseSearchModule } from './enterprise-search/enterprise-search.module';
import { OntologyPlatformModule } from './ontology-platform/ontology-platform.module';
import { TaxonomyPlatformModule } from './taxonomy-platform/taxonomy-platform.module';
import { EnterpriseRagModule } from './enterprise-rag/enterprise-rag.module';
import { KnowledgeMemoryModule } from './knowledge-memory/knowledge-memory.module';
import { KnowledgeIntelligenceModule } from './knowledge-intelligence/knowledge-intelligence.module';
import { KnowledgeApisModule } from './knowledge-apis/knowledge-apis.module';
import { KnowledgeAnalyticsModule } from './knowledge-analytics/knowledge-analytics.module';
import { EmbeddingCloudModule } from './embedding-cloud/embedding-cloud.module';
import { VectorCloudModule } from './vector-cloud/vector-cloud.module';
import { MemoryCloudModule } from './memory-cloud/memory-cloud.module';
import { KnowledgeGraphModule } from './knowledge-graph/knowledge-graph.module';
import { ContextEngineModule } from './context-engine/context-engine.module';
import { ReasoningCloudModule } from './reasoning-cloud/reasoning-cloud.module';
import { RecommendationEngineModule } from './recommendation-engine/recommendation-engine.module';
import { PromptIntelligenceModule } from './prompt-intelligence/prompt-intelligence.module';
import { DecisionEngineModule } from './decision-engine/decision-engine.module';
import { AiOrchestrationModule } from './ai-orchestration/ai-orchestration.module';
import { IntelligenceAnalyticsModule } from './intelligence-analytics/intelligence-analytics.module';
import { NeuralTtsModule } from './neural-tts/neural-tts.module';
import { VoiceCloningModule } from './voice-cloning/voice-cloning.module';
import { EmotionVoiceModule } from './emotion-voice/emotion-voice.module';
import { VoiceStudioModule } from './voice-studio/voice-studio.module';
import { VoiceEnhancementModule } from './voice-enhancement/voice-enhancement.module';
import { VoiceBiometricsModule } from './voice-biometrics/voice-biometrics.module';
import { VoiceMarketplaceModule } from './voice-marketplace/voice-marketplace.module';
import { VoiceAnalyticsModule } from './voice-analytics/voice-analytics.module';
import { SpeechRecognitionModule } from './speech-recognition/speech-recognition.module';
import { SpeakerIntelligenceModule } from './speaker-intelligence/speaker-intelligence.module';
import { EmotionIntelligenceModule } from './emotion-intelligence/emotion-intelligence.module';
import { AudioIntelligenceModule } from './audio-intelligence/audio-intelligence.module';
import { PronunciationIntelligenceModule } from './pronunciation-intelligence/pronunciation-intelligence.module';
import { WakeWordModule } from './wake-word/wake-word.module';
import { CallIntelligenceModule } from './call-intelligence/call-intelligence.module';
import { SpeechAnalyticsModule } from './speech-analytics/speech-analytics.module';
import { DialectsModule } from './dialects/dialects.module';
import { AccentsModule } from './accents/accents.module';
import { GrammarModule } from './grammar/grammar.module';
import { StyleModule } from './style/style.module';
import { LanguageIntelligenceModule } from './language-intelligence/language-intelligence.module';
import { CountryPacksModule } from './country-packs/country-packs.module';
import { GraphqlModule } from './graphql/graphql.module';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';

@Module({
  imports: [
    PrismaModule,
    HealthModule,
    ObservabilityModule,
    AuditCoreModule,
    NotificationsModule,
    IdentityModule,
    WorkspacesModule,
    CloudFoundationModule,
    DeveloperCloudModule,
    EnterpriseCloudModule,
    GatewayCloudModule,
    LanguageCloudModule,
    SpeechCloudModule,
    VoiceCloudModule,
    IntelligenceCloudModule,
    KnowledgeCloudModule,
    InferenceCloudModule,
    GpuPlatformModule,
    ModelServingModule,
    AiRouterModule,
    StreamingRuntimeModule,
    BatchRuntimeModule,
    IntelligentCacheModule,
    CostOptimizationModule,
    AiRuntimeAnalyticsModule,
    AiKernelModule,
    FoundationModelCloudModule,
    ModelTrainingPlatformModule,
    ModelEvaluationPlatformModule,
    ModelRegistryModule,
    AtlasModule,
    AiFabricModule,
    EventFabricModule,
    ContextFabricModule,
    KnowledgeFabricModule,
    PromptFabricModule,
    ReasoningFabricModule,
    MemoryFabricModule,
    AgentFabricModule,
    PolicyFabricModule,
    EcosystemCloudModule,
    PluginMarketplaceModule,
    ModelMarketplaceModule,
    DatasetMarketplaceModule,
    PromptMarketplaceModule,
    AgentMarketplaceModule,
    WorkflowMarketplaceModule,
    ConnectorMarketplaceModule,
    VoiceLanguageMarketplaceModule,
    CreatorEconomyModule,
    TourismHeritageIntelligenceModule,
    AgriculturalIntelligenceModule,
    EducationIntelligenceModule,
    FinancialIntelligenceModule,
    HealthcareIntelligenceModule,
    GovernmentIntelligenceModule,
    AfricanKnowledgeGraphModule,
    CulturalIntelligenceModule,
    AfricanLanguageRegistryModule,
    AfricanIntelligenceCloudModule,
    MemoryRuntimeModule,
    PromptRuntimeModule,
    ContextRuntimeModule,
    ReasoningRuntimeModule,
    AgentRuntimeModule,
    WorkflowRuntimeModule,
    PluginRuntimeModule,
    PolicyRuntimeModule,
    KnowledgeBaseModule,
    EnterpriseSearchModule,
    OntologyPlatformModule,
    TaxonomyPlatformModule,
    EnterpriseRagModule,
    KnowledgeMemoryModule,
    KnowledgeIntelligenceModule,
    KnowledgeApisModule,
    KnowledgeAnalyticsModule,
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
    EmotionIntelligenceModule,
    AudioIntelligenceModule,
    PronunciationIntelligenceModule,
    WakeWordModule,
    CallIntelligenceModule,
    SpeechAnalyticsModule,
    ApiKeysModule,
    RegistryModule,
    LanguagesModule,
    DialectsModule,
    AccentsModule,
    GrammarModule,
    StyleModule,
    LanguageIntelligenceModule,
    CountryPacksModule,
    GraphqlModule,
    LocalesModule,
    GatewayModule,
    TranslateModule,
    UsageModule,
    OpenApiModule,
    AuditModule,
    BillingModule,
    JobsModule,
    DocumentsModule,
    AudioModule,
    OcrModule,
    GlossaryModule,
    TmModule,
    QualityModule,
    LocalizeModule,
    PromptsModule,
    ChatModule,
    InterpretModule,
    EmbeddingsModule,
    KnowledgeModule,
    GovernanceModule,
    AdminModule,
    ConnectorsModule,
    WorkflowsModule,
    VoiceModule,
    AnalyticsModule,
    MarketplaceModule,
    EvalModule,
    DatasetsModule,
    VerticalGlossariesModule,
    FineTunesModule,
    ModelsModule,
    TrainingModule,
    VoiceClonesModule,
    RegionsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
