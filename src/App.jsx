import { useMemo, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';

import { C, RAW, QNAMES, QNAMES_SHORT } from './data/constants.js';
import { runPipeline } from './utils/pipeline.js';
import { meanOff } from './utils/correlation.js';
import { decisionStatus } from './utils/decisionStatus.js';
import { useThresholdPopover } from './hooks/useThresholdPopover.js';
import { useLiveBoard } from './hooks/useLiveBoard.js';
import { ExperienceProvider, useExperience } from './context/ExperienceContext.jsx';

import { Header } from './components/Header/Header.jsx';
import { SourceDataSection } from './components/SourceDataSection/SourceDataSection.jsx';
import { StickyControls } from './components/StickyControls/StickyControls.jsx';
import { ThresholdPopover } from './components/ThresholdPopover/ThresholdPopover.jsx';
import { FeatureSpaceCard } from './components/FeatureSpaceCard/FeatureSpaceCard.jsx';
import { QuantumCircuitSection } from './components/QuantumCircuitSection/QuantumCircuitSection.jsx';
import { FeatureSpaceComparison } from './components/FeatureSpaceComparison/FeatureSpaceComparison.jsx';
import { MethodologyNote } from './components/MethodologyNote/MethodologyNote.jsx';
import { LiveBoardPanel } from './components/LiveBoardPanel/LiveBoardPanel.jsx';
import { InnovationCenterSection } from './components/InnovationCenterSection/InnovationCenterSection.jsx';
import { BrandingShowcase } from './components/BrandingShowcase/BrandingShowcase.jsx';
import { ExperienceShell } from './components/ExperienceShell/ExperienceShell.jsx';

/*
  QUANTUM FEATURE MAPPING LAB (Unified State Architecture)
  Single source of truth via ExperienceProvider:
  physical machine (Section 1) and feature space validation (Section 2)
  now synchronize perfectly to the same active record and requested inputs.
*/

function AppContent() {
  const exp = useExperience();
  const [circuitOpen, setCircuitOpen] = useState(false);

  const {
    showThresholdExplanation,
    setShowThresholdExplanation,
    popoverStyle,
    learnMoreButtonRef,
    thresholdPopoverRef,
  } = useThresholdPopover();

  // Adapter connecting peripheral live board / simulated sliders to unified experience state
  const liveBoard = useLiveBoard(exp.setRequestedReading);

  const sensorColors = [
    C.interaction,
    C.deviation,
    C.warning,
    C.classicalLight,
  ];

  // Section 2: Pipeline execution for correlation matrices and background scatter distribution
  const R = useMemo(() => runPipeline(exp.noise), [exp.noise]);

  const visibleCount = 1000;
  const activeId = exp.activeRecordId;

  const rawCorrelation = meanOff(R.classical.corr);
  const quantumCorrelation = meanOff(R.quantum.corr);

  const [featureA, featureB] = exp.selectedAxes.quantum;

  const rawPoints = R.test.X.slice(0, visibleCount).map((row) => [
    row[0],
    row[1],
  ]);

  const quantumPoints = R.test.Q.slice(0, visibleCount).map((row) => [
    row[featureA],
    row[featureB],
  ]);

  const labels = R.test.y.slice(0, visibleCount);

  // Synchronized single record state across Section 1 and Section 2
  const activeRecord = exp.activeRecord;
  const currentLabel = activeRecord.label;
  const conditionColor = exp.conditionColor;

  const classicalThreshold = exp.classicalThreshold;
  const quantumThreshold = exp.quantumThreshold;

  const classicalScore = exp.classicalScore;
  const quantumScore = exp.quantumScore;

  const classicalAlert = exp.classicalAlert;
  const quantumAlert = exp.quantumAlert;

  const machineAlert = liveBoard.activeMode === 'classical' ? classicalAlert : quantumAlert;
  const showBrandingPreview =
    new URLSearchParams(window.location.search).get('branding-preview') === '1';

  const classicalStatus = decisionStatus(currentLabel, classicalAlert);
  const quantumStatus = decisionStatus(currentLabel, quantumAlert);

  const aucDelta = (R.quantum.auc - R.classical.auc) * 100;
  const falseAlarmReduction =
    Math.max(0, R.classical.op.fpr - R.quantum.op.fpr) * 100;

  const classicalCard = {
    variant: 'classical',
    borderColor: C.classical,
    title: '2A. Classical Representation',
    description:
      'The four physical signals are kept as original input variables.',
    correlation: { value: rawCorrelation, color: C.classicalLight },
    chips: RAW.map((name) => ({ label: name, active: false })),
    chipCaption: 'Direct representation of the signals captured by the sensors.',
    heatmap: { matrix: R.classical.corr, labels: RAW, showValues: true },
    scatter: {
      accent: C.classical,
      xLabel: 'Hoist Load',
      yLabel: 'Crowd Vib.',
      points: rawPoints,
      labels,
      note: 'Overlap between colors indicates records with similar sensor-space patterns.',
    },
    metric: {
      label: 'Classical Representation Result',
      color: C.classicalLight,
      description:
        'Direct sensor channels provide 1D signals but lack non-linear coupling terms, resulting in overlapping clusters and high false alarm rates.',
    },
    validation: {
      auc: R.classical.auc,
      fpr: R.classical.op.fpr,
      color: C.classicalLight,
    },
    selected: {
      index: activeId,
      label: currentLabel,
      conditionColor,
      score: classicalScore,
      threshold: classicalThreshold,
      alert: classicalAlert,
      status: classicalStatus,
    },
  };

  const quantumCard = {
    variant: 'quantum',
    borderColor: C.quantum,
    title: '2B. Quantum Feature-Mapped Representation',
    description:
      'The feature map enriches the representation by generating derived observables from the same four physical signals.',
    correlation: { value: quantumCorrelation, color: C.quantumLight },
    chips: QNAMES.map((name, i) => ({
      label: name,
      active: i === featureA || i === featureB,
    })),
    chipCaption:
      '7 derived quantum features (single-body and 2-body interaction observables), mapped by Rimay DQFM from the four physical signals.',
    heatmap: { matrix: R.quantum.corr, labels: QNAMES_SHORT, showValues: true },
    scatter: {
      accent: C.quantum,
      xLabel: QNAMES[featureA],
      yLabel: QNAMES[featureB],
      points: quantumPoints,
      labels,
      note: 'Geometric separation in the Hilbert space feature map reveals the anomaly cluster hidden in raw coordinates.',
    },
    metric: {
      label: 'Quantum Feature Map Result',
      color: C.quantumLight,
      description:
        `The quantum feature map embeds 2-body interaction observables (Hilbert space), unlocking clear geometric separation and achieving +${aucDelta.toFixed(1)} pts AUC lift.`,
    },
    validation: {
      auc: R.quantum.auc,
      fpr: R.quantum.op.fpr,
      color: C.quantumLight,
    },
    selected: {
      index: activeId,
      label: currentLabel,
      conditionColor,
      score: quantumScore,
      threshold: quantumThreshold,
      alert: quantumAlert,
      status: quantumStatus,
    },
  };

  if (showBrandingPreview) {
    return (
      <div className="app branding-preview-page">
        <BrandingShowcase />
      </div>
    );
  }

  return (
    <div className="app">
      <Header />

      <div className="divider" />

      <SourceDataSection
        visibleSample={activeId}
        selectedSensors={activeRecord.sensors}
        sensorColors={sensorColors}
        alert={machineAlert}
        label={currentLabel}
        mode={liveBoard.activeMode}
        liveMode={true}
        sensorDisplayValues={exp.displayValues}
      />

      <LiveBoardPanel liveBoard={liveBoard} />

      <StickyControls
        noise={exp.noise}
        onNoiseChange={exp.setNoise}
        visibleSample={activeId}
        visibleCount={visibleCount}
        selectedLabel={currentLabel}
        onSampleChange={exp.selectRecord}
        showThresholdExplanation={showThresholdExplanation}
        onToggleThresholdExplanation={() =>
          setShowThresholdExplanation((open) => !open)
        }
        learnMoreButtonRef={learnMoreButtonRef}
      />

      {showThresholdExplanation && (
        <ThresholdPopover
          thresholdPopoverRef={thresholdPopoverRef}
          popoverStyle={popoverStyle}
          onClose={() => setShowThresholdExplanation(false)}
        />
      )}

      <QuantumCircuitSection
        circuitOpen={circuitOpen}
        onToggle={() => setCircuitOpen((open) => !open)}
      />

      <div className="band">
        SAME DATA RECORD <strong>→</strong> TWO COMPLEMENTARY FEATURE SPACES
      </div>

      <main className="split">
        <FeatureSpaceCard {...classicalCard} />
        <FeatureSpaceCard {...quantumCard} />
      </main>

      <FeatureSpaceComparison
        rawCorrelation={rawCorrelation}
        quantumCorrelation={quantumCorrelation}
        aucDelta={aucDelta}
        falseAlarmReduction={falseAlarmReduction}
      />

      <MethodologyNote />

      <InnovationCenterSection />
    </div>
  );
}

export default function App() {
  return (
    <ExperienceProvider>
      <BrowserRouter>
        <ExperienceShell lab={<AppContent />} />
      </BrowserRouter>
    </ExperienceProvider>
  );
}
