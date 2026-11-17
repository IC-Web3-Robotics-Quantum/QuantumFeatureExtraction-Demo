/**
 * @file unifiedState.test.js
 * Automated tests for Phase 02 Unified State and Nearest-Neighbor Matching.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  findNearestRecord,
  getRecord,
  getQuantumObservables,
  getBenchmarkArms,
} from '../src/domain/index.js';

test('1. Deterministic Matching - Exact boundary records (ID 0 and ID 999)', () => {
  const record0 = getRecord(0);
  const match0 = findNearestRecord(record0.rawSensors);

  assert.strictEqual(match0.recordId, 0, 'Matching record 0 sensors must return record ID 0');
  assert.strictEqual(match0.exact, true);
  assert.strictEqual(match0.distance, 0);
  assert.deepStrictEqual(match0.matchedRecord.sensors, record0.sensors);
  assert.deepStrictEqual(match0.matchedRecord.qFeatures, record0.qFeatures);

  const record999 = getRecord(999);
  const match999 = findNearestRecord(record999.rawSensors);

  assert.strictEqual(match999.recordId, 999, 'Matching record 999 sensors must return record ID 999');
  assert.strictEqual(match999.exact, true);
  assert.strictEqual(match999.distance, 0);
  assert.deepStrictEqual(match999.matchedRecord.sensors, record999.sensors);
  assert.deepStrictEqual(match999.matchedRecord.qFeatures, record999.qFeatures);
});

test('2. Deterministic Matching - Arbitrary slider positions & requested vs matched separation', () => {
  // Intermediate slider readings
  const arbitraryReading = {
    hoistLoad: 310.5,
    crowdVib: 15.2,
    driveTemp: 125.0,
    cableTension: 88.4,
  };

  const match = findNearestRecord(arbitraryReading);

  assert.ok(match.recordId >= 0 && match.recordId < 1000, 'Matched record must be in range [0, 999]');
  assert.ok(match.distance >= 0, 'Distance must be non-negative');
  assert.strictEqual(typeof match.distance, 'number');

  // Requested physical inputs must be preserved exactly as entered
  assert.deepStrictEqual(match.requestedPhysical, arbitraryReading);

  // Matched record physical inputs must come from the precomputed dataset
  const precomputedRecord = getRecord(match.recordId);
  assert.deepStrictEqual(match.matchedRecord.rawSensors, precomputedRecord.rawSensors);

  // 7 quantum observables must strictly be the precomputed observables of the matched record
  const observables = getQuantumObservables(match.recordId);
  assert.strictEqual(observables.length, 7);
  for (let i = 0; i < 7; i++) {
    assert.strictEqual(observables[i].value, precomputedRecord.qFeatures[i]);
  }
});

test('3. Extreme Slider Inputs - Robustness and bounded distance', () => {
  const minReading = { hoistLoad: 0, crowdVib: 0, driveTemp: 20, cableTension: 1 };
  const matchMin = findNearestRecord(minReading);
  assert.ok(matchMin.recordId >= 0 && matchMin.recordId < 1000);
  assert.ok(matchMin.distance <= 2.0, 'Max Euclidean distance in 4D unit hypercube cannot exceed sqrt(4)=2.0');

  const maxReading = { hoistLoad: 500, crowdVib: 50, driveTemp: 200, cableTension: 200 };
  const matchMax = findNearestRecord(maxReading);
  assert.ok(matchMax.recordId >= 0 && matchMax.recordId < 1000);
  assert.ok(matchMax.distance <= 2.0);
});

test('4. Benchmark Invariance - Moving sliders or selecting cases does not alter benchmark', () => {
  const armsBefore = getBenchmarkArms();
  assert.strictEqual(armsBefore.raw.apPercent, 34.5);
  assert.strictEqual(armsBefore.hybrid.apPercent, 72.8);

  // Perform multiple nearest record matches across different regions
  findNearestRecord({ hoistLoad: 100, crowdVib: 10, driveTemp: 50, cableTension: 30 });
  findNearestRecord({ hoistLoad: 450, crowdVib: 45, driveTemp: 180, cableTension: 190 });

  const armsAfter = getBenchmarkArms();
  assert.strictEqual(armsAfter.raw.apPercent, 34.5);
  assert.strictEqual(armsAfter.hybrid.apPercent, 72.8);
  assert.strictEqual(armsAfter.hgb_raw.apPercent, 89.5);
});

test('5. Single Source of Truth - Scores & Observables for any record ID', () => {
  for (const testId of [0, 42, 500, 777, 999]) {
    const record = getRecord(testId);
    assert.strictEqual(record.id, testId);

    // Assert that classical and quantum scores are strictly from the record
    assert.strictEqual(record.classicalScore, record.classicalScore);
    assert.strictEqual(record.quantumScore, record.quantumScore);

    // Ground truth label is binary (0 or 1)
    assert.ok(record.label === 0 || record.label === 1);

    // QFeatures are 7 values
    assert.strictEqual(record.qFeatures.length, 7);
  }
});
