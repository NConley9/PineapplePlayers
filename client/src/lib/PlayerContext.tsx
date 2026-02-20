import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { v4 as uuid } from 'uuid';

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

function loadPlayer(): PlayerState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return { player_id: uuid(), display_name: '', photo_url: null };
}

function savePlayer(p: PlayerState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

const PlayerContext = createContext<PlayerContextType>(null!);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [player, setPlayerState] = useState<PlayerState>(loadPlayer);
  const [ageVerified, setAgeVerified] = useState(() => localStorage.getItem(AGE_KEY) === 'true');

  useEffect(() => {
    savePlayer(player);
  }, [player]);

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
