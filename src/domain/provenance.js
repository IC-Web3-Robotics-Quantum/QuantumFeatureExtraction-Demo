/**
 * @file provenance.js
 * Domain module establishing data provenance classification and audit trails
 * for the NTT DATA × Kipu Quantum Feature Extraction experience.
 *
 * Ground rules:
 * - PRECOMPUTED_QFE: Derived from Kipu's offline execution using ibm_aer backend.
 * - PRECOMPUTED_BENCHMARK: Aggregated 15-fold cross-validation metrics.
 * - LOCAL_DERIVED: Calculated in-browser from saved records (e.g. Euclidean distance, correlations).
 * - CONCEPTUAL: Pedagogical illustrations explaining the paper; no empirical trace.
 * - HARDWARE_INPUT: Real-time sensor readings from ESP32 peripheral, matched to saved records.
 */

export const PROVENANCE_KINDS = Object.freeze({
  PRECOMPUTED_QFE: 'PRECOMPUTED_QFE',
  PRECOMPUTED_BENCHMARK: 'PRECOMPUTED_BENCHMARK',
  LOCAL_DERIVED: 'LOCAL_DERIVED',
  CONCEPTUAL: 'CONCEPTUAL',
  HARDWARE_INPUT: 'HARDWARE_INPUT',
});

export const PROVENANCE_METADATA = Object.freeze({
  [PROVENANCE_KINDS.PRECOMPUTED_QFE]: {
    id: PROVENANCE_KINDS.PRECOMPUTED_QFE,
    label: 'Precomputed quantum features',
    shortBadge: 'Kipu ibm_aer precomputed',
    description:
      'Feature vectors derived by Kipu prior to the demo using the ibm_aer quantum simulator backend. Not executed live in browser.',
    backend: 'ibm_aer (Rimay DQFM)',
    isRealTimeQuantum: false,
    isHardwareIBM: false,
  },
  [PROVENANCE_KINDS.PRECOMPUTED_BENCHMARK]: {
    id: PROVENANCE_KINDS.PRECOMPUTED_BENCHMARK,
    label: 'Saved benchmark results',
    shortBadge: '15-fold benchmark',
    description:
      'Aggregated performance metrics evaluated over 15 paired folds (RepeatedStratifiedKFold 5×3) on synthetic shovel telemetry.',
    protocol: '15 paired folds, recall_target = 0.90',
    isRealTimeQuantum: false,
    isHardwareIBM: false,
  },
  [PROVENANCE_KINDS.LOCAL_DERIVED]: {
    id: PROVENANCE_KINDS.LOCAL_DERIVED,
    label: 'Computed locally from saved data',
    shortBadge: 'Local computation',
    description:
      'Distances, axis coordinates, scatter points and local correlation matrices calculated inside the browser from precomputed records.',
    isRealTimeQuantum: false,
    isHardwareIBM: false,
  },
  [PROVENANCE_KINDS.CONCEPTUAL]: {
    id: PROVENANCE_KINDS.CONCEPTUAL,
    label: 'Conceptual illustration',
    shortBadge: 'Conceptual diagram',
    description:
      'Pedagogical animation illustrating the paper principles (Encoding, CD Evolution, Pauli Readout). No proprietary gates or hardware traces represented.',
    isRealTimeQuantum: false,
    isHardwareIBM: false,
  },
  [PROVENANCE_KINDS.HARDWARE_INPUT]: {
    id: PROVENANCE_KINDS.HARDWARE_INPUT,
    label: 'Live sensor input; matching saved case',
    shortBadge: 'Physical I/O input',
    description:
      'Physical potentiometer readings delivered via ESP32. The microcontroller does not execute quantum or ML code; it maps to the nearest precomputed record.',
    isRealTimeQuantum: false,
    isHardwareIBM: false,
  },
});

/**
 * Returns provenance metadata with validation.
 * @param {string} kind
 * @returns {object} Provenance record
 */
export function getProvenance(kind) {
  const meta = PROVENANCE_METADATA[kind];
  if (!meta) {
    throw new Error(`[Provenance] Unknown provenance kind: "${kind}". Expected one of: ${Object.keys(PROVENANCE_KINDS).join(', ')}`);
  }
  return meta;
}

/**
 * Audit catalog for all showroom visualizations.
 */
export const VISUALIZATION_PROVENANCE_CATALOG = Object.freeze([
  {
    key: 'machine_diagram',
    title: 'Electric Shovel Physical Diagram & Sensors',
    provenance: PROVENANCE_KINDS.LOCAL_DERIVED,
    source: 'src/components/MachineDiagram/',
    dataset: 'Synthetic shovel telemetry (4 raw channels)',
    disclaimer: 'Synthetic industrial scenario; not customer-confidential telemetry.',
  },
  {
    key: 'matrix_classical',
    title: 'Classical 4×4 Correlation Matrix',
    provenance: PROVENANCE_KINDS.PRECOMPUTED_BENCHMARK,
    source: '/cloud_artifacts/matrix_classical-20260821T132724Z-675881.png',
    dataset: '2000 training records, classical sensor channels',
    disclaimer: 'Pearson correlation matrix of raw sensor signals, not Hamiltonian couplings.',
  },
  {
    key: 'matrix_quantum',
    title: 'Quantum 7×7 Observables Correlation Matrix',
    provenance: PROVENANCE_KINDS.PRECOMPUTED_BENCHMARK,
    source: '/cloud_artifacts/matrix_quantum-20260821T132724Z-675881.png',
    dataset: 'Derived observables from Kipu offline execution',
    disclaimer: 'Derived observables correlation; does not represent qubit physical entanglement strength.',
  },
  {
    key: 'fisher_scores',
    title: 'Quantum Fisher Separability Scores',
    provenance: PROVENANCE_KINDS.PRECOMPUTED_BENCHMARK,
    source: 'src/data/kipuCloudModel.json (cloudMetrics.quantum_fisher_scores)',
    dataset: 'Precomputed marginal separability metric across 7 quantum observables',
    disclaimer: 'Measures marginal class separability per feature; not SHAP or causal importance.',
  },
  {
    key: 'pr_curves',
    title: 'Precision-Recall Curves (15 Paired Folds)',
    provenance: PROVENANCE_KINDS.PRECOMPUTED_BENCHMARK,
    source: '/cloud_artifacts/pr_curves-20260821T132724Z-675881.png',
    dataset: 'RepeatedStratifiedKFold(5,3) on 2000 training records',
    disclaimer: 'Precomputed 15-fold cross-validation bands. Demonstrates linear detector behavior.',
  },
  {
    key: 'benchmark_ap_bars',
    title: 'Average Precision (AP) Benchmark Comparison',
    provenance: PROVENANCE_KINDS.PRECOMPUTED_BENCHMARK,
    source: 'src/data/kipuCloudModel.json (cloudMetrics.arms)',
    dataset: '4 main arms: raw, quantum, hybrid, hgb_raw + 3 selected arms',
    disclaimer: 'HGB non-linear model outperforms hybrid linear model. Improvement is ~38.3 percentage points, not relative %.',
  },
  {
    key: 'scatter_exploration',
    title: 'Dual Feature Space Scatter Plot',
    provenance: PROVENANCE_KINDS.LOCAL_DERIVED,
    source: 'src/data/realCases.json (1000 test records)',
    dataset: 'Precomputed test split evaluated on Kipu ibm_aer',
    disclaimer: 'Axes represent distinct spaces; coordinates do not imply isometric metric transformation.',
  },
  {
    key: 'hamiltonian_encoding_graph',
    title: 'Hamiltonian Spin Encoding Illustration',
    provenance: PROVENANCE_KINDS.CONCEPTUAL,
    source: 'Conceptual UI in Method scene',
    dataset: 'Paper principle: digitized counterdiabatic feature extraction',
    disclaimer: 'Conceptual schematic. Proprietary Kipu Hamiltonian couplings are not rendered as empirical data.',
  },
  {
    key: 'counterdiabatic_evolution_anim',
    title: 'Digitized Counterdiabatic Dynamics Animation',
    provenance: PROVENANCE_KINDS.CONCEPTUAL,
    source: 'Conceptual animation in Method scene',
    dataset: 'Methodological principle',
    disclaimer: 'Conceptual illustration of non-linear state transformation. No live quantum solver.',
  },
  {
    key: 'quantum_readout_7',
    title: '7 Precomputed Quantum Observables Readout',
    provenance: PROVENANCE_KINDS.PRECOMPUTED_QFE,
    source: 'src/data/realCases.json (records[id].qFeatures)',
    dataset: 'Exact 7 observables: q0..q3, corr_0_1, corr_1_2, corr_1_3',
    disclaimer: 'Values read directly from Kipu precomputed dataset; not generated on the fly.',
  },
  {
    key: 'nearest_neighbor_matching',
    title: 'Physical Input Nearest-Neighbor Snapping',
    provenance: PROVENANCE_KINDS.LOCAL_DERIVED,
    source: 'src/utils/liveScore.js (findNearestRealRecord)',
    dataset: 'Deterministic Euclidean distance matching over 1000 saved cases',
    disclaimer: 'Indicator is geometric Euclidean distance in normalized 4D hypercube, not a probabilistic confidence score.',
  },
]);
