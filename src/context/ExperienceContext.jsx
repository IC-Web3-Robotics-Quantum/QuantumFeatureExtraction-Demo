/**
 * @file ExperienceContext.jsx
 * Unified state provider for NTT DATA × Kipu Quantum Feature Mapping.
 *
 * Ground rules:
 * - Single source of truth for: activeRecordId, requestedPhysical, inputOrigin,
 *   match metadata, selectedRepresentation, selectedAxes, activeModelView, labInputMode.
 * - selectRecord(id): exact match on precomputed record (distance = 0, exact = true).
 * - setRequestedReading(reading, origin): snaps via findNearestRecord(reading),
 *   storing requested physical inputs separated from effective matched record.
 * - Readout of 7 quantum observables and scores strictly reads from the matched record.
 * - Plant Noise is strictly isolated to exploratory data perturbation mode and does not alter
 *   the canonical record or benchmark metrics.
 */

import { createContext, useContext, useState, useMemo, useCallback } from 'react';
import {
  getRecord,
  getRecordsCount,
  getQuantumObservables,
  getPhysicalSensors,
  getOperationalThresholds,
  findNearestRecord,
  getBenchmarkArms,
  getHeadlineComparison,
  getBenchmarkProtocol,
} from '../domain/index.js';
import { C } from '../data/constants.js';

const ExperienceContext = createContext(null);

export const DEFAULT_RECORD_ID = 0;
const initialRecord = getRecord(DEFAULT_RECORD_ID);

export function ExperienceProvider({ children }) {
  // Core unified state
  const [activeRecordId, setActiveRecordId] = useState(DEFAULT_RECORD_ID);
  const [requestedPhysical, setRequestedPhysical] = useState(() => ({ ...initialRecord.rawSensors }));
  const [inputOrigin, setInputOrigin] = useState('record'); // 'record' | 'sliders' | 'preset' | 'esp32'
  const [match, setMatch] = useState(() => ({
    recordId: DEFAULT_RECORD_ID,
    distance: 0,
    exact: true,
  }));

  // Visual exploration state
  const [selectedRepresentation, setSelectedRepresentation] = useState('quantum'); // 'raw' | 'quantum' | 'hybrid'
  const [selectedAxes, setSelectedAxes] = useState({
    raw: [0, 1], // Hoist Load vs Crowd Vib.
    quantum: [1, 5], // Crowd Vib ⟨Z₁⟩ vs Crowd × Temp ⟨Z₁Z₂⟩ (dominant Fisher feature)
  });
  const [activeModelView, setActiveModelView] = useState('quantum'); // 'classical' | 'quantum'
  const [labInputMode, setLabInputMode] = useState('simulated'); // 'simulated' | 'esp32'

  // Plant noise: strictly isolated exploratory perturbation
  const [noise, setNoise] = useState(1);

  /**
   * Selects an exact record by ID (e.g. from record slider, table, or curated preset).
   */
  const selectRecord = useCallback((id, origin = 'record') => {
    const total = getRecordsCount();
    const clampedId = Math.max(0, Math.min(total - 1, Number(id) || 0));
    const targetRecord = getRecord(clampedId);

    setActiveRecordId(clampedId);
    setRequestedPhysical({ ...targetRecord.rawSensors });
    setMatch({
      recordId: clampedId,
      distance: 0,
      exact: true,
    });
    setInputOrigin(origin === 'preset' ? 'preset' : 'record');
  }, []);

  /**
   * Sets requested physical readings from sliders, presets, or ESP32 hardware,
   * snapping to the nearest precomputed record in the 1000 evaluated test cases.
   */
  const setRequestedReading = useCallback((reading, origin = 'sliders') => {
    if (!reading) return;

    const matchResult = findNearestRecord(reading);
    setRequestedPhysical({ ...reading });
    setMatch({
      recordId: matchResult.recordId,
      distance: matchResult.distance,
      exact: matchResult.exact,
    });
    setActiveRecordId(matchResult.recordId);
    setInputOrigin(origin);
  }, []);

  /**
   * Axis selection for scatter plots.
   */
  const setAxes = useCallback((space, axes) => {
    if (space !== 'raw' && space !== 'quantum') return;
    setSelectedAxes((prev) => ({
      ...prev,
      [space]: [axes[0], axes[1]],
    }));
  }, []);

  /**
   * Resets experience to canonical baseline state.
   */
  const resetExperience = useCallback(() => {
    selectRecord(DEFAULT_RECORD_ID);
    setSelectedRepresentation('quantum');
    setActiveModelView('quantum');
    setNoise(1);
  }, [selectRecord]);

  // Derived selectors for active record
  const activeRecord = useMemo(() => getRecord(activeRecordId), [activeRecordId]);
  const observables = useMemo(() => getQuantumObservables(activeRecordId), [activeRecordId]);
  const physicalSensors = useMemo(() => getPhysicalSensors(activeRecordId), [activeRecordId]);

  // Thresholds from canonical precomputed model
  const { classical: classicalThreshold, quantum: quantumThreshold } = getOperationalThresholds();

  const classicalScore = activeRecord.classicalScore;
  const quantumScore = activeRecord.quantumScore;
  const classicalAlert = classicalScore >= classicalThreshold;
  const quantumAlert = quantumScore >= quantumThreshold;
  const activeAlert = activeModelView === 'classical' ? classicalAlert : quantumAlert;

  const conditionColor = activeRecord.label === 1 ? C.deviation : C.healthy;

  // Formatted display values for sensors
  const displayValues = useMemo(() => {
    const raw = requestedPhysical || activeRecord.rawSensors;
    return [
      `${(raw.hoistLoad ?? 0).toFixed(1)} kN`,
      `${(raw.crowdVib ?? 0).toFixed(1)} mm/s`,
      `${(raw.driveTemp ?? 0).toFixed(1)} °C`,
      `${(raw.cableTension ?? 0).toFixed(1)} MPa`,
    ];
  }, [requestedPhysical, activeRecord]);

  // Benchmark metrics (stable, decoupled from active record)
  const benchmarkArms = useMemo(() => getBenchmarkArms(), []);
  const headlineComparison = useMemo(() => getHeadlineComparison(), []);
  const benchmarkProtocol = useMemo(() => getBenchmarkProtocol(), []);

  const value = useMemo(
    () => ({
      // State
      activeRecordId,
      requestedPhysical,
      inputOrigin,
      match,
      selectedRepresentation,
      selectedAxes,
      activeModelView,
      labInputMode,
      noise,

      // Selectors & Data
      activeRecord,
      observables,
      physicalSensors,
      displayValues,
      classicalScore,
      quantumScore,
      classicalThreshold,
      quantumThreshold,
      classicalAlert,
      quantumAlert,
      activeAlert,
      conditionColor,
      label: activeRecord.label,
      isAnomaly: activeRecord.label === 1,

      // Benchmark singletons
      benchmarkArms,
      headlineComparison,
      benchmarkProtocol,

      // Actions
      selectRecord,
      setRequestedReading,
      setSelectedRepresentation,
      setAxes,
      setActiveModelView,
      setLabInputMode,
      setNoise,
      resetExperience,
    }),
    [
      activeRecordId,
      requestedPhysical,
      inputOrigin,
      match,
      selectedRepresentation,
      selectedAxes,
      activeModelView,
      labInputMode,
      noise,
      activeRecord,
      observables,
      physicalSensors,
      displayValues,
      classicalScore,
      quantumScore,
      classicalAlert,
      quantumAlert,
      activeAlert,
      conditionColor,
      benchmarkArms,
      headlineComparison,
      benchmarkProtocol,
      selectRecord,
      setRequestedReading,
      setAxes,
      resetExperience,
    ]
  );

  return <ExperienceContext.Provider value={value}>{children}</ExperienceContext.Provider>;
}

export function useExperience() {
  const context = useContext(ExperienceContext);
  if (!context) {
    throw new Error('[useExperience] must be used within an <ExperienceProvider>');
  }
  return context;
}
