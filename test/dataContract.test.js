/**
 * @file dataContract.test.js
 * Automated offline integrity tests for Phase 01 Data Contracts.
 * Uses Node.js built-in test runner (node:test, node:assert). Zero dependencies.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  getRecord,
  getAllRecords,
  getRecordsCount,
  getQuantumObservables,
  getPhysicalSensors,
  getDatasetSummary,
  getOperationalThresholds,
  getOperatingPoints,
  getBenchmarkArms,
  getHeroBenchmarkArms,
  getHeadlineComparison,
  getFisherScores,
  getBenchmarkProtocol,
  RAW_SENSORS,
  QUANTUM_OBSERVABLES,
  DIMENSIONALITY_STAGES,
  checkSensorOrdering,
  PROVENANCE_KINDS,
  getProvenance,
  VISUALIZATION_PROVENANCE_CATALOG,
  validateDomainArtifacts,
} from '../src/domain/index.js';

test('1. Record Repository - 1000 records × 7 observables invariant', () => {
  assert.strictEqual(getRecordsCount(), 1000, 'Total record count must be exactly 1000');

  const all = getAllRecords();
  assert.strictEqual(all.length, 1000);

  const first = getRecord(0);
  assert.strictEqual(first.id, 0);
  assert.strictEqual(first.sensors.length, 4);
  assert.strictEqual(first.qFeatures.length, 7);
  assert.ok(typeof first.classicalScore === 'number');
  assert.ok(typeof first.quantumScore === 'number');

  const last = getRecord(999);
  assert.strictEqual(last.id, 999);
  assert.strictEqual(last.sensors.length, 4);
  assert.strictEqual(last.qFeatures.length, 7);

  // Out of bounds checks
  assert.throws(() => getRecord(-1), RangeError);
  assert.throws(() => getRecord(1000), RangeError);
  assert.throws(() => getRecord('abc'), TypeError);

  const observables = getQuantumObservables(0);
  assert.strictEqual(observables.length, 7);
  assert.strictEqual(observables[0].key, 'q0');
  assert.strictEqual(observables[4].key, 'corr_0_1');
  assert.strictEqual(observables[5].key, 'corr_1_2');
  assert.strictEqual(observables[6].key, 'corr_1_3');

  const physical = getPhysicalSensors(0);
  assert.strictEqual(physical.sensors.length, 4);
  assert.ok(physical.rawSensors.hoistLoad > 0);

  const summary = getDatasetSummary();
  assert.strictEqual(summary.totalRecords, 1000);
  assert.strictEqual(summary.normalCount + summary.deviationCount, 1000);

  const thresholds = getOperationalThresholds();
  assert.strictEqual(thresholds.classical, 0.2144008767667138);
  assert.strictEqual(thresholds.quantum, 0.13499867930098475);

  const points = getOperatingPoints();
  assert.strictEqual(points.classical.threshold, thresholds.classical);
  assert.strictEqual(points.quantum.threshold, thresholds.quantum);
  assert.ok(points.quantum.recall >= 0.9 && points.quantum.recall < 0.91);
});

test('2. Parity Invariant - Xq_test_0.csv matches realCases.records qFeatures with 0 diff', () => {
  const csvPath = path.resolve('datapool_artifacts/Xq_test_0.csv');
  assert.ok(fs.existsSync(csvPath), 'CSV file must exist at datapool_artifacts/Xq_test_0.csv');

  const csvContent = fs.readFileSync(csvPath, 'utf8').trim().split(/\r?\n/);
  const header = csvContent[0].trim();
  assert.strictEqual(header, 'q0,q1,q2,q3,corr_0_1,corr_1_2,corr_1_3');

  const rows = csvContent.slice(1);
  assert.strictEqual(rows.length, 1000, 'CSV must have 1000 data rows');

  const records = getAllRecords();
  let maxAbsDiff = 0;

  for (let i = 0; i < 1000; i++) {
    const csvValues = rows[i].split(',').map(Number);
    const jsonValues = records[i].qFeatures;
    assert.strictEqual(csvValues.length, 7);
    for (let j = 0; j < 7; j++) {
      const diff = Math.abs(csvValues[j] - jsonValues[j]);
      if (diff > maxAbsDiff) maxAbsDiff = diff;
    }
  }

  assert.strictEqual(maxAbsDiff, 0, 'Discrepancy between CSV and JSON qFeatures must be 0');
});

test('3. Metric Repository - Benchmark arms and headline lift', () => {
  const arms = getBenchmarkArms();
  const heroArms = getHeroBenchmarkArms();
  assert.strictEqual(heroArms.length, 3, 'Must have 3 hero arms: raw, quantum, hybrid');
  assert.ok(heroArms.every((arm) => arm.isLinear), 'All hero arms share the same linear detector');

  // Check AP values (raw: 34.5%, quantum: 68.1%, hybrid: 72.8%)
  assert.strictEqual(arms.raw.apPercent, 34.5);
  assert.strictEqual(arms.quantum.apPercent, 68.1);
  assert.strictEqual(arms.hybrid.apPercent, 72.8);
  assert.deepStrictEqual(Object.keys(arms), ['raw', 'quantum', 'hybrid']);

  // Headline comparison
  const headline = getHeadlineComparison();
  assert.strictEqual(headline.contrast, 'hybrid - raw');
  assert.strictEqual(headline.diffPercentagePoints, 38.3, 'Headline AP gain must be +38.3 percentage points');
  assert.ok(headline.pHolm < 1e-8, 'p_holm must be statistically significant (< 1e-8)');
  assert.strictEqual(headline.verdict, 'confirmed');

  // Operating benchmark at 90% recall
  assert.strictEqual(headline.precisionLift.diffPercentagePoints, 12.9);

  // Fisher scores
  const fisher = getFisherScores();
  assert.strictEqual(fisher.length, 7);
  assert.ok(fisher[5].isDominant, 'corr_1_2 must be the dominant Fisher score feature');
  assert.ok(fisher[5].fisherScore > 0.1);

  // Protocol
  const protocol = getBenchmarkProtocol();
  assert.strictEqual(protocol.backend, 'ibm_aer');
  assert.strictEqual(protocol.nFolds, 15);
  assert.strictEqual(protocol.recallTarget, 0.90);
});

test('4. Feature Catalog - Sensor and observable mappings and column ordering', () => {
  assert.strictEqual(RAW_SENSORS.length, 4);
  assert.strictEqual(QUANTUM_OBSERVABLES.length, 7);
  assert.strictEqual(DIMENSIONALITY_STAGES.length, 3);
  assert.strictEqual(DIMENSIONALITY_STAGES[0].count, 4);
  assert.strictEqual(DIMENSIONALITY_STAGES[1].count, 7);
  assert.strictEqual(DIMENSIONALITY_STAGES[2].count, 11);

  // Sensor ordering check: UI order differs from Python benchmark run column names
  const pythonCols = ['cable_tension_MPa', 'crowd_vibration_mms', 'hoist_load_kN', 'drive_temp_C'];
  const orderingCheck = checkSensorOrdering(pythonCols);
  assert.strictEqual(
    orderingCheck.matchesDirectly,
    false,
    'UI raw sensor order and Python dataframe column order must be explicitly decoupled'
  );
  assert.strictEqual(orderingCheck.mapping.hoistLoad.pythonIndex, 2);
  assert.strictEqual(orderingCheck.mapping.cableTension.pythonIndex, 0);
});

test('5. Provenance Catalog - Classification and visualization audit', () => {
  assert.ok(PROVENANCE_KINDS.PRECOMPUTED_QFE);
  assert.ok(PROVENANCE_KINDS.PRECOMPUTED_BENCHMARK);
  assert.ok(PROVENANCE_KINDS.LOCAL_DERIVED);
  assert.ok(PROVENANCE_KINDS.CONCEPTUAL);
  assert.ok(PROVENANCE_KINDS.HARDWARE_INPUT);

  const prov = getProvenance(PROVENANCE_KINDS.PRECOMPUTED_BENCHMARK);
  assert.strictEqual(prov.isRealTimeQuantum, false);
  assert.strictEqual(prov.isHardwareIBM, false);

  assert.throws(() => getProvenance('INVALID_KIND'));

  assert.ok(VISUALIZATION_PROVENANCE_CATALOG.length >= 10);
  const prCurvesItem = VISUALIZATION_PROVENANCE_CATALOG.find((v) => v.key === 'pr_curves');
  assert.strictEqual(prCurvesItem.provenance, PROVENANCE_KINDS.PRECOMPUTED_BENCHMARK);
});

test('6. Domain Artifact Validation Suite', () => {
  const csvRaw = fs.readFileSync('datapool_artifacts/Xq_test_0.csv', 'utf8');
  const result = validateDomainArtifacts(csvRaw);
  assert.strictEqual(result.valid, true, `Validation failed with errors: ${result.errors.join('; ')}`);
  assert.strictEqual(result.errors.length, 0);
  assert.strictEqual(result.summary.recordsCount, 1000);
  assert.strictEqual(result.summary.rawSensorsCount, 4);
  assert.strictEqual(result.summary.quantumObservablesCount, 7);
  assert.strictEqual(result.summary.armsEvaluated, 7);
});
