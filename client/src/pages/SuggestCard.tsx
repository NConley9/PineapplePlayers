import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../lib/PlayerContext';
import { api } from '../lib/api';

const CARD_TYPES = [
  { value: 'truth', label: 'Truth' },
  { value: 'dare', label: 'Dare' },
  { value: 'challenge', label: 'Challenge' },
  { value: 'group', label: 'Group' },
];

const EXPANSIONS = [
  { value: '', label: 'No preference' },
  { value: 'core', label: 'Core' },
  { value: 'vanilla', label: 'Vanilla' },
  { value: 'pineapple', label: 'Pineapple' },
];

export default function SuggestCard() {
  const navigate = useNavigate();
  const { player } = usePlayer();

  const [cardType, setCardType] = useState('truth');
  const [cardText, setCardText] = useState('');
  const [expansion, setExpansion] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!cardText.trim() || cardText.trim().length < 10) {
      setError('Card text must be at least 10 characters');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.submitSuggestion({
        player_id: player.player_id,
        card_type: cardType,
        card_text: cardText.trim(),
        expansion: expansion || undefined,
      });
      setSuccess(true);
      setCardText('');
    } catch (err: any) {
      setError(err.message || 'Failed to submit suggestion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pp-shell p-6">
      <div className="max-w-md mx-auto space-y-6 pp-panel">
        <button onClick={() => navigate('/')} className="text-pp-text-muted hover:text-pp-text transition-colors">
          ← Back
        </button>

        <h1 className="text-2xl font-bold text-pp-text pp-title">Suggest a Card</h1>
        <p className="text-pp-text-muted text-sm">
          Have a great idea for a card? Submit it and we might add it to the game!
        </p>

        {success ? (
          <div className="text-center space-y-4 py-8">
            <span className="text-6xl">🎉</span>
            <h2 className="text-xl font-bold text-pp-text">Thanks!</h2>
            <p className="text-pp-text-muted">Your suggestion has been submitted for review.</p>
            <div className="flex gap-3">
              <button onClick={() => { setSuccess(false); }} className="btn-secondary flex-1">
                Submit Another
              </button>
              <button onClick={() => navigate('/')} className="btn-primary flex-1">
                Home
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Card Type */}
            <div>
              <label className="block text-sm text-pp-text-muted mb-2">Card Type</label>
              <div className="grid grid-cols-2 gap-2">
                {CARD_TYPES.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setCardType(t.value)}
                    className={`p-3 rounded-xl border font-bold transition-colors ${
                      cardType === t.value
                        ? `card-${t.value} card-${t.value}-bg border-2`
                        : 'bg-pp-surface/50 border-pp-surface text-pp-text-muted hover:border-pp-purple/30'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Card Text */}
            <div>
              <label className="block text-sm text-pp-text-muted mb-2">Card Text</label>
              <textarea
                value={cardText}
                onChange={e => setCardText(e.target.value)}
                maxLength={500}
                rows={4}
                placeholder="Write your card idea here..."
                className="input-field resize-none"
              />
              <p className="text-xs text-pp-text-muted mt-1 text-right">{cardText.length}/500</p>
            </div>

            {/* Suggested Expansion */}
            <div>
              <label className="block text-sm text-pp-text-muted mb-2">Suggested Expansion</label>
              <select
                value={expansion}
                onChange={e => setExpansion(e.target.value)}
                className="input-field"
              >
                {EXPANSIONS.map(e => (
                  <option key={e.value} value={e.value}>{e.label}</option>
                ))}
              </select>
            </div>

            {error && <p className="text-pp-red text-sm text-center">{error}</p>}

            <button onClick={handleSubmit} disabled={loading || cardText.trim().length < 10} className="btn-primary w-full">
              {loading ? 'Submitting...' : 'Submit Suggestion'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
