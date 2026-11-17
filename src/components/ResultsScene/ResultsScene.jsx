import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getBenchmarkArms,
  getBenchmarkProtocol,
  getHeadlineComparison,
  getNystroemComparison,
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
  const nystroem = getNystroemComparison();
  const heroArms = [arms.raw, arms.quantum, arms.hybrid, arms.hgb_raw];
  const selectedArms = [arms.selected_raw, arms.selected_hybrid, arms.selected_nystroem];
  const maxAp = Math.max(...heroArms.map((arm) => arm.apPercent));

  return (
    <section className="results-scene">
      <div className="results-heading">
        <div>
          <span className="shell-eyebrow">Saved benchmark evidence</span>
          <h1>Does the representation improve detection?</h1>
          <p>Four benchmark arms, one paired protocol, and the limitations that define what this experiment can support.</p>
        </div>
        <span className="results-provenance">Synthetic dataset · {protocol.backend} · offline</span>
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
          <span>hybrid − raw AP under the same linear detector; hgb_raw is a separate non-linear classical baseline and wins this benchmark.</span>
        </div>
      </section>

      <div className="results-grid">
        <section className="results-panel">
          <div className="results-card-heading">
            <div>
              <span className="results-kicker">Operating point</span>
              <h2>Precision at Recall ≥ 90%</h2>
            </div>
            <span className="results-fold-note">P@R90</span>
          </div>
          <div className="results-pr-grid">
            <div><small>Raw</small><strong>{formatPercent(arms.raw.precisionAtRecallPercent)}</strong></div>
            <div><small>Hybrid</small><strong>{formatPercent(arms.hybrid.precisionAtRecallPercent)}</strong></div>
            <div><small>Lift</small><strong>+{headline.precisionLift.diffPercentagePoints.toFixed(1)} pp</strong></div>
          </div>
          <p className="results-muted">This endpoint uses the formal benchmark target of recall {protocol.recallTarget.toFixed(2)}. It is not the 80% local policy used by the Lab.</p>
        </section>

        <section className="results-panel">
          <div className="results-card-heading">
            <div>
              <span className="results-kicker">Advanced comparison</span>
              <h2>Selection inside cross-validation</h2>
            </div>
          </div>
          <div className="results-selected-list">
            {selectedArms.map((arm) => (
              <div key={arm.key} className="results-selected-row">
                <span>{arm.shortLabel}</span>
                <strong>{formatPercent(arm.apPercent)}</strong>
                <small>{arm.nFeatures} selected features</small>
              </div>
            ))}
          </div>
          <p className="results-muted">Feature selection is refit inside each training fold, then scored on held-out rows. This prevents selection leakage.</p>
        </section>
      </div>

      <section className="results-comparison">
        <div>
          <span className="results-kicker">Matched classical control</span>
          <h2>Hybrid versus Nyström</h2>
          <p>{nystroem.disclaimer}</p>
        </div>
        <div className="results-verdict">
          <strong>{nystroem.verdict}</strong>
          <span>Δ AP {nystroem.diffPercentagePoints >= 0 ? '+' : ''}{nystroem.diffPercentagePoints.toFixed(1)} pp · p<sub>Holm</sub> = {nystroem.pHolm.toFixed(1)}</span>
        </div>
      </section>

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
        <span className="results-kicker">Scope and limitations</span>
        <p>Synthetic industrial dataset · precomputed with Kipu using the <code>{protocol.backend}</code> simulator · one finite shot budget · no live solver execution · no claim of general quantum advantage.</p>
      </section>

      <div className="results-footer">
        <span>Benchmark evidence is separate from scores for individual saved Lab records.</span>
        <Link className="shell-nav-button shell-nav-button-primary" to="/lab">Enter lab</Link>
      </div>

      {selectedEvidence && <EvidenceViewer evidence={selectedEvidence} onClose={() => setSelectedEvidence(null)} />}
    </section>
  );
}
