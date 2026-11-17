import { useMemo, useState } from 'react';
import { Heatmap } from '../Heatmap/Heatmap.jsx';
import { HeatmapLegend } from '../Heatmap/HeatmapLegend.jsx';
import { Scatter } from '../Scatter/Scatter.jsx';
import { RAW, QNAMES_SHORT } from '../../data/constants.js';
import { getFisherScores } from '../../domain/index.js';
import { runPipeline } from '../../utils/pipeline.js';
import { useExperience } from '../../context/ExperienceContext.jsx';

const TABS = [
  { id: 'matrices', label: 'Matrices' },
  { id: 'scatter', label: 'Scatter' },
  { id: 'fisher', label: 'Fisher' },
  { id: 'dimensions', label: 'Dimensions' },
];

function AxisSelect({ label, value, options, onChange }) {
  return (
    <label className="feature-axis-select">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(Number(event.target.value))}>
        {options.map((option, index) => <option value={index} key={option}>{option}</option>)}
      </select>
    </label>
  );
}

function MatricesTab({ result }) {
  return (
    <div className="feature-tab-grid feature-matrices-tab">
      <section className="feature-chart-card">
        <div className="feature-chart-heading">
          <div>
            <span className="feature-kicker">Local correlation</span>
            <h2>Raw sensor matrix · 4 × 4</h2>
          </div>
          <span className="feature-source-label">1,000 test records</span>
        </div>
        <div className="feature-heatmap"><Heatmap matrix={result.classical.corr} labels={RAW} showValues /></div>
        <HeatmapLegend />
      </section>
      <section className="feature-chart-card">
        <div className="feature-chart-heading">
          <div>
            <span className="feature-kicker">Local correlation</span>
            <h2>Observable matrix · 7 × 7</h2>
          </div>
          <span className="feature-source-label">1,000 test records</span>
        </div>
        <div className="feature-heatmap"><Heatmap matrix={result.quantum.corr} labels={QNAMES_SHORT} showValues /></div>
        <HeatmapLegend />
      </section>
      <p className="feature-method-note">
        Each cell shows how strongly two features move together across the 1,000 test records.
      </p>
      <div className="feature-original-evidence">
        <span className="feature-kicker">Original Kipu evidence</span>
        <a href="/cloud_artifacts/matrix_classical-20260821T132724Z-675881.png" target="_blank" rel="noopener noreferrer">
          Open classical matrix PNG
        </a>
        <a href="/cloud_artifacts/matrix_quantum-20260821T132724Z-675881.png" target="_blank" rel="noopener noreferrer">
          Open quantum matrix PNG
        </a>
      </div>
    </div>
  );
}

function ScatterTab({ result, rawAxes, quantumAxes, setRawAxes, setQuantumAxes, activeRecordId }) {
  const rawPoints = result.records.map((record) => [record.sensors[rawAxes[0]], record.sensors[rawAxes[1]]]);
  const quantumPoints = result.records.map((record) => [record.qFeatures[quantumAxes[0]], record.qFeatures[quantumAxes[1]]]);
  const labels = result.records.map((record) => record.label);

  return (
    <div className="feature-tab-grid feature-scatter-tab">
      <section className="feature-chart-card">
        <div className="feature-chart-heading">
          <div><span className="feature-kicker">Raw projection</span><h2>Original sensor space</h2></div>
          <span className="feature-source-label">Same saved records</span>
        </div>
        <div className="feature-axis-controls">
          <AxisSelect label="X" value={rawAxes[0]} options={RAW} onChange={(value) => setRawAxes([value, rawAxes[1]])} />
          <AxisSelect label="Y" value={rawAxes[1]} options={RAW} onChange={(value) => setRawAxes([rawAxes[0], value])} />
        </div>
        <div className="feature-scatter"><Scatter points={rawPoints} labels={labels} highlight={activeRecordId} xLabel={RAW[rawAxes[0]]} yLabel={RAW[rawAxes[1]]} accent="var(--color-brand)" /></div>
      </section>
      <section className="feature-chart-card">
        <div className="feature-chart-heading">
          <div><span className="feature-kicker">Two-variable projection</span><h2>Quantum observable space</h2></div>
          <span className="feature-source-label">Two observables at a time</span>
        </div>
        <div className="feature-axis-controls">
          <AxisSelect label="X" value={quantumAxes[0]} options={QNAMES_SHORT} onChange={(value) => setQuantumAxes([value, quantumAxes[1]])} />
          <AxisSelect label="Y" value={quantumAxes[1]} options={QNAMES_SHORT} onChange={(value) => setQuantumAxes([quantumAxes[0], value])} />
        </div>
        <div className="feature-scatter"><Scatter points={quantumPoints} labels={labels} highlight={activeRecordId} xLabel={QNAMES_SHORT[quantumAxes[0]]} yLabel={QNAMES_SHORT[quantumAxes[1]]} accent="var(--color-brand-bright)" /></div>
      </section>
      <p className="feature-method-note">
        Each point is one operating record, colored by its label. The outlined point is
        the active record #{activeRecordId}.
      </p>
    </div>
  );
}

function FisherTab() {
  const scores = useMemo(() => getFisherScores(), []);
  const max = Math.max(...scores.map((item) => item.fisherScore));

  return (
    <div className="feature-tab-grid feature-fisher-tab">
      <section className="feature-chart-card feature-fisher-card">
        <div className="feature-chart-heading">
          <div><span className="feature-kicker">Benchmark metadata</span><h2>Quantum Fisher scores</h2></div>
          <span className="feature-source-label">Seven observables</span>
        </div>
        <div className="feature-fisher-list">
          {scores.map((item) => (
            <div className="feature-fisher-row" key={item.key}>
              <span>{item.key}</span>
              <div className="feature-fisher-track"><i style={{ width: `${(item.fisherScore / max) * 100}%` }} /></div>
              <strong>{item.fisherScore.toFixed(3)}</strong>
            </div>
          ))}
        </div>
      </section>
      <aside className="feature-explanation-card">
        <span className="feature-kicker">How to read this</span>
        <h2>Separability, not feature importance.</h2>
        <p>
          How well each observable, on its own, separates normal from deviation
          cases. A higher bar means a clearer split.
        </p>
      </aside>
    </div>
  );
}

function DimensionsTab() {
  const stages = [
    { count: 4, title: 'Raw', detail: 'Original physical signals' },
    { count: 7, title: 'Quantum', detail: 'Saved observables' },
    { count: 11, title: 'Hybrid', detail: '4 raw + 7 quantum' },
  ];

  return (
    <div className="feature-tab-grid feature-dimensions-tab">
      <section className="feature-chart-card">
        <div className="feature-chart-heading">
          <div><span className="feature-kicker">Representation dimensions</span><h2>One dataset, three feature counts</h2></div>
        </div>
        <div className="feature-dimension-row">
          {stages.map((stage, index) => (
            <div className="feature-dimension-stage" key={stage.title}>
              <strong>{stage.count}</strong>
              <span>{stage.title}</span>
              <small>{stage.detail}</small>
              {index < stages.length - 1 && <i aria-hidden="true">→</i>}
            </div>
          ))}
        </div>
      </section>
      <p className="feature-method-note">
        Dimension count describes the shape of each representation, not its performance.
      </p>
    </div>
  );
}

export function FeatureSpaceScene() {
  const { activeRecordId } = useExperience();
  const [activeTab, setActiveTab] = useState('matrices');
  const [rawAxes, setRawAxes] = useState([0, 1]);
  const [quantumAxes, setQuantumAxes] = useState([1, 5]);
  const result = useMemo(() => runPipeline(1), []);

  return (
    <section className="feature-space-scene">
      <div className="feature-space-heading">
        <div>
          <span className="shell-eyebrow">Feature space</span>
          <h1>What changed in the representation?</h1>
          <p>Inspect the saved feature spaces through one view at a time.</p>
        </div>
        <span className="feature-record-badge">Active record #{activeRecordId}</span>
      </div>

      <nav className="feature-tabs" aria-label="Feature space views">
        {TABS.map((tab) => (
          <button type="button" className={activeTab === tab.id ? 'is-selected' : ''} key={tab.id} onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === 'matrices' && <MatricesTab result={result} />}
      {activeTab === 'scatter' && <ScatterTab result={result} rawAxes={rawAxes} quantumAxes={quantumAxes} setRawAxes={setRawAxes} setQuantumAxes={setQuantumAxes} activeRecordId={activeRecordId} />}
      {activeTab === 'fisher' && <FisherTab />}
      {activeTab === 'dimensions' && <DimensionsTab />}

      <div className="feature-space-footer">
        <span>Source: 1,000 test records and benchmark results.</span>
      </div>
    </section>
  );
}
