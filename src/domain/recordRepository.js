/**
 * @file recordRepository.js
 * Domain repository providing strictly-typed, validated access to individual precomputed records.
 *
 * Ground rules:
 * - 1000 test cases precomputed by Kipu offline using ibm_aer backend.
 * - Each record has 4 raw sensors, 7 quantum features, label, and precomputed classical/quantum scores.
 * - No on-the-fly generation of qFeatures or scores; values are read directly from canonical storage.
 */

import realCasesBundle from '../data/realCases.json' with { type: 'json' };
import { QUANTUM_OBSERVABLES, RAW_SENSORS } from './featureCatalog.js';

// Invariant assertions
if (!realCasesBundle || !Array.isArray(realCasesBundle.records)) {
  throw new Error('[RecordRepository] Critical error: realCases.json is missing or corrupted.');
}

if (realCasesBundle.records.length !== 1000) {
  throw new Error(
    `[RecordRepository] Invariant violation: expected 1000 records, got ${realCasesBundle.records.length}`
  );
}

// Pre-validate every single record on module load
for (let i = 0; i < realCasesBundle.records.length; i++) {
  const r = realCasesBundle.records[i];
  if (r.id !== i) {
    throw new Error(`[RecordRepository] ID mismatch at index ${i}: record.id is ${r.id}`);
  }
  if (!Array.isArray(r.sensors) || r.sensors.length !== 4) {
    throw new Error(`[RecordRepository] Record ${i} does not have exactly 4 normalized sensors.`);
  }
  if (!Array.isArray(r.qFeatures) || r.qFeatures.length !== 7) {
    throw new Error(`[RecordRepository] Record ${i} does not have exactly 7 quantum observables.`);
  }
  if (typeof r.label !== 'number' || (r.label !== 0 && r.label !== 1)) {
    throw new Error(`[RecordRepository] Record ${i} has invalid label: ${r.label}`);
  }
}

const RECORDS = Object.freeze(realCasesBundle.records);
const SCALER = Object.freeze(realCasesBundle.scaler);
const TOTAL_COUNT = RECORDS.length;

/**
 * Retrieves a single record by ID.
 * @param {number} id - Record ID (0 to 999)
 * @returns {object} Immutable record object
 */
export function getRecord(id) {
  if (typeof id !== 'number' || !Number.isInteger(id)) {
    throw new TypeError(`[RecordRepository] Record ID must be an integer, got: ${typeof id}`);
  }
  if (id < 0 || id >= TOTAL_COUNT) {
    throw new RangeError(
      `[RecordRepository] Record ID out of bounds: ${id}. Valid range is [0, ${TOTAL_COUNT - 1}].`
    );
  }
  return RECORDS[id];
}

/**
 * Returns all 1000 precomputed records.
 * @returns {readonly object[]}
 */
export function getAllRecords() {
  return RECORDS;
}

/**
 * Returns total count of records.
 * @returns {number} 1000
 */
export function getRecordsCount() {
  return TOTAL_COUNT;
}

/**
 * Returns the 7 quantum observables for a given record, decorated with metadata.
 * @param {number} id
 * @returns {Array<{ key: string, pauli: string, label: string, value: number, type: string }>}
 */
export function getQuantumObservables(id) {
  const record = getRecord(id);
  return QUANTUM_OBSERVABLES.map((meta, i) => ({
    ...meta,
    value: record.qFeatures[i],
  }));
}

/**
 * Returns physical and normalized sensor values for a record.
 * @param {number} id
 */
export function getPhysicalSensors(id) {
  const record = getRecord(id);
  return {
    sensors: [...record.sensors],
    rawSensors: { ...record.rawSensors },
    display: { ...record.display },
    channels: RAW_SENSORS.map((meta, i) => ({
      ...meta,
      normalizedValue: record.sensors[i],
      rawValue: record.rawSensors[meta.key],
      displayValue: record.display?.[meta.key] ?? `${record.rawSensors[meta.key]} ${meta.unit}`,
    })),
  };
}

/**
 * Returns dataset summary and ground-truth balance.
 */
export function getDatasetSummary() {
  let normalCount = 0;
  let deviationCount = 0;

  for (let i = 0; i < TOTAL_COUNT; i++) {
    if (RECORDS[i].label === 1) deviationCount++;
    else normalCount++;
  }

  return {
    totalRecords: TOTAL_COUNT,
    normalCount,
    deviationCount,
    normalPercentage: (normalCount / TOTAL_COUNT) * 100,
    deviationPercentage: (deviationCount / TOTAL_COUNT) * 100,
    scaler: SCALER,
    source: realCasesBundle.source || 'Kipu Quantum Hub Real Execution (1000 Test Records)',
  };
}
