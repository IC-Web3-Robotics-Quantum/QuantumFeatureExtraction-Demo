/**
 * @file validateArtifacts.js
 * Domain integrity checker validating consistency across all data files, CSV test pools,
 * and precomputed benchmark models without network dependencies.
 */

import realCases from '../data/realCases.json' with { type: 'json' };
import kipuCloudModel from '../data/kipuCloudModel.json' with { type: 'json' };
import { RAW_SENSORS, QUANTUM_OBSERVABLES } from './featureCatalog.js';

/**
 * Validates integrity of loaded datasets and benchmark artifacts.
 * @param {string|null} csvContent - Optional raw CSV content from Xq_test_0.csv
 * @returns {{ valid: boolean, errors: string[], warnings: string[], summary: object }}
 */
export function validateDomainArtifacts(csvContent = null) {
  const errors = [];
  const warnings = [];

  // 1. Validate realCases.records
  if (!realCases || !Array.isArray(realCases.records)) {
    errors.push('realCases.json: records array is missing.');
  } else {
    if (realCases.records.length !== 1000) {
      errors.push(`realCases.records: expected 1000 records, found ${realCases.records.length}`);
    }

    let invalidSensors = 0;
    let invalidQFeatures = 0;
    let invalidScores = 0;

    for (let i = 0; i < realCases.records.length; i++) {
      const r = realCases.records[i];
      if (r.id !== i) {
        errors.push(`realCases.records[${i}]: id mismatch (${r.id} !== ${i})`);
      }
      if (!Array.isArray(r.sensors) || r.sensors.length !== 4) {
        invalidSensors++;
      }
      if (!Array.isArray(r.qFeatures) || r.qFeatures.length !== 7) {
        invalidQFeatures++;
      }
      if (typeof r.classicalScore !== 'number' || typeof r.quantumScore !== 'number') {
        invalidScores++;
      }
    }

    if (invalidSensors > 0) {
      errors.push(`realCases.records: ${invalidSensors} records have sensor count != 4`);
    }
    if (invalidQFeatures > 0) {
      errors.push(`realCases.records: ${invalidQFeatures} records have qFeatures count != 7`);
    }
    if (invalidScores > 0) {
      errors.push(`realCases.records: ${invalidScores} records have missing scores`);
    }
  }

  // 2. Validate CSV parity if provided
  if (csvContent && typeof csvContent === 'string') {
    const lines = csvContent.trim().split(/\r?\n/);
    const expectedHeader = QUANTUM_OBSERVABLES.map((q) => q.key).join(',');
    const actualHeader = lines[0]?.trim();

    if (actualHeader !== expectedHeader) {
      errors.push(`Xq_test_0.csv header mismatch. Expected: "${expectedHeader}", found: "${actualHeader}"`);
    }

    const dataRows = lines.slice(1);
    if (dataRows.length !== 1000) {
      errors.push(`Xq_test_0.csv row count mismatch. Expected: 1000, found: ${dataRows.length}`);
    } else if (realCases?.records?.length === 1000) {
      let maxDiff = 0;
      for (let i = 0; i < 1000; i++) {
        const rowVals = dataRows[i].split(',').map(Number);
        const jsonVals = realCases.records[i].qFeatures;
        for (let j = 0; j < 7; j++) {
          const diff = Math.abs(rowVals[j] - jsonVals[j]);
          if (diff > maxDiff) maxDiff = diff;
        }
      }
      if (maxDiff > 1e-4) {
        errors.push(`Xq_test_0.csv and realCases.records discrepancy exceeds tolerance: maxDiff=${maxDiff}`);
      }
    }
  }

  // 3. Validate kipuCloudModel
  const metrics = kipuCloudModel?.cloudMetrics;
  if (!metrics) {
    errors.push('kipuCloudModel.json: cloudMetrics object missing');
  } else {
    const requiredArms = ['raw', 'quantum', 'hybrid'];
    for (const arm of requiredArms) {
      if (!metrics.arms?.[arm]) {
        errors.push(`kipuCloudModel.cloudMetrics.arms: missing arm "${arm}"`);
      } else if (typeof metrics.arms[arm].ap_mean !== 'number') {
        errors.push(`kipuCloudModel.cloudMetrics.arms.${arm}: ap_mean is not a number`);
      }
    }

    // Headline endpoint check
    const headline = metrics.endpoints?.hybrid_vs_raw?.dAP;
    if (!headline) {
      errors.push('kipuCloudModel.cloudMetrics.endpoints: hybrid_vs_raw.dAP missing');
    } else if (typeof headline.mean_diff !== 'number') {
      errors.push('kipuCloudModel.cloudMetrics.endpoints.hybrid_vs_raw: mean_diff is not a number');
    }

    // Fisher scores check
    if (!Array.isArray(metrics.quantum_fisher_scores) || metrics.quantum_fisher_scores.length !== 7) {
      errors.push('kipuCloudModel.cloudMetrics: quantum_fisher_scores must be an array of 7 numbers');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    summary: {
      recordsCount: realCases?.records?.length ?? 0,
      rawSensorsCount: RAW_SENSORS.length,
      quantumObservablesCount: QUANTUM_OBSERVABLES.length,
      armsEvaluated: metrics?.arms ? Object.keys(metrics.arms).length : 0,
      headlineAPDiff: metrics?.endpoints?.hybrid_vs_raw?.dAP?.mean_diff
        ? `${(metrics.endpoints.hybrid_vs_raw.dAP.mean_diff * 100).toFixed(1)} pp`
        : 'N/A',
    },
  };
}
