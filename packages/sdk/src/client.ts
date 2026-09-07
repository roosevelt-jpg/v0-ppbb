import { VerbaLabError } from './errors.js';
import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  CreateJobRequest,
  DetectRequest,
  DetectResponse,
  Dialect,
  DialectDetectRequest,
  DialectDetectResponse,
  Accent,
  AccentDetectRequest,
  AccentDetectResponse,
  GrammarCheckRequest,
  GrammarCheckResponse,
  GrammarIntelligenceOverview,
  GrammarSpellResponse,
  GrammarCorrectResponse,
  GrammarSuggestRequest,
  GrammarSuggestResponse,
  GrammarAnalytics,
  StyleProfile,
  StyleRewriteRequest,
  StyleRewriteResponse,
  StyleIntelligenceOverview,
  StyleToneDetectRequest,
  StyleToneDetectResponse,
  StyleToneTransformRequest,
  StyleTransferRequest,
  StyleTransferResponse,
  StyleAnalytics,
  LanguageIntelligenceOverview,
  LanguageAnalyzeRequest,
  LanguageAnalyzeResponse,
  LanguageSentimentResponse,
  LanguageTranslationConfidenceRequest,
  LanguageTranslationConfidenceResponse,
  LanguageSpeechConfidenceRequest,
  LanguageSpeechConfidenceResponse,
  LanguageIntelligenceAnalytics,
  TmIntelligenceOverview,
  TmSearchRequest,
  TmSearchResponse,
  TmAnalytics,
  LanguageAnalyticsOverview,
  AnalyticsPeriodParams,
  AnalyticsOverviewResponse,
  AnalyticsTranslationUsage,
  AnalyticsQuality,
  AnalyticsLatency,
  EnterpriseAnalyticsReport,
  CountryPack,
  EmbeddingsRequest,
  EmbeddingsResponse,
  InterpretRequest,
  InterpretResponse,
  Job,
  Language,
  LanguageFamily,
  WritingSystem,
  LinguisticRule,
  RegistryOverview,
  RegistryValidateRequest,
  RegistryValidateResponse,
  RegistryAnalytics,
  RegistryHealth,
  LocalePack,
  LocaleLayout,
  LocaleFormatRequest,
  LocaleFormatResponse,
  LocalizationPlatformOverview,
  IcuValidateResponse,
  IcuFormatRequest,
  IcuFormatResponse,
  LocalizeCatalogResponse,
  LocalizeQaRequest,
  LocalizeQaResponse,
  LocalizeRequest,
  LocalizeResponse,
  OcrRequest,
  OcrResponse,
  RegionsResponse,
  SpeechRequest,
  SpeechResponse,
  TranscribeRequest,
  TranscribeResponse,
  TranslateRequest,
  TranslateResponse,
  TranslateFormatRequest,
  TranslateFormatResponse,
  TranslateChatRequest,
  TranslateChatResponse,
  TranslateEngineOverview,
  TranslateStreamEvent,
  UploadFile,
  VerbaLabClientOptions,
  Voice,
} from './types.js';

type ErrorBody = {
  error?: { code?: string; message?: string; request_id?: string };
};

function toBlob(file: UploadFile): Blob {
  if (file.data instanceof Blob) {
    return file.contentType && file.data.type !== file.contentType
      ? new Blob([file.data], { type: file.contentType })
      : file.data;
  }
  const bytes = file.data instanceof Uint8Array ? file.data : new Uint8Array(file.data);
  return new Blob([bytes], { type: file.contentType ?? 'application/octet-stream' });
}

export class VerbaLab {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: VerbaLabClientOptions) {
    if (!options.apiKey?.startsWith('vl_live_') && !options.apiKey?.startsWith('vl_test_')) {
      throw new Error('apiKey must be a VerbaLab key starting with vl_live_ or vl_test_');
    }
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? 'https://api.verbalab.ai').replace(/\/$/, '');
    this.fetchImpl = options.fetch ?? fetch;
  }

  async translate(input: TranslateRequest): Promise<TranslateResponse> {
    return this.requestJson<TranslateResponse>('/v1/translate', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async translateEngine(): Promise<TranslateEngineOverview> {
    return this.requestJson<TranslateEngineOverview>('/v1/translate/engine', { method: 'GET' });
  }

  async translateFormat(input: TranslateFormatRequest): Promise<TranslateFormatResponse> {
    return this.requestJson<TranslateFormatResponse>('/v1/translate/formats', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async translateChat(input: TranslateChatRequest): Promise<TranslateChatResponse> {
    return this.requestJson<TranslateChatResponse>('/v1/translate/chat', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async *translateStream(input: TranslateRequest): AsyncGenerator<TranslateStreamEvent> {
    const res = await this.fetchImpl(`${this.baseUrl}/v1/translate/stream`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as ErrorBody;
      throw new VerbaLabError(
        body.error?.message ?? `HTTP ${res.status}`,
        body.error?.code ?? 'http_error',
        res.status,
        body.error?.request_id,
      );
    }
    if (!res.body) {
      throw new VerbaLabError('Empty stream body', 'stream_error', res.status);
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop() ?? '';
      for (const part of parts) {
        const line = part
          .split('\n')
          .map((l) => l.trim())
          .find((l) => l.startsWith('data:'));
        if (!line) continue;
        const json = line.slice(5).trim();
        if (!json) continue;
        yield JSON.parse(json) as TranslateStreamEvent;
      }
    }
  }

  async detect(input: DetectRequest): Promise<DetectResponse> {
    return this.requestJson<DetectResponse>('/v1/detect', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async dialects(language?: string): Promise<Dialect[]> {
    const q = language ? `?language=${encodeURIComponent(language)}` : '';
    const res = await this.requestJson<{ data: Dialect[] }>(`/v1/dialects${q}`, { method: 'GET' });
    return res.data;
  }

  async dialect(code: string): Promise<Dialect> {
    return this.requestJson<Dialect>(`/v1/dialects/${encodeURIComponent(code)}`, { method: 'GET' });
  }

  async detectDialect(input: DialectDetectRequest): Promise<DialectDetectResponse> {
    return this.requestJson<DialectDetectResponse>('/v1/dialects/detect', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async accents(language?: string): Promise<Accent[]> {
    const q = language ? `?language=${encodeURIComponent(language)}` : '';
    const res = await this.requestJson<{ data: Accent[] }>(`/v1/accents${q}`, { method: 'GET' });
    return res.data;
  }

  async accent(code: string): Promise<Accent> {
    return this.requestJson<Accent>(`/v1/accents/${encodeURIComponent(code)}`, { method: 'GET' });
  }

  async detectAccent(input: AccentDetectRequest): Promise<AccentDetectResponse> {
    if (input.file) {
      const form = new FormData();
      form.append('file', toBlob(input.file), input.file.filename);
      if (input.text) form.append('text', input.text);
      if (input.language) form.append('language', input.language);
      return this.requestForm<AccentDetectResponse>('/v1/accents/detect', form);
    }
    return this.requestJson<AccentDetectResponse>('/v1/accents/detect', {
      method: 'POST',
      body: JSON.stringify({ text: input.text, language: input.language }),
    });
  }

  async checkGrammar(input: GrammarCheckRequest): Promise<GrammarCheckResponse> {
    return this.requestJson<GrammarCheckResponse>('/v1/grammar/check', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async grammarIntelligence(): Promise<GrammarIntelligenceOverview> {
    return this.requestJson<GrammarIntelligenceOverview>('/v1/grammar/intelligence', {
      method: 'GET',
    });
  }

  async spellCheck(input: GrammarCheckRequest): Promise<GrammarSpellResponse> {
    return this.requestJson<GrammarSpellResponse>('/v1/grammar/spell', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async correctGrammar(input: GrammarCheckRequest): Promise<GrammarCorrectResponse> {
    return this.requestJson<GrammarCorrectResponse>('/v1/grammar/correct', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async suggestWriting(input: GrammarSuggestRequest): Promise<GrammarSuggestResponse> {
    return this.requestJson<GrammarSuggestResponse>('/v1/grammar/suggest', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async grammarAnalytics(): Promise<GrammarAnalytics> {
    return this.requestJson<GrammarAnalytics>('/v1/grammar/analytics', { method: 'GET' });
  }

  async styleProfiles(): Promise<StyleProfile[]> {
    const res = await this.requestJson<{ data: StyleProfile[] }>('/v1/style/profiles', { method: 'GET' });
    return res.data;
  }

  async rewriteStyle(input: StyleRewriteRequest): Promise<StyleRewriteResponse> {
    return this.requestJson<StyleRewriteResponse>('/v1/style/rewrite', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async styleIntelligence(): Promise<StyleIntelligenceOverview> {
    return this.requestJson<StyleIntelligenceOverview>('/v1/style/intelligence', {
      method: 'GET',
    });
  }

  async detectTone(input: StyleToneDetectRequest): Promise<StyleToneDetectResponse> {
    return this.requestJson<StyleToneDetectResponse>('/v1/style/detect', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async transformTone(input: StyleToneTransformRequest): Promise<StyleRewriteResponse> {
    return this.requestJson<StyleRewriteResponse>('/v1/style/transform', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async transferStyle(input: StyleTransferRequest): Promise<StyleTransferResponse> {
    return this.requestJson<StyleTransferResponse>('/v1/style/transfer', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async styleAnalytics(): Promise<StyleAnalytics> {
    return this.requestJson<StyleAnalytics>('/v1/style/analytics', { method: 'GET' });
  }

  async languageIntelligence(): Promise<LanguageIntelligenceOverview> {
    return this.requestJson<LanguageIntelligenceOverview>('/v1/language-intelligence', {
      method: 'GET',
    });
  }

  async analyzeLanguage(input: LanguageAnalyzeRequest): Promise<LanguageAnalyzeResponse> {
    return this.requestJson<LanguageAnalyzeResponse>('/v1/language-intelligence/analyze', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async languageSentiment(input: { text: string }): Promise<LanguageSentimentResponse> {
    return this.requestJson<LanguageSentimentResponse>('/v1/language-intelligence/sentiment', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async languageIntent(input: { text: string }): Promise<LanguageSentimentResponse> {
    return this.requestJson<LanguageSentimentResponse>('/v1/language-intelligence/intent', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async translationConfidence(
    input: LanguageTranslationConfidenceRequest,
  ): Promise<LanguageTranslationConfidenceResponse> {
    return this.requestJson<LanguageTranslationConfidenceResponse>(
      '/v1/language-intelligence/translation-confidence',
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
    );
  }

  async speechConfidence(
    input: LanguageSpeechConfidenceRequest,
  ): Promise<LanguageSpeechConfidenceResponse> {
    return this.requestJson<LanguageSpeechConfidenceResponse>(
      '/v1/language-intelligence/speech-confidence',
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
    );
  }

  async languageIntelligenceAnalytics(): Promise<LanguageIntelligenceAnalytics> {
    return this.requestJson<LanguageIntelligenceAnalytics>('/v1/language-intelligence/analytics', {
      method: 'GET',
    });
  }

  async tmIntelligence(): Promise<TmIntelligenceOverview> {
    return this.requestJson<TmIntelligenceOverview>('/v1/tm', { method: 'GET' });
  }

  async searchTm(input: TmSearchRequest): Promise<TmSearchResponse> {
    return this.requestJson<TmSearchResponse>('/v1/tm/search', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async tmAnalytics(): Promise<TmAnalytics> {
    return this.requestJson<TmAnalytics>('/v1/tm/analytics', { method: 'GET' });
  }

  async languageAnalyticsCatalog(): Promise<LanguageAnalyticsOverview> {
    return this.requestJson<LanguageAnalyticsOverview>('/v1/analytics', { method: 'GET' });
  }

  async analyticsOverview(params?: AnalyticsPeriodParams): Promise<AnalyticsOverviewResponse> {
    const q = new URLSearchParams();
    if (params?.from) q.set('from', params.from);
    if (params?.to) q.set('to', params.to);
    const qs = q.toString();
    return this.requestJson<AnalyticsOverviewResponse>(
      `/v1/analytics/overview${qs ? `?${qs}` : ''}`,
      { method: 'GET' },
    );
  }

  async analyticsTranslation(params?: AnalyticsPeriodParams): Promise<AnalyticsTranslationUsage> {
    const q = new URLSearchParams();
    if (params?.from) q.set('from', params.from);
    if (params?.to) q.set('to', params.to);
    const qs = q.toString();
    return this.requestJson<AnalyticsTranslationUsage>(
      `/v1/analytics/translation${qs ? `?${qs}` : ''}`,
      { method: 'GET' },
    );
  }

  async analyticsQuality(params?: AnalyticsPeriodParams): Promise<AnalyticsQuality> {
    const q = new URLSearchParams();
    if (params?.from) q.set('from', params.from);
    if (params?.to) q.set('to', params.to);
    const qs = q.toString();
    return this.requestJson<AnalyticsQuality>(`/v1/analytics/quality${qs ? `?${qs}` : ''}`, {
      method: 'GET',
    });
  }

  async analyticsLatency(params?: AnalyticsPeriodParams): Promise<AnalyticsLatency> {
    const q = new URLSearchParams();
    if (params?.from) q.set('from', params.from);
    if (params?.to) q.set('to', params.to);
    const qs = q.toString();
    return this.requestJson<AnalyticsLatency>(`/v1/analytics/latency${qs ? `?${qs}` : ''}`, {
      method: 'GET',
    });
  }

  async enterpriseAnalyticsReport(
    params?: AnalyticsPeriodParams,
  ): Promise<EnterpriseAnalyticsReport> {
    const q = new URLSearchParams();
    if (params?.from) q.set('from', params.from);
    if (params?.to) q.set('to', params.to);
    const qs = q.toString();
    return this.requestJson<EnterpriseAnalyticsReport>(
      `/v1/analytics/reports/enterprise${qs ? `?${qs}` : ''}`,
      { method: 'GET' },
    );
  }

  async countryPacks(region?: string): Promise<CountryPack[]> {
    const q = region ? `?region=${encodeURIComponent(region)}` : '';
    const res = await this.requestJson<{ data: CountryPack[] }>(`/v1/country-packs${q}`, {
      method: 'GET',
    });
    return res.data;
  }

  async countryPack(code: string, includeLocales = false): Promise<CountryPack> {
    const q = includeLocales ? '?includeLocales=true' : '';
    return this.requestJson<CountryPack>(`/v1/country-packs/${encodeURIComponent(code)}${q}`, {
      method: 'GET',
    });
  }

  async chat(input: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    return this.requestJson<ChatCompletionResponse>('/v1/chat/completions', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async embeddings(input: EmbeddingsRequest): Promise<EmbeddingsResponse> {
    return this.requestJson<EmbeddingsResponse>('/v1/embeddings', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async languages(): Promise<Language[]> {
    const res = await this.requestJson<{ data: Language[] }>('/v1/languages', { method: 'GET' });
    return res.data;
  }

  async language(code: string): Promise<Language> {
    return this.requestJson<Language>(`/v1/languages/${encodeURIComponent(code)}`, { method: 'GET' });
  }

  async registry(): Promise<RegistryOverview> {
    return this.requestJson<RegistryOverview>('/v1/registry', { method: 'GET' });
  }

  async languageFamilies(): Promise<LanguageFamily[]> {
    const res = await this.requestJson<{ data: LanguageFamily[] }>('/v1/registry/families', {
      method: 'GET',
    });
    return res.data;
  }

  async languageFamily(code: string): Promise<LanguageFamily & { languages?: unknown[] }> {
    return this.requestJson(`/v1/registry/families/${encodeURIComponent(code)}`, { method: 'GET' });
  }

  async writingSystems(kind?: string): Promise<WritingSystem[]> {
    const q = kind ? `?kind=${encodeURIComponent(kind)}` : '';
    const res = await this.requestJson<{ data: WritingSystem[] }>(`/v1/registry/scripts${q}`, {
      method: 'GET',
    });
    return res.data;
  }

  async writingSystem(code: string): Promise<WritingSystem & { languages?: unknown[] }> {
    return this.requestJson(`/v1/registry/scripts/${encodeURIComponent(code)}`, { method: 'GET' });
  }

  async alphabets(): Promise<WritingSystem[]> {
    const res = await this.requestJson<{ data: WritingSystem[] }>('/v1/registry/alphabets', {
      method: 'GET',
    });
    return res.data;
  }

  async linguisticRules(filters?: { kind?: string; language?: string }): Promise<LinguisticRule[]> {
    const params = new URLSearchParams();
    if (filters?.kind) params.set('kind', filters.kind);
    if (filters?.language) params.set('language', filters.language);
    const q = params.toString() ? `?${params}` : '';
    const res = await this.requestJson<{ data: LinguisticRule[] }>(`/v1/registry/rules${q}`, {
      method: 'GET',
    });
    return res.data;
  }

  async linguisticRule(code: string): Promise<LinguisticRule> {
    return this.requestJson<LinguisticRule>(`/v1/registry/rules/${encodeURIComponent(code)}`, {
      method: 'GET',
    });
  }

  async validateRegistry(input: RegistryValidateRequest): Promise<RegistryValidateResponse> {
    return this.requestJson<RegistryValidateResponse>('/v1/registry/validate', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async registryAnalytics(): Promise<RegistryAnalytics> {
    return this.requestJson<RegistryAnalytics>('/v1/registry/analytics', { method: 'GET' });
  }

  async registryHealth(): Promise<RegistryHealth> {
    return this.requestJson<RegistryHealth>('/v1/registry/health', { method: 'GET' });
  }

  async regions(): Promise<RegionsResponse> {
    return this.requestJson<RegionsResponse>('/v1/regions', { method: 'GET' });
  }

  async locales(): Promise<LocalePack[]> {
    const res = await this.requestJson<{ data: LocalePack[] }>('/v1/locales', { method: 'GET' });
    return res.data;
  }

  async locale(code: string): Promise<LocalePack> {
    return this.requestJson<LocalePack>(`/v1/locales/${encodeURIComponent(code)}`, { method: 'GET' });
  }

  async localeLayout(code: string): Promise<LocaleLayout> {
    return this.requestJson<LocaleLayout>(`/v1/locales/${encodeURIComponent(code)}/layout`, {
      method: 'GET',
    });
  }

  async localeFormat(input: LocaleFormatRequest): Promise<LocaleFormatResponse> {
    return this.requestJson<LocaleFormatResponse>('/v1/locales/format', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async localizationPlatform(): Promise<LocalizationPlatformOverview> {
    return this.requestJson<LocalizationPlatformOverview>('/v1/localization', { method: 'GET' });
  }

  async validateIcu(message: string): Promise<IcuValidateResponse> {
    return this.requestJson<IcuValidateResponse>('/v1/icu/validate', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  async formatIcu(input: IcuFormatRequest): Promise<IcuFormatResponse> {
    return this.requestJson<IcuFormatResponse>('/v1/icu/format', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async localizeCatalog(content: unknown, format: 'json' | 'yaml' = 'json'): Promise<LocalizeCatalogResponse> {
    return this.requestJson<LocalizeCatalogResponse>('/v1/localize/catalog', {
      method: 'POST',
      body: JSON.stringify({ format, content }),
    });
  }

  async localizeQa(input: LocalizeQaRequest): Promise<LocalizeQaResponse> {
    return this.requestJson<LocalizeQaResponse>('/v1/localize/qa', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async localize(input: LocalizeRequest): Promise<LocalizeResponse> {
    return this.requestJson<LocalizeResponse>('/v1/localize', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async createJob(input: CreateJobRequest): Promise<Job> {
    return this.requestJson<Job>('/v1/jobs', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async listJobs(limit = 50): Promise<Job[]> {
    return this.requestJson<Job[]>(`/v1/jobs?limit=${encodeURIComponent(String(limit))}`, {
      method: 'GET',
    });
  }

  async getJob(id: string): Promise<Job> {
    return this.requestJson<Job>(`/v1/jobs/${encodeURIComponent(id)}`, { method: 'GET' });
  }

  async ocr(input: OcrRequest): Promise<OcrResponse> {
    const form = new FormData();
    form.append('file', toBlob(input.file), input.file.filename);
    if (input.languageHint) form.append('languageHint', input.languageHint);
    if (input.source) form.append('source', input.source);
    if (input.target) form.append('target', input.target);
    return this.requestForm<OcrResponse>('/v1/ocr', form);
  }

  async voices(): Promise<{ data: Voice[] }> {
    return this.requestJson<{ data: Voice[] }>('/v1/audio/voices', { method: 'GET' });
  }

  async speechProducts(): Promise<{
    products: Array<{
      id: string;
      name: string;
      status: string;
      api: string | null;
      console: string | null;
      notes: string;
    }>;
    architecture: Record<string, unknown>;
    docs: string;
  }> {
    return this.requestJson('/v1/speech/products', { method: 'GET' });
  }

  async transcribe(input: TranscribeRequest): Promise<TranscribeResponse> {
    const form = new FormData();
    form.append('file', toBlob(input.file), input.file.filename);
    if (input.language) form.append('language', input.language);
    return this.requestForm<TranscribeResponse>('/v1/audio/transcriptions', form);
  }

  async speech(input: SpeechRequest): Promise<SpeechResponse> {
    const response = await this.fetchImpl(`${this.baseUrl}/v1/audio/speech`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        Accept: '*/*',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as ErrorBody;
      throw new VerbaLabError(
        body.error?.message ?? `Request failed with status ${response.status}`,
        body.error?.code ?? 'http_error',
        response.status,
        body.error?.request_id,
      );
    }

    const audio = new Uint8Array(await response.arrayBuffer());
    return {
      audio,
      mimeType: response.headers.get('content-type') ?? 'audio/mpeg',
      provider: response.headers.get('x-verbalab-provider') ?? undefined,
      voice: response.headers.get('x-verbalab-voice') ?? undefined,
      characters: Number(response.headers.get('x-verbalab-characters') ?? '') || undefined,
      watermarkApplied: response.headers.get('x-verbalab-watermark') === 'required',
    };
  }

  async interpret(input: InterpretRequest): Promise<InterpretResponse> {
    const form = new FormData();
    form.append('file', toBlob(input.file), input.file.filename);
    form.append('target', input.target);
    form.append('voice', input.voice);
    if (input.source) form.append('source', input.source);
    if (input.language) form.append('language', input.language);
    if (input.format) form.append('format', input.format);
    return this.requestForm<InterpretResponse>('/v1/interpret', form);
  }

  private async requestJson<T>(path: string, init: RequestInit): Promise<T> {
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(init.headers ?? {}),
      },
    });
    return this.parseJsonResponse<T>(response);
  }

  private async requestForm<T>(path: string, form: FormData): Promise<T> {
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: 'application/json',
      },
      body: form,
    });
    return this.parseJsonResponse<T>(response);
  }

  private async parseJsonResponse<T>(response: Response): Promise<T> {
    const body = (await response.json().catch(() => ({}))) as T & ErrorBody;

    if (!response.ok) {
      throw new VerbaLabError(
        body.error?.message ?? `Request failed with status ${response.status}`,
        body.error?.code ?? 'http_error',
        response.status,
        body.error?.request_id,
      );
    }

    return body;
  }
}
