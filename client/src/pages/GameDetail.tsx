import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export default function GameDetail() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId) return;
    api.getGameDetail(roomId).then(setDetail).catch(() => {}).finally(() => setLoading(false));
  }, [roomId]);

  if (loading) {
    return (
      <div className="min-h-screen pp-shell flex items-center justify-center">
        <div className="pp-panel text-pp-text-muted">Loading...</div>
      </div>
    );
  }

  if (!detail || !detail.room) {
    return (
      <div className="min-h-screen pp-shell flex items-center justify-center p-6">
        <div className="text-center space-y-4 pp-panel">
          <p className="text-pp-text">Game not found</p>
          <button onClick={() => navigate('/')} className="btn-primary">Home</button>
        </div>
      </div>
    );
  }

  const typeColors: Record<string, string> = {
    truth: 'text-pp-purple',
    dare: 'text-pp-red',
    challenge: 'text-pp-orange',
    group: 'text-pp-gold',
  };

  return (
    <div className="min-h-screen pp-shell p-6">
      <div className="max-w-md mx-auto space-y-6 pp-panel">
        <button onClick={() => navigate(-1)} className="text-pp-text-muted hover:text-pp-text transition-colors">
          ← Back
        </button>

        <div>
          <h1 className="text-2xl font-bold text-pp-text pp-title">Game Log</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="font-mono text-pp-purple font-bold">{detail.room.room_code}</span>
            <span className="text-pp-text-muted text-sm">{new Date(detail.room.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Players */}
        <div>
          <h2 className="text-sm text-pp-text-muted mb-2">Players</h2>
          <div className="flex flex-wrap gap-2">
            {detail.players.map((p: any) => (
              <span key={p.player_id} className="px-3 py-1 rounded-full bg-pp-surface text-pp-text text-sm">
                {p.display_name}
              </span>
            ))}
          </div>
        </div>

        {/* Turn Log */}
        <div className="space-y-2">
          <h2 className="text-sm text-pp-text-muted">Turns ({detail.turns.length})</h2>
          {detail.turns.map((turn: any, i: number) => (
            <div key={i} className="p-4 rounded-xl bg-pp-surface/50 border border-pp-purple/10">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-bold text-pp-text text-sm">{turn.player_name}</span>
                  <span className={`ml-2 text-xs font-bold uppercase ${typeColors[turn.card_type] || 'text-pp-text-muted'}`}>
                    {turn.card_type}
                  </span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  turn.outcome === 'completed'
                    ? 'bg-green-600/20 text-green-400'
                    : 'bg-pp-surface text-pp-text-muted'
                }`}>
                  {turn.outcome === 'completed' ? '✓ Done' : '⏭ Pass'}
                </span>
              </div>
              <p className="text-pp-text-muted text-sm mt-2">{turn.card_text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
