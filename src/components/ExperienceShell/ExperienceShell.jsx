import { Link, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useExperience } from '../../context/ExperienceContext.jsx';
import { ChallengeScene } from '../ChallengeScene/ChallengeScene.jsx';
import { MethodScene } from '../MethodScene/MethodScene.jsx';
import { FeatureSpaceScene } from '../FeatureSpaceScene/FeatureSpaceScene.jsx';
import { ResultsScene } from '../ResultsScene/ResultsScene.jsx';
import { InteractiveLabScene } from '../InteractiveLabScene/InteractiveLabScene.jsx';

const guidedRoutes = [
  { path: '/challenge', label: 'Challenge' },
  { path: '/method', label: 'Method' },
  { path: '/features', label: 'Features' },
  { path: '/results', label: 'Results' },
];

function ShellLayout() {
  const location = useLocation();
  const { activeRecordId, resetExperience } = useExperience();
  const currentIndex = guidedRoutes.findIndex(({ path }) => path === location.pathname);
  const previousPath = currentIndex > 0 ? guidedRoutes[currentIndex - 1].path : '/experience';
  const nextPath =
    currentIndex >= 0 && currentIndex < guidedRoutes.length - 1
      ? guidedRoutes[currentIndex + 1].path
      : '/lab';

  return (
    <div className="experience-shell">
      <header className="experience-shell-header">
        <Link className="shell-wordmark" to="/" aria-label="Return to welcome">
          NTT DATA <span>× Kipu Quantum</span>
        </Link>
        <nav className="shell-nav" aria-label="Experience navigation">
          <Link to="/experience">Menu</Link>
          <Link to="/lab">Lab</Link>
          <button type="button" onClick={resetExperience}>Reset</button>
        </nav>
      </header>

      <main className="experience-shell-main">
        <Outlet />
      </main>

      {currentIndex >= 0 && (
        <footer className="shell-stepper">
          <Link className="shell-nav-button" to={previousPath}>Back</Link>
          <span className="shell-progress" aria-label={`Guided step ${currentIndex + 1} of ${guidedRoutes.length}`}>
            {currentIndex + 1} / {guidedRoutes.length}
          </span>
          <Link className="shell-nav-button shell-nav-button-primary" to={nextPath}>
            {currentIndex === guidedRoutes.length - 1 ? 'Enter lab' : 'Next'}
          </Link>
        </footer>
      )}

      {location.pathname === '/lab' && (
        <p className="shell-record-status">Active saved record: <strong>#{activeRecordId}</strong></p>
      )}
    </div>
  );
}

function Welcome() {
  return (
    <section className="shell-attractor">
      <span className="shell-eyebrow">NTT DATA × Kipu Quantum</span>
      <h1>Quantum Feature Extraction</h1>
      <p>Exploring industrial telemetry through classical and quantum-inspired representations.</p>
      <Link className="shell-cta" to="/experience">Touch to explore</Link>
    </section>
  );
}

function ExperienceMenu() {
  return (
    <section className="shell-menu">
      <div>
        <span className="shell-eyebrow">Choose your path</span>
        <h1>Explore the technology at your pace.</h1>
      </div>
      <div className="shell-choice-grid">
        <Link className="shell-choice" to="/challenge">
          <span className="shell-choice-index">01</span>
          <h2>Discover the technology</h2>
          <p>Follow the guided story from industrial challenge to experimental evidence.</p>
          <span className="shell-choice-action">Start guided experience →</span>
        </Link>
        <Link className="shell-choice" to="/lab">
          <span className="shell-choice-index">02</span>
          <h2>Enter the lab</h2>
          <p>Inspect saved cases and interact with the local sensor controls.</p>
          <span className="shell-choice-action">Open interactive lab →</span>
        </Link>
      </div>
    </section>
  );
}

function Challenge() {
  return <ChallengeScene />;
}

function Method() {
  return <MethodScene />;
}

function Features() {
  return <FeatureSpaceScene />;
}

function Results() {
  return <ResultsScene />;
}

function NotFound() {
  return (
    <section className="shell-attractor shell-not-found">
      <span className="shell-eyebrow">Page not found</span>
      <h1>This scene is not available.</h1>
      <p>Return to the experience menu to continue exploring the demo.</p>
      <Link className="shell-cta" to="/experience">Back to menu</Link>
    </section>
  );
}

export function ExperienceShell({ lab: _lab }) {
  return (
    <Routes>
      <Route element={<ShellLayout />}>
        <Route index element={<Welcome />} />
        <Route path="experience" element={<ExperienceMenu />} />
        <Route path="challenge" element={<Challenge />} />
        <Route path="method" element={<Method />} />
        <Route path="features" element={<Features />} />
        <Route path="results" element={<Results />} />
        <Route path="lab" element={<InteractiveLabScene />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
