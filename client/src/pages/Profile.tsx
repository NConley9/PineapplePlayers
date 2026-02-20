import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../lib/PlayerContext';
import { api } from '../lib/api';
import { RulesModal } from '../components/RulesModal';

export default function Profile() {
  const navigate = useNavigate();
  const { player, setPlayer } = usePlayer();
  const [name, setName] = useState(player.display_name || '');
  const [photoPreview, setPhotoPreview] = useState<string | null>(player.photo_url);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (player.player_id) {
      api.getPlayerHistory(player.player_id).then(res => {
        setHistory(res.games || []);
      }).catch(() => {});
    }
  }, [player.player_id]);

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoPreview(URL.createObjectURL(file));
    try {
      const url = await api.uploadPhoto(file);
      setPlayer({ photo_url: url });
    } catch {
      // ignore
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setPlayer({ display_name: name.trim() });
    try {
      await api.updatePlayer(player.player_id, {
        display_name: name.trim(),
        photo_url: player.photo_url || undefined,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // still saved locally
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setLoading(false);
  };

  return (
    <div id="profile-page" className="min-h-screen pp-shell p-6">
      <div id="profile-container" className="max-w-md mx-auto space-y-6 pp-panel">
        <div className="flex items-center justify-between">
          <button id="btn-back" onClick={() => navigate('/')} className="text-pp-text-muted hover:text-pp-text transition-colors">
            ← Back
          </button>
          <button id="btn-rules" onClick={() => setShowRules(true)} className="text-sm text-pp-text-muted hover:text-pp-text transition-colors underline" aria-label="Show rules">Rules</button>
        </div>

        <h1 id="profile-title" className="text-2xl font-bold text-pp-text pp-title">Your Profile</h1>

        {/* Photo */}
        <div className="flex justify-center">
          <div
            id="photo-upload"
            onClick={() => fileRef.current?.click()}
            className="w-24 h-24 rounded-full bg-pp-surface border-2 border-pp-purple/30 flex items-center justify-center cursor-pointer overflow-hidden hover:border-pp-purple transition-colors"
          >
            {photoPreview ? (
              <img src={photoPreview} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-pp-text-muted text-3xl">📷</span>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="hidden" />
        </div>

        {/* Name */}
        <div>
          <label htmlFor="name-input" className="block text-sm text-pp-text-muted mb-2">Display Name</label>
          <input
            id="name-input"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={30}
            placeholder="Your name"
            className="input-field"
          />
        </div>

        <button id="btn-save-profile" onClick={handleSave} disabled={loading} className="btn-primary w-full">
          {saved ? '✓ Saved' : loading ? 'Saving...' : 'Save Profile'}
        </button>

        {/* Game History */}
        <div id="game-history-section" className="pt-4">
          <h2 className="text-lg font-bold text-pp-text mb-3">Game History</h2>
          {history.length === 0 ? (
            <p className="text-pp-text-muted text-sm">No games played yet.</p>
          ) : (
            <div id="history-list" className="space-y-2">
              {history.map((g: any) => (
                <button
                  id={`history-game-${g.room_id}`}
                  key={g.room_id}
                  onClick={() => navigate(`/history/${g.room_id}`)}
                  className="w-full text-left p-4 rounded-xl bg-pp-surface/50 border border-pp-purple/20 hover:border-pp-purple/50 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-pp-purple font-bold">{g.room_code}</span>
                    <span className="text-xs text-pp-text-muted">{new Date(g.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="text-sm text-pp-text-muted mt-1">
                    {g.player_count} players · {g.turn_count} turns
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
    </div>
  );
}
