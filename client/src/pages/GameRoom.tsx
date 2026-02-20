import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../lib/socket';
import { usePlayer } from '../lib/PlayerContext';
import { useGame } from '../lib/GameContext';
import PlayerList from '../components/PlayerList';
import CardDisplay from '../components/CardDisplay';
import KickVoteModal from '../components/KickVoteModal';
import { Icon } from '../components/Icon';

export default function GameRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const socket = useSocket();
  const { player } = usePlayer();
  const { game, setGame, resetGame } = useGame();
  const [showKickVote, setShowKickVote] = useState(false);

  const isMyTurn = game.current_turn_player_id === player.player_id;
  const isHost = game.host_player_id === player.player_id;
  const activePlayerCount = game.players.filter((p: any) => p.is_active && !p.is_kicked).length;

  // Connect socket and join room
  useEffect(() => {
    if (!roomId) return;

    if (!socket.connected) socket.connect();

    socket.emit('join_room', {
      room_code: game.room_code || '',
      player_id: player.player_id,
      display_name: player.display_name,
      photo_url: player.photo_url || undefined,
    });
  }, [roomId]);

  // Socket event handlers
  useEffect(() => {
    const onRoomState = (state: any) => {
      setGame({
        room_id: state.room.room_id,
        room_code: state.room.room_code,
        status: state.room.status,
        host_player_id: state.room.host_player_id,
        expansions: state.room.expansions,
        current_turn_player_id: state.room.current_turn_player_id,
        turn_order: state.room.turn_order,
        turn_number: state.room.turn_number || 0,
        players: state.players,
        turn_log: state.turn_log || [],
        active_kick_vote: state.active_kick_vote || null,
      });
    };

    const onPlayerJoined = (p: any) => {
      setGame({ players: [...game.players.filter((x: any) => x.player_id !== p.player_id), p] });
    };

    const onPlayerLeft = (data: any) => {
      setGame({
        players: game.players.map((p: any) =>
          p.player_id === data.player_id ? { ...p, is_active: false } : p
        ),
      });
    };

    const onGameStarted = (data: any) => {
      setGame({
        status: 'in_progress',
        turn_order: data.turn_order,
        current_turn_player_id: data.current_player_id,
      });
    };

    const onTurnStarted = (data: any) => {
      setGame({
        current_turn_player_id: data.player_id,
        turn_number: data.turn_number,
        drawn_cards: [],
        selected_card: null,
        turn_outcome: null,
      });
    };

    const onCardsDrawn = (data: any) => {
      setGame({ drawn_cards: data.cards });
    };

    const onCardSelected = (data: any) => {
      setGame({ selected_card: data.card });
    };

    const onTurnEnded = (data: any) => {
      setGame({ turn_outcome: data.outcome });
    };

    const onKickVoteInitiated = (data: any) => {
      setGame({ active_kick_vote: data });
      setShowKickVote(true);
    };

    const onKickVoteUpdate = (data: any) => {
      setGame({
        active_kick_vote: game.active_kick_vote
          ? { ...game.active_kick_vote, votes_for: data.votes_for, votes_against: data.votes_against }
          : null,
      });
    };

    const onKickVoteResolved = (data: any) => {
      setShowKickVote(false);
      setGame({ active_kick_vote: null });
      if (data.result === 'kicked' && data.target_player_id === player.player_id) {
        alert('You have been removed from the game.');
        resetGame();
        navigate('/');
      }
    };

    const onGameEnded = () => {
      setGame({ status: 'ended' });
    };

    const onError = (data: any) => {
      console.error('Socket error:', data.message);
    };

    socket.on('room_state', onRoomState);
    socket.on('player_joined', onPlayerJoined);
    socket.on('player_left', onPlayerLeft);
    socket.on('game_started', onGameStarted);
    socket.on('turn_started', onTurnStarted);
    socket.on('cards_drawn', onCardsDrawn);
    socket.on('card_selected', onCardSelected);
    socket.on('turn_ended', onTurnEnded);
    socket.on('kick_vote_initiated', onKickVoteInitiated);
    socket.on('kick_vote_update', onKickVoteUpdate);
    socket.on('kick_vote_resolved', onKickVoteResolved);
    socket.on('game_ended', onGameEnded);
    socket.on('error', onError);

    return () => {
      socket.off('room_state', onRoomState);
      socket.off('player_joined', onPlayerJoined);
      socket.off('player_left', onPlayerLeft);
      socket.off('game_started', onGameStarted);
      socket.off('turn_started', onTurnStarted);
      socket.off('cards_drawn', onCardsDrawn);
      socket.off('card_selected', onCardSelected);
      socket.off('turn_ended', onTurnEnded);
      socket.off('kick_vote_initiated', onKickVoteInitiated);
      socket.off('kick_vote_update', onKickVoteUpdate);
      socket.off('kick_vote_resolved', onKickVoteResolved);
      socket.off('game_ended', onGameEnded);
      socket.off('error', onError);
    };
  }, [socket, game.players, game.active_kick_vote]);

  // Actions
  const handleStartGame = useCallback(() => {
    socket.emit('start_game', { room_id: roomId!, player_id: player.player_id });
  }, [socket, roomId, player.player_id]);

  const handleDrawCards = useCallback(() => {
    socket.emit('draw_cards', { room_id: roomId!, player_id: player.player_id });
  }, [socket, roomId, player.player_id]);

  const handleSelectCard = useCallback((cardId: number) => {
    socket.emit('select_card', { room_id: roomId!, player_id: player.player_id, card_id: cardId });
  }, [socket, roomId, player.player_id]);

  const handleCompleteTurn = useCallback((outcome: 'completed' | 'passed') => {
    socket.emit('complete_turn', { room_id: roomId!, player_id: player.player_id, outcome });
  }, [socket, roomId, player.player_id]);

  const handleEndTurn = useCallback(() => {
    socket.emit('end_turn', { room_id: roomId!, player_id: player.player_id });
  }, [socket, roomId, player.player_id]);

  const handleLeave = useCallback(() => {
    socket.emit('leave_room', { room_id: roomId!, player_id: player.player_id });
    resetGame();
    navigate('/');
  }, [socket, roomId, player.player_id]);

  const handleKick = useCallback((targetPlayerId: string) => {
    socket.emit('initiate_kick', { room_id: roomId!, player_id: player.player_id, target_player_id: targetPlayerId });
  }, [socket, roomId, player.player_id]);

  const handleCastVote = useCallback((voteId: string, vote: 'kick' | 'keep') => {
    socket.emit('cast_kick_vote', { room_id: roomId!, player_id: player.player_id, vote_id: voteId, vote });
    setShowKickVote(false);
  }, [socket, roomId, player.player_id]);

  const copyRoomCode = () => {
    navigator.clipboard.writeText(game.room_code || '');
  };

  const currentPlayer = game.players.find((p: any) => p.player_id === game.current_turn_player_id);

  // ---- RENDER ----

  // Game ended
  if (game.status === 'ended') {
    return (
      <div id="game-ended-page" className="min-h-screen pp-shell flex items-center justify-center p-6">
        <div id="game-over-panel" className="text-center space-y-6 max-w-sm pp-panel">
          <Icon name="pineapple" size="xl" className="pp-animate-float" ariaLabel="Pineapple Players" />
          <h1 id="game-over-title" className="text-2xl font-bold text-pp-text pp-title">Game Over!</h1>
          <p className="text-pp-text-muted">Thanks for playing Pineapple Players.</p>
          <button id="btn-back-to-home" onClick={() => navigate('/')} className="btn-primary w-full">Back to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div id="game-room-page" className="min-h-screen pp-shell flex flex-col">
      {/* Header */}
      <header id="game-header" className="mx-4 mt-4 rounded-2xl px-4 py-3 border border-pp-purple/20 bg-pp-surface/40 backdrop-blur flex items-center justify-between overflow-visible">
        <div className="flex items-center gap-2">
          <Icon name="pineapple" size="md" />
          <span className="text-sm text-pp-text-muted">Room:</span>
          <button
            id="room-code-btn"
            onClick={copyRoomCode}
            aria-label="Copy room code"
            className="font-mono font-bold text-pp-text tracking-widest hover:text-pp-purple transition-colors"
          >
            {game.room_code}
          </button>
        </div>
        <button id="btn-leave" onClick={handleLeave} className="text-sm text-pp-red hover:text-pp-red-dark transition-colors" aria-label="Leave room">
          Leave
        </button>
      </header>

      {/* Main Content */}
      <main id="main-game-content" className="flex-1 flex flex-col items-center justify-center p-6">
        {/* LOBBY */}
        {game.status === 'lobby' && (
          <div id="lobby-panel" className="w-full max-w-md space-y-6 text-center pp-panel">
            <h2 className="text-xl font-bold text-pp-text pp-title">Waiting for players...</h2>
            <p className="text-pp-text-muted">
              Share code <span className="font-mono font-bold text-pp-purple">{game.room_code}</span> with your friends
            </p>

            {isHost && (
              <button
                id="btn-start-game"
                onClick={handleStartGame}
                disabled={activePlayerCount < 1}
                className="btn-primary w-full"
              >
                Start Game
              </button>
            )}
          </div>
        )}

        {/* IN GAME */}
        {game.status === 'in_progress' && (
          <div id="game-container" className="w-full flex justify-center px-4">
            <div className="w-full max-w-6xl space-y-6">
              {/* Mobile/Tablet: Stack layout | Large screens: 3-column layout */}
              <div id="game-grid" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left panel - turn info */}
                <div id="turn-info-panel" className="lg:col-span-1 pp-panel">
                  <div className="text-center space-y-4">
                    <p className="text-sm text-pp-text-muted font-mono">Turn {game.turn_number}</p>
                    <h2 id="turn-indicator" className="text-xl font-bold text-pp-text pp-title">
                      {isMyTurn ? "Your Turn" : `${currentPlayer?.display_name || 'Unknown'}'s Turn`}
                    </h2>
                    {isMyTurn && <Icon name="play" size="lg" className="text-pp-gold mx-auto pp-animate-float" />}
                  </div>
                </div>

                {/* Right panel - card play area */}
                <div id="card-play-panel" className="lg:col-span-2 pp-panel">
                  {/* MY TURN */}
                  {isMyTurn && (
                    <div id="my-turn-section" className="space-y-6">
                      {/* Draw phase */}
                      {game.drawn_cards.length === 0 && !game.selected_card && (
                        <button onClick={handleDrawCards} className="btn-primary w-full text-lg py-4">
                          Draw Cards
                        </button>
                      )}

                      {/* Card selection phase */}
                      {game.drawn_cards.length === 2 && !game.selected_card && (
                        <div className="space-y-4">
                          <p className="text-center text-pp-text-muted">Choose a card to play:</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {game.drawn_cards.map((card: any, idx: number) => (
                              <CardDisplay 
                                key={card.card_id} 
                                card={card} 
                                onClick={() => handleSelectCard(card.card_id)}
                                drawDelay={idx}
                                glowing={false}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Play phase - card selected, waiting for action */}
                      {game.selected_card && !game.turn_outcome && (
                        <div className="space-y-6 pp-animate-fade-scale">
                          <CardDisplay card={game.selected_card} large glowing />
                          <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => handleCompleteTurn('completed')} className="btn-success flex items-center justify-center gap-2">
                              <Icon name="check" size="sm" />
                              Completed
                            </button>
                            <button onClick={() => handleCompleteTurn('passed')} className="btn-muted flex items-center justify-center gap-2">
                              <Icon name="skip" size="sm" />
                              Pass
                            </button>
                          </div>
                        </div>
                      )}

                      {/* End turn phase */}
                      {game.turn_outcome && (
                        <div className="space-y-6 text-center pp-animate-fade-scale">
                          <p className="text-pp-text text-lg font-bold">
                            {game.turn_outcome === 'completed' ? '🎉 Nice work!' : '⏭️ Passed'}
                          </p>
                          <button onClick={handleEndTurn} className="btn-primary w-full">
                            End Turn
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* WAITING (not my turn) */}
                  {!isMyTurn && game.selected_card && (
                    <div className="space-y-4">
                      <p className="text-center text-sm text-pp-text-muted">Currently playing:</p>
                      <CardDisplay card={game.selected_card} large />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Player bar */}
      <PlayerList
        players={game.players.filter((p: any) => p.is_active && !p.is_kicked)}
        currentPlayerId={player.player_id}
        currentTurnPlayerId={game.current_turn_player_id}
        onKick={game.status === 'in_progress' ? handleKick : undefined}
      />

      {/* Kick Vote Modal */}
      {showKickVote && game.active_kick_vote && game.active_kick_vote.target_player_id !== player.player_id && (
        <KickVoteModal
          vote={game.active_kick_vote}
          players={game.players}
          onVote={handleCastVote}
          onClose={() => setShowKickVote(false)}
        />
      )}
    </div>
  );
}
