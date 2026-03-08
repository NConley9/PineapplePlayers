import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../lib/socket';
import { usePlayer } from '../lib/PlayerContext';
import { useGame } from '../lib/GameContext';
import { api } from '../lib/api';
import PlayerList from '../components/PlayerList';
import CardDisplay from '../components/CardDisplay';
import KickVoteModal from '../components/KickVoteModal';
import { RulesModal } from '../components/RulesModal';
import { Icon } from '../components/Icon';

export default function GameRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const socket = useSocket();
  const { player } = usePlayer();
  const { game, setGame, resetGame } = useGame();
  const [showKickVote, setShowKickVote] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [passNotice, setPassNotice] = useState<string | null>(null);
  const hasJoinedRef = useRef(false);

  const isMyTurn = game.current_turn_player_id === player.player_id;
  const isHost = game.host_player_id === player.player_id;
  const activePlayerCount = game.players.filter((p: any) => p.is_active && !p.is_kicked).length;

  // Restore room info on reload
  useEffect(() => {
    if (!roomId || game.room_code) return;
    api.getRoom(roomId)
      .then((room) => {
        if (room?.room_code) {
          setGame({ room_id: room.room_id, room_code: room.room_code });
        }
      })
      .catch(() => {});
  }, [roomId, game.room_code, setGame]);

  // Connect socket and join room once room_code is available
  useEffect(() => {
    if (!roomId || !game.room_code) return;
    if (hasJoinedRef.current) return;

    if (!socket.connected) socket.connect();

    socket.emit('join_room', {
      room_code: game.room_code || '',
      player_id: player.player_id,
      display_name: player.display_name,
      photo_url: player.photo_url || undefined,
    });

    hasJoinedRef.current = true;

    return () => {
      hasJoinedRef.current = false;
    };
  }, [roomId, game.room_code, player.player_id, player.display_name, player.photo_url, socket]);

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
      if (data.outcome === 'passed') {
        const passer = game.players.find((p: any) => p.player_id === data.player_id);
        setPassNotice(`${passer?.display_name || 'A player'} passed their turn.`);
        setTimeout(() => setPassNotice(null), 3500);
      }
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
        <div id="game-over-panel" className="text-center space-y-8 max-w-sm pp-panel pp-animate-fade-scale">
          <div className="pp-animate-float text-6xl">🍍</div>
          <div className="space-y-2">
            <h1
              id="game-over-title"
              className="pp-title pp-text-shimmer text-3xl font-black"
              style={{ fontFamily: 'var(--font-pp-display)' }}
            >
              GAME OVER!
            </h1>
            <p className="text-pp-text-muted text-sm">Thanks for playing Pineapple Players.</p>
          </div>
          <button id="btn-back-to-home" onClick={() => navigate('/')} className="btn-primary w-full">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="game-room-page" className="min-h-screen pp-shell flex flex-col overflow-hidden">
      {/* Header */}
      <header
        id="game-header"
        className="mx-3 mt-3 rounded-2xl px-4 py-3 border border-pp-cyan/15
          bg-pp-bg-light/60 backdrop-blur-md flex items-center justify-between"
        style={{ position: 'relative', zIndex: 10 }}
      >
        <div className="flex items-center gap-3">
          <Icon name="pineapple" size="md" />
          <div className="flex flex-col leading-none">
            <span className="text-pp-text-muted text-xs uppercase tracking-wider">Room</span>
            <button
              id="room-code-btn"
              onClick={copyRoomCode}
              aria-label="Copy room code"
              className="font-black tracking-widest text-pp-cyan hover:text-pp-gold transition-colors"
              style={{ fontFamily: 'var(--font-pp-display)', fontSize: '0.75rem' }}
            >
              {game.room_code}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            id="btn-log"
            onClick={() => navigate(`/history/${roomId}`)}
            className="text-xs text-pp-text-muted hover:text-pp-text transition-colors font-bold uppercase tracking-wider"
          >
            Log
          </button>
          <button
            id="btn-rules"
            onClick={() => setShowRules(true)}
            className="text-xs text-pp-text-muted hover:text-pp-text transition-colors font-bold uppercase tracking-wider"
          >
            Rules
          </button>
          <button
            id="btn-leave"
            onClick={handleLeave}
            className="text-xs text-pp-dare hover:text-pp-dare-dark transition-colors font-bold uppercase tracking-wider"
          >
            Leave
          </button>
        </div>
      </header>

      {/* Pass notice */}
      {passNotice && (
        <div
          className="mx-3 mt-2 rounded-2xl border border-pp-gold/30 px-4 py-2.5 text-sm font-semibold text-pp-gold pp-animate-slide-left"
          style={{ background: 'rgba(255,214,10,0.08)', zIndex: 10, position: 'relative' }}
        >
          ⏭ {passNotice}
        </div>
      )}

      {/* Main Content */}
      <main
        id="main-game-content"
        className="game-room-main flex-1 flex flex-col items-center justify-center p-3 sm:p-4 pb-28 overflow-y-auto"
        style={{ position: 'relative', zIndex: 1 }}
      >
        {/* LOBBY */}
        {game.status === 'lobby' && (
          <div id="lobby-panel" className="w-full max-w-md space-y-6 text-center pp-panel pp-animate-rise">
            <div className="space-y-3">
              <div className="text-5xl pp-animate-float">🍍</div>
              <h2
                className="pp-title font-black"
                style={{ fontFamily: 'var(--font-pp-display)', fontSize: '1.1rem', color: 'var(--color-pp-text)' }}
              >
                WAITING FOR PLAYERS
              </h2>
              <p className="text-pp-text-muted text-sm">
                Share{' '}
                <span
                  className="font-black"
                  style={{ color: 'var(--color-pp-cyan)', fontFamily: 'var(--font-pp-display)', fontSize: '0.8rem' }}
                >
                  {game.room_code}
                </span>{' '}
                with your crew
              </p>
              <p className="text-xs text-pp-text-muted opacity-60">
                Can play with 1 device passed around
              </p>
            </div>

            {isHost && (
              <button
                id="btn-start-game"
                onClick={handleStartGame}
                disabled={activePlayerCount < 1}
                className="btn-primary w-full text-base py-4"
              >
                Start Game
              </button>
            )}
          </div>
        )}

        {/* IN GAME */}
        {game.status === 'in_progress' && (
          <div id="game-container" className="w-full max-w-2xl space-y-4">

            {/* Turn banner */}
            <div
              id="turn-banner"
              className="pp-panel py-3 px-5 flex items-center justify-between pp-animate-slide-left"
            >
              <div>
                <p
                  className="text-pp-text-muted uppercase tracking-widest"
                  style={{ fontSize: '0.6rem', fontFamily: 'var(--font-pp-display)' }}
                >
                  Turn {game.turn_number}
                </p>
                <h2
                  id="turn-indicator"
                  className="font-black leading-tight"
                  style={{
                    fontFamily: 'var(--font-pp-display)',
                    fontSize: '0.95rem',
                    color: isMyTurn ? 'var(--color-pp-gold)' : 'var(--color-pp-text)',
                  }}
                >
                  {isMyTurn ? '⚡ YOUR TURN' : `${currentPlayer?.display_name?.toUpperCase() || 'UNKNOWN'}`}
                </h2>
              </div>
              {isMyTurn && (
                <div
                  className="pp-animate-pulse-ring w-10 h-10 rounded-2xl flex items-center justify-center"
                  style={{ background: 'rgba(255,214,10,0.15)', border: '1px solid rgba(255,214,10,0.4)' }}
                >
                  <span className="text-xl">⚡</span>
                </div>
              )}
            </div>

            {/* Card play area */}
            <div id="card-play-area">
              {/* MY TURN */}
              {isMyTurn && (
                <div id="my-turn-section" className="space-y-4">
                  {/* Draw phase */}
                  {game.drawn_cards.length === 0 && !game.selected_card && (
                    <button
                      onClick={handleDrawCards}
                      className="btn-primary w-full text-base py-5 pp-animate-rise"
                      style={{ fontSize: '0.85rem' }}
                    >
                      🃏 Draw Cards
                    </button>
                  )}

                  {/* Card selection phase */}
                  {game.drawn_cards.length === 2 && !game.selected_card && (
                    <div className="space-y-3">
                      <p
                        className="text-center font-bold uppercase tracking-widest"
                        style={{ color: 'var(--color-pp-text-muted)', fontSize: '0.65rem', fontFamily: 'var(--font-pp-display)' }}
                      >
                        Choose a card
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        {game.drawn_cards.map((card: any, idx: number) => (
                          <CardDisplay
                            key={card.card_id}
                            card={card}
                            onClick={() => handleSelectCard(card.card_id)}
                            drawDelay={idx}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Play phase */}
                  {game.selected_card && !game.turn_outcome && (
                    <div className="space-y-5 pp-animate-fade-scale">
                      <CardDisplay card={game.selected_card} large glowing />
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => handleCompleteTurn('completed')}
                          className="btn-success flex items-center justify-center gap-2 py-4"
                        >
                          <Icon name="check" size="sm" />
                          <span className="font-black uppercase tracking-wide" style={{ fontSize: '0.7rem', fontFamily: 'var(--font-pp-display)' }}>Done</span>
                        </button>
                        <button
                          onClick={() => handleCompleteTurn('passed')}
                          className="btn-muted flex items-center justify-center gap-2 py-4"
                        >
                          <Icon name="skip" size="sm" />
                          <span className="font-black uppercase tracking-wide" style={{ fontSize: '0.7rem', fontFamily: 'var(--font-pp-display)' }}>Pass</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* End turn phase */}
                  {game.turn_outcome && (
                    <div className="space-y-5 text-center pp-animate-fade-scale">
                      <div className="pp-panel py-6">
                        <p className="text-4xl mb-3">
                          {game.turn_outcome === 'completed' ? '🎉' : '⏭️'}
                        </p>
                        <p
                          className="font-black"
                          style={{
                            fontFamily: 'var(--font-pp-display)',
                            fontSize: '0.85rem',
                            color: game.turn_outcome === 'completed' ? 'var(--color-pp-cyan)' : 'var(--color-pp-text-muted)',
                          }}
                        >
                          {game.turn_outcome === 'completed' ? 'NAILED IT!' : 'PASSED'}
                        </p>
                      </div>
                      <button onClick={handleEndTurn} className="btn-primary w-full py-4">
                        End Turn
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* WAITING: not my turn */}
              {!isMyTurn && (
                <div className="space-y-4 pp-animate-fade-scale">
                  {game.selected_card ? (
                    <>
                      <p
                        className="text-center font-bold uppercase tracking-widest"
                        style={{ color: 'var(--color-pp-text-muted)', fontSize: '0.6rem', fontFamily: 'var(--font-pp-display)' }}
                      >
                        Currently playing
                      </p>
                      <CardDisplay card={game.selected_card} large />
                    </>
                  ) : (
                    <div className="pp-panel text-center py-10 space-y-3">
                      <div className="text-4xl pp-animate-float">⏳</div>
                      <p
                        className="font-black"
                        style={{ fontFamily: 'var(--font-pp-display)', fontSize: '0.75rem', color: 'var(--color-pp-text-muted)' }}
                      >
                        WAITING FOR {currentPlayer?.display_name?.toUpperCase() || 'PLAYER'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Player bar */}
      <div className="fixed bottom-0 left-0 right-0 z-20">
        <PlayerList
          players={game.players.filter((p: any) => !p.is_kicked)}
          currentPlayerId={player.player_id}
          currentTurnPlayerId={game.current_turn_player_id}
          turnOrder={game.turn_order}
          onKick={game.status === 'in_progress' ? handleKick : undefined}
        />
      </div>

      {showKickVote && game.active_kick_vote && game.active_kick_vote.target_player_id !== player.player_id && (
        <KickVoteModal
          vote={game.active_kick_vote}
          players={game.players}
          onVote={handleCastVote}
          onClose={() => setShowKickVote(false)}
        />
      )}

      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
    </div>
  );
}
