import React from 'react';
import { Icon } from './Icon';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const rules = [
    {
      emoji: '🃏',
      title: 'Basic Rules',
      body: 'On your turn, draw 2 cards and pick 1 to play. The other card gets shuffled back. Hit Completed if you do it, or Pass if you skip.',
    },
    {
      emoji: '👥',
      title: '"Another Player"',
      body: "Pick any player, but not the same one as last time. The group decides if partners can be picked. If they refuse, they take their pass punishment.",
    },
    {
      emoji: '🍷',
      title: 'Pass Punishment',
      body: 'Before the game, set punishments — either per-player (set by their partner) or one for everyone. Common picks: drink, remove clothing, or any agreed penalty.',
    },
    {
      emoji: '❌',
      title: 'Losing a Challenge',
      body: 'If you lose a challenge, you take your pass punishment too.',
    },
    {
      emoji: '🍍',
      title: 'Have Fun',
      body: "Modify rules as your group sees fit. Safety first — no one should be uncomfortable.",
    },
  ];

  return (
    <div
      id="rules-overlay"
      className="fixed inset-0 flex items-end sm:items-center justify-center p-4 z-50"
      style={{ background: 'rgba(3,10,24,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        id="rules-modal"
        className="w-full max-w-md max-h-[85vh] overflow-y-auto pp-panel pp-animate-rise"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2
            id="rules-title"
            className="pp-title font-black"
            style={{ fontFamily: 'var(--font-pp-display)', fontSize: '1.1rem', color: 'var(--color-pp-text)', lineHeight: 1 }}
          >
            HOW TO<br /><span style={{ color: 'var(--color-pp-cyan)' }}>PLAY</span>
          </h2>
          <button
            id="btn-close-rules"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-pp-surface border border-pp-cyan/20 flex items-center justify-center text-pp-text-muted hover:text-pp-text hover:border-pp-cyan/50 transition-all"
          >
            <Icon name="x" size="sm" />
          </button>
        </div>

        {/* Rules list */}
        <div className="space-y-3">
          {rules.map((rule, i) => (
            <div
              key={i}
              className="flex gap-3 p-3 rounded-2xl border border-pp-cyan/10 bg-pp-surface/30"
            >
              <span className="text-xl flex-shrink-0 mt-0.5">{rule.emoji}</span>
              <div>
                <h3
                  className="font-black mb-1"
                  style={{ fontFamily: 'var(--font-pp-display)', fontSize: '0.6rem', color: 'var(--color-pp-text)', letterSpacing: '0.06em', textTransform: 'uppercase' }}
                >
                  {rule.title}
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--color-pp-text-muted)' }}>
                  {rule.body}
                </p>
              </div>
            </div>
          ))}
        </div>

        <button
          id="btn-close-rules-footer"
          onClick={onClose}
          className="w-full mt-5 btn-primary py-4"
        >
          Got It
        </button>
      </div>
    </div>
  );
};

RulesModal.displayName = 'RulesModal';


interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

