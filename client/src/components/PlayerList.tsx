import { Icon } from './Icon';
import { resolvePhotoUrl } from '../lib/photo';

interface Player {
  player_id: string;
  display_name: string;
  photo_url: string | null;
  is_active: boolean;
}

interface PlayerListProps {
  players: Player[];
  currentPlayerId: string;
  currentTurnPlayerId: string | null;
  turnOrder?: string[];
  onKick?: (playerId: string) => void;
}

export default function PlayerList({ players, currentPlayerId, currentTurnPlayerId, turnOrder = [], onKick }: PlayerListProps) {
  const orderedPlayers = turnOrder.length
    ? [...players].sort((a, b) => turnOrder.indexOf(a.player_id) - turnOrder.indexOf(b.player_id))
    : players;
  const currentIndex = currentTurnPlayerId ? turnOrder.indexOf(currentTurnPlayerId) : -1;
  const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % turnOrder.length : -1;
  const nextPlayerId = nextIndex >= 0 ? turnOrder[nextIndex] : null;

  return (
    <div className="shrink-0 border-t border-pp-purple/20 bg-pp-bg-light/95 backdrop-blur p-3 shadow-[0_-8px_24px_rgba(0,0,0,0.25)]">
      <div className="flex gap-3 overflow-x-auto pb-1">
        {orderedPlayers.map(p => {
          const isMe = p.player_id === currentPlayerId;
          const isActive = p.player_id === currentTurnPlayerId;
          const isNext = p.player_id === nextPlayerId;
          const orderIndex = turnOrder.indexOf(p.player_id);
          const isInactive = !p.is_active;
          const photoUrl = resolvePhotoUrl(p.photo_url);
          return (
            <div
              key={p.player_id}
              className={`flex flex-col items-center min-w-[60px] relative group pt-1 ${isInactive ? 'opacity-50' : ''}`}
              id={`player-item-${p.player_id}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold overflow-hidden
                ${isActive ? 'ring-2 ring-pp-gold ring-offset-2 ring-offset-pp-bg-light' : ''}
                ${isMe ? 'bg-pp-purple/30 border-pp-purple' : 'bg-pp-surface'} border border-pp-purple/30
              `}>
                {photoUrl ? (
                  <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-pp-text">{p.display_name[0]?.toUpperCase()}</span>
                )}
              </div>
              {orderIndex >= 0 && (
                <span className="mt-1 text-[10px] text-pp-text-muted">#{orderIndex + 1}</span>
              )}
              <span className={`text-xs mt-1 truncate max-w-[60px] ${isMe ? 'text-pp-purple' : 'text-pp-text-muted'}`}>
                {isMe ? 'You' : p.display_name}
              </span>
              {isActive && (
                <span className="mt-1 text-[10px] font-semibold text-pp-gold">Now</span>
              )}
              {!isActive && isNext && (
                <span className="mt-1 text-[10px] font-semibold text-pp-text">Next</span>
              )}
              {isInactive && (
                <span className="mt-1 text-[10px] text-pp-text-muted">Left</span>
              )}
              {/* Kick button */}
              {onKick && !isMe && (
                <button
                  onClick={() => onKick(p.player_id)}
                  aria-label={`Suggest kick for ${p.display_name}`}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-pp-red text-white text-xs items-center justify-center hidden group-hover:flex"
                  title="Suggest Kick"
                >
                  <Icon name="x" size="sm" className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
