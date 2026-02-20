import { Icon } from './Icon';

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
  onKick?: (playerId: string) => void;
}

export default function PlayerList({ players, currentPlayerId, currentTurnPlayerId, onKick }: PlayerListProps) {
  return (
    <div className="border-t border-pp-purple/20 bg-pp-bg-light/70 backdrop-blur p-3">
      <div className="flex gap-3 overflow-x-auto pb-1">
        {players.map(p => {
          const isMe = p.player_id === currentPlayerId;
          const isActive = p.player_id === currentTurnPlayerId;
          return (
            <div key={p.player_id} className="flex flex-col items-center min-w-[60px] relative group pt-1" id={`player-item-${p.player_id}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold overflow-hidden
                ${isActive ? 'ring-2 ring-pp-gold ring-offset-2 ring-offset-pp-bg-light' : ''}
                ${isMe ? 'bg-pp-purple/30 border-pp-purple' : 'bg-pp-surface'} border border-pp-purple/30
              `}>
                {p.photo_url ? (
                  <img src={p.photo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-pp-text">{p.display_name[0]?.toUpperCase()}</span>
                )}
              </div>
              <span className={`text-xs mt-1 truncate max-w-[60px] ${isMe ? 'text-pp-purple' : 'text-pp-text-muted'}`}>
                {isMe ? 'You' : p.display_name}
              </span>
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
