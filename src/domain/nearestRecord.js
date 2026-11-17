/**
 * @file nearestRecord.js
 * Domain algorithm for deterministic nearest-neighbor matching across
 * precomputed benchmark records.
 *
 * Ground rules:
 * - Operates strictly on the 1000 validated cases in recordRepository.
 * - Normalizes physical readings using calibration.physicalToUnit().
 * - Normalized Euclidean distance in 4D hypercube: D = sqrt(sum((x_i - s_i)^2)).
 * - Deterministic tie-breaking: strictly lower index wins.
 * - Distinguishes between requested reading and matched record reading.
 * - Reports Euclidean distance; does NOT present similarity as a statistical probability.
 */

import { getAllRecords } from './recordRepository.js';
import { physicalToUnit } from '../data/calibration.js';

/**
 * Finds the nearest precomputed record in the 1000 evaluated test records.
 * @param {{ hoistLoad: number, crowdVib: number, driveTemp: number, cableTension: number }} physicalReading
 * @param {Array<object>} [records] - Optional records array (defaults to canonical repository)
 * @returns {{
 *   matchedRecord: object,
 *   recordId: number,
 *   distance: number,
 *   exact: boolean,
 *   normalizedTarget: number[],
 *   requestedPhysical: object
 * }}
 */
export function findNearestRecord(physicalReading, records = getAllRecords()) {
  if (!records || records.length === 0) {
    throw new Error('[NearestRecord] No records available for nearest-neighbor search.');
  }

  if (!physicalReading || typeof physicalReading !== 'object') {
    throw new TypeError('[NearestRecord] physicalReading must be an object with sensor values.');
  }

  const normalizedTarget = physicalToUnit(physicalReading);

  let bestRecord = records[0];
  let bestDistSq = Infinity;

  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    const s = r.sensors;
    const d0 = normalizedTarget[0] - s[0];
    const d1 = normalizedTarget[1] - s[1];
    const d2 = normalizedTarget[2] - s[2];
    const d3 = normalizedTarget[3] - s[3];

    const distSq = d0 * d0 + d1 * d1 + d2 * d2 + d3 * d3;

    // Strict inequality enforces deterministic lowest-index tie breaking
    if (distSq < bestDistSq) {
      bestDistSq = distSq;
      bestRecord = r;
    }
  }

  const distance = Math.sqrt(bestDistSq);
  const exact = distance < 1e-5;

  return {
    matchedRecord: bestRecord,
    recordId: bestRecord.id,
    distance: Number(distance.toFixed(4)),
    exact,
    normalizedTarget,
    requestedPhysical: { ...physicalReading },
  };
}
