import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { api } from '../lib/api';
import { resolvePhotoUrl } from '../lib/photo';

type ProfilePhoto = {
  photo_url: string;
  player_id: string;
  display_name: string;
  created_at: string;
};

export default function AdminProfilePhotos() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profilePhotos, setProfilePhotos] = useState<ProfilePhoto[]>([]);

  useEffect(() => {
    api.getAdminProfilePhotos()
      .then((data) => setProfilePhotos(data.photos || []))
      .catch((err: any) => setError(err.message || 'Failed to load profile photos'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen pp-shell p-6">
      <div className="max-w-5xl mx-auto space-y-6 pp-panel">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/admin/analytics')} className="text-pp-text-muted hover:text-pp-text transition-colors">
            ← Back to Analytics
          </button>
          <button onClick={() => navigate('/')} className="text-pp-text-muted hover:text-pp-text transition-colors text-sm">
            Home
          </button>
        </div>

        <h1 className="text-2xl font-bold text-pp-text pp-title">Profile Photo Browser</h1>

        {loading && (
          <div className="rounded-xl border border-pp-purple/20 bg-pp-surface/40 p-4 text-pp-text-muted text-sm">
            Loading profile photos...
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-pp-red/30 bg-pp-red/10 p-4 text-pp-red text-sm">
            {error}
          </div>
        )}

        {!loading && !error && profilePhotos.length === 0 && (
          <div className="rounded-xl border border-pp-purple/20 bg-pp-surface/40 p-4 text-pp-text-muted text-sm">
            No uploaded profile photos found.
          </div>
        )}

        {!loading && !error && profilePhotos.length > 0 && (
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
                  <div className="mt-2 flex items-center gap-1 text-xs text-pp-text truncate">
                    <Icon name="users" size="sm" />
                    <span className="truncate">{photo.display_name || 'Unknown'}</span>
                  </div>
                  <div className="text-[10px] text-pp-text-muted">{new Date(photo.created_at).toLocaleDateString()}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
