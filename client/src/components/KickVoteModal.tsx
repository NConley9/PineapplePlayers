interface KickVoteModalProps {
  vote: {
    vote_id: string;
    target_player_id: string;
    initiated_by: string;
    votes_for?: number;
    votes_against?: number;
  };
  players: Array<{ player_id: string; display_name: string }>;
  onVote: (voteId: string, vote: 'kick' | 'keep') => void;
  onClose: () => void;
}

export default function KickVoteModal({ vote, players, onVote, onClose }: KickVoteModalProps) {
  const target = players.find(p => p.player_id === vote.target_player_id);
  const initiator = players.find(p => p.player_id === vote.initiated_by);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        onClick={e => e.stopPropagation()}
        className="pp-panel max-w-sm w-full space-y-4 border border-pp-red/30"
      >
        <h2 className="text-lg font-bold text-pp-text text-center">Kick Vote</h2>

        <p className="text-pp-text-muted text-center text-sm">
          <span className="text-pp-text font-bold">{initiator?.display_name || 'Someone'}</span>{' '}
          has suggested kicking{' '}
          <span className="text-pp-red font-bold">{target?.display_name || 'a player'}</span>
        </p>

        {(vote.votes_for !== undefined || vote.votes_against !== undefined) && (
          <div className="flex justify-center gap-6 text-sm">
            <span className="text-pp-red">Kick: {vote.votes_for || 0}</span>
            <span className="text-green-400">Keep: {vote.votes_against || 0}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => onVote(vote.vote_id, 'kick')} className="btn-danger py-3">
            Kick
          </button>
          <button onClick={() => onVote(vote.vote_id, 'keep')} className="btn-success py-3">
            Keep
          </button>
        </div>
      </div>
    </div>
  );
}
