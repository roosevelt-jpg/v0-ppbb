import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { IdentityModule } from '../identity/identity.module';
import { RateLimitModule } from '../rate-limit/rate-limit.module';
import { LanguageCloudApplicationModule } from '../language-cloud/application/language-cloud-application.module';
import { SpeechCloudApplicationModule } from '../speech-cloud/application/speech-cloud-application.module';
import { TranslateModule } from '../translate/translate.module';
import { GrammarModule } from '../grammar/grammar.module';
import { LocalizeModule } from '../localize/localize.module';
import { TranslateAuthGuard } from '../common/guards/translate-auth.guard';
import { LanguageCloudGraphqlResolver } from './language-cloud.resolver';
import { SpeechCloudGraphqlResolver } from './speech-cloud.resolver';
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
