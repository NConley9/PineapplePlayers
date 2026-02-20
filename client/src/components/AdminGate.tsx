import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from './Icon';

interface AdminGateProps {
  children: React.ReactNode;
}

export function AdminGate({ children }: AdminGateProps) {
  const navigate = useNavigate();
  const [isAuthed, setIsAuthed] = useState(() => {
    return localStorage.getItem('admin_verified') === 'true';
  });
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (isAuthed) {
    return <>{children}</>;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Simple password check - in production, this would verify server-side
    const ADMIN_PASSWORD = 'PineappleAdmin2026';
    
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem('admin_verified', 'true');
      setIsAuthed(true);
      setPassword('');
    } else {
      setError('Invalid password');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen pp-shell flex flex-col items-center justify-center p-6">
      <div className="max-w-sm w-full space-y-6 pp-panel">
        <div className="flex justify-center">
          <Icon name="lock" size="xl" className="text-pp-gold" />
        </div>
        
        <h1 className="text-2xl font-bold text-pp-text pp-title text-center">Admin Access</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-pp-text-muted mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="input-field w-full"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-pp-red text-sm text-center">{error}</p>
          )}

          <button type="submit" className="btn-primary w-full">
            Verify Access
          </button>
        </form>

        <button
          onClick={() => navigate('/')}
          className="text-pp-text-muted hover:text-pp-text transition-colors text-sm text-center w-full"
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
}
