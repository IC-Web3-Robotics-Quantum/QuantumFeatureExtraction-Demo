import { findNearestRecord } from '../domain/nearestRecord.js';
import { getRecord, getAllRecords } from '../domain/recordRepository.js';
import realCases from '../data/realCases.json' with { type: 'json' };
import frozenModel from '../data/frozenModel.json' with { type: 'json' };
import kipuCloudModel from '../data/kipuCloudModel.json' with { type: 'json' };

/**
 * Find nearest real record - delegates to canonical domain implementation.
 */
export function findNearestRealRecord(physicalReading, records = getAllRecords()) {
  const match = findNearestRecord(physicalReading, records);
  // Maximum possible distance in 4D unit hypercube is sqrt(4) = 2.0
  const similarity = Math.max(0, (1 - match.distance / 2) * 100);

  return {
    bestRecord: match.matchedRecord,
    distance: match.distance,
    exact: match.exact,
    similarity: Number(similarity.toFixed(1)),
  };
}

/**
 * Scores a physical reading by matching to the closest real sample evaluated by Kipu.
 * Returns exact precomputed 7 quantum observables (Xq) and ground-truth validation.
 */
export function liveScore(physicalReading, activeModel = realCases || kipuCloudModel || frozenModel) {
  const model = activeModel?.classical ? activeModel : realCases;
  const snap = findNearestRealRecord(physicalReading);
  const r = snap?.bestRecord || getRecord(0);

  const classicalThreshold = model.classical?.op?.threshold ?? model.classical?.threshold ?? 0.2231;
  const quantumThreshold = model.quantum?.op?.threshold ?? model.quantum?.threshold ?? 0.2097;

  const classicalScore = r.classicalScore;
  const quantumScore = r.quantumScore;
  const classicalAlert = classicalScore >= classicalThreshold;
  const quantumAlert = quantumScore >= quantumThreshold;

  return {
    matchedRecord: r,
    recordId: r.id,
    distance: snap.distance,
    exact: snap.exact,
    similarity: snap.similarity,
    x: r.sensors,
    rawSensors: r.rawSensors,
    display: r.display,
    qx: r.qFeatures,
    label: r.label,
    classicalScore,
    classicalThreshold,
    classicalAlert,
    quantumScore,
    quantumThreshold,
    quantumAlert,
    userReading: physicalReading,
    modelSource: 'Kipu Quantum Hub Real Execution (1000 Test Records)',
  };
}

export { frozenModel, kipuCloudModel, realCases };
