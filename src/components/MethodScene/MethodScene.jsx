import { useState } from 'react';
import { Link } from 'react-router-dom';
import { RAW, UNITS } from '../../data/constants.js';
import { useExperience } from '../../context/ExperienceContext.jsx';

const STEPS = [
  {
    id: 'input',
    label: '01 Input & dependencies',
    title: 'Start with one physical record.',
  },
  {
    id: 'encoding',
    label: '02 Hamiltonian encoding',
    title: 'Represent inputs and dataset dependencies.',
  },
  {
    id: 'evolution',
    label: '03 Counterdiabatic evolution',
    title: 'Transform the representation conceptually.',
  },
  {
    id: 'measurement',
    label: '04 Observable measurement',
    title: 'Read seven saved observables.',
  },
];

function InputStep({ record }) {
  const readings = [
    { key: 'hoistLoad', label: RAW[0], unit: UNITS[0] },
    { key: 'crowdVib', label: RAW[1], unit: UNITS[1] },
    { key: 'driveTemp', label: RAW[2], unit: UNITS[2] },
    { key: 'cableTension', label: RAW[3], unit: UNITS[3] },
  ];

  return (
    <div className="method-step-content">
      <div className="method-copy">
        <span className="method-kicker">Sample values</span>
        <h2>One record supplies the local inputs.</h2>
        <p>
          The values below belong to saved record #{record.id}. Dataset-level
          dependencies are separate statistics estimated across the collection;
          they are not recomputed from this one sample.
        </p>
      </div>
      <div className="method-input-grid">
        {readings.map(({ key, label, unit }) => (
          <div className="method-value-card" key={key}>
            <span>{label}</span>
            <strong>{Number(record.rawSensors[key]).toFixed(1)} {unit}</strong>
            <small>local input</small>
          </div>
        ))}
      </div>
    </div>
  );
}

function EncodingStep() {
  return (
    <div className="method-step-content">
      <div className="method-copy">
        <span className="method-kicker">Conceptual encoding</span>
        <h2>Sample fields and dataset dependencies play different roles.</h2>
        <p>
          Local fields describe the selected machine record. Dependency terms
          describe relationships estimated from the dataset. The specific
          coupling topology and coefficients of this PoC are not available as
          display artifacts, so this diagram is intentionally conceptual.
        </p>
      </div>
      <div className="method-encoding-diagram" aria-label="Conceptual Hamiltonian encoding">
        <div className="method-node-row">
          {['q0', 'q1', 'q2', 'q3'].map((node) => <span className="method-node" key={node}>{node}</span>)}
        </div>
        <div className="method-links" aria-hidden="true">
          <i /><i /><i />
        </div>
        <div className="method-dependency-label">dataset dependency terms · conceptual</div>
      </div>
    </div>
  );
}

function EvolutionStep() {
  return (
    <div className="method-step-content">
      <div className="method-copy">
        <span className="method-kicker">Conceptual illustration</span>
        <h2>A digitized counterdiabatic path changes the representation.</h2>
        <p>
          The method applies an approximate digitized evolution before
          measurement, creating derived observables for downstream analysis.
          This scene does not represent a live solver, proprietary gates, or
          intermediate measured states.
        </p>
      </div>
      <div className="method-evolution" aria-label="Conceptual evolution illustration">
        <div className="method-evolution-track">
          <span className="method-evolution-state">input</span>
          <i className="method-evolution-line" />
          <span className="method-evolution-state is-active">digitized path</span>
          <i className="method-evolution-line" />
          <span className="method-evolution-state">readout</span>
        </div>
        <span className="method-evolution-caption">Conceptual illustration · no live execution</span>
      </div>
    </div>
  );
}

function MeasurementStep({ observables }) {
  const [selectedKey, setSelectedKey] = useState(observables[0]?.key);
  const selected = observables.find((observable) => observable.key === selectedKey) || observables[0];

  return (
    <div className="method-step-content">
      <div className="method-copy">
        <span className="method-kicker">Saved readout</span>
        <h2>Seven observables are available for this record.</h2>
        <p>
          Values are read directly from the saved Kipu execution. Select an
          observable to inspect its mapped qubit or qubit pair.
        </p>
      </div>
      <div className="method-measurement-layout">
        <div className="method-qubit-map" aria-label="Observable qubit map">
          {[0, 1, 2, 3].map((qubit) => {
            const active = selected?.qubits.includes(qubit);
            return (
              <span className={`method-qubit ${active ? 'is-active' : ''}`} key={qubit}>
                q{qubit}
              </span>
            );
          })}
        </div>
        <div className="method-observable-list">
          {observables.map((observable) => (
            <button
              type="button"
              className={`method-observable ${observable.key === selectedKey ? 'is-selected' : ''}`}
              key={observable.key}
              onClick={() => setSelectedKey(observable.key)}
            >
              <span>
                <strong>{observable.key}</strong>
                <small>{observable.type === 'two_body' ? 'two-body' : 'single-body'}</small>
              </span>
              <b>{observable.value.toFixed(6)}</b>
            </button>
          ))}
        </div>
        <div className="method-observable-detail">
          <span className="method-kicker">Selected observable</span>
          <strong>{selected?.pauli}</strong>
          <span>{selected?.key} · qubits {selected?.qubits.join(', ')}</span>
          <small>{selected?.description}</small>
        </div>
      </div>
    </div>
  );
}

export function MethodScene() {
  const { activeRecord, observables } = useExperience();
  const [stepIndex, setStepIndex] = useState(0);
  const step = STEPS[stepIndex];

  return (
    <section className="method-scene">
      <div className="method-heading">
        <div>
          <span className="shell-eyebrow">Inside the method</span>
          <h1>How do we obtain new features from the same signals?</h1>
        </div>
        <span className="method-record-badge">Saved record #{activeRecord.id}</span>
      </div>

      <nav className="method-step-tabs" aria-label="Method subscenes">
        {STEPS.map((item, index) => (
          <button
            type="button"
            className={index === stepIndex ? 'is-selected' : ''}
            key={item.id}
            onClick={() => setStepIndex(index)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="method-step-header">
        <span>{step.title}</span>
        <span>{stepIndex + 1} / {STEPS.length}</span>
      </div>

      <div className="method-step-panel">
        {step.id === 'input' && <InputStep record={activeRecord} />}
        {step.id === 'encoding' && <EncodingStep />}
        {step.id === 'evolution' && <EvolutionStep />}
        {step.id === 'measurement' && <MeasurementStep observables={observables} />}
      </div>

      <div className="method-footer">
        <button
          type="button"
          className="shell-nav-button"
          disabled={stepIndex === 0}
          onClick={() => setStepIndex((index) => Math.max(0, index - 1))}
        >
          Previous subscene
        </button>
        {stepIndex < STEPS.length - 1 ? (
          <button
            type="button"
            className="shell-nav-button shell-nav-button-primary"
            onClick={() => setStepIndex((index) => Math.min(STEPS.length - 1, index + 1))}
          >
            Next subscene
          </button>
        ) : (
          <Link className="shell-nav-button shell-nav-button-primary" to="/features">
            Explore feature space
          </Link>
        )}
      </div>
    </section>
  );
}
