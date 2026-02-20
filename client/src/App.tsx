import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PlayerProvider, usePlayer } from './lib/PlayerContext';
import { GameProvider } from './lib/GameContext';
import { SocketContext, socket } from './lib/socket';
import AgeGate from './pages/AgeGate';
import Home from './pages/Home';
import CreateGame from './pages/CreateGame';
import JoinRoom from './pages/JoinRoom';
import GameRoom from './pages/GameRoom';
import Profile from './pages/Profile';
import SuggestCard from './pages/SuggestCard';
import GameDetail from './pages/GameDetail';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminCards from './pages/AdminCards';

function AppContent() {
  const { ageVerified } = usePlayer();

  if (!ageVerified) {
    return <AgeGate />;
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/create" element={<CreateGame />} />
      <Route path="/join" element={<JoinRoom />} />
      <Route path="/room/:roomId" element={<GameRoom />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/suggest" element={<SuggestCard />} />
      <Route path="/history/:roomId" element={<GameDetail />} />
      <Route path="/admin/analytics" element={<AdminAnalytics />} />
      <Route path="/admin/cards" element={<AdminCards />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <PlayerProvider>
        <GameProvider>
          <SocketContext.Provider value={socket}>
            <AppContent />
          </SocketContext.Provider>
        </GameProvider>
      </PlayerProvider>
    </BrowserRouter>
  );
}

export default App;
