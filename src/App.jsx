import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import MainLayout from './components/layout/MainLayout'
import WelcomeScreen from './components/welcome/WelcomeScreen'
import GuidedTour, { shouldShowTour } from './components/welcome/GuidedTour'

export default function App() {
  const [showWelcome, setShowWelcome] = useState(() => {
    return !localStorage.getItem('modelarena-visited')
  })
  const [showTour, setShowTour] = useState(false)

  // Allow scrolling on the landing page, lock it inside the app
  useEffect(() => {
    const root = document.getElementById('root')
    if (!root) return
    if (showWelcome) {
      root.style.overflowY = 'auto'
      root.style.height = 'auto'
    } else {
      root.style.overflowY = 'hidden'
      root.style.height = '100%'
    }
  }, [showWelcome])

  const handleDismissWelcome = () => {
    localStorage.setItem('modelarena-visited', 'true')
    setShowWelcome(false)
    if (shouldShowTour()) {
      setShowTour(true)
    }
  }

  const handleShowWelcome = () => {
    setShowWelcome(true)
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {showWelcome ? (
          <WelcomeScreen key="welcome" onDismiss={handleDismissWelcome} />
        ) : (
          <MainLayout key="main" onShowWelcome={handleShowWelcome} />
        )}
      </AnimatePresence>

      {showTour && !showWelcome && (
        <GuidedTour onComplete={() => setShowTour(false)} />
      )}
    </>
  )
}
