import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../lib/PlayerContext';
import { useGame } from '../lib/GameContext';
import { RulesModal } from '../components/RulesModal';
import { api } from '../lib/api';
import { resolvePhotoUrl } from '../lib/photo';

export default function JoinRoom() {
  const navigate = useNavigate();
  const { player, setPlayer } = usePlayer();
  const { setGame } = useGame();

  const [code, setCode] = useState('');
  const [name, setName] = useState(player.display_name || '');
  const [photoPreview, setPhotoPreview] = useState<string | null>(player.photo_url);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRules, setShowRules] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const resolvedPhotoPreview = resolvePhotoUrl(photoPreview);

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
    if (!code.trim() || !name.trim()) {
      setError('Room code and name are required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      setPlayer({ display_name: name.trim() });
      const res = await api.joinRoom({
        room_code: code.trim().toUpperCase(),
        display_name: name.trim(),
        photo_url: player.photo_url || undefined,
        player_id: player.player_id,
      });
      setGame({
        room_id: res.room.room_id,
        room_code: res.room.room_code,
        status: res.room.status,
        host_player_id: res.room.host_player_id,
        expansions: res.room.expansions,
        players: res.players,
        current_turn_player_id: res.room.current_turn_player_id,
        turn_order: res.room.turn_order,
      });
      navigate(`/room/${res.room.room_id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to join room');
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
        <button onClick={() => setShowRules(true)} className="text-xs text-pp-text-muted hover:text-pp-text transition-colors font-bold uppercase tracking-wider">
          Rules
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4" style={{ position: 'relative', zIndex: 1 }}>
      <div className="w-full max-w-md space-y-5 pp-panel pp-animate-rise">
        <h1
          className="pp-title font-black"
          style={{ fontFamily: 'var(--font-pp-display)', fontSize: '1.3rem', color: 'var(--color-pp-text)', lineHeight: 1.1 }}
        >
          JOIN<br /><span style={{ color: 'var(--color-pp-cyan)' }}>ROOM</span>
        </h1>

        {/* Room Code */}
        <div>
          <label className="block mb-2 font-bold uppercase tracking-widest" style={{ fontSize: '0.6rem', fontFamily: 'var(--font-pp-display)', color: 'var(--color-pp-text-muted)' }}>Room Code</label>
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase().replace(/\s+/g, '-'))}
            maxLength={24}
            placeholder="SUNNY-PINEAPPLE"
            className="input-field text-center font-black uppercase tracking-widest"
            style={{ fontSize: '1.1rem', fontFamily: 'var(--font-pp-display)', color: 'var(--color-pp-cyan)' }}
          />
        </div>

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

        {error && (
          <p className="text-pp-dare text-sm text-center font-semibold">{error}</p>
        )}

        <button onClick={handleSubmit} disabled={loading || !code.trim() || !name.trim()} className="btn-primary w-full py-4">
          {loading ? 'Joining...' : 'Join Game'}
        </button>
      </div>
      </main>

      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
    </div>
  );
}
