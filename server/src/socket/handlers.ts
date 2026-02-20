import { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@pineapple/shared';
import {
  findRoomByCode,
  getRoom,
  addPlayerToRoom,
  removePlayerFromRoom,
  startGame,
  drawCards,
  discardCard,
  logTurn,
  advanceTurn,
  initiateKick,
  castKickVote,
  resolveKickVote,
  getActivePlayers,
  getRoomState,
  updateExpansions,
  getCardById,
  createOrGetPlayer,
} from '../game/logic';

// Track socket → (room_id, player_id) mapping
const socketRoomMap = new Map<string, { room_id: string; player_id: string }>();
// Track active turn state per room (drawn cards for the active player)
const turnState = new Map<string, { card1: number; card2: number; selected?: number; outcome?: string }>();
// Track kick vote timers
const kickTimers = new Map<string, NodeJS.Timeout>();

export function registerSocketHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>
): void {
  io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
    console.log(`Socket connected: ${socket.id}`);

    // ---- Join Room ----
    socket.on('join_room', async (data: any) => {
      try {
        const room = await findRoomByCode(data.room_code.toUpperCase());
        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        // Ensure player exists
        await createOrGetPlayer(data.player_id, data.display_name, data.photo_url);

        const result = await addPlayerToRoom(room.room_id, data.player_id, data.display_name, data.photo_url);
        if ('error' in result) {
          socket.emit('error', { message: result.error });
          return;
        }

        // Join socket room
        socket.join(room.room_id);
        socketRoomMap.set(socket.id, { room_id: room.room_id, player_id: data.player_id });

        // Broadcast to room
        io.to(room.room_id).emit('player_joined', result);

        // Send full state to joining player
        const state = await getRoomState(room.room_id);
        if (state) {
          socket.emit('room_state', state);
        }
      } catch (err) {
        console.error('join_room error:', err);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // ---- Leave Room ----
    socket.on('leave_room', (data) => {
      const mapping = socketRoomMap.get(socket.id);
      if (!mapping) return;
      if (mapping.room_id !== data.room_id || mapping.player_id !== data.player_id) return;

      handlePlayerLeave(io, socket, data.room_id, data.player_id);
      socketRoomMap.delete(socket.id);
    });

    // ---- Start Game ----
    socket.on('start_game', async (data: any) => {
      try {
        const result = await startGame(data.room_id, data.player_id);
        if (!result.success) {
          socket.emit('error', { message: result.error || 'Cannot start game' });
          return;
        }

        const room = await getRoom(data.room_id);
        if (!room) return;

        io.to(data.room_id).emit('game_started', {
          turn_order: room.turn_order,
          current_player_id: room.current_turn_player_id!,
        });

        io.to(data.room_id).emit('turn_started', {
          player_id: room.current_turn_player_id!,
          turn_number: room.turn_number || 1,
        });
      } catch (err) {
        console.error('start_game error:', err);
        socket.emit('error', { message: 'Failed to start game' });
      }
    });

    // ---- Draw Cards ----
    socket.on('draw_cards', async (data: any) => {
      try {
        const room = await getRoom(data.room_id);
        if (!room || room.current_turn_player_id !== data.player_id) {
          socket.emit('error', { message: 'Not your turn' });
          return;
        }

        const cards = await drawCards(data.room_id, 2);
        if (cards.length < 2) {
          socket.emit('error', { message: 'Not enough cards in deck' });
          return;
        }

        // Store turn state
        turnState.set(data.room_id, { card1: cards[0].card_id, card2: cards[1].card_id });

        // Send cards only to the active player
        socket.emit('cards_drawn', { player_id: data.player_id, cards });
      } catch (err) {
        console.error('draw_cards error:', err);
        socket.emit('error', { message: 'Failed to draw cards' });
      }
    });

    // ---- Select Card ----
    socket.on('select_card', async (data: any) => {
      try {
        const room = await getRoom(data.room_id);
        if (!room || room.current_turn_player_id !== data.player_id) {
          socket.emit('error', { message: 'Not your turn' });
          return;
        }

        const state = turnState.get(data.room_id);
        if (!state) {
          socket.emit('error', { message: 'No cards drawn' });
          return;
        }

        // Validate selection
        if (data.card_id !== state.card1 && data.card_id !== state.card2) {
          socket.emit('error', { message: 'Invalid card selection' });
          return;
        }

        state.selected = data.card_id;

        // Discard both cards
        await discardCard(data.room_id, state.card1);
        await discardCard(data.room_id, state.card2);

        // Broadcast selected card to all players
        const card = await getCardById(data.card_id);
        if (card) {
          io.to(data.room_id).emit('card_selected', { player_id: data.player_id, card });
        }
      } catch (err) {
        console.error('select_card error:', err);
        socket.emit('error', { message: 'Failed to select card' });
      }
    });

    // ---- Complete Turn (Completed/Pass) ----
    socket.on('complete_turn', async (data: any) => {
      try {
        const room = await getRoom(data.room_id);
        if (!room || room.current_turn_player_id !== data.player_id) {
          socket.emit('error', { message: 'Not your turn' });
          return;
        }

        const state = turnState.get(data.room_id);
        if (!state || !state.selected) {
          socket.emit('error', { message: 'No card selected' });
          return;
        }

        state.outcome = data.outcome;

        // Log the turn
        await logTurn(
          data.room_id,
          data.player_id,
          state.card1,
          state.card2,
          state.selected,
          data.outcome,
          room.turn_number || 1
        );

        const card = await getCardById(state.selected);
        io.to(data.room_id).emit('turn_ended', {
          player_id: data.player_id,
          outcome: data.outcome,
          card: card!,
        });
      } catch (err) {
        console.error('complete_turn error:', err);
        socket.emit('error', { message: 'Failed to complete turn' });
      }
    });

    // ---- End Turn (advance to next player) ----
    socket.on('end_turn', async (data: any) => {
      try {
        const room = await getRoom(data.room_id);
        if (!room || room.current_turn_player_id !== data.player_id) {
          socket.emit('error', { message: 'Not your turn' });
          return;
        }

        // Clean up turn state
        turnState.delete(data.room_id);

        const { nextPlayerId, turnNumber } = await advanceTurn(data.room_id);
        if (nextPlayerId) {
          io.to(data.room_id).emit('turn_started', {
            player_id: nextPlayerId,
            turn_number: turnNumber,
          });
        }
      } catch (err) {
        console.error('end_turn error:', err);
        socket.emit('error', { message: 'Failed to end turn' });
      }
    });

    // ---- Kick Vote ----
    socket.on('initiate_kick', async (data: any) => {
      try {
        const result = await initiateKick(data.room_id, data.player_id, data.target_player_id);
        if ('error' in result) {
          socket.emit('error', { message: result.error });
          return;
        }

        io.to(data.room_id).emit('kick_vote_initiated', {
          vote_id: result.vote_id,
          target_player_id: data.target_player_id,
          initiated_by: data.player_id,
        });

        // Set 60-second timeout
        const timer = setTimeout(async () => {
          const resolved = await resolveKickVote(result.vote_id);
          io.to(data.room_id).emit('kick_vote_resolved', {
            vote_id: result.vote_id,
            target_player_id: data.target_player_id,
            result: resolved.result,
          });

          if (resolved.result === 'kicked') {
            await handleKickedPlayer(io, data.room_id, data.target_player_id);
          }
          kickTimers.delete(result.vote_id);
        }, 60000);

        kickTimers.set(result.vote_id, timer);
      } catch (err) {
        console.error('initiate_kick error:', err);
        socket.emit('error', { message: 'Failed to initiate kick vote' });
      }
    });

    socket.on('cast_kick_vote', async (data: any) => {
      try {
        const result = await castKickVote(data.vote_id, data.player_id, data.vote);

        // Broadcast updated tallies
        const { query } = require('../db/database');
        const kvResult = await query('SELECT * FROM kick_votes WHERE vote_id = $1', [data.vote_id]);
        const kv = kvResult.rows[0];
        if (kv) {
          io.to(data.room_id).emit('kick_vote_update', {
            vote_id: data.vote_id,
            votes_for: kv.votes_for,
            votes_against: kv.votes_against,
          });
        }

        if (result.resolved) {
          // Cancel timer
          const timer = kickTimers.get(data.vote_id);
          if (timer) {
            clearTimeout(timer);
            kickTimers.delete(data.vote_id);
          }

          io.to(data.room_id).emit('kick_vote_resolved', {
            vote_id: data.vote_id,
            target_player_id: kv.target_player_id,
            result: result.result!,
          });

          if (result.result === 'kicked') {
            await handleKickedPlayer(io, data.room_id, kv.target_player_id);
          }
        }
      } catch (err) {
        console.error('cast_kick_vote error:', err);
        socket.emit('error', { message: 'Failed to cast vote' });
      }
    });

    // ---- Update Expansions ----
    socket.on('update_expansions', async (data: any) => {
      try {
        const success = await updateExpansions(data.room_id, data.player_id, data.expansions);
        if (!success) {
          socket.emit('error', { message: 'Only the host can change expansions in the lobby' });
          return;
        }
        // Broadcast updated state
        const state = await getRoomState(data.room_id);
        if (state) {
          io.to(data.room_id).emit('room_state', state);
        }
      } catch (err) {
        console.error('update_expansions error:', err);
      }
    });

    // ---- Disconnect ----
    socket.on('disconnect', async () => {
      const mapping = socketRoomMap.get(socket.id);
      if (mapping) {
        await handlePlayerLeave(io, socket, mapping.room_id, mapping.player_id);
        socketRoomMap.delete(socket.id);
      }
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
}

function handlePlayerLeave(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  socket: Socket,
  roomId: string,
  playerId: string
): Promise<void> {
  return (async () => {
    try {
      const room = await getRoom(roomId);
      const wasCurrentTurn = room?.current_turn_player_id === playerId;

      const { gameEnded } = await removePlayerFromRoom(roomId, playerId);

      socket.leave(roomId);
      io.to(roomId).emit('player_left', { player_id: playerId });

      if (gameEnded) {
        io.to(roomId).emit('game_ended');
        return;
      }

      // If it was their turn, auto-advance
      if (wasCurrentTurn && room) {
        const state = turnState.get(roomId);
        if (state && state.selected) {
          await logTurn(roomId, playerId, state.card1, state.card2, state.selected, 'passed', room.turn_number || 1);
        }
        turnState.delete(roomId);

        const { nextPlayerId, turnNumber } = await advanceTurn(roomId);
        if (nextPlayerId) {
          io.to(roomId).emit('turn_started', {
            player_id: nextPlayerId,
            turn_number: turnNumber,
          });
        }
      }
    } catch (err) {
      console.error('handlePlayerLeave error:', err);
    }
  })();
}

async function handleKickedPlayer(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  roomId: string,
  targetPlayerId: string
): Promise<void> {
  const room = await getRoom(roomId);
  if (room && room.current_turn_player_id === targetPlayerId) {
    turnState.delete(roomId);
    const { nextPlayerId, turnNumber } = await advanceTurn(roomId);
    if (nextPlayerId) {
      io.to(roomId).emit('turn_started', {
        player_id: nextPlayerId,
        turn_number: turnNumber,
      });
    }
  }
}
