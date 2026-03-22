import Sidebar from './Sidebar'
import TopBar from './TopBar'
import useGameStore from '../../stores/useGameStore'
import ModelBuilderView from '../builder/ModelBuilder'
import TrainingPanel from '../training/TrainingPanel'
import GamePlayback from '../playback/GamePlayback'
import Leaderboard from '../leaderboard/Leaderboard'

export default function MainLayout({ onShowWelcome }) {
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
    <div className="h-full flex">
      <Sidebar onShowWelcome={onShowWelcome} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <div className="flex-1 overflow-hidden">
          {renderView()}
        </div>
      </div>
    </div>
  )
}
