import { useState } from 'react';
import { Cloud, CheckCircle2, Cpu, BarChart3, Layers, ZoomIn, X, Activity, Info } from 'lucide-react';
import {
  getBenchmarkArms,
  getHeadlineComparison,
  getBenchmarkProtocol,
} from '../../domain/metricRepository.js';
import { getProvenance } from '../../domain/provenance.js';

export function CloudBenchmarkSection() {
  const [activeTab, setActiveTab] = useState('matrix_quantum');
  const [modalImage, setModalImage] = useState(null);
  const [plotsOpen, setPlotsOpen] = useState(false);

  const arms = getBenchmarkArms();
  const headline = getHeadlineComparison();
  const protocol = getBenchmarkProtocol();
  const benchmarkProv = getProvenance('PRECOMPUTED_BENCHMARK');

  const apRaw = arms.raw.apPercent;
  const apQuantum = arms.quantum.apPercent;
  const apHybrid = arms.hybrid.apPercent;

  const precRaw = arms.raw.precisionAtRecallPercent;
  const precHybrid = arms.hybrid.precisionAtRecallPercent;

  const artifacts = {
    matrix_quantum: {
      title: 'Quantum Feature Observables & Fisher Score',
      tag: 'Derived Hilbert Space Observables',
      src: '/cloud_artifacts/matrix_quantum-20260821T132724Z-675881.png',
      caption:
        'Correlation matrix of the 7 derived quantum features (single-body and 2-body correlators) with column-wise Fisher Separability scores on the right. Dominant predictive contribution comes from 2-body interaction observable corr_1_2 (⟨Z₁Z₂⟩).',
    },
    matrix_classical: {
      title: 'Raw Sensor Baseline Correlation',
      tag: 'Sensor Space Matrix',
      src: '/cloud_artifacts/matrix_classical-20260821T132724Z-675881.png',
      caption:
        'Baseline 4×4 sensor correlation matrix for Cable Tension, Crowd Vibration, Hoist Load, and Drive Temperature (average |ρ| = 0.018).',
    },
    pr_curves: {
      title: 'Precision-Recall Curves (15 Paired Folds)',
      tag: 'Classification Performance',
      src: '/cloud_artifacts/pr_curves-20260821T132724Z-675881.png',
      caption:
        'Evaluation across 15 paired folds (mean ± 1 SD band). The Hybrid DQFM representation (dark blue) and Quantum representation (light blue) outperform raw sensor inputs (orange dashed) across recall thresholds for the same linear detector.',
    },
  };

  const currentArtifact = artifacts[activeTab];

  return (
    <section className="card cloud-benchmark-section" id="cloud-benchmark">
      {/* Header */}
      <div className="cloud-section-header">
        <div className="cloud-header-left">
          <div className="cloud-badge-row">
            <span className="cloud-verified-pill">
              <Cloud size={14} className="cloud-icon-pulse" />
              NTT DATA × Kipu Benchmark
            </span>
            <span className="cloud-status-tag">
              <CheckCircle2 size={13} />
              Verified Execution
            </span>
            <span className="cloud-backend-tag">
              <Cpu size={13} />
              Backend: {protocol.backend}
            </span>
            <span className="cloud-backend-tag" style={{ color: '#00DFED', borderColor: 'rgba(0, 223, 237, 0.3)' }}>
              <Info size={13} />
              {benchmarkProv.shortBadge}
            </span>
          </div>
          <h2 className="section-title" style={{ marginTop: 8 }}>
            Cloud Solver Benchmark & Empirical Evidence
          </h2>
          <p className="section-description">
            Aggregated results from batch quantum feature mapping precomputed with Kipu Rimay solver on synthetic mining shovel telemetry (2,000 train / 1,000 test, 15 paired cross-validation folds).
          </p>
        </div>

        <div className="cloud-execution-info">
          <div className="exec-label">Cloud Execution ID</div>
          <div className="exec-id" title={protocol.fitReference}>
            {protocol.fitReference.slice(0, 13)}...
          </div>
          <div className="exec-meta">Organization: NTT DATA Academy</div>
        </div>
      </div>

      {/* Real Numbers KPI Grid */}
      <div className="cloud-kpi-grid">
        <div className="cloud-kpi-card highlight-kpi">
          <div className="kpi-header">
            <span className="kpi-tag">PRIMARY LINEAR ENDPOINT</span>
            <Activity size={16} className="kpi-icon" />
          </div>
          <div className="kpi-value mono-val" style={{ color: '#00DFED' }}>
            +{headline.diffPercentagePoints.toFixed(1)} pp
          </div>
          <div className="kpi-title">Average Precision Lift (Hybrid − Raw)</div>
          <div className="kpi-detail">
            Statistically confirmed gain for linear classifier: <br />
            <strong>p-value = {headline.pHolm.toExponential(2)}</strong> (Holm-corrected)
          </div>
        </div>

        <div className="cloud-kpi-card">
          <div className="kpi-header">
            <span className="kpi-tag">OPERATING BENCHMARK</span>
            <BarChart3 size={16} className="kpi-icon" />
          </div>
          <div className="kpi-value mono-val" style={{ color: '#F59E0B' }}>
            {precHybrid.toFixed(1)}% <span style={{ fontSize: '0.6em', color: '#9EACC2' }}>vs {precRaw.toFixed(1)}%</span>
          </div>
          <div className="kpi-title">Precision @ {protocol.recallTarget * 100}% Recall (P@R₉₀)</div>
          <div className="kpi-detail">
            <strong>+{(precHybrid - precRaw).toFixed(1)} percentage points</strong> precision gain at the high-recall operating threshold.
          </div>
        </div>

        <div className="cloud-kpi-card">
          <div className="kpi-header">
            <span className="kpi-tag">BENCHMARK COMPARISON (AP)</span>
            <Layers size={16} className="kpi-icon" />
          </div>
          <div className="kpi-bars">
            <div className="kpi-bar-row" title="Linear Logistic Regression on 4 raw sensors">
              <span className="bar-label">Raw (4):</span>
              <div className="bar-track">
                <div className="bar-fill bar-raw" style={{ width: `${apRaw}%` }} />
              </div>
              <span className="bar-val">{apRaw.toFixed(1)}%</span>
            </div>
            <div className="kpi-bar-row" title="Linear Logistic Regression on 7 quantum observables">
              <span className="bar-label">Quantum (7):</span>
              <div className="bar-track">
                <div className="bar-fill bar-quantum" style={{ width: `${apQuantum}%` }} />
              </div>
              <span className="bar-val">{apQuantum.toFixed(1)}%</span>
            </div>
            <div className="kpi-bar-row" title="Linear Logistic Regression on 11 hybrid features">
              <span className="bar-label">Hybrid (11):</span>
              <div className="bar-track">
                <div className="bar-fill bar-hybrid" style={{ width: `${apHybrid}%` }} />
              </div>
              <span className="bar-val">{apHybrid.toFixed(1)}%</span>
            </div>
          </div>
          <div className="kpi-detail" style={{ marginTop: 8, fontSize: '0.8rem', color: '#9EACC2' }}>
            Linear detector improves by +{headline.diffPercentagePoints} pp with hybrid features.
          </div>
        </div>
      </div>

      {/* Real Cloud Plot Visualizer */}
      <button
        type="button"
        className="plots-toggle-btn"
        onClick={() => setPlotsOpen((open) => !open)}
        aria-expanded={plotsOpen}
      >
        {plotsOpen ? '▲ Hide Plots & Correlation Matrices' : '▼ Show Precomputed Evidence Plots & Correlation Matrices'}
      </button>

      {plotsOpen && (
        <div className="cloud-visualizer-container">
          <div className="visualizer-tabs-bar">
            <div className="visualizer-tabs">
              <button
                type="button"
                className={`viz-tab-btn ${activeTab === 'matrix_quantum' ? 'active' : ''}`}
                onClick={() => setActiveTab('matrix_quantum')}
              >
                ⚛️ Quantum Features & Fisher Scores
              </button>
              <button
                type="button"
                className={`viz-tab-btn ${activeTab === 'matrix_classical' ? 'active' : ''}`}
                onClick={() => setActiveTab('matrix_classical')}
              >
                📊 Raw Sensor Matrix
              </button>
              <button
                type="button"
                className={`viz-tab-btn ${activeTab === 'pr_curves' ? 'active' : ''}`}
                onClick={() => setActiveTab('pr_curves')}
              >
                📈 Precision-Recall Curves (15 Folds)
              </button>
            </div>

            <button
              type="button"
              className="expand-plot-btn"
              onClick={() => setModalImage(currentArtifact.src)}
            >
              <ZoomIn size={14} /> Full Resolution
            </button>
          </div>

          <div className="visualizer-content-card">
            <div className="plot-image-wrapper" onClick={() => setModalImage(currentArtifact.src)}>
              <img
                src={currentArtifact.src}
                alt={currentArtifact.title}
                className="cloud-plot-img"
              />
              <div className="plot-zoom-hint">
                <ZoomIn size={16} /> Click to expand
              </div>
            </div>

            <div className="plot-caption-box">
              <div className="plot-caption-title">{currentArtifact.title}</div>
              <p className="plot-caption-text">{currentArtifact.caption}</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal for full size view */}
      {modalImage && (
        <div className="image-modal-backdrop" onClick={() => setModalImage(null)}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setModalImage(null)}
            >
              <X size={20} />
            </button>
            <img src={modalImage} alt="Expanded Cloud Plot" className="modal-expanded-img" />
          </div>
        </div>
      )}

      {/* Explanatory bridge note */}
      <div className="cloud-bridge-note">
        <strong>💡 Experimental Context:</strong> The benchmark was evaluated using 3,000 synthetic records with 15 paired folds. For the linear classifier, the hybrid representation delivers an AP lift of <strong>+{headline.diffPercentagePoints.toFixed(1)} percentage points</strong> (72.8% vs 34.5%).
      </div>
    </section>
  );
}
