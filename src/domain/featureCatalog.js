/**
 * @file featureCatalog.js
 * Domain catalog for sensors, quantum observables, and representation dimensions.
 * Normalizes labels, ordering, and mappings between UI and benchmark artifacts.
 *
 * NOTE: The benchmark Python run had classical column names in a different order
 * than the UI rawNames:
 *   UI / realCases.rawNames:
 *     [0] 'Hoist Load' (hoistLoad)
 *     [1] 'Crowd Vib.' (crowdVib)
 *     [2] 'Drive Temp.' (driveTemp)
 *     [3] 'Cable Tension' (cableTension)
 *   cloudMetrics.run.classical_column_names:
 *     [0] 'cable_tension_MPa'
 *     [1] 'crowd_vibration_mms'
 *     [2] 'hoist_load_kN'
 *     [3] 'drive_temp_C'
 * This module ensures explicit key-based mapping rather than assuming identical index order.
 */

export const RAW_SENSORS = Object.freeze([
  {
    index: 0,
    key: 'hoistLoad',
    label: 'Hoist Load',
    shortLabel: 'Hoist',
    pythonCol: 'hoist_load_kN',
    unit: 'kN',
    min: 0,
    max: 500,
    description: 'Main electric winch motor load lifting the mining shovel bucket.',
    colorToken: 'var(--color-interaction, #00DFED)',
  },
  {
    index: 1,
    key: 'crowdVib',
    label: 'Crowd Vib.',
    shortLabel: 'Vibration',
    pythonCol: 'crowd_vibration_mms',
    unit: 'mm/s',
    min: 0,
    max: 50,
    description: 'Radial crowd arm vibration detecting structural shudder during digging.',
    colorToken: 'var(--color-warning, #FF7A00)',
  },
  {
    index: 2,
    key: 'driveTemp',
    label: 'Drive Temp.',
    shortLabel: 'Temp',
    pythonCol: 'drive_temp_C',
    unit: '°C',
    min: 20,
    max: 200,
    description: 'Operating temperature of main motor drive inverter and gearbox.',
    colorToken: 'var(--color-brand-bright, #19A3FC)',
  },
  {
    index: 3,
    key: 'cableTension',
    label: 'Cable Tension',
    shortLabel: 'Tension',
    pythonCol: 'cable_tension_MPa',
    unit: 'MPa',
    min: 1,
    max: 200,
    description: 'Mechanical tension measured on the primary suspension hoist cables.',
    colorToken: 'var(--color-brand-strong, #005B96)',
  },
]);

export const QUANTUM_OBSERVABLES = Object.freeze([
  {
    index: 0,
    key: 'q0',
    pauli: '⟨Z₀⟩',
    label: '⟨Z₀⟩ (Hoist Load)',
    type: 'single_body',
    mappedFrom: ['hoistLoad'],
    qubits: [0],
    description: 'Expectation value of Pauli Z on qubit 0 (encoded from Hoist Load).',
  },
  {
    index: 1,
    key: 'q1',
    pauli: '⟨Z₁⟩',
    label: '⟨Z₁⟩ (Crowd Vib)',
    type: 'single_body',
    mappedFrom: ['crowdVib'],
    qubits: [1],
    description: 'Expectation value of Pauli Z on qubit 1 (encoded from Crowd Vibration).',
  },
  {
    index: 2,
    key: 'q2',
    pauli: '⟨Z₂⟩',
    label: '⟨Z₂⟩ (Drive Temp)',
    type: 'single_body',
    mappedFrom: ['driveTemp'],
    qubits: [2],
    description: 'Expectation value of Pauli Z on qubit 2 (encoded from Drive Temperature).',
  },
  {
    index: 3,
    key: 'q3',
    pauli: '⟨Z₃⟩',
    label: '⟨Z₃⟩ (Cable Tension)',
    type: 'single_body',
    mappedFrom: ['cableTension'],
    qubits: [3],
    description: 'Expectation value of Pauli Z on qubit 3 (encoded from Cable Tension).',
  },
  {
    index: 4,
    key: 'corr_0_1',
    pauli: '⟨Z₀Z₁⟩',
    label: '⟨Z₀Z₁⟩ (Hoist × Crowd)',
    type: 'two_body',
    mappedFrom: ['hoistLoad', 'crowdVib'],
    qubits: [0, 1],
    description: 'Two-body correlation observable between Hoist Load and Crowd Vibration.',
  },
  {
    index: 5,
    key: 'corr_1_2',
    pauli: '⟨Z₁Z₂⟩',
    label: '⟨Z₁Z₂⟩ (Crowd × Temp)',
    type: 'two_body',
    mappedFrom: ['crowdVib', 'driveTemp'],
    qubits: [1, 2],
    description: 'Two-body correlation observable between Crowd Vibration and Drive Temperature. Highest Fisher separability score in the benchmark.',
  },
  {
    index: 6,
    key: 'corr_1_3',
    pauli: '⟨Z₁Z₃⟩',
    label: '⟨Z₁Z₃⟩ (Crowd × Tension)',
    type: 'two_body',
    mappedFrom: ['crowdVib', 'cableTension'],
    qubits: [1, 3],
    description: 'Two-body correlation observable between Crowd Vibration and Cable Tension.',
  },
]);

export const DIMENSIONALITY_STAGES = Object.freeze([
  {
    stage: 'raw',
    count: 4,
    title: 'Raw Sensor Space',
    formula: '4 signals',
    description: 'Original physical channels: Hoist Load, Crowd Vib, Drive Temp, Cable Tension.',
    isLinearSeparable: false,
  },
  {
    stage: 'quantum',
    count: 7,
    title: 'Quantum Observable Space',
    formula: '4 single-body + 3 correlators',
    description: 'Expectation values of Pauli observables measured after counterdiabatic evolution.',
    isLinearSeparable: true,
  },
  {
    stage: 'hybrid',
    count: 11,
    title: 'Hybrid Feature Space',
    formula: '4 raw + 7 quantum = 11 features',
    description: 'Combined representation uniting classical signals and quantum correlators for linear classification.',
    isLinearSeparable: true,
  },
]);

export function getAllRawSensors() {
  return RAW_SENSORS;
}

export function getAllQuantumObservables() {
  return QUANTUM_OBSERVABLES;
}

export function getRawSensorByKey(key) {
  const sensor = RAW_SENSORS.find((s) => s.key === key);
  if (!sensor) throw new Error(`[FeatureCatalog] Unknown raw sensor key: ${key}`);
  return sensor;
}

export function getRawSensorByIndex(idx) {
  const sensor = RAW_SENSORS[idx];
  if (!sensor) throw new Error(`[FeatureCatalog] Raw sensor index out of bounds: ${idx}`);
  return sensor;
}

export function getQuantumObservableByKey(key) {
  const obs = QUANTUM_OBSERVABLES.find((q) => q.key === key);
  if (!obs) throw new Error(`[FeatureCatalog] Unknown quantum observable key: ${key}`);
  return obs;
}

export function getQuantumObservableByIndex(idx) {
  const obs = QUANTUM_OBSERVABLES[idx];
  if (!obs) throw new Error(`[FeatureCatalog] Quantum observable index out of bounds: ${idx}`);
  return obs;
}

/**
 * Validates sensor order compatibility between UI and benchmark run metadata.
 * @param {string[]} pythonRunColumns
 * @returns {{ matchesDirectly: boolean, mapping: object }}
 */
export function checkSensorOrdering(pythonRunColumns = []) {
  const uiSensorKeys = RAW_SENSORS.map((s) => s.pythonCol);
  const matchesDirectly =
    pythonRunColumns.length === uiSensorKeys.length &&
    pythonRunColumns.every((col, i) => col === uiSensorKeys[i]);

  const mapping = RAW_SENSORS.reduce((acc, sensor) => {
    const pythonIdx = pythonRunColumns.indexOf(sensor.pythonCol);
    acc[sensor.key] = {
      uiIndex: sensor.index,
      pythonCol: sensor.pythonCol,
      pythonIndex: pythonIdx,
    };
    return acc;
  }, {});

  return { matchesDirectly, mapping };
}
