import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../lib/PlayerContext';
import { useGame } from '../lib/GameContext';
import { RulesModal } from '../components/RulesModal';
import { api } from '../lib/api';
import { resolvePhotoUrl } from '../lib/photo';

const EXPANSIONS = [
  { key: 'core', label: 'Core', description: 'Always included — the essential deck', locked: true },
  { key: 'vanilla', label: 'Vanilla', description: 'Tamer truths & dares — great for mixed groups' },
  { key: 'pineapple', label: 'Pineapple', description: 'Adventurous dares with kissing & touching' },
];

export default function CreateGame() {
  const navigate = useNavigate();
  const { player, setPlayer } = usePlayer();
  const { setGame } = useGame();

  const [name, setName] = useState(player.display_name || '');
  const [selectedExpansions, setSelectedExpansions] = useState<string[]>(['core']);
  const [photoPreview, setPhotoPreview] = useState<string | null>(player.photo_url);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRules, setShowRules] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const resolvedPhotoPreview = resolvePhotoUrl(photoPreview);

  const toggleExpansion = (key: string) => {
    if (key === 'core') return;
    setSelectedExpansions(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoPreview(URL.createObjectURL(file));
    try {
      const url = await api.uploadPhoto(file);
      setPlayer({ photo_url: url });
    } catch {
      setError('Photo upload failed');
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || name.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }
    setLoading(true);
    setError('');
    try {
      setPlayer({ display_name: name.trim() });
      const res = await api.createRoom({
        host_display_name: name.trim(),
        host_photo_url: player.photo_url || undefined,
        expansions: selectedExpansions,
        player_id: player.player_id,
      });
      setGame({
        room_id: res.room.room_id,
        room_code: res.room_code,
        status: 'lobby',
        host_player_id: res.player.player_id,
        expansions: selectedExpansions,
        players: [],
      });
      navigate(`/room/${res.room.room_id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create game');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pp-shell flex flex-col">
      {/* Header */}
      <header className="mx-3 mt-3 rounded-2xl px-4 py-3 border border-pp-cyan/15 bg-pp-bg-light/60 backdrop-blur-md flex items-center justify-between" style={{ position: 'relative', zIndex: 10 }}>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-pp-text-muted hover:text-pp-cyan transition-colors font-bold uppercase tracking-wider"
          style={{ fontSize: '0.65rem', fontFamily: 'var(--font-pp-display)' }}
        >
          ← Back
        </button>
        <button
          onClick={() => setShowRules(true)}
          className="text-xs text-pp-text-muted hover:text-pp-text transition-colors font-bold uppercase tracking-wider"
        >
          Rules
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4" style={{ position: 'relative', zIndex: 1 }}>
      <div className="w-full max-w-md space-y-5 pp-panel pp-animate-rise">
        <h1
          className="pp-title font-black"
          style={{ fontFamily: 'var(--font-pp-display)', fontSize: '1.3rem', color: 'var(--color-pp-text)', lineHeight: 1.1 }}
        >
          CREATE<br /><span style={{ color: 'var(--color-pp-cyan)' }}>GAME</span>
        </h1>

        {/* Name */}
        <div>
          <label className="block mb-2 font-bold uppercase tracking-widest" style={{ fontSize: '0.6rem', fontFamily: 'var(--font-pp-display)', color: 'var(--color-pp-text-muted)' }}>Your Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={30}
            placeholder="Display name"
            className="input-field"
          />
        </div>

        {/* Photo */}
        <div>
          <label className="block mb-2 font-bold uppercase tracking-widest" style={{ fontSize: '0.6rem', fontFamily: 'var(--font-pp-display)', color: 'var(--color-pp-text-muted)' }}>Photo (optional)</label>
          <div className="flex items-center gap-4">
            <div
              onClick={() => fileRef.current?.click()}
              className="w-16 h-16 rounded-2xl bg-pp-surface border-2 border-pp-cyan/20 flex items-center justify-center cursor-pointer overflow-hidden hover:border-pp-cyan/60 transition-all"
            >
              {resolvedPhotoPreview ? (
                <img src={resolvedPhotoPreview} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl">📷</span>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="hidden" />
            <span className="text-xs text-pp-text-muted">Tap to take or upload</span>
          </div>
        </div>

        {/* Expansions */}
        <div>
          <label className="block mb-2 font-bold uppercase tracking-widest" style={{ fontSize: '0.6rem', fontFamily: 'var(--font-pp-display)', color: 'var(--color-pp-text-muted)' }}>Card Expansions</label>
          <div className="space-y-2">
            {EXPANSIONS.map(exp => {
              const isSelected = selectedExpansions.includes(exp.key);
              return (
                <button
                  key={exp.key}
                  onClick={() => toggleExpansion(exp.key)}
                  disabled={exp.locked}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${
                    isSelected
                      ? 'border-pp-cyan/60 bg-pp-cyan/10'
                      : 'border-pp-surface-2 bg-pp-surface/40 hover:border-pp-cyan/30'
                  } ${exp.locked ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-pp-text text-sm">{exp.label}</span>
                    <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center text-xs transition-all ${
                      isSelected ? 'bg-pp-cyan border-pp-cyan' : 'border-pp-text-muted/30'
                    }`}>
                      {isSelected && <span className="text-pp-bg font-black text-xs">✓</span>}
                    </div>
                  </div>
                  <p className="text-xs text-pp-text-muted mt-1">{exp.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <p className="text-pp-dare text-sm text-center font-semibold">{error}</p>
        )}

        <button onClick={handleSubmit} disabled={loading || !name.trim()} className="btn-primary w-full py-4">
          {loading ? 'Creating...' : 'Create Game'}
        </button>
      </div>
      </main>

      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
    </div>
  );
}
