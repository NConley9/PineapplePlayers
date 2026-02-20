import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { api } from '../lib/api';

type Analytics = {
  total_games: number;
  avg_turns: number;
  avg_players: number;
  by_expansion: { expansion: string; turn_count: number }[];
};

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  useEffect(() => {
    api.getAdminAnalytics()
      .then((data) => setAnalytics(data))
      .catch((err: any) => setError(err.message || 'Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen pp-shell p-6">
      <div className="max-w-md mx-auto space-y-6 pp-panel">
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
          </>
        )}
      </div>
    </div>
  );
}
