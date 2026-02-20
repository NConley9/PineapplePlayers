// ==========================================
// Pineapple Players — Shared Types
// ==========================================

// ---- Enums ----

export type CardType = 'truth' | 'dare' | 'challenge' | 'group';
export type Expansion = 'core' | 'vanilla' | 'pineapple';
export type RoomStatus = 'lobby' | 'in_progress' | 'ended';
export type TurnOutcome = 'completed' | 'passed';
export type AuthProvider = 'guest' | 'email' | 'oauth';
export type KickVoteStatus = 'pending' | 'kicked' | 'stayed';
export type SuggestionStatus = 'new' | 'accepted' | 'rejected';

// ---- Entities ----

export interface Player {
  player_id: string;
  display_name: string;
  photo_url: string | null;
  email: string | null;
  auth_provider: AuthProvider;
  created_at: string;
}

export interface Room {
  room_id: string;
  room_code: string;
  host_player_id: string;
  status: RoomStatus;
  expansions: Expansion[];
  current_turn_player_id: string | null;
  turn_order: string[];
  turn_number: number;
  created_at: string;
  ended_at: string | null;
}

export interface Card {
  card_id: number;
  card_type: CardType;
  card_text: string;
  expansion: Expansion;
  is_active: boolean;
}

export interface TurnLog {
  log_id: string;
  room_id: string;
  player_id: string;
  card_drawn_1: number;
  card_drawn_2: number;
  card_selected: number;
  outcome: TurnOutcome;
  turn_number: number;
  created_at: string;
}

export interface RoomPlayer {
  room_id: string;
  player_id: string;
  display_name: string;
  photo_url: string | null;
  is_active: boolean;
  is_kicked: boolean;
  kick_count: number;
  joined_at: string;
}

export interface KickVote {
  vote_id: string;
  room_id: string;
  target_player_id: string;
  initiated_by: string;
  votes_for: number;
  votes_against: number;
  status: KickVoteStatus;
  created_at: string;
  resolved_at: string | null;
}

export interface CardSuggestion {
  suggestion_id: string;
  player_id: string | null;
  card_type: CardType;
  card_text: string;
  expansion: string;
  status: SuggestionStatus;
  reviewed_at: string | null;
  created_at: string;
}

// ---- Socket Events ----

export interface ServerToClientEvents {
  player_joined: (player: RoomPlayer) => void;
  player_left: (data: { player_id: string }) => void;
  game_started: (data: { turn_order: string[]; current_player_id: string }) => void;
  turn_started: (data: { player_id: string; turn_number: number }) => void;
  cards_drawn: (data: { player_id: string; cards: Card[] }) => void;
  card_selected: (data: { player_id: string; card: Card }) => void;
  turn_ended: (data: { player_id: string; outcome: TurnOutcome; card: Card }) => void;
  kick_vote_initiated: (data: { vote_id: string; target_player_id: string; initiated_by: string }) => void;
  kick_vote_update: (data: { vote_id: string; votes_for: number; votes_against: number }) => void;
  kick_vote_resolved: (data: { vote_id: string; target_player_id: string; result: 'kicked' | 'stayed' }) => void;
  game_ended: () => void;
  room_state: (state: RoomState) => void;
  error: (data: { message: string }) => void;
}

export interface ClientToServerEvents {
  join_room: (data: { room_code: string; player_id: string; display_name: string; photo_url?: string }) => void;
  leave_room: (data: { room_id: string; player_id: string }) => void;
  start_game: (data: { room_id: string; player_id: string }) => void;
  draw_cards: (data: { room_id: string; player_id: string }) => void;
  select_card: (data: { room_id: string; player_id: string; card_id: number }) => void;
  complete_turn: (data: { room_id: string; player_id: string; outcome: TurnOutcome }) => void;
  end_turn: (data: { room_id: string; player_id: string }) => void;
  initiate_kick: (data: { room_id: string; player_id: string; target_player_id: string }) => void;
  cast_kick_vote: (data: { room_id: string; player_id: string; vote_id: string; vote: 'kick' | 'keep' }) => void;
  update_expansions: (data: { room_id: string; player_id: string; expansions: Expansion[] }) => void;
}

// ---- Composite State ----

export interface RoomState {
  room: Room;
  players: RoomPlayer[];
  current_card?: Card;
  drawn_cards?: Card[];
  active_kick_vote?: KickVote;
  turn_log: TurnLog[];
}

// ---- API Request/Response ----

export interface CreateRoomRequest {
  host_display_name: string;
  host_photo_url?: string;
  expansions: Expansion[];
  player_id?: string; // if returning player
}

export interface CreateRoomResponse {
  room: Room;
  player: Player;
  room_code: string;
}

export interface JoinRoomRequest {
  room_code: string;
  display_name: string;
  photo_url?: string;
  player_id?: string;
}

export interface JoinRoomResponse {
  room: Room;
  player: Player;
  players: RoomPlayer[];
}

export interface CardSuggestionRequest {
  player_id?: string;
  card_type: CardType;
  card_text: string;
  expansion?: string;
}

export interface ProfileUpdateRequest {
  display_name?: string;
  photo_url?: string;
  email?: string;
  password?: string;
}

export interface GameHistoryEntry {
  room_id: string;
  room_code: string;
  created_at: string;
  ended_at: string | null;
  player_count: number;
  turn_count: number;
  expansions: Expansion[];
}
