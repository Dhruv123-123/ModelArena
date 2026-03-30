import { AnimatePresence, motion as M } from 'framer-motion'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import useGameStore from '../../stores/useGameStore'
import ModelBuilderView from '../builder/ModelBuilder'
import TrainingPanel from '../training/TrainingPanel'
import GamePlayback from '../playback/GamePlayback'
import Leaderboard from '../leaderboard/Leaderboard'

export default function MainLayout() {
  const { view } = useGameStore()

  const renderView = () => {
    switch (view) {
      case 'builder': return <ModelBuilderView />
      case 'train': return <TrainingPanel />
      case 'play': return <GamePlayback />
      case 'leaderboard': return <Leaderboard />
      default: return <ModelBuilderView />
    }
  }

  return (
    <div className="h-full flex min-h-0">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <TopBar />
        <div className="flex-1 overflow-hidden min-h-0 relative grid-bg">
          {/* Ambient glow decorations */}
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-tertiary/3 rounded-full blur-[100px] pointer-events-none" />

          <AnimatePresence mode="wait">
            <M.div
              key={view}
              role="presentation"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="absolute inset-0 overflow-auto"
            >
              {renderView()}
            </M.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
