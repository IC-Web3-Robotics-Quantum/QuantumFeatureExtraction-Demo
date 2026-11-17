import { useState } from 'react';
import {
  getBenchmarkArms,
  getBenchmarkProtocol,
  getHeadlineComparison,
} from '../../domain/index.js';
import { SCIENTIFIC_EVIDENCE } from '../../data/scientificEvidence.js';

function formatPercent(value) {
  return `${value.toFixed(1)}%`;
}

function BenchmarkBar({ arm, max }) {
  return (
    <div className="results-bar-row">
      <div className="results-bar-label">
        <span>{arm.shortLabel}</span>
        <strong>{formatPercent(arm.apPercent)}</strong>
      </div>
      <div className="results-bar-track" aria-label={`${arm.label}: ${formatPercent(arm.apPercent)} AP`}>
        <i
          className={`results-bar-fill results-bar-fill-${arm.key}`}
          style={{ width: `${(arm.apPercent / max) * 100}%` }}
        />
      </div>
      <small>{arm.modelType}</small>
    </div>
  );
}

function EvidenceViewer({ evidence, onClose }) {
  return (
    <div className="results-modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="results-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="evidence-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="results-modal-header">
          <div>
            <span className="results-kicker">{evidence.label}</span>
            <h2 id="evidence-modal-title">{evidence.title}</h2>
          </div>
          <button type="button" className="results-close" onClick={onClose} aria-label="Close evidence viewer">×</button>
        </div>
        <div className="results-modal-image-wrap">
          <img src={evidence.source} alt={evidence.description} />
        </div>
        <div className="results-modal-actions">
          <span>{evidence.description}</span>
          <a href={evidence.source} download>Download original</a>
        </div>
      </section>
    </div>
  );
}

export function ResultsScene() {
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const arms = getBenchmarkArms();
  const protocol = getBenchmarkProtocol();
  const headline = getHeadlineComparison();
  const heroArms = [arms.raw, arms.quantum, arms.hybrid];
  const maxAp = Math.max(...heroArms.map((arm) => arm.apPercent));

  return (
    <section className="results-scene">
      <div className="results-heading">
        <div>
          <span className="shell-eyebrow">Benchmark evidence</span>
          <h1>Does the representation improve detection?</h1>
          <p>Same detector, same data, three representations: classical signals, quantum features, and both combined.</p>
        </div>
      </div>

      <section className="results-hero-card">
        <div className="results-card-heading">
          <div>
            <span className="results-kicker">Average Precision · higher is better</span>
            <h2>Same linear detector, different representations</h2>
          </div>
          <span className="results-fold-note">{protocol.nFolds} paired folds</span>
        </div>
        <div className="results-bars">
          {heroArms.map((arm) => <BenchmarkBar key={arm.key} arm={arm} max={maxAp} />)}
        </div>
        <div className="results-hero-callout">
          <strong>+{headline.diffPercentagePoints.toFixed(1)} pp</strong>
          <span>Adding the quantum features to the classical signals lifts Average Precision under the same logistic-regression detector, a statistically confirmed result across 15 paired folds.</span>
        </div>
      </section>

      <div className="results-grid results-grid-single">
        <section className="results-panel">
          <div className="results-card-heading">
            <div>
              <span className="results-kicker">Operating point</span>
              <h2>Precision at Recall ≥ 90%</h2>
            </div>
            <span className="results-fold-note">P@R90</span>
          </div>
          <div className="results-pr-grid">
            <div><small>Classical</small><strong>{formatPercent(arms.raw.precisionAtRecallPercent)}</strong></div>
            <div><small>Hybrid</small><strong>{formatPercent(arms.hybrid.precisionAtRecallPercent)}</strong></div>
            <div><small>Lift</small><strong>+{headline.precisionLift.diffPercentagePoints.toFixed(1)} pp</strong></div>
          </div>
          <p className="results-muted">Measured at recall {protocol.recallTarget.toFixed(2)} across {protocol.nFolds} cross-validation folds.</p>
        </section>
      </div>

      <section className="results-evidence">
        <div className="results-card-heading">
          <div>
            <span className="results-kicker">Explore evidence</span>
            <h2>Original scientific artifacts</h2>
          </div>
          <span className="results-fold-note">Zoom and download available</span>
        </div>
        <div className="results-evidence-grid">
          {SCIENTIFIC_EVIDENCE.map((evidence) => (
            <button type="button" className="results-evidence-card" key={evidence.id} onClick={() => setSelectedEvidence(evidence)}>
              <img src={evidence.source} alt="" />
              <span>{evidence.title}</span>
              <small>{evidence.label} · Open viewer</small>
            </button>
          ))}
        </div>
      </section>

      <section className="results-limitations">
        <span className="results-kicker">Scope</span>
        <p>Synthetic industrial dataset where the warning sign lives in an interaction between sensors · computed with Kipu on the <code>{protocol.backend}</code> simulator · no claim of quantum advantage.</p>
      </section>

      {selectedEvidence && <EvidenceViewer evidence={selectedEvidence} onClose={() => setSelectedEvidence(null)} />}
    </section>
  );
}
