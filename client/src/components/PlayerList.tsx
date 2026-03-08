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

export default function PlayerList({ players, currentPlayerId, currentTurnPlayerId, onKick }: PlayerListProps) {
  return (
    <div
      className="border-t border-pp-cyan/10 backdrop-blur-xl"
      style={{
        background: 'linear-gradient(to top, rgba(3,10,24,0.95), rgba(7,15,32,0.85))',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.4)',
      }}
    >
      <div className="flex gap-2 overflow-x-auto px-3 py-3 pb-safe">
        {players.map((p) => {
          const isMe = p.player_id === currentPlayerId;
          const isActive = p.player_id === currentTurnPlayerId;
          const photoUrl = resolvePhotoUrl(p.photo_url);

          return (
            <div
              key={p.player_id}
              className="flex flex-col items-center gap-1 min-w-[56px] relative group flex-shrink-0"
              id={`player-item-${p.player_id}`}
            >
              {/* Active turn indicator bar */}
              {isActive && (
                <div
                  className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full"
                  style={{ background: 'var(--color-pp-gold)', boxShadow: '0 0 8px var(--color-pp-gold)' }}
                />
              )}

              {/* Avatar */}
              <div
                className={`
                  w-11 h-11 rounded-2xl overflow-hidden flex items-center justify-center text-sm font-black
                  transition-all duration-300
                  ${isActive ? 'pp-animate-pulse-ring scale-110' : ''}
                  ${isMe ? 'border-2 border-pp-cyan/60' : 'border border-pp-surface-2'}
                `}
                style={{
                  background: isMe
                    ? 'linear-gradient(135deg, rgba(0,221,180,0.25), rgba(16,32,64,0.8))'
                    : 'rgba(16,32,64,0.8)',
                  boxShadow: isActive
                    ? '0 0 20px rgba(255,214,10,0.4)'
                    : isMe
                    ? '0 0 12px rgba(0,221,180,0.2)'
                    : 'none',
                }}
              >
                {photoUrl ? (
                  <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span
                    className="font-black"
                    style={{
                      color: isActive ? 'var(--color-pp-gold)' : isMe ? 'var(--color-pp-cyan)' : 'var(--color-pp-text-muted)',
                      fontFamily: 'var(--font-pp-display)',
                      fontSize: '0.7rem',
                    }}
                  >
                    {p.display_name[0]?.toUpperCase()}
                  </span>
                )}
              </div>

              {/* Name */}
              <span
                className="text-center leading-tight truncate w-14 block"
                style={{
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-pp-body)',
                  color: isActive
                    ? 'var(--color-pp-gold)'
                    : isMe
                    ? 'var(--color-pp-cyan)'
                    : 'var(--color-pp-text-muted)',
                }}
              >
                {isMe ? 'You' : p.display_name}
              </span>

              {/* Kick button */}
              {onKick && !isMe && (
                <button
                  onClick={() => onKick(p.player_id)}
                  aria-label={`Suggest kick for ${p.display_name}`}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-pp-dare text-white
                    text-xs items-center justify-center hidden group-hover:flex
                    shadow-lg transition-all hover:scale-110"
                >
                  <Icon name="x" size="sm" className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
