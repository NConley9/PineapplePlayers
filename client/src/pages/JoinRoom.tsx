import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../lib/PlayerContext';
import { useGame } from '../lib/GameContext';
import { Icon } from '../components/Icon';
import { RulesModal } from '../components/RulesModal';
import { api } from '../lib/api';

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
    <div className="min-h-screen pp-shell p-6">
      <div className="max-w-md mx-auto space-y-6 pp-panel">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/')} className="text-pp-text-muted hover:text-pp-text transition-colors">
            ← Back
          </button>
          <button onClick={() => setShowRules(true)} className="text-sm text-pp-text-muted hover:text-pp-text transition-colors underline" aria-label="Show rules">Rules</button>
        </div>

        <h1 className="text-2xl font-bold text-pp-text pp-title">Join Room</h1>

        {/* Room Code */}
        <div>
          <label className="block text-sm text-pp-text-muted mb-2">Room Code</label>
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            maxLength={6}
            placeholder="Enter room code"
            className="input-field text-center text-2xl tracking-widest font-bold uppercase"
          />
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm text-pp-text-muted mb-2">Your Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={30}
            placeholder="Enter your display name"
            className="input-field"
          />
        </div>

        {/* Photo */}
        <div>
          <label className="block text-sm text-pp-text-muted mb-2">Photo (optional)</label>
          <div className="flex items-center gap-4">
            <div
              onClick={() => fileRef.current?.click()}
              className="w-16 h-16 rounded-full bg-pp-surface border border-pp-purple/30 flex items-center justify-center cursor-pointer overflow-hidden hover:border-pp-purple transition-colors"
            >
              {photoPreview ? (
                <img src={photoPreview} alt="" className="w-full h-full object-cover" />
              ) : (
                <Icon name="card" size="md" className="text-pp-text-muted" />
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="hidden" />
            <span className="text-sm text-pp-text-muted">Tap to take or upload a photo</span>
          </div>
        </div>

        {error && (
          <p className="text-pp-red text-sm text-center">{error}</p>
        )}

        <button onClick={handleSubmit} disabled={loading || !code.trim() || !name.trim()} className="btn-primary w-full">
          {loading ? 'Joining...' : 'Join Game'}
        </button>
      </div>

      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
    </div>
  );
}
