import { useEffect, useRef } from 'react';
import { PHYSICAL_RANGES, SLIDER_FIELDS, midpointReading } from '../../data/calibration.js';
import { STAGED_SCENARIOS } from '../../data/stagedScenarios.js';

export { midpointReading };

/* On-screen stand-in for the physical potentiometers — drag a slider and it
   drives the same scoring path a real board message would (useLiveBoard's
   applyReading). Automatically snaps to the closest of the 1000 real Kipu test records. */
export function SimulatedBoardPanel({
  isSimulating,
  reading,
  result,
  onStart,
  onChange,
  onUpdate,
  onStop,
}) {
  const handleUpdate = onChange || onUpdate;
  const hasAutoStarted = useRef(false);

  // Auto-initialize simulation once, the first time the panel is opened
  useEffect(() => {
    if (!hasAutoStarted.current && !isSimulating && onStart) {
      hasAutoStarted.current = true;
      onStart(midpointReading());
    }
  }, [isSimulating, onStart]);

  const engage = (nextReading) => {
    if (!isSimulating && onStart) {
      onStart(nextReading);
    } else if (handleUpdate) {
      handleUpdate(nextReading);
    }
  };

  const activeReading = reading || midpointReading();

  return (
    <div className="sim-board">
      <div className="sim-board-presets no-drag">
        {STAGED_SCENARIOS.map((scenario) => (
          <button
            key={scenario.id}
            type="button"
            className="sim-preset-btn no-drag"
            title={scenario.narrative}
            onClick={() => engage(scenario.reading)}
          >
            {scenario.label}
          </button>
        ))}
      </div>

      {result?.matchedRecord && (
        <div className="sim-snap-info-box no-drag">
          <div className="sim-snap-header">
            <span className="sim-snap-badge">
              📍 Snapped: Real Kipu Case #{result.recordId}
            </span>
            <span
              className="sim-snap-similarity"
              title="Normalized 4D Euclidean distance to precomputed test record"
            >
              {result.exact || result.distance === 0
                ? 'Exact match (dist: 0)'
                : `Distance: ${result.distance}`}
            </span>
          </div>
          <div className="sim-snap-detail">
            <span className="sim-snap-label">Ground Truth:</span>
            <strong className={result.label === 1 ? 'is-anomaly' : 'is-healthy'}>
              {result.label === 1 ? '⚠️ DEVIATION (Real Anomaly)' : '✓ HEALTHY (Normal)'}
            </strong>
          </div>
        </div>
      )}

      {SLIDER_FIELDS.map(({ key, label }) => {
        const { min, max, unit } = PHYSICAL_RANGES[key];
        const step = Math.max(0.1, (max - min) / 200);
        const currentValue = activeReading[key] ?? ((min + max) / 2);

        return (
          <div className="sim-slider-row" key={key}>
            <div className="sim-slider-label">
              <span>{label}</span>
              <strong>
                {Number(currentValue).toFixed(1)} {unit}
              </strong>
            </div>
            <input
              type="range"
              className="sim-slider no-drag"
              min={min}
              max={max}
              step={step}
              value={currentValue}
              onChange={(e) =>
                engage({
                  ...activeReading,
                  [key]: Number(e.target.value),
                })
              }
            />
          </div>
        );
      })}

      <div className="sim-board-footer no-drag">
        {onStop && (
          <button
            type="button"
            className="sim-exit-btn no-drag"
            onClick={onStop}
          >
            Reset Simulator
          </button>
        )}
      </div>
    </div>
  );
}
