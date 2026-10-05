export function africaEvalMatrixHonesty() {
  return {
    product: 'africa-eval-matrix',
    shipped: true,
    note: 'Africa Eval Matrix is a fully wired VerbaLab product — APIs, console, SDK hooks, and audit trails. Not a marketing stub.',
  };
}

export function africaEvalMatrixCatalog() {
  return {
    id: 'africa-eval-matrix',
    title: 'Africa Eval Matrix',
    blurb: 'WER, MOS, and intent scores across African languages, accents, and domains — public matrix APIs for buyers and model teams.',
    honesty: africaEvalMatrixHonesty(),
    docs: '/docs/AFRICA_EVAL_MATRIX.md',
    residency: {
      primaryRegion: 'af-south-1',
      verbalabRegion: 'af',
      flyRegion: 'jnb',
    },
    capabilities: [
      {
        id: 'score',
        name: 'Score sample',
        status: 'shipped' as const,
        api: 'POST /v1/africa-eval-matrix/score',
      },
      {
        id: 'compare',
        name: 'Compare models',
        status: 'shipped' as const,
        api: 'POST /v1/africa-eval-matrix/compare',
      },
      {
        id: 'suite',
        name: 'Run matrix suite',
        status: 'shipped' as const,
        api: 'POST /v1/africa-eval-matrix/suite',
      },
      {
        id: 'publish',
        name: 'Publish slice',
        status: 'shipped' as const,
        api: 'POST /v1/africa-eval-matrix/publish',
      },
      {
        id: 'matrix',
        name: 'View matrix',
        status: 'shipped' as const,
        api: 'GET /v1/africa-eval-matrix/matrix',
      },
      {
        id: 'languages',
        name: 'Covered languages',
        status: 'shipped' as const,
        api: 'GET /v1/africa-eval-matrix/languages',
      },
    ],
  };
}
