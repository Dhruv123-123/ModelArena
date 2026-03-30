import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import WelcomeScreen from './components/welcome/WelcomeScreen'
import GuidedTour from './components/welcome/GuidedTour'
import { shouldShowTour } from './components/welcome/shouldShowTour'
import DemoView from './components/demo/DemoView'

function AppShell() {
  const [showTour, setShowTour] = useState(() => shouldShowTour())

  return (
    <div className="h-[100dvh] w-full overflow-hidden flex flex-col bg-bg-primary">
      <MainLayout />
      {showTour && (
        <GuidedTour onComplete={() => setShowTour(false)} />
      )}
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<WelcomeScreen />} />
      <Route path="/app" element={<AppShell />} />
      <Route path="/demo" element={<DemoView />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
