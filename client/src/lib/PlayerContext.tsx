import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { v4 as uuid } from 'uuid';
import { api } from './api';

interface PlayerState {
  player_id: string;
  display_name: string;
  photo_url: string | null;
}

interface PlayerContextType {
  player: PlayerState;
  setPlayer: (p: Partial<PlayerState>) => void;
  ageVerified: boolean;
  confirmAge: () => void;
}

const STORAGE_KEY = 'pp_player';
const AGE_KEY = 'pp_age_verified';
const PLAYER_ID_COOKIE = 'pp_player_id';

function getCookie(name: string): string | null {
  const escaped = name.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setPlayerIdCookie(playerId: string) {
  document.cookie = `${PLAYER_ID_COOKIE}=${encodeURIComponent(playerId)}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

function loadPlayer(): PlayerState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed?.player_id) {
        return parsed;
      }
    }
  } catch { /* ignore */ }

  const cookiePlayerId = getCookie(PLAYER_ID_COOKIE);
  if (cookiePlayerId) {
    return { player_id: cookiePlayerId, display_name: '', photo_url: null };
  }

  return { player_id: uuid(), display_name: '', photo_url: null };
}

function savePlayer(p: PlayerState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  setPlayerIdCookie(p.player_id);
}

const PlayerContext = createContext<PlayerContextType>(null!);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [player, setPlayerState] = useState<PlayerState>(loadPlayer);
  const [ageVerified, setAgeVerified] = useState(() => localStorage.getItem(AGE_KEY) === 'true');

  useEffect(() => {
    savePlayer(player);
  }, [player]);

  useEffect(() => {
    let cancelled = false;
    if (!player.player_id) return;

    api.getPlayer(player.player_id)
      .then((remote) => {
        if (cancelled || !remote) return;
        setPlayerState(prev => {
          const next = {
            ...prev,
            display_name: remote.display_name || prev.display_name,
            photo_url: remote.photo_url ?? prev.photo_url,
          };
          return next;
        });
      })
      .catch(() => {
        // ignore - local player may not exist on server yet
      });

    return () => {
      cancelled = true;
    };
  }, [player.player_id]);

  const setPlayer = (updates: Partial<PlayerState>) => {
    setPlayerState(prev => ({ ...prev, ...updates }));
  };

  const confirmAge = () => {
    localStorage.setItem(AGE_KEY, 'true');
    setAgeVerified(true);
  };

  return (
    <PlayerContext.Provider value={{ player, setPlayer, ageVerified, confirmAge }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  return useContext(PlayerContext);
}
