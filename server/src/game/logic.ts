import { getDb } from '../db/database';
import { v4 as uuid } from 'uuid';
import type { Card, Expansion, RoomPlayer, TurnLog, RoomState, Room } from '@pineapple/shared';

// ---- Helpers ----

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function shuffle<T>(array: T[]): T[] {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---- Room Management ----

export function createRoom(hostPlayerId: string, expansions: Expansion[]): { room_id: string; room_code: string } {
  const db = getDb();
  const room_id = uuid();

  // Generate unique code
  let room_code: string;
  do {
    room_code = generateRoomCode();
  } while (db.prepare('SELECT 1 FROM rooms WHERE room_code = ? AND status != ?').get(room_code, 'ended'));

  // Ensure 'core' is always included
  if (!expansions.includes('core')) {
    expansions = ['core', ...expansions];
  }

  db.prepare(`
    INSERT INTO rooms (room_id, room_code, host_player_id, status, expansions, turn_order)
    VALUES (?, ?, ?, 'lobby', ?, '[]')
  `).run(room_id, room_code, hostPlayerId, JSON.stringify(expansions));

  return { room_id, room_code };
}

export function findRoomByCode(code: string): Room | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM rooms WHERE room_code = ?').get(code) as any;
  if (!row) return null;
  return {
    ...row,
    expansions: JSON.parse(row.expansions),
    turn_order: JSON.parse(row.turn_order),
  };
}

export function getRoom(roomId: string): Room | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM rooms WHERE room_id = ?').get(roomId) as any;
  if (!row) return null;
  return {
    ...row,
    expansions: JSON.parse(row.expansions),
    turn_order: JSON.parse(row.turn_order),
  };
}

export function getRoomPlayers(roomId: string): RoomPlayer[] {
  const db = getDb();
  return db.prepare('SELECT * FROM room_players WHERE room_id = ?').all(roomId) as RoomPlayer[];
}

export function getActivePlayers(roomId: string): RoomPlayer[] {
  const db = getDb();
  return db.prepare(
    'SELECT * FROM room_players WHERE room_id = ? AND is_active = 1 AND is_kicked = 0'
  ).all(roomId) as RoomPlayer[];
}

// ---- Player Management ----

export function createOrGetPlayer(playerId: string | undefined, displayName: string, photoUrl?: string): { player_id: string; display_name: string; photo_url: string | null } {
  const db = getDb();

  if (playerId) {
    const existing = db.prepare('SELECT * FROM players WHERE player_id = ?').get(playerId) as any;
    if (existing) {
      // Update name/photo if changed
      db.prepare('UPDATE players SET display_name = ?, photo_url = COALESCE(?, photo_url) WHERE player_id = ?')
        .run(displayName, photoUrl || null, playerId);
      return { player_id: playerId, display_name: displayName, photo_url: photoUrl || existing.photo_url };
    }
  }

  const newId = playerId || uuid();
  db.prepare(
    'INSERT INTO players (player_id, display_name, photo_url, auth_provider) VALUES (?, ?, ?, ?)'
  ).run(newId, displayName, photoUrl || null, 'guest');

  return { player_id: newId, display_name: displayName, photo_url: photoUrl || null };
}

export function addPlayerToRoom(roomId: string, playerId: string, displayName: string, photoUrl?: string): RoomPlayer | { error: string } {
  const db = getDb();

  // Check if banned
  const existing = db.prepare(
    'SELECT * FROM room_players WHERE room_id = ? AND player_id = ?'
  ).get(roomId, playerId) as any;

  if (existing && existing.kick_count >= 2) {
    return { error: 'You have been banned from this room.' };
  }

  // Check name uniqueness
  const nameTaken = db.prepare(
    'SELECT 1 FROM room_players WHERE room_id = ? AND display_name = ? AND player_id != ? AND is_active = 1'
  ).get(roomId, displayName, playerId);

  if (nameTaken) {
    return { error: 'That name is already taken. Choose another.' };
  }

  if (existing) {
    // Rejoin
    db.prepare(
      'UPDATE room_players SET is_active = 1, display_name = ?, photo_url = COALESCE(?, photo_url) WHERE room_id = ? AND player_id = ?'
    ).run(displayName, photoUrl || null, roomId, playerId);
  } else {
    db.prepare(
      'INSERT INTO room_players (room_id, player_id, display_name, photo_url) VALUES (?, ?, ?, ?)'
    ).run(roomId, playerId, displayName, photoUrl || null);
  }

  // Add to turn order if game is in progress
  const room = getRoom(roomId);
  if (room && room.status === 'in_progress') {
    const turnOrder = room.turn_order;
    if (!turnOrder.includes(playerId)) {
      turnOrder.push(playerId);
      db.prepare('UPDATE rooms SET turn_order = ? WHERE room_id = ?')
        .run(JSON.stringify(turnOrder), roomId);
    }
  }

  return db.prepare(
    'SELECT * FROM room_players WHERE room_id = ? AND player_id = ?'
  ).get(roomId, playerId) as RoomPlayer;
}

export function removePlayerFromRoom(roomId: string, playerId: string): { gameEnded: boolean } {
  const db = getDb();

  db.prepare('UPDATE room_players SET is_active = 0 WHERE room_id = ? AND player_id = ?')
    .run(roomId, playerId);

  // Remove from turn order
  const room = getRoom(roomId);
  if (room) {
    const turnOrder = room.turn_order.filter((id: string) => id !== playerId);
    db.prepare('UPDATE rooms SET turn_order = ? WHERE room_id = ?')
      .run(JSON.stringify(turnOrder), roomId);
  }

  // Check if any active players remain
  const active = getActivePlayers(roomId);
  const updatedRoom = getRoom(roomId);
  if (active.length === 0 && updatedRoom?.status === 'in_progress') {
    db.prepare("UPDATE rooms SET status = 'ended', ended_at = datetime('now') WHERE room_id = ?")
      .run(roomId);
    return { gameEnded: true };
  }

  return { gameEnded: false };
}

// ---- Deck Management ----

export function buildDeck(roomId: string, expansions: Expansion[]): void {
  const db = getDb();

  const placeholders = expansions.map(() => '?').join(',');
  const cards = db.prepare(
    `SELECT card_id FROM cards WHERE expansion IN (${placeholders}) AND is_active = 1`
  ).all(...expansions) as { card_id: number }[];

  const cardIds = shuffle(cards.map(c => c.card_id));

  // Upsert game deck
  db.prepare(`
    INSERT INTO game_decks (room_id, draw_pile, discard_pile)
    VALUES (?, ?, '[]')
    ON CONFLICT(room_id) DO UPDATE SET draw_pile = ?, discard_pile = '[]'
  `).run(roomId, JSON.stringify(cardIds), JSON.stringify(cardIds));
}

export function drawCards(roomId: string, count: number = 2): Card[] {
  const db = getDb();
  const deck = db.prepare('SELECT * FROM game_decks WHERE room_id = ?').get(roomId) as any;
  if (!deck) return [];

  let drawPile: number[] = JSON.parse(deck.draw_pile);
  let discardPile: number[] = JSON.parse(deck.discard_pile);

  // Reshuffle if needed
  if (drawPile.length < count) {
    drawPile = shuffle([...drawPile, ...discardPile]);
    discardPile = [];
  }

  const drawnIds = drawPile.splice(0, count);

  db.prepare('UPDATE game_decks SET draw_pile = ?, discard_pile = ? WHERE room_id = ?')
    .run(JSON.stringify(drawPile), JSON.stringify(discardPile), roomId);

  if (drawnIds.length === 0) return [];

  const placeholders = drawnIds.map(() => '?').join(',');
  return db.prepare(
    `SELECT * FROM cards WHERE card_id IN (${placeholders})`
  ).all(...drawnIds) as Card[];
}

export function discardCard(roomId: string, cardId: number): void {
  const db = getDb();
  const deck = db.prepare('SELECT * FROM game_decks WHERE room_id = ?').get(roomId) as any;
  if (!deck) return;

  const discardPile: number[] = JSON.parse(deck.discard_pile);
  discardPile.push(cardId);

  db.prepare('UPDATE game_decks SET discard_pile = ? WHERE room_id = ?')
    .run(JSON.stringify(discardPile), roomId);
}

// ---- Game Flow ----

export function startGame(roomId: string, hostPlayerId: string): { success: boolean; error?: string } {
  const db = getDb();
  const room = getRoom(roomId);
  if (!room) return { success: false, error: 'Room not found' };
  if (room.host_player_id !== hostPlayerId) return { success: false, error: 'Only the host can start the game' };
  if (room.status !== 'lobby') return { success: false, error: 'Game already started' };

  const players = getActivePlayers(roomId);
  if (players.length < 1) return { success: false, error: 'Need at least 1 player to start' };

  // Build deck
  buildDeck(roomId, room.expansions as Expansion[]);

  // Randomize turn order
  const turnOrder = shuffle(players.map(p => p.player_id));
  const firstPlayer = turnOrder[0];

  db.prepare(`
    UPDATE rooms SET status = 'in_progress', turn_order = ?, current_turn_player_id = ?, turn_number = 1
    WHERE room_id = ?
  `).run(JSON.stringify(turnOrder), firstPlayer, roomId);

  return { success: true };
}

export function getNextPlayer(roomId: string): string | null {
  const room = getRoom(roomId);
  if (!room || !room.turn_order.length) return null;

  const activePlayers = getActivePlayers(roomId);
  const activeIds = new Set(activePlayers.map(p => p.player_id));

  const currentIndex = room.turn_order.indexOf(room.current_turn_player_id || '');
  const order = room.turn_order;

  // Find next active player
  for (let i = 1; i <= order.length; i++) {
    const nextIndex = (currentIndex + i) % order.length;
    if (activeIds.has(order[nextIndex])) {
      return order[nextIndex];
    }
  }
  return null;
}

export function advanceTurn(roomId: string): { nextPlayerId: string | null; turnNumber: number } {
  const db = getDb();
  const room = getRoom(roomId);
  if (!room) return { nextPlayerId: null, turnNumber: 0 };

  const nextPlayerId = getNextPlayer(roomId);
  const turnNumber = (room.turn_number || 0) + 1;

  if (nextPlayerId) {
    db.prepare('UPDATE rooms SET current_turn_player_id = ?, turn_number = ? WHERE room_id = ?')
      .run(nextPlayerId, turnNumber, roomId);
  }

  return { nextPlayerId, turnNumber };
}

export function logTurn(
  roomId: string,
  playerId: string,
  cardDrawn1: number,
  cardDrawn2: number,
  cardSelected: number,
  outcome: 'completed' | 'passed',
  turnNumber: number
): TurnLog {
  const db = getDb();
  const logId = uuid();

  db.prepare(`
    INSERT INTO turn_logs (log_id, room_id, player_id, card_drawn_1, card_drawn_2, card_selected, outcome, turn_number)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(logId, roomId, playerId, cardDrawn1, cardDrawn2, cardSelected, outcome, turnNumber);

  return db.prepare('SELECT * FROM turn_logs WHERE log_id = ?').get(logId) as TurnLog;
}

export function getTurnLogs(roomId: string): TurnLog[] {
  const db = getDb();
  return db.prepare('SELECT * FROM turn_logs WHERE room_id = ? ORDER BY turn_number ASC').all(roomId) as TurnLog[];
}

// ---- Kick Votes ----

export function initiateKick(roomId: string, initiatedBy: string, targetPlayerId: string): { vote_id: string } | { error: string } {
  const db = getDb();

  // Check no pending vote
  const pending = db.prepare(
    "SELECT 1 FROM kick_votes WHERE room_id = ? AND status = 'pending'"
  ).get(roomId);
  if (pending) return { error: 'A kick vote is already in progress' };

  const voteId = uuid();
  db.prepare(`
    INSERT INTO kick_votes (vote_id, room_id, target_player_id, initiated_by, voters)
    VALUES (?, ?, ?, ?, ?)
  `).run(voteId, roomId, targetPlayerId, initiatedBy, JSON.stringify({ [initiatedBy]: 'kick' }));

  // Auto-count initiator's vote
  db.prepare('UPDATE kick_votes SET votes_for = 1 WHERE vote_id = ?').run(voteId);

  return { vote_id: voteId };
}

export function castKickVote(voteId: string, playerId: string, vote: 'kick' | 'keep'): { resolved: boolean; result?: 'kicked' | 'stayed' } {
  const db = getDb();
  const kv = db.prepare('SELECT * FROM kick_votes WHERE vote_id = ?').get(voteId) as any;
  if (!kv || kv.status !== 'pending') return { resolved: false };

  const voters = JSON.parse(kv.voters);
  if (voters[playerId]) return { resolved: false }; // already voted

  voters[playerId] = vote;
  const votesFor = Object.values(voters).filter(v => v === 'kick').length;
  const votesAgainst = Object.values(voters).filter(v => v === 'keep').length;

  db.prepare('UPDATE kick_votes SET voters = ?, votes_for = ?, votes_against = ? WHERE vote_id = ?')
    .run(JSON.stringify(voters), votesFor, votesAgainst, voteId);

  // Check if all eligible have voted
  const activePlayers = getActivePlayers(kv.room_id);
  const eligible = activePlayers.filter(p => p.player_id !== kv.target_player_id);

  if (Object.keys(voters).length >= eligible.length) {
    return resolveKickVote(voteId);
  }

  return { resolved: false };
}

export function resolveKickVote(voteId: string): { resolved: boolean; result: 'kicked' | 'stayed' } {
  const db = getDb();
  const kv = db.prepare('SELECT * FROM kick_votes WHERE vote_id = ?').get(voteId) as any;

  const activePlayers = getActivePlayers(kv.room_id);
  const eligible = activePlayers.filter(p => p.player_id !== kv.target_player_id);
  const threshold = Math.floor(eligible.length / 2) + 1;

  const result = kv.votes_for >= threshold ? 'kicked' : 'stayed';

  db.prepare("UPDATE kick_votes SET status = ?, resolved_at = datetime('now') WHERE vote_id = ?")
    .run(result, voteId);

  if (result === 'kicked') {
    // Kick the player
    db.prepare(
      'UPDATE room_players SET is_kicked = 1, is_active = 0, kick_count = kick_count + 1 WHERE room_id = ? AND player_id = ?'
    ).run(kv.room_id, kv.target_player_id);

    // Remove from turn order
    const room = getRoom(kv.room_id);
    if (room) {
      const turnOrder = room.turn_order.filter((id: string) => id !== kv.target_player_id);
      db.prepare('UPDATE rooms SET turn_order = ? WHERE room_id = ?')
        .run(JSON.stringify(turnOrder), kv.room_id);
    }
  }

  return { resolved: true, result };
}

// ---- Room State ----

export function getRoomState(roomId: string): RoomState | null {
  const room = getRoom(roomId);
  if (!room) return null;

  const players = getRoomPlayers(roomId);
  const turnLog = getTurnLogs(roomId);

  const db = getDb();
  const activeKickVote = db.prepare(
    "SELECT * FROM kick_votes WHERE room_id = ? AND status = 'pending'"
  ).get(roomId) as any;

  return {
    room,
    players,
    turn_log: turnLog,
    active_kick_vote: activeKickVote ? {
      ...activeKickVote,
      voters: undefined,
    } : undefined,
  };
}

// ---- Expansion Management ----

export function updateExpansions(roomId: string, hostPlayerId: string, expansions: Expansion[]): boolean {
  const db = getDb();
  const room = getRoom(roomId);
  if (!room || room.host_player_id !== hostPlayerId || room.status !== 'lobby') return false;

  if (!expansions.includes('core')) {
    expansions = ['core', ...expansions];
  }

  db.prepare('UPDATE rooms SET expansions = ? WHERE room_id = ?')
    .run(JSON.stringify(expansions), roomId);
  return true;
}

// ---- Card Suggestions ----

export function createSuggestion(
  playerId: string | null,
  cardType: string,
  cardText: string,
  expansion: string
): string {
  const db = getDb();
  const id = uuid();
  db.prepare(`
    INSERT INTO card_suggestions (suggestion_id, player_id, card_type, card_text, expansion)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, playerId, cardType, cardText, expansion);
  return id;
}

// ---- Game History ----

export function getPlayerGameHistory(playerId: string) {
  const db = getDb();
  return db.prepare(`
    SELECT r.room_id, r.room_code, r.created_at, r.ended_at, r.expansions,
           (SELECT COUNT(*) FROM room_players WHERE room_id = r.room_id) as player_count,
           (SELECT COUNT(*) FROM turn_logs WHERE room_id = r.room_id) as turn_count
    FROM rooms r
    INNER JOIN room_players rp ON r.room_id = rp.room_id
    WHERE rp.player_id = ?
      AND (SELECT COUNT(*) FROM turn_logs WHERE room_id = r.room_id) >= 3
    ORDER BY r.created_at DESC
  `).all(playerId) as any[];
}

export function getGameDetail(roomId: string) {
  const db = getDb();

  const turns = db.prepare(`
    SELECT tl.*, c.card_type, c.card_text, c.expansion,
           p.display_name as player_name
    FROM turn_logs tl
    LEFT JOIN cards c ON tl.card_selected = c.card_id
    LEFT JOIN players p ON tl.player_id = p.player_id
    WHERE tl.room_id = ?
    ORDER BY tl.turn_number ASC
  `).all(roomId) as any[];

  const players = getRoomPlayers(roomId);
  const room = getRoom(roomId);

  return { room, players, turns };
}

export function getAnalyticsSummary() {
  const db = getDb();

  const summary = db.prepare(`
    SELECT
      COUNT(*) as total_games,
      AVG(turn_count) as avg_turns,
      AVG(player_count) as avg_players
    FROM (
      SELECT
        r.room_id,
        (SELECT COUNT(*) FROM turn_logs WHERE room_id = r.room_id) as turn_count,
        (SELECT COUNT(*) FROM room_players WHERE room_id = r.room_id) as player_count
      FROM rooms r
      WHERE (SELECT COUNT(*) FROM turn_logs WHERE room_id = r.room_id) >= 3
    )
  `).get() as { total_games: number; avg_turns: number | null; avg_players: number | null };

  const byExpansion = db.prepare(`
    SELECT
      c.expansion,
      COUNT(*) as turn_count
    FROM turn_logs tl
    INNER JOIN cards c ON tl.card_selected = c.card_id
    WHERE tl.room_id IN (
      SELECT r.room_id
      FROM rooms r
      WHERE (SELECT COUNT(*) FROM turn_logs WHERE room_id = r.room_id) >= 3
    )
    GROUP BY c.expansion
    ORDER BY turn_count DESC
  `).all() as { expansion: string; turn_count: number }[];

  return {
    total_games: summary.total_games || 0,
    avg_turns: summary.avg_turns ? Number(summary.avg_turns.toFixed(2)) : 0,
    avg_players: summary.avg_players ? Number(summary.avg_players.toFixed(2)) : 0,
    by_expansion: byExpansion,
  };
}

// ---- Card Getters ----

export function getCardById(cardId: number): Card | null {
  const db = getDb();
  return db.prepare('SELECT * FROM cards WHERE card_id = ?').get(cardId) as Card | null;
}
