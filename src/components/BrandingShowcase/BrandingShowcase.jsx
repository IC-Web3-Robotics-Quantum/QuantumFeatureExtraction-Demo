const palette = [
  { name: 'Smart Navy', value: '#070F26', className: 'brand-swatch-navy' },
  { name: 'Future Blue', value: '#0072BC', className: 'brand-swatch-blue' },
  { name: 'Future Blue 50', value: '#19A3FC', className: 'brand-swatch-blue-bright' },
  { name: 'Text Gray', value: '#2E404D', className: 'brand-swatch-gray' },
];

export function BrandingShowcase() {
  return (
    <aside className="branding-showcase" aria-label="Branding system preview">
      <div className="branding-showcase-header">
        <div>
          <span className="eyebrow">Phase 03 · visual system</span>
          <h2>NTT DATA × Kipu Quantum</h2>
        </div>
        <span className="provenance-label">Temporary preview</span>
      </div>

      <div className="branding-showcase-grid">
        <section className="brand-scene brand-scene-dark">
          <span className="eyebrow">Scene container</span>
          <h3>Quantum Feature Mapping</h3>
          <p>One message, one visual focus, one clear action.</p>
          <div className="brand-actions">
            <button type="button" className="brand-button brand-button-primary">
              Touch to explore
            </button>
            <button type="button" className="brand-button brand-button-quiet">
              Learn more
            </button>
          </div>
        </section>

        <section className="brand-scene">
          <span className="eyebrow">Reusable states</span>
          <div className="brand-status-list">
            <span className="status-chip status-chip-neutral">Verified result</span>
            <span className="status-chip status-chip-info">Precomputed evidence</span>
          </div>
          <div className="brand-tooltip">
            <span className="tooltip-marker" aria-hidden="true">i</span>
            <span>Source and scope stay visible next to evidence.</span>
          </div>
        </section>
      </div>

      <div className="branding-showcase-footer">
        <div className="brand-legend" aria-label="Color legend">
          <span className="eyebrow">Palette and meaning</span>
          {palette.map((color) => (
            <span className="brand-legend-item" key={color.name}>
              <i className={`brand-swatch ${color.className}`} aria-hidden="true" />
              <span>
                <strong>{color.name}</strong>
                <small>{color.value}</small>
              </span>
            </span>
          ))}
        </div>
        <div className="brand-chart-frame" aria-label="Chart container preview">
          <span className="eyebrow">Chart container</span>
          <div className="brand-chart" aria-hidden="true">
            <i style={{ height: '42%' }} />
            <i style={{ height: '68%' }} />
            <i style={{ height: '54%' }} />
            <i style={{ height: '82%' }} />
          </div>
          <span className="provenance-label">Synthetic dataset · precomputed result</span>
        </div>
      </div>
    </aside>
  );
}
