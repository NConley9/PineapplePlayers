import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePlayer } from '../lib/PlayerContext';
import { resolvePhotoUrl } from '../lib/photo';
import { Icon } from '../components/Icon';
import { RulesModal } from '../components/RulesModal';
import logoImg from '../assets/logo.png';

export default function Home() {
  const { player } = usePlayer();
  const [showRules, setShowRules] = useState(false);
  const resolvedPhotoUrl = resolvePhotoUrl(player.photo_url);

  return (
    <div className="min-h-screen pp-shell flex flex-col" id="home-page">
      {/* Header */}
      <header
        id="header-main"
        className="mx-3 mt-3 flex items-center justify-between rounded-2xl px-4 py-3
          border border-pp-cyan/15 bg-pp-bg-light/60 backdrop-blur-md"
        style={{ position: 'relative', zIndex: 10 }}
      >
        <div className="flex items-center gap-3">
          <div className="pp-animate-float" id="header-logo">
            <Icon name="icon" size="lg" ariaLabel="Pineapple Players" />
          </div>
          <h1
            id="app-title"
            className="text-lg font-black pp-title tracking-tight"
            style={{ fontFamily: 'var(--font-pp-display)', fontSize: '1rem', lineHeight: 1 }}
          >
            <span className="pp-text-shimmer">PINEAPPLE</span>
            <br />
            <span className="text-pp-text-muted text-xs font-bold tracking-widest uppercase" style={{ fontFamily: 'var(--font-pp-body)' }}>
              Players
            </span>
          </h1>
        </div>
        <Link
          id="profile-btn"
          to="/profile"
          aria-label="Open profile"
          className="w-10 h-10 rounded-full overflow-hidden border-2 border-pp-cyan/30
            bg-pp-surface flex items-center justify-center
            hover:border-pp-gold/60 transition-all"
        >
          {resolvedPhotoUrl ? (
            <img src={resolvedPhotoUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-pp-text font-bold text-sm">
              {player.display_name ? player.display_name[0].toUpperCase() : '?'}
            </span>
          )}
        </Link>
      </header>

      {/* Hero */}
      <main
        id="main-content"
        className="flex-1 flex flex-col items-center justify-center p-4 gap-6 sm:gap-8"
        style={{ position: 'relative', zIndex: 1 }}
      >
        {/* Logo + title block */}
        <div id="home-logo" className="flex flex-col items-center gap-4 pp-animate-rise" style={{ animationDelay: '0s' }}>
          <div className="pp-animate-float w-28 h-28 sm:w-36 sm:h-36">
            <img src={logoImg} alt="Pineapple Players" className="w-full h-full object-contain drop-shadow-2xl" />
          </div>
          <div className="text-center space-y-1">
            <h2
              className="pp-title pp-text-shimmer text-3xl sm:text-4xl font-black"
              style={{ fontFamily: 'var(--font-pp-display)', lineHeight: 1.05 }}
            >
              PINEAPPLE<br />PLAYERS
            </h2>
            <p className="text-pp-text-muted text-sm tracking-widest uppercase" style={{ fontFamily: 'var(--font-pp-body)' }}>
              The Party Card Game
            </p>
          </div>
        </div>

        {/* Action tiles */}
        <div id="tiles-grid" className="grid grid-cols-2 gap-3 sm:gap-4 w-full max-w-xs sm:max-w-sm">
          <Link
            id="tile-join"
            to="/join"
            className="pp-tile aspect-square flex flex-col items-center justify-center gap-2 p-4 pp-animate-rise"
            style={{ animationDelay: '0.08s' }}
          >
            <div className="w-10 h-10 rounded-2xl bg-pp-cyan/15 border border-pp-cyan/30 flex items-center justify-center">
              <Icon name="users" size="md" className="text-pp-cyan" ariaLabel="Join Room" />
            </div>
            <span className="font-black text-pp-text text-xs tracking-wide uppercase" style={{ fontFamily: 'var(--font-pp-display)', fontSize: '0.6rem' }}>Join Room</span>
          </Link>

          <Link
            id="tile-create"
            to="/create"
            className="pp-tile aspect-square flex flex-col items-center justify-center gap-2 p-4 pp-animate-rise"
            style={{ animationDelay: '0.14s' }}
          >
            <div className="w-10 h-10 rounded-2xl bg-pp-gold/15 border border-pp-gold/30 flex items-center justify-center">
              <Icon name="plus" size="md" className="text-pp-gold" ariaLabel="Create Game" />
            </div>
            <span className="font-black text-pp-text text-xs tracking-wide uppercase" style={{ fontFamily: 'var(--font-pp-display)', fontSize: '0.6rem' }}>Create</span>
          </Link>

          <Link
            id="tile-profile"
            to="/profile"
            className="pp-tile aspect-square flex flex-col items-center justify-center gap-2 p-4 pp-animate-rise"
            style={{ animationDelay: '0.2s' }}
          >
            <div className="w-10 h-10 rounded-2xl bg-pp-truth/15 border border-pp-truth/30 flex items-center justify-center">
              <Icon name="home" size="md" className="text-pp-truth" ariaLabel="Profile" />
            </div>
            <span className="font-black text-pp-text text-xs tracking-wide uppercase" style={{ fontFamily: 'var(--font-pp-display)', fontSize: '0.6rem' }}>Profile</span>
          </Link>

          <Link
            id="tile-suggest"
            to="/suggest"
            className="pp-tile aspect-square flex flex-col items-center justify-center gap-2 p-4 pp-animate-rise"
            style={{ animationDelay: '0.26s' }}
          >
            <div className="w-10 h-10 rounded-2xl bg-pp-dare/15 border border-pp-dare/30 flex items-center justify-center">
              <Icon name="card" size="md" className="text-pp-dare" ariaLabel="Suggest a Card" />
            </div>
            <span className="font-black text-pp-text text-xs tracking-wide uppercase" style={{ fontFamily: 'var(--font-pp-display)', fontSize: '0.6rem' }}>Suggest</span>
          </Link>
        </div>

        {/* Admin strip */}
        <Link
          id="tile-analytics"
          to="/admin/analytics"
          className="pp-animate-rise w-full max-w-xs sm:max-w-sm rounded-2xl border border-pp-cyan/15
            bg-pp-surface/30 px-4 py-3 flex items-center justify-center gap-2
            hover:border-pp-cyan/40 hover:bg-pp-cyan/5 transition-all"
          style={{ animationDelay: '0.32s' }}
        >
          <Icon name="bar-chart" size="sm" className="text-pp-text-muted" />
          <span className="text-pp-text-muted text-xs font-bold tracking-widest uppercase">Admin Analytics</span>
        </Link>
      </main>

      {/* Footer */}
      <footer
        id="footer"
        className="p-4 text-center flex gap-5 justify-center items-center text-pp-text-muted text-xs"
        style={{ position: 'relative', zIndex: 10 }}
      >
        <button
          id="btn-rules"
          onClick={() => setShowRules(true)}
          className="hover:text-pp-cyan transition-colors underline underline-offset-2"
        >
          Rules
        </button>
        <span className="opacity-30">·</span>
        <span>Pineapple Players &copy; {new Date().getFullYear()}</span>
      </footer>

      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
    </div>
  );
}
