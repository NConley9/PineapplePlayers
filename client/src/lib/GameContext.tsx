import { createContext, useContext, useState, type ReactNode } from 'react';

interface GameState {
  room_id: string | null;
  room_code: string | null;
  status: 'lobby' | 'in_progress' | 'ended' | null;
  host_player_id: string | null;
  expansions: string[];
  current_turn_player_id: string | null;
  turn_order: string[];
  turn_number: number;
  players: any[];
  drawn_cards: any[];
  selected_card: any | null;
  turn_outcome: string | null;
  active_kick_vote: any | null;
  turn_log: any[];
}

interface GameContextType {
  game: GameState;
  setGame: (updates: Partial<GameState>) => void;
  resetGame: () => void;
}

const initialGameState: GameState = {
  room_id: null,
  room_code: null,
  status: null,
  host_player_id: null,
  expansions: ['core'],
  current_turn_player_id: null,
  turn_order: [],
  turn_number: 0,
  players: [],
  drawn_cards: [],
  selected_card: null,
  turn_outcome: null,
  active_kick_vote: null,
  turn_log: [],
};

const STORAGE_KEY = 'pp_room';

function loadRoomState(): Partial<GameState> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    /* ignore */
  }
  return {};
}

function saveRoomState(room: Partial<GameState>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(room));
}

const GameContext = createContext<GameContextType>(null!);

export function GameProvider({ children }: { children: ReactNode }) {
  const [game, setGameState] = useState<GameState>(() => ({
    ...initialGameState,
    ...loadRoomState(),
  }));

  const setGame = (updates: Partial<GameState>) => {
    setGameState(prev => {
      const next = { ...prev, ...updates };
      saveRoomState({ room_id: next.room_id, room_code: next.room_code });
      return next;
    });
  };

  const resetGame = () => {
    localStorage.removeItem(STORAGE_KEY);
    setGameState(initialGameState);
  };

  return (
    <GameContext.Provider value={{ game, setGame, resetGame }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  return useContext(GameContext);
}
