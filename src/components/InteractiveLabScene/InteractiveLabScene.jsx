import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MachineDiagram } from '../MachineDiagram/MachineDiagram.jsx';
import { Scatter } from '../Scatter/Scatter.jsx';
import { ModeSwitch } from '../LiveBoardPanel/ModeSwitch.jsx';
import { PHYSICAL_RANGES, SLIDER_FIELDS, midpointReading } from '../../data/calibration.js';
import { STAGED_SCENARIOS } from '../../data/stagedScenarios.js';
import { getAllRecords } from '../../domain/recordRepository.js';
import { RAW, QNAMES_SHORT, UNITS } from '../../data/constants.js';
import { useExperience } from '../../context/ExperienceContext.jsx';
import { useLiveBoard } from '../../hooks/useLiveBoard.js';

const SENSOR_KEYS = SLIDER_FIELDS.map(({ key }) => key);
const RECORDS = getAllRecords();
const RAW_POINTS = RECORDS.map((record) => [record.sensors[0], record.sensors[1]]);
const QUANTUM_POINTS = RECORDS.map((record) => [record.qFeatures[1], record.qFeatures[5]]);
const LABELS = RECORDS.map((record) => record.label);

function formatValue(value, unit) {
  return `${Number(value ?? 0).toFixed(1)} ${unit}`;
}

function ReadingGrid({ title, reading }) {
  return (
    <div className="lab-reading-block">
      <span className="lab-panel-label">{title}</span>
      <div className="lab-reading-grid">
        {SENSOR_KEYS.map((key, index) => (
          <div key={key}>
            <small>{RAW[index]}</small>
            <strong>{formatValue(reading?.[key], UNITS[index])}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScoreCard({ label, score, threshold, alert }) {
  return (
    <div className="lab-score-card">
      <span>{label}</span>
      <strong>{score.toFixed(4)}</strong>
      <small>Threshold {threshold.toFixed(4)} · {alert ? 'Alert' : 'Clear'}</small>
    </div>
  );
}

export function InteractiveLabScene() {
  const exp = useExperience();
  const liveBoard = useLiveBoard(exp.setRequestedReading);
  const [wsUrl, setWsUrl] = useState(liveBoard.url);
  const { activeRecord, activeRecordId, match, requestedPhysical, observables } = exp;
  const effectiveReading = activeRecord.rawSensors;
  const activeMode = liveBoard.activeMode;
  const activeAlert = activeMode === 'classical' ? exp.classicalAlert : exp.quantumAlert;
  const reading = liveBoard.reading || requestedPhysical || midpointReading();
  const activeScenario = STAGED_SCENARIOS.find((scenario) => scenario.recordId === activeRecordId);

  const requestedDistance = match.exact ? '0.0000' : match.distance.toFixed(4);
  const selectedRawPoints = useMemo(() => RAW_POINTS, []);
  const selectedQuantumPoints = useMemo(() => QUANTUM_POINTS, []);

  const updateReading = (key, value) => {
    liveBoard.updateSimulation({
      ...reading,
      [key]: value,
    });
  };

  const choosePreset = (scenario) => {
    liveBoard.startSimulation(scenario.reading, 'preset');
  };

  return (
    <section className="interactive-lab-scene">
      <div className="lab-heading">
        <div>
          <span className="shell-eyebrow">Interactive lab</span>
          <h1>What happens when the readings change?</h1>
          <p>Move the four physical inputs or select a saved case. Every panel follows the same matched record.</p>
        </div>
        <span className="lab-provenance">Offline · 1,000 saved cases</span>
      </div>

      <div className="lab-layout">
        <section className="lab-machine-panel">
          <span className="lab-panel-label">Conceptual machine scene</span>
          <div className="lab-machine">
            <MachineDiagram alert={activeAlert} label={activeRecord.label} mode={activeMode} />
          </div>
          <div className={`lab-alert-state ${activeAlert ? 'is-alert' : 'is-clear'}`}>
            <strong>{activeAlert ? 'ALERT ACTIVE' : 'ALL CLEAR'}</strong>
            <span>{activeMode} score for matched case #{activeRecordId}</span>
          </div>
          <p className="lab-note">The diagram is an interface for a synthetic scenario, not a deployed customer asset.</p>
        </section>

        <section className="lab-controls-panel">
          <div className="lab-panel-header">
            <div>
              <span className="lab-panel-label">Input source</span>
              <h2>{liveBoard.isSimulating ? 'Simulated inputs' : 'Saved record selection'}</h2>
            </div>
            <span className={`lab-connection-status is-${liveBoard.status}`}>
              {liveBoard.status}
            </span>
          </div>

          <div className="lab-mode-row">
            <ModeSwitch
              mode={activeMode}
              isAuto={Boolean(liveBoard.reading?.mode)}
              onSelect={liveBoard.setMode}
              classicalAlert={exp.classicalAlert}
              quantumAlert={exp.quantumAlert}
            />
          </div>

          <div className="lab-presets">
            <span className="lab-panel-label">Curated saved cases</span>
            <div>
              {STAGED_SCENARIOS.map((scenario) => (
                <button type="button" key={scenario.id} onClick={() => choosePreset(scenario)}>
                  Case #{scenario.recordId}
                </button>
              ))}
            </div>
          </div>

          <div className="lab-slider-list">
            {SLIDER_FIELDS.map(({ key, label }, index) => {
              const range = PHYSICAL_RANGES[key];
              return (
                <label className="lab-slider-row" key={key}>
                  <span>{label}</span>
                  <input
                    type="range"
                    min={range.min}
                    max={range.max}
                    step={Math.max(0.1, (range.max - range.min) / 200)}
                    value={reading[key] ?? range.min}
                    onChange={(event) => updateReading(key, Number(event.target.value))}
                    aria-label={label}
                  />
                  <strong>{formatValue(reading[key], UNITS[index])}</strong>
                </label>
              );
            })}
          </div>

          <div className="lab-record-selector">
            <label htmlFor="lab-record-id">Select exact saved record</label>
            <input
              id="lab-record-id"
              type="range"
              min="0"
              max="999"
              value={activeRecordId}
              onChange={(event) => exp.selectRecord(event.target.value)}
            />
            <strong>#{activeRecordId}</strong>
          </div>

          <div className="lab-ws-controls">
            <label htmlFor="lab-ws-url">ESP32 WebSocket (optional)</label>
            <div>
              <input id="lab-ws-url" value={wsUrl} onChange={(event) => setWsUrl(event.target.value)} aria-label="ESP32 WebSocket URL" />
              <button type="button" onClick={() => (liveBoard.status === 'connected' || liveBoard.status === 'connecting' ? liveBoard.disconnect() : liveBoard.connect(wsUrl))}>
                {liveBoard.status === 'connected' || liveBoard.status === 'connecting' ? 'Disconnect' : 'Connect'}
              </button>
            </div>
            {liveBoard.lastError && <p className="lab-error">{liveBoard.lastError}</p>}
          </div>
        </section>
      </div>

      <section className="lab-match-panel">
        <div className="lab-match-summary">
          <div>
            <span className="lab-panel-label">Matched saved record</span>
            <strong>#{activeRecordId} · {activeRecord.label === 1 ? 'Deviation' : 'Normal'}</strong>
            <small>Origin: {exp.inputOrigin} · {activeScenario?.label || 'Free-form reading'}</small>
          </div>
          <div>
            <span className="lab-panel-label">Normalized distance</span>
            <strong>{requestedDistance}</strong>
            <small>{match.exact ? 'Exact saved case' : 'Nearest saved case; not a confidence score'}</small>
          </div>
        </div>
        <div className="lab-readings">
          <ReadingGrid title="Requested reading" reading={requestedPhysical} />
          <ReadingGrid title="Effective saved reading" reading={effectiveReading} />
        </div>
      </section>

      <div className="lab-data-grid">
        <section className="lab-data-panel">
          <div className="lab-panel-header">
            <div><span className="lab-panel-label">Saved feature readout</span><h2>Seven quantum observables</h2></div>
            <span className="lab-record-id">#{activeRecordId}</span>
          </div>
          <div className="lab-observable-grid">
            {observables.map((observable) => (
              <div key={observable.key}>
                <span>{observable.key}</span>
                <strong>{observable.value.toFixed(4)}</strong>
              </div>
            ))}
          </div>
        </section>
        <section className="lab-data-panel">
          <div className="lab-panel-header">
            <div><span className="lab-panel-label">Saved model scores</span><h2>Same matched record</h2></div>
          </div>
          <div className="lab-score-grid">
            <ScoreCard label="Classical" score={exp.classicalScore} threshold={exp.classicalThreshold} alert={exp.classicalAlert} />
            <ScoreCard label="Quantum" score={exp.quantumScore} threshold={exp.quantumThreshold} alert={exp.quantumAlert} />
          </div>
          <p className="lab-note">Scores are precomputed per saved case. This Lab does not generate an HGB score.</p>
        </section>
      </div>

      <section className="lab-data-panel">
        <div className="lab-panel-header">
          <div><span className="lab-panel-label">Synchronized feature view</span><h2>Active record highlighted in two projections</h2></div>
        </div>
        <div className="lab-scatter-grid">
          <div><span>Raw: {RAW[0]} vs {RAW[1]}</span><Scatter points={selectedRawPoints} labels={LABELS} highlight={activeRecordId} xLabel={RAW[0]} yLabel={RAW[1]} accent="var(--color-brand)" /></div>
          <div><span>Quantum: {QNAMES_SHORT[1]} vs {QNAMES_SHORT[5]}</span><Scatter points={selectedQuantumPoints} labels={LABELS} highlight={activeRecordId} xLabel={QNAMES_SHORT[1]} yLabel={QNAMES_SHORT[5]} accent="var(--color-brand-bright)" /></div>
        </div>
      </section>

      <div className="lab-footer">
        <span>ESP32 input is optional; disconnecting it leaves simulated mode available.</span>
        <Link className="shell-nav-button" to="/experience">Back to menu</Link>
      </div>
    </section>
  );
}
