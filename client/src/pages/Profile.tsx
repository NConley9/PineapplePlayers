import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../lib/PlayerContext';
import { api } from '../lib/api';
import { RulesModal } from '../components/RulesModal';
import { resolvePhotoUrl } from '../lib/photo';

export default function Profile() {
  const navigate = useNavigate();
  const { player, setPlayer } = usePlayer();
  const [name, setName] = useState(player.display_name || '');
  const [photoPreview, setPhotoPreview] = useState<string | null>(resolvePhotoUrl(player.photo_url));
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

  useEffect(() => {
    setPhotoPreview(resolvePhotoUrl(player.photo_url));
  }, [player.photo_url]);

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const temporaryPreview = URL.createObjectURL(file);
    setPhotoPreview(temporaryPreview);

    try {
      const url = await api.uploadPhoto(file);
      setPlayer({ photo_url: url });
      setPhotoPreview(resolvePhotoUrl(url));
      await api.updatePlayer(player.player_id, { photo_url: url });
    } catch {
      // ignore
    } finally {
      URL.revokeObjectURL(temporaryPreview);
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
    <div id="profile-page" className="min-h-screen pp-shell flex flex-col">
      {/* Header */}
      <header className="mx-3 mt-3 rounded-2xl px-4 py-3 border border-pp-cyan/15 bg-pp-bg-light/60 backdrop-blur-md flex items-center justify-between" style={{ position: 'relative', zIndex: 10 }}>
        <button
          id="btn-back"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-pp-text-muted hover:text-pp-cyan transition-colors font-bold uppercase tracking-wider"
          style={{ fontSize: '0.65rem', fontFamily: 'var(--font-pp-display)' }}
        >
          ← Back
        </button>
        <button id="btn-rules" onClick={() => setShowRules(true)} className="text-xs text-pp-text-muted hover:text-pp-text transition-colors font-bold uppercase tracking-wider">
          Rules
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-start p-4 pt-6 gap-5" style={{ position: 'relative', zIndex: 1 }}>
        <div id="profile-container" className="w-full max-w-md space-y-5 pp-panel pp-animate-rise">
          <h1
            id="profile-title"
            className="pp-title font-black"
            style={{ fontFamily: 'var(--font-pp-display)', fontSize: '1.3rem', color: 'var(--color-pp-text)', lineHeight: 1.1 }}
          >
            YOUR<br /><span style={{ color: 'var(--color-pp-cyan)' }}>PROFILE</span>
          </h1>

          {/* Photo */}
          <div className="flex flex-col items-center gap-3">
            <div
              id="photo-upload"
              onClick={() => fileRef.current?.click()}
              className="w-24 h-24 rounded-3xl bg-pp-surface border-2 border-pp-cyan/25 flex items-center justify-center cursor-pointer overflow-hidden hover:border-pp-cyan/60 transition-all"
              style={{ boxShadow: '0 0 24px rgba(0,221,180,0.1)' }}
            >
              {photoPreview ? (
                <img src={photoPreview} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl">📷</span>
              )}
            </div>
            <span className="text-xs text-pp-text-muted">Tap to update photo</span>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="hidden" />
          </div>

          {/* Name */}
          <div>
            <label htmlFor="name-input" className="block mb-2 font-bold uppercase tracking-widest" style={{ fontSize: '0.6rem', fontFamily: 'var(--font-pp-display)', color: 'var(--color-pp-text-muted)' }}>Display Name</label>
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

          <button id="btn-save-profile" onClick={handleSave} disabled={loading} className="btn-primary w-full py-4">
            {saved ? '✓ Saved!' : loading ? 'Saving...' : 'Save Profile'}
          </button>
        </div>

        {/* Game History */}
        <div id="game-history-section" className="w-full max-w-md space-y-3 pp-animate-rise" style={{ animationDelay: '0.1s' }}>
          <h2
            className="font-black uppercase tracking-widest px-1"
            style={{ fontSize: '0.65rem', fontFamily: 'var(--font-pp-display)', color: 'var(--color-pp-text-muted)' }}
          >
            Game History
          </h2>
          {history.length === 0 ? (
            <div className="pp-panel text-center py-8">
              <p className="text-pp-text-muted text-sm">No games played yet.</p>
            </div>
          ) : (
            <div id="history-list" className="space-y-2">
              {history.map((g: any) => (
                <button
                  id={`history-game-${g.room_id}`}
                  key={g.room_id}
                  onClick={() => navigate(`/history/${g.room_id}`)}
                  className="w-full text-left px-4 py-4 rounded-2xl border border-pp-cyan/15 bg-pp-surface/40 hover:border-pp-cyan/40 hover:bg-pp-cyan/5 transition-all"
                >
                  <div className="flex justify-between items-center">
                    <span
                      className="font-black tracking-widest"
                      style={{ fontFamily: 'var(--font-pp-display)', fontSize: '0.7rem', color: 'var(--color-pp-cyan)' }}
                    >
                      {g.room_code}
                    </span>
                    <span className="text-xs text-pp-text-muted">{new Date(g.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="text-xs text-pp-text-muted mt-1 font-semibold">
                    {g.player_count} players · {g.turn_count} turns
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
    </div>
  );
}
