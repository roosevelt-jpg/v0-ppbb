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
import { InferenceCloudApplicationModule } from '../inference-cloud/application/inference-cloud-application.module';
import { AiKernelApplicationModule } from '../ai-kernel/application/ai-kernel-application.module';
import { FoundationModelCloudApplicationModule } from '../foundation-model-cloud/application/foundation-model-cloud-application.module';
import { ModelTrainingPlatformApplicationModule } from '../model-training-platform/application/model-training-platform-application.module';
import { ModelEvaluationPlatformApplicationModule } from '../model-evaluation-platform/application/model-evaluation-platform-application.module';
import { ModelRegistryApplicationModule } from '../model-registry/application/model-registry-application.module';
import { AtlasApplicationModule } from '../atlas/application/atlas-application.module';
import { AiFabricApplicationModule } from '../ai-fabric/application/ai-fabric-application.module';
import { EventFabricApplicationModule } from '../event-fabric/application/event-fabric-application.module';
import { ContextFabricApplicationModule } from '../context-fabric/application/context-fabric-application.module';
import { KnowledgeFabricApplicationModule } from '../knowledge-fabric/application/knowledge-fabric-application.module';
import { PromptFabricApplicationModule } from '../prompt-fabric/application/prompt-fabric-application.module';
import { ReasoningFabricApplicationModule } from '../reasoning-fabric/application/reasoning-fabric-application.module';
import { MemoryFabricApplicationModule } from '../memory-fabric/application/memory-fabric-application.module';
import { AgentFabricApplicationModule } from '../agent-fabric/application/agent-fabric-application.module';
import { PolicyFabricApplicationModule } from '../policy-fabric/application/policy-fabric-application.module';
import { EcosystemCloudApplicationModule } from '../ecosystem-cloud/application/ecosystem-cloud-application.module';
import { PluginMarketplaceApplicationModule } from '../plugin-marketplace/application/plugin-marketplace-application.module';
import { ModelMarketplaceApplicationModule } from '../model-marketplace/application/model-marketplace-application.module';
import { DatasetMarketplaceApplicationModule } from '../dataset-marketplace/application/dataset-marketplace-application.module';
import { PromptMarketplaceApplicationModule } from '../prompt-marketplace/application/prompt-marketplace-application.module';
import { AgentMarketplaceApplicationModule } from '../agent-marketplace/application/agent-marketplace-application.module';
import { WorkflowMarketplaceApplicationModule } from '../workflow-marketplace/application/workflow-marketplace-application.module';
import { ConnectorMarketplaceApplicationModule } from '../connector-marketplace/application/connector-marketplace-application.module';
import { VoiceLanguageMarketplaceApplicationModule } from '../voice-language-marketplace/application/voice-language-marketplace-application.module';
import { CreatorEconomyApplicationModule } from '../creator-economy/application/creator-economy-application.module';
import { TourismHeritageIntelligenceApplicationModule } from '../tourism-heritage-intelligence/application/tourism-heritage-intelligence-application.module';
import { ResearchAnalyticsApplicationModule } from '../research-analytics/application/research-analytics-application.module';
import { AiOperationsDashboardApplicationModule } from '../ai-operations-dashboard/application/ai-operations-dashboard-application.module';
import { ContinuousLearningApplicationModule } from '../continuous-learning/application/continuous-learning-application.module';
import { AiDriftDetectionApplicationModule } from '../ai-drift-detection/application/ai-drift-detection-application.module';
import { AgentopsPlatformApplicationModule } from '../agentops-platform/application/agentops-platform-application.module';
import { RagopsPlatformApplicationModule } from '../ragops-platform/application/ragops-platform-application.module';
import { PromptopsPlatformApplicationModule } from '../promptops-platform/application/promptops-platform-application.module';
import { ContinuousEvaluationApplicationModule } from '../continuous-evaluation/application/continuous-evaluation-application.module';
import { TrainingPipelineApplicationModule } from '../training-pipeline/application/training-pipeline-application.module';
import { DatasetPipelineApplicationModule } from '../dataset-pipeline/application/dataset-pipeline-application.module';
import { MlopsLlmopsCloudApplicationModule } from '../mlops-llmops-cloud/application/mlops-llmops-cloud-application.module';
import { OpenSciencePlatformApplicationModule } from '../open-science-platform/application/open-science-platform-application.module';
import { PatentInnovationPlatformApplicationModule } from '../patent-innovation-platform/application/patent-innovation-platform-application.module';
import { AiPublicationPlatformApplicationModule } from '../ai-publication-platform/application/ai-publication-platform-application.module';
import { EvaluationPlatformApplicationModule } from '../evaluation-platform/application/evaluation-platform-application.module';
import { BenchmarkPlatformApplicationModule } from '../benchmark-platform/application/benchmark-platform-application.module';
import { SyntheticDataPlatformApplicationModule } from '../synthetic-data-platform/application/synthetic-data-platform-application.module';
import { ExperimentPlatformApplicationModule } from '../experiment-platform/application/experiment-platform-application.module';
import { ResearchCloudApplicationModule } from '../research-cloud/application/research-cloud-application.module';
import { AgriculturalIntelligenceApplicationModule } from '../agricultural-intelligence/application/agricultural-intelligence-application.module';
import { EducationIntelligenceApplicationModule } from '../education-intelligence/application/education-intelligence-application.module';
import { FinancialIntelligenceApplicationModule } from '../financial-intelligence/application/financial-intelligence-application.module';
import { HealthcareIntelligenceApplicationModule } from '../healthcare-intelligence/application/healthcare-intelligence-application.module';
import { GovernmentIntelligenceApplicationModule } from '../government-intelligence/application/government-intelligence-application.module';
import { AfricanKnowledgeGraphApplicationModule } from '../african-knowledge-graph/application/african-knowledge-graph-application.module';
import { CulturalIntelligenceApplicationModule } from '../cultural-intelligence/application/cultural-intelligence-application.module';
import { AfricanLanguageRegistryApplicationModule } from '../african-language-registry/application/african-language-registry-application.module';
import { AfricanIntelligenceCloudApplicationModule } from '../african-intelligence-cloud/application/african-intelligence-cloud-application.module';
import { MemoryRuntimeModule } from '../memory-runtime/memory-runtime.module';
import { PromptRuntimeModule } from '../prompt-runtime/prompt-runtime.module';
import { ContextRuntimeModule } from '../context-runtime/context-runtime.module';
import { ReasoningRuntimeModule } from '../reasoning-runtime/reasoning-runtime.module';
import { AgentRuntimeModule } from '../agent-runtime/agent-runtime.module';
import { WorkflowRuntimeModule } from '../workflow-runtime/workflow-runtime.module';
import { PluginRuntimeModule } from '../plugin-runtime/plugin-runtime.module';
import { PolicyRuntimeModule } from '../policy-runtime/policy-runtime.module';
import { GpuPlatformModule } from '../gpu-platform/gpu-platform.module';
import { ModelServingModule } from '../model-serving/model-serving.module';
import { AiRouterModule } from '../ai-router/ai-router.module';
import { StreamingRuntimeModule } from '../streaming-runtime/streaming-runtime.module';
import { BatchRuntimeModule } from '../batch-runtime/batch-runtime.module';
import { IntelligentCacheModule } from '../intelligent-cache/intelligent-cache.module';
import { CostOptimizationModule } from '../cost-optimization/cost-optimization.module';
import { AiRuntimeAnalyticsModule } from '../ai-runtime-analytics/ai-runtime-analytics.module';
import { KnowledgeBaseModule } from '../knowledge-base/knowledge-base.module';
import { EnterpriseSearchModule } from '../enterprise-search/enterprise-search.module';
import { OntologyPlatformModule } from '../ontology-platform/ontology-platform.module';
import { TaxonomyPlatformModule } from '../taxonomy-platform/taxonomy-platform.module';
import { EnterpriseRagModule } from '../enterprise-rag/enterprise-rag.module';
import { KnowledgeMemoryModule } from '../knowledge-memory/knowledge-memory.module';
import { KnowledgeIntelligenceModule } from '../knowledge-intelligence/knowledge-intelligence.module';
import { KnowledgeApisModule } from '../knowledge-apis/knowledge-apis.module';
import { KnowledgeAnalyticsModule } from '../knowledge-analytics/knowledge-analytics.module';
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
import { InferenceCloudGraphqlResolver } from './inference-cloud.resolver';
import { AiKernelGraphqlResolver } from './ai-kernel.resolver';
import { FoundationModelCloudGraphqlResolver } from './foundation-model-cloud.resolver';
import { ModelTrainingPlatformGraphqlResolver } from './model-training-platform.resolver';
import { ModelEvaluationPlatformGraphqlResolver } from './model-evaluation-platform.resolver';
import { ModelRegistryGraphqlResolver } from './model-registry.resolver';
import { AtlasGraphqlResolver } from './atlas.resolver';
import { AiFabricGraphqlResolver } from './ai-fabric.resolver';
import { EventFabricGraphqlResolver } from './event-fabric.resolver';
import { ContextFabricGraphqlResolver } from './context-fabric.resolver';
import { KnowledgeFabricGraphqlResolver } from './knowledge-fabric.resolver';
import { PromptFabricGraphqlResolver } from './prompt-fabric.resolver';
import { ReasoningFabricGraphqlResolver } from './reasoning-fabric.resolver';
import { MemoryFabricGraphqlResolver } from './memory-fabric.resolver';
import { AgentFabricGraphqlResolver } from './agent-fabric.resolver';
import { PolicyFabricGraphqlResolver } from './policy-fabric.resolver';
import { EcosystemCloudGraphqlResolver } from './ecosystem-cloud.resolver';
import { PluginMarketplaceGraphqlResolver } from './plugin-marketplace.resolver';
import { ModelMarketplaceGraphqlResolver } from './model-marketplace.resolver';
import { DatasetMarketplaceGraphqlResolver } from './dataset-marketplace.resolver';
import { PromptMarketplaceGraphqlResolver } from './prompt-marketplace.resolver';
import { AgentMarketplaceGraphqlResolver } from './agent-marketplace.resolver';
import { WorkflowMarketplaceGraphqlResolver } from './workflow-marketplace.resolver';
import { ConnectorMarketplaceGraphqlResolver } from './connector-marketplace.resolver';
import { VoiceLanguageMarketplaceGraphqlResolver } from './voice-language-marketplace.resolver';
import { CreatorEconomyGraphqlResolver } from './creator-economy.resolver';
import { TourismHeritageIntelligenceGraphqlResolver } from './tourism-heritage-intelligence.resolver';
import { ResearchAnalyticsGraphqlResolver } from './research-analytics.resolver';
import { AiOperationsDashboardGraphqlResolver } from './ai-operations-dashboard.resolver';
import { ContinuousLearningGraphqlResolver } from './continuous-learning.resolver';
import { AiDriftDetectionGraphqlResolver } from './ai-drift-detection.resolver';
import { AgentopsPlatformGraphqlResolver } from './agentops-platform.resolver';
import { RagopsPlatformGraphqlResolver } from './ragops-platform.resolver';
import { PromptopsPlatformGraphqlResolver } from './promptops-platform.resolver';
import { ContinuousEvaluationGraphqlResolver } from './continuous-evaluation.resolver';
import { TrainingPipelineGraphqlResolver } from './training-pipeline.resolver';
import { DatasetPipelineGraphqlResolver } from './dataset-pipeline.resolver';
import { MlopsLlmopsCloudGraphqlResolver } from './mlops-llmops-cloud.resolver';
import { OpenSciencePlatformGraphqlResolver } from './open-science-platform.resolver';
import { PatentInnovationPlatformGraphqlResolver } from './patent-innovation-platform.resolver';
import { AiPublicationPlatformGraphqlResolver } from './ai-publication-platform.resolver';
import { EvaluationPlatformGraphqlResolver } from './evaluation-platform.resolver';
import { BenchmarkPlatformGraphqlResolver } from './benchmark-platform.resolver';
import { SyntheticDataPlatformGraphqlResolver } from './synthetic-data-platform.resolver';
import { ExperimentPlatformGraphqlResolver } from './experiment-platform.resolver';
import { ResearchCloudGraphqlResolver } from './research-cloud.resolver';
import { AgriculturalIntelligenceGraphqlResolver } from './agricultural-intelligence.resolver';
import { EducationIntelligenceGraphqlResolver } from './education-intelligence.resolver';
import { FinancialIntelligenceGraphqlResolver } from './financial-intelligence.resolver';
import { HealthcareIntelligenceGraphqlResolver } from './healthcare-intelligence.resolver';
import { GovernmentIntelligenceGraphqlResolver } from './government-intelligence.resolver';
import { AfricanKnowledgeGraphGraphqlResolver } from './african-knowledge-graph.resolver';
import { CulturalIntelligenceGraphqlResolver } from './cultural-intelligence.resolver';
import { AfricanLanguageRegistryGraphqlResolver } from './african-language-registry.resolver';
import { AfricanIntelligenceCloudGraphqlResolver } from './african-intelligence-cloud.resolver';
import { MemoryRuntimeGraphqlResolver } from './memory-runtime.resolver';
import { PromptRuntimeGraphqlResolver } from './prompt-runtime.resolver';
import { ContextRuntimeGraphqlResolver } from './context-runtime.resolver';
import { ReasoningRuntimeGraphqlResolver } from './reasoning-runtime.resolver';
import { AgentRuntimeGraphqlResolver } from './agent-runtime.resolver';
import { WorkflowRuntimeGraphqlResolver } from './workflow-runtime.resolver';
import { PluginRuntimeGraphqlResolver } from './plugin-runtime.resolver';
import { PolicyRuntimeGraphqlResolver } from './policy-runtime.resolver';
import { GpuPlatformGraphqlResolver } from './gpu-platform.resolver';
import { ModelServingGraphqlResolver } from './model-serving.resolver';
import { AiRouterGraphqlResolver } from './ai-router.resolver';
import { StreamingRuntimeGraphqlResolver } from './streaming-runtime.resolver';
import { BatchRuntimeGraphqlResolver } from './batch-runtime.resolver';
import { IntelligentCacheGraphqlResolver } from './intelligent-cache.resolver';
import { CostOptimizationGraphqlResolver } from './cost-optimization.resolver';
import { AiRuntimeAnalyticsGraphqlResolver } from './ai-runtime-analytics.resolver';
import { KnowledgeBaseGraphqlResolver } from './knowledge-base.resolver';
import { EnterpriseSearchGraphqlResolver } from './enterprise-search.resolver';
import { OntologyPlatformGraphqlResolver } from './ontology-platform.resolver';
import { TaxonomyPlatformGraphqlResolver } from './taxonomy-platform.resolver';
import { EnterpriseRagGraphqlResolver } from './enterprise-rag.resolver';
import { KnowledgeMemoryGraphqlResolver } from './knowledge-memory.resolver';
import { KnowledgeIntelligenceGraphqlResolver } from './knowledge-intelligence.resolver';
import { KnowledgeApisGraphqlResolver } from './knowledge-apis.resolver';
import { KnowledgeAnalyticsGraphqlResolver } from './knowledge-analytics.resolver';
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
    InferenceCloudApplicationModule,
    AiKernelApplicationModule,
    FoundationModelCloudApplicationModule,
    ModelTrainingPlatformApplicationModule,
    ModelEvaluationPlatformApplicationModule,
    ModelRegistryApplicationModule,
    AtlasApplicationModule,
    AiFabricApplicationModule,
    EventFabricApplicationModule,
    ContextFabricApplicationModule,
    KnowledgeFabricApplicationModule,
    PromptFabricApplicationModule,
    ReasoningFabricApplicationModule,
    MemoryFabricApplicationModule,
    AgentFabricApplicationModule,
    PolicyFabricApplicationModule,
    EcosystemCloudApplicationModule,
    PluginMarketplaceApplicationModule,
    ModelMarketplaceApplicationModule,
    DatasetMarketplaceApplicationModule,
    PromptMarketplaceApplicationModule,
    AgentMarketplaceApplicationModule,
    WorkflowMarketplaceApplicationModule,
    ConnectorMarketplaceApplicationModule,
    VoiceLanguageMarketplaceApplicationModule,
    CreatorEconomyApplicationModule,
    TourismHeritageIntelligenceApplicationModule,
    ResearchAnalyticsApplicationModule,
    AiOperationsDashboardApplicationModule,
    ContinuousLearningApplicationModule,
    AiDriftDetectionApplicationModule,
    AgentopsPlatformApplicationModule,
    RagopsPlatformApplicationModule,
    PromptopsPlatformApplicationModule,
    ContinuousEvaluationApplicationModule,
    TrainingPipelineApplicationModule,
    DatasetPipelineApplicationModule,
    MlopsLlmopsCloudApplicationModule,
    OpenSciencePlatformApplicationModule,
    PatentInnovationPlatformApplicationModule,
    AiPublicationPlatformApplicationModule,
    EvaluationPlatformApplicationModule,
    BenchmarkPlatformApplicationModule,
    SyntheticDataPlatformApplicationModule,
    ExperimentPlatformApplicationModule,
    ResearchCloudApplicationModule,
    AgriculturalIntelligenceApplicationModule,
    EducationIntelligenceApplicationModule,
    FinancialIntelligenceApplicationModule,
    HealthcareIntelligenceApplicationModule,
    GovernmentIntelligenceApplicationModule,
    AfricanKnowledgeGraphApplicationModule,
    CulturalIntelligenceApplicationModule,
    AfricanLanguageRegistryApplicationModule,
    AfricanIntelligenceCloudApplicationModule,
    MemoryRuntimeModule,
    PromptRuntimeModule,
    ContextRuntimeModule,
    ReasoningRuntimeModule,
    AgentRuntimeModule,
    WorkflowRuntimeModule,
    PluginRuntimeModule,
    PolicyRuntimeModule,
    GpuPlatformModule,
    ModelServingModule,
    AiRouterModule,
    StreamingRuntimeModule,
    BatchRuntimeModule,
    IntelligentCacheModule,
    CostOptimizationModule,
    AiRuntimeAnalyticsModule,
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
    InferenceCloudGraphqlResolver,
    AiKernelGraphqlResolver,
    FoundationModelCloudGraphqlResolver,
    ModelTrainingPlatformGraphqlResolver,
    ModelEvaluationPlatformGraphqlResolver,
    ModelRegistryGraphqlResolver,
    AtlasGraphqlResolver,
    AiFabricGraphqlResolver,
    EventFabricGraphqlResolver,
    ContextFabricGraphqlResolver,
    KnowledgeFabricGraphqlResolver,
    PromptFabricGraphqlResolver,
    ReasoningFabricGraphqlResolver,
    MemoryFabricGraphqlResolver,
    AgentFabricGraphqlResolver,
    PolicyFabricGraphqlResolver,
    EcosystemCloudGraphqlResolver,
    PluginMarketplaceGraphqlResolver,
    ModelMarketplaceGraphqlResolver,
    DatasetMarketplaceGraphqlResolver,
    PromptMarketplaceGraphqlResolver,
    AgentMarketplaceGraphqlResolver,
    WorkflowMarketplaceGraphqlResolver,
    ConnectorMarketplaceGraphqlResolver,
    VoiceLanguageMarketplaceGraphqlResolver,
    CreatorEconomyGraphqlResolver,
    TourismHeritageIntelligenceGraphqlResolver,
    ResearchAnalyticsGraphqlResolver,
    AiOperationsDashboardGraphqlResolver,
    ContinuousLearningGraphqlResolver,
    AiDriftDetectionGraphqlResolver,
    AgentopsPlatformGraphqlResolver,
    RagopsPlatformGraphqlResolver,
    PromptopsPlatformGraphqlResolver,
    ContinuousEvaluationGraphqlResolver,
    TrainingPipelineGraphqlResolver,
    DatasetPipelineGraphqlResolver,
    MlopsLlmopsCloudGraphqlResolver,
    OpenSciencePlatformGraphqlResolver,
    PatentInnovationPlatformGraphqlResolver,
    AiPublicationPlatformGraphqlResolver,
    EvaluationPlatformGraphqlResolver,
    BenchmarkPlatformGraphqlResolver,
    SyntheticDataPlatformGraphqlResolver,
    ExperimentPlatformGraphqlResolver,
    ResearchCloudGraphqlResolver,
    AgriculturalIntelligenceGraphqlResolver,
    EducationIntelligenceGraphqlResolver,
    FinancialIntelligenceGraphqlResolver,
    HealthcareIntelligenceGraphqlResolver,
    GovernmentIntelligenceGraphqlResolver,
    AfricanKnowledgeGraphGraphqlResolver,
    CulturalIntelligenceGraphqlResolver,
    AfricanLanguageRegistryGraphqlResolver,
    AfricanIntelligenceCloudGraphqlResolver,
    MemoryRuntimeGraphqlResolver,
    PromptRuntimeGraphqlResolver,
    ContextRuntimeGraphqlResolver,
    ReasoningRuntimeGraphqlResolver,
    AgentRuntimeGraphqlResolver,
    WorkflowRuntimeGraphqlResolver,
    PluginRuntimeGraphqlResolver,
    PolicyRuntimeGraphqlResolver,
    GpuPlatformGraphqlResolver,
    ModelServingGraphqlResolver,
    AiRouterGraphqlResolver,
    StreamingRuntimeGraphqlResolver,
    BatchRuntimeGraphqlResolver,
    IntelligentCacheGraphqlResolver,
    CostOptimizationGraphqlResolver,
    AiRuntimeAnalyticsGraphqlResolver,
    KnowledgeBaseGraphqlResolver,
    EnterpriseSearchGraphqlResolver,
    OntologyPlatformGraphqlResolver,
    TaxonomyPlatformGraphqlResolver,
    EnterpriseRagGraphqlResolver,
    KnowledgeMemoryGraphqlResolver,
    KnowledgeIntelligenceGraphqlResolver,
    KnowledgeApisGraphqlResolver,
    KnowledgeAnalyticsGraphqlResolver,
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
