import React from 'react';
import { Icon } from './Icon';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div id="rules-overlay" className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div id="rules-modal" className="bg-pp-bg rounded-2xl border border-pp-purple/30 max-h-[90vh] overflow-y-auto w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 id="rules-title" className="text-2xl font-bold text-pp-text pp-title">How to Play</h2>
          <button
            id="btn-close-rules"
            onClick={onClose}
            className="text-pp-text-muted hover:text-pp-text transition-colors"
          >
            <Icon name="x" size="md" />
          </button>
        </div>

        <div className="space-y-4 text-sm text-pp-text-muted">
          <section>
            <h3 className="font-bold text-pp-text mb-2">🎮 Basic Rules</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>On your turn, draw 2 cards and pick 1 to play.</li>
              <li>The unpicked card is shuffled back into the deck.</li>
              <li>Hit <strong>Completed</strong> if you do it, or <strong>Pass</strong> if you skip it.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-pp-text mb-2">👥 "Another Player"</h3>
            <p>Pick any player you want, but not the same one you picked last time. The group decides if significant others can be picked.</p>
            <p className="mt-2">If that player refuses, they take their pass punishment.</p>
          </section>

          <section>
            <h3 className="font-bold text-pp-text mb-2">🍷 Pass Punishment</h3>
            <p className="mb-2">Before the game starts, set punishments:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Each player’s significant other sets that player’s punishment, or</li>
              <li>The group sets one punishment for everyone.</li>
            </ul>
            <p className="mt-2 text-xs">Common picks: drink, remove clothing, or any agreed penalty.</p>
            <p className="mt-2">If you pass, you do your pass punishment.</p>
          </section>

          <section>
            <h3 className="font-bold text-pp-text mb-2">❌ Losing a Challenge</h3>
            <p>If you lose a challenge, you also do your pass punishment.</p>
          </section>

          <section>
            <h3 className="font-bold text-pp-text mb-2">🍻 Have Fun</h3>
            <p>Modify rules as your group sees fit. Safety first—no one should be uncomfortable.</p>
          </section>
        </div>

        <button
          id="btn-close-rules-footer"
          onClick={onClose}
          className="w-full mt-6 btn-primary"
        >
          Got It
        </button>
      </div>
    </div>
  );
};

RulesModal.displayName = 'RulesModal';
