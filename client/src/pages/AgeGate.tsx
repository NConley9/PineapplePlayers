import { usePlayer } from '../lib/PlayerContext';

export default function AgeGate() {
  const { confirmAge } = usePlayer();

  return (
    <div className="fixed inset-0 z-50 pp-shell flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Pineapple Icon */}
        <div className="text-8xl pp-animate-float" aria-hidden="true">🍍</div>

        <h1 className="text-3xl font-bold pp-title bg-gradient-to-r from-pp-red via-pp-purple to-pp-orange bg-clip-text text-transparent">
          Pineapple Players
        </h1>

        <div className="pp-panel">
          <p className="text-pp-text text-lg leading-relaxed">
            This app contains <strong>adult content</strong> intended for players 18 years of age or older.
          </p>
          <p className="text-pp-text-muted mt-3 text-sm">
            By continuing, you confirm that you are at least 18 years of age.
          </p>
        </div>

        <div className="space-y-3">
          <button onClick={confirmAge} className="btn-primary w-full text-lg">
            I am 18+
          </button>
          <button
            onClick={() => window.location.href = 'about:blank'}
            className="btn-muted w-full"
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  );
}
