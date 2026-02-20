import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePlayer } from '../lib/PlayerContext';
import { Icon } from '../components/Icon';
import { RulesModal } from '../components/RulesModal';
import logoImg from '../assets/logo.png';

export default function Home() {
  const { player } = usePlayer();
  const [showRules, setShowRules] = useState(false);

  return (
    <div className="min-h-screen pp-shell flex flex-col" id="home-page">
      {/* Header */}
      <header id="header-main" className="mx-4 mt-4 flex items-center justify-between rounded-2xl px-4 py-3 border border-pp-purple/20 bg-pp-surface/40 backdrop-blur overflow-visible">
        <div className="flex items-center gap-2">
          <div className="pp-animate-float" id="header-logo">
            <Icon name="icon" size="lg" ariaLabel="Pineapple Players" />
          </div>
          <h1 id="app-title" className="text-2xl font-bold pp-title bg-gradient-to-r from-pp-red via-pp-purple to-pp-orange bg-clip-text text-transparent">
            Pineapple Players
          </h1>
        </div>
        <Link
          id="profile-btn"
          to="/profile"
          aria-label="Open profile"
          className="w-10 h-10 rounded-full bg-pp-surface/70 border border-pp-purple/30 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pp-gold/70 focus-visible:ring-offset-2 focus-visible:ring-offset-pp-bg"
        >
          {player.photo_url ? (
            <img src={player.photo_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-pp-text-muted text-sm">
              {player.display_name ? player.display_name[0].toUpperCase() : '?'}
            </span>
          )}
        </Link>
      </header>

      {/* Main Grid */}
      <main id="main-content" className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
        {/* Full Logo */}
        <div id="home-logo" className="w-32 h-32 pp-animate-float">
          <img src={logoImg} alt="" className="w-full h-full object-contain" />
        </div>

        <div id="tiles-grid" className="pp-layout-two-col w-full max-w-sm lg:max-w-2xl">
          <Link
            id="tile-join"
            to="/join"
            className="aspect-square pp-tile pp-animate-rise"
            style={{ animationDelay: '0.05s' }}
          >
            <Icon name="door" size="xl" ariaLabel="Join Room" />
            <span className="font-bold text-pp-text">Join Room</span>
          </Link>

          <Link
            id="tile-create"
            to="/create"
            className="aspect-square pp-tile pp-animate-rise"
            style={{ animationDelay: '0.1s' }}
          >
            <Icon name="plus" size="xl" ariaLabel="Create Game" />
            <span className="font-bold text-pp-text">Create Game</span>
          </Link>

          <Link
            id="tile-profile"
            to="/profile"
            className="aspect-square pp-tile pp-animate-rise"
            style={{ animationDelay: '0.15s' }}
          >
            <Icon name="home" size="xl" ariaLabel="Profile" />
            <span className="font-bold text-pp-text">Profile</span>
          </Link>

          <Link
            id="tile-suggest"
            to="/suggest"
            className="aspect-square pp-tile pp-animate-rise"
            style={{ animationDelay: '0.2s' }}
          >
            <Icon name="card" size="xl" ariaLabel="Suggest a Card" />
            <span className="font-bold text-pp-text">Suggest a Card</span>
          </Link>

          <Link
            id="tile-analytics"
            to="/admin/analytics"
            className="col-span-2 rounded-2xl border border-pp-purple/30 bg-pp-surface/40 px-4 py-3 flex items-center justify-center gap-2 hover:border-pp-gold/60 transition-colors pp-animate-rise"
            style={{ animationDelay: '0.25s' }}
          >
            <Icon name="bar-chart" size="md" />
            <span className="font-bold text-pp-text">Admin Analytics</span>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer id="footer" className="p-4 text-center text-pp-text-muted text-xs flex gap-4 justify-center items-center">
        <button id="btn-rules" onClick={() => setShowRules(true)} className="text-pp-text-muted hover:text-pp-text transition-colors underline">Rules</button>
        <span>Pineapple Players &copy; {new Date().getFullYear()}</span>
      </footer>

      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
    </div>
  );
}
