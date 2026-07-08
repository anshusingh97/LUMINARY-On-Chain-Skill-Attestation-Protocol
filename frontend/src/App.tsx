import StarField from './components/StarField'
import Navigation from './components/Navigation'
import Notifications from './components/Notifications'
import Explore from './pages/Explore'
import Attest from './pages/Attest'
import Profile from './pages/Profile'
import Leaderboard from './pages/Leaderboard'
import { useLuminaryStore } from './lib/store'

export default function App() {
  const { activeTab } = useLuminaryStore()

  return (
    <div className="min-h-screen relative">
      <StarField />
      <div className="relative z-10">
        <Navigation />
        <main>
          {activeTab === 'explore'     && <Explore />}
          {activeTab === 'attest'      && <Attest />}
          {activeTab === 'profile'     && <Profile />}
          {activeTab === 'leaderboard' && <Leaderboard />}
        </main>
      </div>
      <Notifications />
    </div>
  )
}
