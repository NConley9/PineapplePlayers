import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { api } from '../lib/api';
import { resolvePhotoUrl } from '../lib/photo';

type Analytics = {
  total_games: number;
  avg_turns: number;
  avg_players: number;
  by_expansion: { expansion: string; turn_count: number }[];
  card_performance: {
    card_id: number;
    card_type: string;
    card_text: string;
    expansion: string;
    offered_count: number;
    chosen_count: number;
    chosen_ratio: number;
  }[];
  expansion_usage: {
    expansion: string;
    game_count: number;
    total_games: number;
    ratio: number;
  }[];
  game_logs: {
    room_id: string;
    room_code: string;
    status: string;
    expansions: string[];
    created_at: string;
    ended_at: string | null;
    player_count: number;
    turn_count: number;
    turns: {
      turn_number: number;
      outcome: string;
      player_name: string;
      card_type: string;
      card_text: string;
      expansion: string;
    }[];
  }[];
};

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [photosLoading, setPhotosLoading] = useState(true);
  const [photosError, setPhotosError] = useState('');
  const [profilePhotos, setProfilePhotos] = useState<{ photo_url: string; player_id: string; display_name: string; created_at: string }[]>([]);

  useEffect(() => {
    api.getAdminAnalytics()
      .then((data) => setAnalytics(data))
      .catch((err: any) => setError(err.message || 'Failed to load analytics'))
      .finally(() => setLoading(false));

    api.getAdminProfilePhotos()
      .then((data) => setProfilePhotos(data.photos || []))
      .catch((err: any) => setPhotosError(err.message || 'Failed to load profile photos'))
      .finally(() => setPhotosLoading(false));
  }, []);

  return (
    <div className="min-h-screen pp-shell p-6">
      <div className="max-w-5xl mx-auto space-y-6 pp-panel">
        <button onClick={() => navigate('/')} className="text-pp-text-muted hover:text-pp-text transition-colors">
          ← Back
        </button>

        <h1 className="text-2xl font-bold text-pp-text pp-title">Admin Analytics</h1>
        <p className="text-sm text-pp-text-muted">Games with fewer than 3 turns are excluded.</p>

        <button onClick={() => navigate('/admin/cards')} className="btn-secondary w-full flex items-center justify-center gap-2">
          <Icon name="card" size="sm" />
          Manage Cards
        </button>

        {loading && (
          <div className="rounded-xl border border-pp-purple/20 bg-pp-surface/40 p-4 text-pp-text-muted text-sm">
            Loading analytics...
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-pp-red/30 bg-pp-red/10 p-4 text-pp-red text-sm">
            {error}
          </div>
        )}

        {!loading && !error && analytics && (
          <>
            <div className="rounded-xl border border-pp-purple/20 bg-pp-surface/40 p-4 space-y-3">
              <h2 className="text-sm font-bold text-pp-text">Profile Photo Browser</h2>
              {photosLoading && (
                <p className="text-sm text-pp-text-muted">Loading profile photos...</p>
              )}
              {!photosLoading && photosError && (
                <p className="text-sm text-pp-red">{photosError}</p>
              )}
              {!photosLoading && !photosError && profilePhotos.length === 0 && (
                <p className="text-sm text-pp-text-muted">No uploaded profile photos found.</p>
              )}
              {!photosLoading && !photosError && profilePhotos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {profilePhotos.map((photo, idx) => {
                    const photoUrl = resolvePhotoUrl(photo.photo_url);
                    return (
                      <div key={`${photo.player_id}-${photo.photo_url}-${idx}`} className="rounded-lg border border-pp-purple/10 bg-pp-surface/30 p-2">
                        <div className="aspect-square rounded-md overflow-hidden bg-pp-bg-light/40 flex items-center justify-center">
                          {photoUrl ? (
                            <img src={photoUrl} alt={photo.display_name || 'Profile photo'} className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <span className="text-xs text-pp-text-muted">No image</span>
                          )}
                        </div>
                        <div className="mt-2 text-xs text-pp-text truncate">{photo.display_name || 'Unknown'}</div>
                        <div className="text-[10px] text-pp-text-muted">{new Date(photo.created_at).toLocaleDateString()}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="rounded-xl border border-pp-purple/20 bg-pp-surface/40 p-4">
                <div className="text-xs text-pp-text-muted">Total Games</div>
                <div className="text-2xl font-bold text-pp-text">{analytics.total_games}</div>
              </div>
              <div className="rounded-xl border border-pp-orange/20 bg-pp-surface/40 p-4">
                <div className="text-xs text-pp-text-muted">Average Turns</div>
                <div className="text-2xl font-bold text-pp-text">{analytics.avg_turns}</div>
              </div>
              <div className="rounded-xl border border-pp-red/20 bg-pp-surface/40 p-4">
                <div className="text-xs text-pp-text-muted">Average Players</div>
                <div className="text-2xl font-bold text-pp-text">{analytics.avg_players}</div>
              </div>
            </div>

            <div className="rounded-xl border border-pp-gold/20 bg-pp-surface/40 p-4">
              <h2 className="text-sm font-bold text-pp-text mb-3">Turns by Expansion</h2>
              {analytics.by_expansion.length === 0 ? (
                <p className="text-sm text-pp-text-muted">No analytics data yet.</p>
              ) : (
                <div className="space-y-2">
                  {analytics.by_expansion.map((item) => (
                    <div key={item.expansion} className="flex items-center justify-between text-sm">
                      <span className="capitalize text-pp-text">{item.expansion}</span>
                      <span className="text-pp-text-muted">{item.turn_count} turns</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-pp-purple/20 bg-pp-surface/40 p-4">
              <h2 className="text-sm font-bold text-pp-text mb-3">Expansion Usage by Game</h2>
              {analytics.expansion_usage.length === 0 ? (
                <p className="text-sm text-pp-text-muted">No expansion usage data yet.</p>
              ) : (
                <div className="space-y-2">
                  {analytics.expansion_usage.map((item) => (
                    <div key={item.expansion} className="flex items-center justify-between text-sm">
                      <span className="capitalize text-pp-text">{item.expansion}</span>
                      <span className="text-pp-text-muted">
                        {item.game_count}/{item.total_games} ({(item.ratio * 100).toFixed(1)}%)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-pp-orange/20 bg-pp-surface/40 p-4 space-y-3">
              <h2 className="text-sm font-bold text-pp-text">Card Offer vs Chosen Ratio</h2>
              {analytics.card_performance.length === 0 ? (
                <p className="text-sm text-pp-text-muted">No card usage data yet.</p>
              ) : (
                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                  {analytics.card_performance.map((card) => (
                    <div key={card.card_id} className="rounded-lg border border-pp-purple/10 bg-pp-surface/30 p-3">
                      <div className="flex items-center justify-between gap-3 text-xs text-pp-text-muted mb-1">
                        <span className="uppercase">{card.card_type}</span>
                        <span className="capitalize">{card.expansion}</span>
                      </div>
                      <p className="text-sm text-pp-text line-clamp-2">{card.card_text}</p>
                      <div className="mt-2 text-xs text-pp-text-muted">
                        Offered: {card.offered_count} · Chosen: {card.chosen_count} · Ratio: {(card.chosen_ratio * 100).toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-pp-red/20 bg-pp-surface/40 p-4 space-y-3">
              <h2 className="text-sm font-bold text-pp-text">Full Game Logs</h2>
              {analytics.game_logs.length === 0 ? (
                <p className="text-sm text-pp-text-muted">No completed turns logged yet.</p>
              ) : (
                <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                  {analytics.game_logs.map((game) => (
                    <details key={game.room_id} className="rounded-lg border border-pp-purple/10 bg-pp-surface/30 p-3">
                      <summary className="cursor-pointer list-none">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-mono font-bold text-pp-purple">{game.room_code}</div>
                            <div className="text-xs text-pp-text-muted">
                              {new Date(game.created_at).toLocaleString()} · {game.player_count} players · {game.turn_count} turns
                            </div>
                          </div>
                          <div className="text-xs text-pp-text-muted capitalize">{game.status}</div>
                        </div>
                        <div className="text-xs text-pp-text-muted mt-1">Expansions: {game.expansions.join(', ')}</div>
                      </summary>
                      <div className="mt-3 space-y-2">
                        {game.turns.map((turn, idx) => (
                          <div key={`${game.room_id}-${idx}`} className="rounded-md border border-pp-purple/10 bg-pp-bg-light/40 p-2 text-xs">
                            <div className="flex items-center justify-between text-pp-text-muted mb-1">
                              <span>Turn {turn.turn_number} · {turn.player_name}</span>
                              <span className="capitalize">{turn.outcome}</span>
                            </div>
                            <div className="text-pp-text">{turn.card_text}</div>
                            <div className="text-pp-text-muted mt-1 uppercase">{turn.card_type} · {turn.expansion}</div>
                          </div>
                        ))}
                      </div>
                    </details>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
