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
import { NeuralTtsModule } from './neural-tts/neural-tts.module';
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
    NeuralTtsModule,
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
