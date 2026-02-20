import { query } from '../db/database';
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

export async function createRoom(hostPlayerId: string, expansions: Expansion[]): Promise<{ room_id: string; room_code: string }> {
  const room_id = uuid();

  // Generate unique code
  let room_code: string = '';
  let codeExists = true;
  while (codeExists) {
    room_code = generateRoomCode();
    const result = await query('SELECT 1 FROM rooms WHERE room_code = $1 AND status != $2', [room_code, 'ended']);
    codeExists = result.rows.length > 0;
  }

  // Ensure 'core' is always included
  if (!expansions.includes('core')) {
    expansions = ['core', ...expansions];
  }

  await query(
    `INSERT INTO rooms (room_id, room_code, host_player_id, status, expansions, turn_order)
     VALUES ($1, $2, $3, 'lobby', $4, $5)`,
    [room_id, room_code, hostPlayerId, JSON.stringify(expansions), JSON.stringify([])]
  );

  return { room_id, room_code };
}

export async function findRoomByCode(code: string): Promise<Room | null> {
  const result = await query('SELECT * FROM rooms WHERE room_code = $1', [code]);
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    ...row,
    expansions: JSON.parse(row.expansions),
    turn_order: JSON.parse(row.turn_order),
  };
}

export async function getRoom(roomId: string): Promise<Room | null> {
  const result = await query('SELECT * FROM rooms WHERE room_id = $1', [roomId]);
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    ...row,
    expansions: JSON.parse(row.expansions),
    turn_order: JSON.parse(row.turn_order),
  };
}

export async function getRoomPlayers(roomId: string): Promise<RoomPlayer[]> {
  const result = await query('SELECT * FROM room_players WHERE room_id = $1', [roomId]);
  return result.rows;
}

export async function getActivePlayers(roomId: string): Promise<RoomPlayer[]> {
  const result = await query(
    'SELECT * FROM room_players WHERE room_id = $1 AND is_active = 1 AND is_kicked = 0',
    [roomId]
  );
  return result.rows;
}

// ---- Player Management ----

export async function createOrGetPlayer(
  playerId: string | undefined,
  displayName: string,
  photoUrl?: string
): Promise<{ player_id: string; display_name: string; photo_url: string | null }> {
  if (playerId) {
    const result = await query('SELECT * FROM players WHERE player_id = $1', [playerId]);
    if (result.rows.length > 0) {
      // Update name/photo if changed
      await query(
        'UPDATE players SET display_name = $1, photo_url = COALESCE($2, photo_url) WHERE player_id = $3',
        [displayName, photoUrl || null, playerId]
      );
      const existing = result.rows[0];
      return { player_id: playerId, display_name: displayName, photo_url: photoUrl || existing.photo_url };
    }
  }

  const newId = playerId || uuid();
  await query(
    'INSERT INTO players (player_id, display_name, photo_url, auth_provider) VALUES ($1, $2, $3, $4)',
    [newId, displayName, photoUrl || null, 'guest']
  );

  return { player_id: newId, display_name: displayName, photo_url: photoUrl || null };
}

export async function addPlayerToRoom(
  roomId: string,
  playerId: string,
  displayName: string,
  photoUrl?: string
): Promise<RoomPlayer | { error: string }> {
  // Check if banned
  const existing = await query(
    'SELECT * FROM room_players WHERE room_id = $1 AND player_id = $2',
    [roomId, playerId]
  );

  if (existing.rows.length > 0 && existing.rows[0].kick_count >= 2) {
    return { error: 'You have been banned from this room.' };
  }

  // Check name uniqueness
  const nameTaken = await query(
    'SELECT 1 FROM room_players WHERE room_id = $1 AND display_name = $2 AND player_id != $3 AND is_active = 1',
    [roomId, displayName, playerId]
  );

  if (nameTaken.rows.length > 0) {
    return { error: 'That name is already taken. Choose another.' };
  }

  if (existing.rows.length > 0) {
    // Rejoin
    await query(
      'UPDATE room_players SET is_active = 1, display_name = $1, photo_url = COALESCE($2, photo_url) WHERE room_id = $3 AND player_id = $4',
      [displayName, photoUrl || null, roomId, playerId]
    );
  } else {
    await query(
      'INSERT INTO room_players (room_id, player_id, display_name, photo_url) VALUES ($1, $2, $3, $4)',
      [roomId, playerId, displayName, photoUrl || null]
    );
  }

  // Add to turn order if game is in progress
  const room = await getRoom(roomId);
  if (room && room.status === 'in_progress') {
    const turnOrder = room.turn_order;
    if (!turnOrder.includes(playerId)) {
      turnOrder.push(playerId);
      await query(
        'UPDATE rooms SET turn_order = $1 WHERE room_id = $2',
        [JSON.stringify(turnOrder), roomId]
      );
    }
  }

  const result = await query(
    'SELECT * FROM room_players WHERE room_id = $1 AND player_id = $2',
    [roomId, playerId]
  );
  return result.rows[0] as RoomPlayer;
}

export async function removePlayerFromRoom(roomId: string, playerId: string): Promise<{ gameEnded: boolean }> {
  await query(
    'UPDATE room_players SET is_active = 0 WHERE room_id = $1 AND player_id = $2',
    [roomId, playerId]
  );

  // Remove from turn order
  const room = await getRoom(roomId);
  if (room) {
    const turnOrder = room.turn_order.filter((id: string) => id !== playerId);
    await query(
      'UPDATE rooms SET turn_order = $1 WHERE room_id = $2',
      [JSON.stringify(turnOrder), roomId]
    );
  }

  // Check if any active players remain
  const active = await getActivePlayers(roomId);
  const updatedRoom = await getRoom(roomId);
  if (active.length === 0 && updatedRoom?.status === 'in_progress') {
    await query(
      "UPDATE rooms SET status = 'ended', ended_at = CURRENT_TIMESTAMP WHERE room_id = $1",
      [roomId]
    );
    return { gameEnded: true };
  }

  return { gameEnded: false };
}

// ---- Deck Management ----

export async function buildDeck(roomId: string, expansions: Expansion[]): Promise<void> {
  const placeholders = expansions.map((_, i) => `$${i + 1}`).join(',');
  const result = await query(
    `SELECT card_id FROM cards WHERE expansion IN (${placeholders}) AND is_active = 1`,
    expansions
  );

  const cardIds = shuffle((result.rows as { card_id: number }[]).map(c => c.card_id));

  // Upsert game deck
  const deckExists = await query(
    'SELECT 1 FROM game_decks WHERE room_id = $1',
    [roomId]
  );

  if (deckExists.rows.length > 0) {
    await query(
      'UPDATE game_decks SET draw_pile = $1, discard_pile = $2 WHERE room_id = $3',
      [JSON.stringify(cardIds), JSON.stringify([]), roomId]
    );
  } else {
    await query(
      'INSERT INTO game_decks (room_id, draw_pile, discard_pile) VALUES ($1, $2, $3)',
      [roomId, JSON.stringify(cardIds), JSON.stringify([])]
    );
  }
}

export async function drawCards(roomId: string, count: number = 2): Promise<Card[]> {
  const result = await query('SELECT * FROM game_decks WHERE room_id = $1', [roomId]);
  if (result.rows.length === 0) return [];

  const deck = result.rows[0];
  let drawPile: number[] = JSON.parse(deck.draw_pile);
  let discardPile: number[] = JSON.parse(deck.discard_pile);

  // Reshuffle if needed
  if (drawPile.length < count) {
    drawPile = shuffle([...drawPile, ...discardPile]);
    discardPile = [];
  }

  const drawnIds = drawPile.splice(0, count);

  await query(
    'UPDATE game_decks SET draw_pile = $1, discard_pile = $2 WHERE room_id = $3',
    [JSON.stringify(drawPile), JSON.stringify(discardPile), roomId]
  );

  if (drawnIds.length === 0) return [];

  const placeholders = drawnIds.map((_, i) => `$${i + 1}`).join(',');
  const cardsResult = await query(
    `SELECT * FROM cards WHERE card_id IN (${placeholders})`,
    drawnIds
  );
  return cardsResult.rows as Card[];
}

export async function discardCard(roomId: string, cardId: number): Promise<void> {
  const result = await query('SELECT * FROM game_decks WHERE room_id = $1', [roomId]);
  if (result.rows.length === 0) return;

  const deck = result.rows[0];
  const discardPile: number[] = JSON.parse(deck.discard_pile);
  discardPile.push(cardId);

  await query(
    'UPDATE game_decks SET discard_pile = $1 WHERE room_id = $2',
    [JSON.stringify(discardPile), roomId]
  );
}

// ---- Game Flow ----

export async function startGame(
  roomId: string,
  hostPlayerId: string
): Promise<{ success: boolean; error?: string }> {
  const room = await getRoom(roomId);
  if (!room) return { success: false, error: 'Room not found' };
  if (room.host_player_id !== hostPlayerId) return { success: false, error: 'Only the host can start the game' };
  if (room.status !== 'lobby') return { success: false, error: 'Game already started' };

  const players = await getActivePlayers(roomId);
  if (players.length < 1) return { success: false, error: 'Need at least 1 player to start' };

  // Build deck
  await buildDeck(roomId, room.expansions as Expansion[]);

  // Randomize turn order
  const turnOrder = shuffle(players.map(p => p.player_id));
  const firstPlayer = turnOrder[0];

  await query(
    `UPDATE rooms SET status = 'in_progress', turn_order = $1, current_turn_player_id = $2, turn_number = 1
     WHERE room_id = $3`,
    [JSON.stringify(turnOrder), firstPlayer, roomId]
  );

  return { success: true };
}

export async function getNextPlayer(roomId: string): Promise<string | null> {
  const room = await getRoom(roomId);
  if (!room || !room.turn_order.length) return null;

  const activePlayers = await getActivePlayers(roomId);
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

export async function advanceTurn(roomId: string): Promise<{ nextPlayerId: string | null; turnNumber: number }> {
  const room = await getRoom(roomId);
  if (!room) return { nextPlayerId: null, turnNumber: 0 };

  const nextPlayerId = await getNextPlayer(roomId);
  const turnNumber = (room.turn_number || 0) + 1;

  if (nextPlayerId) {
    await query(
      'UPDATE rooms SET current_turn_player_id = $1, turn_number = $2 WHERE room_id = $3',
      [nextPlayerId, turnNumber, roomId]
    );
  }

  return { nextPlayerId, turnNumber };
}

export async function logTurn(
  roomId: string,
  playerId: string,
  cardDrawn1: number,
  cardDrawn2: number,
  cardSelected: number,
  outcome: 'completed' | 'passed',
  turnNumber: number
): Promise<TurnLog> {
  const logId = uuid();

  await query(
    `INSERT INTO turn_logs (log_id, room_id, player_id, card_drawn_1, card_drawn_2, card_selected, outcome, turn_number)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [logId, roomId, playerId, cardDrawn1, cardDrawn2, cardSelected, outcome, turnNumber]
  );

  const result = await query('SELECT * FROM turn_logs WHERE log_id = $1', [logId]);
  return result.rows[0] as TurnLog;
}

export async function getTurnLogs(roomId: string): Promise<TurnLog[]> {
  const result = await query(
    'SELECT * FROM turn_logs WHERE room_id = $1 ORDER BY turn_number ASC',
    [roomId]
  );
  return result.rows;
}

// ---- Kick Votes ----

export async function initiateKick(
  roomId: string,
  initiatedBy: string,
  targetPlayerId: string
): Promise<{ vote_id: string } | { error: string }> {
  // Check no pending vote
  const pending = await query(
    "SELECT 1 FROM kick_votes WHERE room_id = $1 AND status = 'pending'",
    [roomId]
  );
  if (pending.rows.length > 0) return { error: 'A kick vote is already in progress' };

  const voteId = uuid();
  await query(
    `INSERT INTO kick_votes (vote_id, room_id, target_player_id, initiated_by, voters)
     VALUES ($1, $2, $3, $4, $5)`,
    [voteId, roomId, targetPlayerId, initiatedBy, JSON.stringify({ [initiatedBy]: 'kick' })]
  );

  // Auto-count initiator's vote
  await query('UPDATE kick_votes SET votes_for = 1 WHERE vote_id = $1', [voteId]);

  return { vote_id: voteId };
}

export async function castKickVote(
  voteId: string,
  playerId: string,
  vote: 'kick' | 'keep'
): Promise<{ resolved: boolean; result?: 'kicked' | 'stayed' }> {
  const result = await query('SELECT * FROM kick_votes WHERE vote_id = $1', [voteId]);
  const kv = result.rows[0];
  if (!kv || kv.status !== 'pending') return { resolved: false };

  const voters = JSON.parse(kv.voters);
  if (voters[playerId]) return { resolved: false }; // already voted

  voters[playerId] = vote;
  const votesFor = Object.values(voters).filter(v => v === 'kick').length;
  const votesAgainst = Object.values(voters).filter(v => v === 'keep').length;

  await query(
    'UPDATE kick_votes SET voters = $1, votes_for = $2, votes_against = $3 WHERE vote_id = $4',
    [JSON.stringify(voters), votesFor, votesAgainst, voteId]
  );

  // Check if all eligible have voted
  const activePlayers = await getActivePlayers(kv.room_id);
  const eligible = activePlayers.filter(p => p.player_id !== kv.target_player_id);

  if (Object.keys(voters).length >= eligible.length) {
    return await resolveKickVote(voteId);
  }

  return { resolved: false };
}

export async function resolveKickVote(voteId: string): Promise<{ resolved: boolean; result: 'kicked' | 'stayed' }> {
  const result = await query('SELECT * FROM kick_votes WHERE vote_id = $1', [voteId]);
  const kv = result.rows[0];

  const activePlayers = await getActivePlayers(kv.room_id);
  const eligible = activePlayers.filter(p => p.player_id !== kv.target_player_id);
  const threshold = Math.floor(eligible.length / 2) + 1;

  const kickResult = kv.votes_for >= threshold ? 'kicked' : 'stayed';

  await query(
    "UPDATE kick_votes SET status = $1, resolved_at = CURRENT_TIMESTAMP WHERE vote_id = $2",
    [kickResult, voteId]
  );

  if (kickResult === 'kicked') {
    // Kick the player
    await query(
      'UPDATE room_players SET is_kicked = 1, is_active = 0, kick_count = kick_count + 1 WHERE room_id = $1 AND player_id = $2',
      [kv.room_id, kv.target_player_id]
    );

    // Remove from turn order
    const room = await getRoom(kv.room_id);
    if (room) {
      const turnOrder = room.turn_order.filter((id: string) => id !== kv.target_player_id);
      await query(
        'UPDATE rooms SET turn_order = $1 WHERE room_id = $2',
        [JSON.stringify(turnOrder), kv.room_id]
      );
    }
  }

  return { resolved: true, result: kickResult };
}

// ---- Room State ----

export async function getRoomState(roomId: string): Promise<RoomState | null> {
  const room = await getRoom(roomId);
  if (!room) return null;

  const players = await getRoomPlayers(roomId);
  const turnLog = await getTurnLogs(roomId);

  const voteResult = await query(
    "SELECT * FROM kick_votes WHERE room_id = $1 AND status = 'pending'",
    [roomId]
  );
  const activeKickVote = voteResult.rows.length > 0 ? voteResult.rows[0] : null;

  return {
    room,
    players,
    turn_log: turnLog,
    active_kick_vote: activeKickVote
      ? {
          ...activeKickVote,
          voters: undefined,
        }
      : undefined,
  };
}

// ---- Expansion Management ----

export async function updateExpansions(roomId: string, hostPlayerId: string, expansions: Expansion[]): Promise<boolean> {
  const room = await getRoom(roomId);
  if (!room || room.host_player_id !== hostPlayerId || room.status !== 'lobby') return false;

  if (!expansions.includes('core')) {
    expansions = ['core', ...expansions];
  }

  await query(
    'UPDATE rooms SET expansions = $1 WHERE room_id = $2',
    [JSON.stringify(expansions), roomId]
  );
  return true;
}

// ---- Card Suggestions ----

export async function createSuggestion(
  playerId: string | null,
  cardType: string,
  cardText: string,
  expansion: string
): Promise<string> {
  const id = uuid();
  await query(
    `INSERT INTO card_suggestions (suggestion_id, player_id, card_type, card_text, expansion)
     VALUES ($1, $2, $3, $4, $5)`,
    [id, playerId, cardType, cardText, expansion]
  );
  return id;
}

// ---- Game History ----

export async function getPlayerGameHistory(playerId: string) {
  const result = await query(
    `SELECT r.room_id, r.room_code, r.created_at, r.ended_at, r.expansions,
            (SELECT COUNT(*) FROM room_players WHERE room_id = r.room_id) as player_count,
            (SELECT COUNT(*) FROM turn_logs WHERE room_id = r.room_id) as turn_count
     FROM rooms r
     INNER JOIN room_players rp ON r.room_id = rp.room_id
     WHERE rp.player_id = $1
       AND (SELECT COUNT(*) FROM turn_logs WHERE room_id = r.room_id) >= 3
     ORDER BY r.created_at DESC`,
    [playerId]
  );
  return result.rows;
}

export async function getGameDetail(roomId: string) {
  const turnsResult = await query(
    `SELECT tl.*, c.card_type, c.card_text, c.expansion,
            p.display_name as player_name
     FROM turn_logs tl
     LEFT JOIN cards c ON tl.card_selected = c.card_id
     LEFT JOIN players p ON tl.player_id = p.player_id
     WHERE tl.room_id = $1
     ORDER BY tl.turn_number ASC`,
    [roomId]
  );

  const players = await getRoomPlayers(roomId);
  const room = await getRoom(roomId);

  return { room, players, turns: turnsResult.rows };
}

export async function getAnalyticsSummary() {
  const summaryResult = await query(
    `SELECT
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
     ) subquery`
  );

  const summary = summaryResult.rows[0] || { total_games: 0, avg_turns: null, avg_players: null };

  const expansionResult = await query(
    `SELECT
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
     ORDER BY turn_count DESC`
  );

  return {
    total_games: parseInt(summary.total_games, 10) || 0,
    avg_turns: summary.avg_turns ? Number((summary.avg_turns as number).toFixed(2)) : 0,
    avg_players: summary.avg_players ? Number((summary.avg_players as number).toFixed(2)) : 0,
    by_expansion: expansionResult.rows,
  };
}

// ---- Card Getters ----

export async function getCardById(cardId: number): Promise<Card | null> {
  const result = await query('SELECT * FROM cards WHERE card_id = $1', [cardId]);
  return result.rows.length > 0 ? (result.rows[0] as Card) : null;
}
