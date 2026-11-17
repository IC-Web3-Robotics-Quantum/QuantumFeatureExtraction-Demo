import { useState } from 'react';
import { MachineDiagram } from '../MachineDiagram/MachineDiagram.jsx';
import { SensorCard } from '../SensorCard/SensorCard.jsx';
import { C, RAW, UNITS } from '../../data/constants.js';
import { STAGED_SCENARIOS } from '../../data/stagedScenarios.js';
import { useExperience } from '../../context/ExperienceContext.jsx';

const SENSOR_KEYS = ['hoistLoad', 'crowdVib', 'driveTemp', 'cableTension'];
const SENSOR_MARKERS = [
  { left: '72%', top: '8%' },
  { left: '50%', top: '31%' },
  { left: '29%', top: '51%' },
  { left: '77%', top: '63%' },
];

function formatReading(value, unit) {
  return `${Number(value ?? 0).toFixed(1)} ${unit}`;
}

export function ChallengeScene() {
  const { activeRecord, activeRecordId, match, requestedPhysical, selectRecord } = useExperience();
  const [selectedSensor, setSelectedSensor] = useState(0);
  const sensorColors = [C.interaction, C.deviation, C.warning, C.classicalLight];
  const effectiveReadings = SENSOR_KEYS.map((key) => activeRecord.rawSensors[key]);

  const applyScenario = (scenario) => {
    // Curated cases point to a saved record: select it exactly (distance 0).
    selectRecord(scenario.recordId, 'preset');
  };

  return (
    <section className="challenge-scene">
      <div className="challenge-heading">
        <div>
          <span className="shell-eyebrow">The challenge</span>
          <h1>What can industrial telemetry reveal?</h1>
          <p>
            Four physical signals from an electric rope shovel are the starting point.
            Explore one case before seeing how its features are transformed.
          </p>
        </div>
        <span className="challenge-note">Synthetic industrial scenario</span>
      </div>

      <div className="challenge-layout">
        <div className="challenge-machine-panel">
          <div className="challenge-panel-label">Electric rope shovel</div>
          <div className="challenge-machine">
            <MachineDiagram alert={false} label={0} mode="quantum" />
            {SENSOR_MARKERS.map((marker, index) => (
              <button
                type="button"
                key={RAW[index]}
                className={`challenge-marker ${selectedSensor === index ? 'is-selected' : ''}`}
                style={marker}
                aria-label={`Inspect ${RAW[index]}`}
                aria-pressed={selectedSensor === index}
                onClick={() => setSelectedSensor(index)}
              >
                {index + 1}
              </button>
            ))}
          </div>
          <div className="challenge-machine-caption">
            Select a numbered point to inspect its signal.
          </div>
        </div>

        <div className="challenge-readings-panel">
          <div className="challenge-panel-label">Matched saved record #{activeRecordId}</div>
          <div className="challenge-condition">
            <span className={`challenge-condition-dot ${activeRecord.label === 1 ? 'is-deviation' : 'is-normal'}`} />
            <strong>{activeRecord.label === 1 ? 'Deviation label' : 'Normal label'}</strong>
            <span>from the saved dataset</span>
          </div>
          <div className="challenge-sensor-grid">
            {RAW.map((name, index) => (
              <button
                type="button"
                className={`challenge-sensor ${selectedSensor === index ? 'is-selected' : ''}`}
                key={name}
                onClick={() => setSelectedSensor(index)}
              >
                <SensorCard
                  name={name}
                  value={activeRecord.sensors[index]}
                  unit={UNITS[index]}
                  color={sensorColors[index]}
                  displayText={formatReading(effectiveReadings[index], UNITS[index])}
                />
              </button>
            ))}
          </div>
          <div className="challenge-selected-reading">
            <span className="challenge-panel-label">Selected signal</span>
            <strong>{RAW[selectedSensor]}</strong>
            <span>{formatReading(effectiveReadings[selectedSensor], UNITS[selectedSensor])}</span>
          </div>
        </div>
      </div>

      <div className="challenge-controls">
        <div>
          <span className="challenge-panel-label">Curated saved cases</span>
          <div className="challenge-presets">
            {STAGED_SCENARIOS.map((scenario) => (
              <button type="button" key={scenario.id} onClick={() => applyScenario(scenario)}>
                Case #{scenario.recordId}
              </button>
            ))}
          </div>
        </div>
        <label className="challenge-record-control">
          <span className="challenge-panel-label">Select saved record</span>
          <input
            type="range"
            min="0"
            max="999"
            value={activeRecordId}
            onChange={(event) => selectRecord(Number(event.target.value))}
          />
          <span>#{activeRecordId}</span>
        </label>
      </div>

      <div className="challenge-match">
        <div>
          <span className="challenge-panel-label">Requested reading</span>
          <strong>{formatReading(requestedPhysical[SENSOR_KEYS[selectedSensor]], UNITS[selectedSensor])}</strong>
          <small>{match.exact ? 'Exact saved case' : 'Nearest saved case selected'}</small>
        </div>
        <div>
          <span className="challenge-panel-label">Effective saved reading</span>
          <strong>{formatReading(effectiveReadings[selectedSensor], UNITS[selectedSensor])}</strong>
          <small>{match.exact ? 'Distance 0' : `Match distance ${match.distance.toFixed(4)}`}</small>
        </div>
      </div>

      <div className="challenge-footer">
        <span>Same four signals, one synchronized record.</span>
      </div>
    </section>
  );
}
