/**
 * Extensible manifest for scientific evidence already present in the repository.
 * Entries are intentionally limited to artifacts with a real source file.
 */
export const SCIENTIFIC_EVIDENCE = Object.freeze([
  {
    id: 'pr-curves',
    title: 'Precision-recall curves',
    label: '15 paired folds',
    source: '/cloud_artifacts/pr_curves-20260821T132724Z-675881.png',
    description: 'Original precomputed PR curves from the benchmark run.',
  },
  {
    id: 'classical-matrix',
    title: 'Classical matrix',
    label: 'Raw sensor correlations',
    source: '/cloud_artifacts/matrix_classical-20260821T132724Z-675881.png',
    description: 'Original correlation matrix for the four raw sensors.',
  },
  {
    id: 'quantum-matrix',
    title: 'Quantum matrix',
    label: 'Observable correlations',
    source: '/cloud_artifacts/matrix_quantum-20260821T132724Z-675881.png',
    description: 'Original correlation matrix for the seven saved observables.',
  },
]);
