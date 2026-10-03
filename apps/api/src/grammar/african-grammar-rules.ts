import type { GrammarIssue } from './grammar-rules';

export type AfricanGrammarPackId =
  | 'sw'
  | 'yo'
  | 'ha'
  | 'am'
  | 'zu'
  | 'ar'
  | 'af'
  | 'ig'
  | 'wo'
  | 'ak';

type PackRule = {
  pattern: RegExp;
  message: string;
  suggestion?: string;
  type?: GrammarIssue['type'];
  severity?: GrammarIssue['severity'];
};

/**
 * Curated Africa-first grammar/spelling heuristics (VL-142 extension).
 * Not full morphological analyzers — lexical + orthography cues only.
 */
const PACKS: Record<AfricanGrammarPackId, { name: string; misspellings: Record<string, string>; rules: PackRule[] }> = {
  sw: {
    name: 'Swahili',
    misspellings: {
      asantte: 'asante',
      tafadali: 'tafadhali',
      habarii: 'habari',
      karibuni: 'karibuni',
      jamboo: 'jambo',
    },
    rules: [
      {
        pattern: /\bsawa sawa\b/gi,
        message: 'Prefer single "sawa" in formal Swahili, or keep intentional reduplication.',
        suggestion: 'sawa',
        type: 'style',
        severity: 'suggestion',
      },
    ],
  },
  yo: {
    name: 'Yoruba',
    misspellings: {
      ekaaro: 'ẹ káàárọ̀',
      ekaro: 'ẹ káàárọ̀',
      oṣe: 'o ṣe',
    },
    rules: [
      {
        pattern: /\bomo\b/gi,
        message: 'Consider tone-marked "ọmọ" in formal Yoruba orthography.',
        suggestion: 'ọmọ',
        type: 'style',
        severity: 'suggestion',
      },
    ],
  },
  ha: {
    name: 'Hausa',
    misspellings: {
      sanu: 'sannu',
      nagode: 'na gode',
      yayaa: 'yaya',
    },
    rules: [],
  },
  am: {
    name: 'Amharic',
    misspellings: {},
    rules: [
      {
        pattern: /\bselam\b/gi,
        message: 'Latin "selam" — prefer Geʽez "ሰላም" in Amharic UI when script fidelity matters.',
        suggestion: 'ሰላም',
        type: 'style',
        severity: 'suggestion',
      },
    ],
  },
  zu: {
    name: 'Zulu',
    misspellings: {
      sawbona: 'sawubona',
      ngiyabongaa: 'ngiyabonga',
      unjanii: 'unjani',
    },
    rules: [],
  },
  ar: {
    name: 'Arabic',
    misspellings: {},
    rules: [
      {
        pattern: /\bmarhaba\b/gi,
        message: 'Latin "marhaba" — prefer Arabic script "مرحبا" for RTL Arabic UI.',
        suggestion: 'مرحبا',
        type: 'style',
        severity: 'suggestion',
      },
    ],
  },
  af: {
    name: 'Afrikaans',
    misspellings: {
      dankiee: 'dankie',
      asseblif: 'asseblief',
      baiee: 'baie',
    },
    rules: [],
  },
  ig: {
    name: 'Igbo',
    misspellings: {
      ndeewo: 'ndewo',
      keduu: 'kedu',
      daaluu: 'daalụ',
    },
    rules: [],
  },
  wo: {
    name: 'Wolof',
    misspellings: {
      jerejef: 'jërëjëf',
      nangadef: 'nanga def',
    },
    rules: [],
  },
  ak: {
    name: 'Akan',
    misspellings: {
      medasee: 'medaase',
      akwaabaa: 'akwaaba',
    },
    rules: [],
  },
};

export function listAfricanGrammarPacks(): Array<{ id: AfricanGrammarPackId; name: string }> {
  return (Object.keys(PACKS) as AfricanGrammarPackId[]).map((id) => ({
    id,
    name: PACKS[id].name,
  }));
}

export function resolveAfricanGrammarPack(language?: string): AfricanGrammarPackId | null {
  if (!language) return null;
  const base = language.trim().toLowerCase().split(/[-_]/)[0]!;
  if (base in PACKS) return base as AfricanGrammarPackId;
  // Twi shares Akan pack
  if (base === 'tw') return 'ak';
  return null;
}

function collectMatches(text: string, re: RegExp): RegExpExecArray[] {
  const flags = re.flags.includes('g') ? re.flags : `${re.flags}g`;
  const global = new RegExp(re.source, flags);
  const out: RegExpExecArray[] = [];
  let match: RegExpExecArray | null;
  while ((match = global.exec(text)) !== null) {
    out.push(match);
    if (match[0].length === 0) global.lastIndex += 1;
  }
  return out;
}

/** Apply African language pack heuristics; falls back to no-op when pack missing. */
export function applyAfricanGrammarRules(
  text: string,
  language?: string,
): { corrected: string; issues: GrammarIssue[]; pack: AfricanGrammarPackId | null } {
  const packId = resolveAfricanGrammarPack(language);
  if (!packId) {
    return { corrected: text, issues: [], pack: null };
  }
  const pack = PACKS[packId];
  const issues: GrammarIssue[] = [];
  let corrected = text;

  for (const [wrong, right] of Object.entries(pack.misspellings)) {
    const re = new RegExp(`\\b${wrong}\\b`, 'gi');
    for (const match of collectMatches(corrected, re)) {
      issues.push({
        type: 'spelling',
        severity: 'error',
        message: `Possible ${pack.name} misspelling of "${right}".`,
        original: match[0],
        suggestion: right,
        offset: match.index,
        length: match[0].length,
      });
    }
    corrected = corrected.replace(new RegExp(`\\b${wrong}\\b`, 'gi'), right);
  }

  for (const rule of pack.rules) {
    for (const match of collectMatches(corrected, rule.pattern)) {
      issues.push({
        type: rule.type ?? 'grammar',
        severity: rule.severity ?? 'suggestion',
        message: rule.message,
        original: match[0],
        suggestion: rule.suggestion,
        offset: match.index,
        length: match[0].length,
      });
    }
  }

  return { corrected: corrected.trimEnd(), issues, pack: packId };
}
