import { Navigate, Route, Routes } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { DemoView } from './components/demo/DemoView';
import { WelcomeScreen } from './components/welcome/WelcomeScreen';
import { shouldShowTour } from './utils/shouldShowTour';

function AppShell() {
  const showTour = shouldShowTour();

  return (
    <>
      {showTour && (
        <div
          className="sr-only"
          aria-live="polite"
          data-guided-tour="pending"
        >
          Guided tour placeholder
        </div>
      )}
      <MainLayout />
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<WelcomeScreen />} />
      <Route path="/app" element={<AppShell />} />
      <Route path="/demo" element={<DemoView />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
