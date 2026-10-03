import { Field, Float, Int, InputType, ObjectType } from '@nestjs/graphql';

@InputType()
export class DetectDialectInput {
  @Field()
  text!: string;

  @Field(() => String, { nullable: true })
  language?: string;
}

@InputType()
export class CheckGrammarInput {
  @Field()
  text!: string;

  @Field(() => String, { nullable: true })
  language?: string;
}

@InputType()
export class SuggestWritingInput {
  @Field()
  text!: string;

  @Field(() => String, { nullable: true })
  language?: string;

  @Field(() => String, { nullable: true })
  styleProfile?: string;
}

@ObjectType()
export class GqlGrammarIntelligence {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Int)
  capabilityCount!: number;

  @Field(() => Int)
  shippedCount!: number;
}

@ObjectType()
export class GqlGrammarSuggestResult {
  @Field()
  language!: string;

  @Field()
  original!: string;

  @Field()
  grammarCorrected!: string;

  @Field()
  styleRewritten!: string;

  @Field()
  styleProfile!: string;

  @Field(() => Int)
  suggestionCount!: number;

  @Field()
  changed!: boolean;

  @Field()
  note!: string;
}

@ObjectType()
export class GqlStyleIntelligence {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Int)
  capabilityCount!: number;

  @Field(() => Int)
  shippedCount!: number;
}

@InputType()
export class DetectToneInput {
  @Field()
  text!: string;
}

@InputType()
export class TransformToneInput {
  @Field()
  text!: string;

  @Field()
  targetTone!: string;

  @Field(() => String, { nullable: true })
  language?: string;
}

@InputType()
export class TransferStyleInput {
  @Field()
  text!: string;

  @Field()
  targetProfile!: string;

  @Field(() => String, { nullable: true })
  language?: string;
}

@ObjectType()
export class GqlToneDetectResult {
  @Field()
  detectedTone!: string;

  @Field(() => Float)
  confidence!: number;

  @Field()
  suggestedProfile!: string;

  @Field()
  note!: string;
}

@ObjectType()
export class GqlStyleTransferResult {
  @Field()
  sourceTone!: string;

  @Field(() => Float)
  sourceConfidence!: number;

  @Field()
  targetProfile!: string;

  @Field()
  rewritten!: string;

  @Field()
  changed!: boolean;

  @Field(() => Int)
  changeCount!: number;

  @Field()
  note!: string;
}

@InputType()
export class RewriteStyleInput {
  @Field()
  text!: string;

  @Field()
  profile!: string;

  @Field(() => String, { nullable: true })
  language?: string;
}

@ObjectType()
export class GqlLanguage {
  @Field()
  code!: string;

  @Field()
  nameEn!: string;

  @Field(() => String, { nullable: true })
  nameNative!: string | null;

  @Field(() => String, { nullable: true })
  script!: string | null;

  @Field(() => String, { nullable: true })
  familyCode!: string | null;

  @Field()
  rtl!: boolean;

  @Field()
  tier!: string;
}

@ObjectType()
export class GqlDialect {
  @Field()
  code!: string;

  @Field()
  languageCode!: string;

  @Field()
  nameEn!: string;

  @Field(() => String, { nullable: true })
  region!: string | null;

  @Field(() => [String])
  cueTerms!: string[];
}

@ObjectType()
export class GqlAccent {
  @Field()
  code!: string;

  @Field()
  languageCode!: string;

  @Field()
  nameEn!: string;

  @Field(() => String, { nullable: true })
  region!: string | null;

  @Field(() => String, { nullable: true })
  relatedDialectCode!: string | null;
}

@ObjectType()
export class GqlLocalePack {
  @Field()
  languageCode!: string;

  @Field(() => String, { nullable: true })
  bcp47!: string | null;

  @Field(() => String, { nullable: true })
  currencyCode!: string | null;

  @Field(() => String, { nullable: true })
  culturalNotes!: string | null;
}

@ObjectType()
export class GqlCountryPack {
  @Field()
  code!: string;

  @Field()
  nameEn!: string;

  @Field(() => String, { nullable: true })
  region!: string | null;

  @Field(() => String, { nullable: true })
  currencyCode!: string | null;

  @Field(() => [String])
  primaryLanguages!: string[];

  @Field(() => [String])
  bcp47Tags!: string[];
}

@ObjectType()
export class GqlStyleProfile {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  description!: string;
}

@ObjectType()
export class GqlLanguageProduct {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field(() => String, { nullable: true })
  console!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlSpeechProduct {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field(() => String, { nullable: true })
  console!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlVoiceProduct {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field(() => String, { nullable: true })
  console!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlSpeechCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlSpeechEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlSpeechCapability])
  capabilities!: GqlSpeechCapability[];
}

@ObjectType()
export class GqlNeuralTtsCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlNeuralTtsEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlNeuralTtsCapability])
  capabilities!: GqlNeuralTtsCapability[];
}

@ObjectType()
export class GqlNeuralTtsVoice {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  gender!: string;

  @Field(() => [String])
  languages!: string[];

  @Field()
  provider!: string;

  @Field()
  personality!: string;

  @Field()
  ageGroup!: string;

  @Field(() => String, { nullable: true })
  dialect!: string | null;

  @Field(() => String, { nullable: true })
  accent!: string | null;

  @Field()
  category!: string;
}

@ObjectType()
export class GqlVoiceCloningCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlVoiceCloningEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlVoiceCloningCapability])
  capabilities!: GqlVoiceCloningCapability[];

  @Field()
  consentRequired!: boolean;

  @Field()
  watermarkRequired!: boolean;
}

@ObjectType()
export class GqlEmotionVoiceCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlEmotionVoiceEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlEmotionVoiceCapability])
  capabilities!: GqlEmotionVoiceCapability[];

  @Field()
  trainedExpressiveModel!: boolean;
}

@ObjectType()
export class GqlEmotionVoiceProfile {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  category!: string;

  @Field()
  description!: string;

  @Field()
  preferredVoice!: string;
}

@ObjectType()
export class GqlVoiceStudioCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlVoiceStudioEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlVoiceStudioCapability])
  capabilities!: GqlVoiceStudioCapability[];

  @Field()
  nonlinearDaw!: boolean;
}

@ObjectType()
export class GqlSpeechVocabPack {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  description!: string;

  @Field(() => [String])
  phrases!: string[];
}

@ObjectType()
export class GqlSpeakerCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlSpeakerEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlSpeakerCapability])
  capabilities!: GqlSpeakerCapability[];
}

@ObjectType()
export class GqlSpeakerProfile {
  @Field()
  id!: string;

  @Field()
  displayName!: string;

  @Field()
  status!: string;

  @Field()
  enrolled!: boolean;

  @Field()
  enrollmentCount!: number;
}

@ObjectType()
export class GqlAccentCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlAccentEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlAccentCapability])
  capabilities!: GqlAccentCapability[];
}

@InputType()
export class DetectAccentInput {
  @Field()
  text!: string;

  @Field(() => String, { nullable: true })
  language?: string;
}

@ObjectType()
export class GqlAccentDetectResult {
  @Field()
  language!: string;

  @Field(() => String, { nullable: true })
  accent!: string | null;

  @Field(() => String, { nullable: true })
  accentName!: string | null;

  @Field()
  confidence!: number;

  @Field()
  provider!: string;

  @Field()
  note!: string;
}

@ObjectType()
export class GqlEmotionCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlEmotionEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [String])
  labels!: string[];

  @Field(() => [GqlEmotionCapability])
  capabilities!: GqlEmotionCapability[];
}

@InputType()
export class DetectEmotionInput {
  @Field()
  text!: string;
}

@ObjectType()
export class GqlEmotionDetectResult {
  @Field()
  label!: string;

  @Field()
  confidence!: number;

  @Field()
  audioAdjusted!: boolean;

  @Field()
  note!: string;
}

@ObjectType()
export class GqlAudioCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlAudioEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlAudioCapability])
  capabilities!: GqlAudioCapability[];
}

@ObjectType()
export class GqlPronunciationCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlPronunciationEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlPronunciationCapability])
  capabilities!: GqlPronunciationCapability[];
}

@ObjectType()
export class GqlPronunciationScores {
  @Field()
  overall!: number;

  @Field()
  accuracy!: number;

  @Field()
  fluency!: number;

  @Field()
  stress!: number;
}

@InputType()
export class AssessPronunciationInput {
  @Field()
  reference!: string;

  @Field({ nullable: true })
  hypothesis?: string;

  @Field({ nullable: true })
  language?: string;
}

@ObjectType()
export class GqlPronunciationAssessResult {
  @Field()
  language!: string;

  @Field()
  hypothesis!: string;

  @Field(() => GqlPronunciationScores)
  scores!: GqlPronunciationScores;

  @Field()
  note!: string;
}

@ObjectType()
export class GqlWakeCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlWakeWordEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [String])
  defaultWakePhrases!: string[];

  @Field(() => [GqlWakeCapability])
  capabilities!: GqlWakeCapability[];
}

@InputType()
export class DetectWakeWordInput {
  @Field()
  text!: string;
}

@ObjectType()
export class GqlWakeDetectResult {
  @Field()
  wakeDetected!: boolean;

  @Field()
  transcript!: string;

  @Field()
  note!: string;
}

@ObjectType()
export class GqlCallCapability {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  api!: string | null;

  @Field()
  notes!: string;
}

@ObjectType()
export class GqlCallIntelligenceEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => [GqlCallCapability])
  capabilities!: GqlCallCapability[];
}

@InputType()
export class IngestCallInput {
  @Field()
  transcript!: string;

  @Field(() => String, { nullable: true })
  language?: string;

  @Field(() => String, { nullable: true })
  direction?: string;

  @Field(() => String, { nullable: true })
  externalRef?: string;
}

@ObjectType()
export class GqlCallRecord {
  @Field()
  id!: string;

  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  summary?: string | null;

  @Field(() => String, { nullable: true })
  transcript?: string | null;
}

@ObjectType()
export class GqlSpeechAnalyticsEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field()
  capabilityCount!: number;

  @Field()
  shippedCount!: number;
}

@ObjectType()
export class GqlSpeechAnalyticsOverview {
  @Field()
  periodStart!: string;

  @Field()
  periodEnd!: string;

  @Field()
  estimatedCostUsd!: number;

  @Field()
  sttRequests!: number;

  @Field()
  ttsRequests!: number;
}

@InputType()
export class TranslateInput {
  @Field()
  text!: string;

  @Field()
  source!: string;

  @Field()
  target!: string;
}

@InputType()
export class TranslateFormatInput {
  @Field()
  format!: string;

  @Field()
  content!: string;

  @Field()
  source!: string;

  @Field()
  target!: string;
}

@ObjectType()
export class GqlTranslateResult {
  @Field()
  text!: string;

  @Field()
  source!: string;

  @Field()
  target!: string;

  @Field()
  provider!: string;

  @Field(() => Int)
  characters!: number;

  @Field()
  tmHit!: boolean;

  @Field(() => Int)
  glossaryApplied!: number;
}

@ObjectType()
export class GqlTranslateFormatResult {
  @Field()
  format!: string;

  @Field()
  content!: string;

  @Field()
  source!: string;

  @Field()
  target!: string;

  @Field(() => Int)
  segmentCount!: number;

  @Field(() => Int)
  characters!: number;

  @Field()
  provider!: string;

  @Field(() => String, { nullable: true })
  note!: string | null;
}

@ObjectType()
export class GqlTranslateEngine {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Int)
  capabilityCount!: number;

  @Field(() => Int)
  shippedCount!: number;
}

@InputType()
export class LocalizeInput {
  @Field()
  content!: string;

  @Field()
  source!: string;

  @Field()
  target!: string;

  @Field({ nullable: true })
  format?: string;
}

@InputType()
export class ValidateIcuInput {
  @Field()
  message!: string;
}

@InputType()
export class FormatIcuInput {
  @Field()
  message!: string;

  @Field(() => String, { nullable: true })
  valuesJson?: string;

  @Field(() => String, { nullable: true })
  locale?: string;
}

@ObjectType()
export class GqlLocalizeResult {
  @Field()
  format!: string;

  @Field()
  serialized!: string;

  @Field(() => Int)
  strings!: number;

  @Field(() => Int)
  translated!: number;

  @Field(() => Int)
  tmHits!: number;
}

@ObjectType()
export class GqlIcuValidateResult {
  @Field()
  valid!: boolean;

  @Field(() => [String])
  placeholders!: string[];

  @Field()
  hasPlural!: boolean;

  @Field()
  hasSelect!: boolean;

  @Field(() => [String])
  issueMessages!: string[];
}

@ObjectType()
export class GqlIcuFormatResult {
  @Field()
  formatted!: string;

  @Field(() => [String])
  placeholders!: string[];

  @Field()
  locale!: string;
}

@ObjectType()
export class GqlLocalizationPlatform {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Int)
  capabilityCount!: number;

  @Field(() => Int)
  shippedCount!: number;
}

@ObjectType()
export class GqlDialectDetectResult {
  @Field()
  language!: string;

  @Field(() => String, { nullable: true })
  dialect!: string | null;

  @Field(() => String, { nullable: true })
  dialectName!: string | null;

  @Field(() => Float)
  confidence!: number;

  @Field()
  provider!: string;

  @Field()
  note!: string;
}

@ObjectType()
export class GqlGrammarIssue {
  @Field()
  type!: string;

  @Field()
  severity!: string;

  @Field()
  message!: string;

  @Field(() => String, { nullable: true })
  suggestion!: string | null;
}

@ObjectType()
export class GqlGrammarCheckResult {
  @Field()
  language!: string;

  @Field()
  corrected!: string;

  @Field()
  changed!: boolean;

  @Field(() => Int)
  issueCount!: number;

  @Field()
  provider!: string;

  @Field(() => [GqlGrammarIssue])
  issues!: GqlGrammarIssue[];

  @Field()
  note!: string;
}

@ObjectType()
export class GqlStyleRewriteResult {
  @Field()
  profile!: string;

  @Field()
  rewritten!: string;

  @Field()
  changed!: boolean;

  @Field(() => Int)
  changeCount!: number;

  @Field()
  provider!: string;

  @Field()
  note!: string;
}

@InputType()
export class AnalyzeLanguageInput {
  @Field()
  text!: string;

  @Field(() => String, { nullable: true })
  language?: string;

  @Field(() => Boolean, { nullable: true })
  includeDialect?: boolean;

  @Field(() => Boolean, { nullable: true })
  includeAccent?: boolean;
}

@ObjectType()
export class GqlLanguageIntelligence {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Int)
  capabilityCount!: number;

  @Field(() => Int)
  shippedCount!: number;
}

@ObjectType()
export class GqlLanguageAnalyzeResult {
  @Field()
  language!: string;

  @Field(() => Float)
  languageConfidence!: number;

  @Field()
  intentLabel!: string;

  @Field()
  sentimentLabel!: string;

  @Field()
  emotionLabel!: string;

  @Field(() => Float)
  readabilityScore!: number;

  @Field(() => Float)
  complexityScore!: number;

  @Field()
  note!: string;
}

@InputType()
export class SearchTmInput {
  @Field()
  text!: string;

  @Field()
  sourceLang!: string;

  @Field()
  targetLang!: string;

  @Field(() => String, { nullable: true })
  projectKey?: string;

  @Field(() => String, { nullable: true })
  mode?: string;

  @Field(() => Int, { nullable: true })
  limit?: number;
}

@ObjectType()
export class GqlTmIntelligence {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Int)
  capabilityCount!: number;

  @Field(() => Int)
  shippedCount!: number;
}

@ObjectType()
export class GqlTmSearchHit {
  @Field()
  id!: string;

  @Field()
  scope!: string;

  @Field()
  sourceText!: string;

  @Field()
  targetText!: string;

  @Field(() => Float)
  score!: number;

  @Field(() => Int)
  version!: number;
}

@ObjectType()
export class GqlTmSearchResult {
  @Field()
  provider!: string;

  @Field(() => Int)
  resultCount!: number;

  @Field(() => [GqlTmSearchHit])
  results!: GqlTmSearchHit[];

  @Field()
  note!: string;
}

@ObjectType()
export class GqlLanguageAnalytics {
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Int)
  capabilityCount!: number;

  @Field(() => Int)
  shippedCount!: number;
}

@ObjectType()
export class GqlAnalyticsOverviewSummary {
  @Field()
  periodStart!: string;

  @Field()
  periodEnd!: string;

  @Field(() => Float)
  estimatedCostUsd!: number;

  @Field(() => Float)
  jobErrorRate!: number;

  @Field(() => Int)
  languagePairCount!: number;

  @Field(() => Int)
  featureCount!: number;
}

@ObjectType()
export class GqlEnterpriseAnalyticsReport {
  @Field()
  product!: string;

  @Field()
  generatedAt!: string;

  @Field()
  periodStart!: string;

  @Field()
  periodEnd!: string;

  @Field(() => Float)
  estimatedCostUsd!: number;

  @Field(() => Int)
  translationRequests!: number;

  @Field(() => Float, { nullable: true })
  averageQualityScore!: number | null;

  @Field(() => Float, { nullable: true })
  p95LatencyMs!: number | null;

  @Field()
  note!: string;
}
