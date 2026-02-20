import { Icon } from './Icon';
import type { IconProps } from './Icon';

interface CardDisplayProps {
  card: {
    card_id: number;
    card_type: string;
    card_text: string;
    expansion: string;
  };
  onClick?: () => void;
  large?: boolean;
  glowing?: boolean;
  drawDelay?: number;
}

const typeIcons: Record<string, IconProps['name']> = {
  truth: 'card',
  dare: 'card',
  challenge: 'card',
  group: 'users',
};

const typeLabels: Record<string, string> = {
  truth: 'Truth',
  dare: 'Dare',
  challenge: 'Challenge',
  group: 'Group',
};

const typeColors: Record<string, string> = {
  truth: 'border-pp-purple',
  dare: 'border-pp-red',
  challenge: 'border-pp-orange',
  group: 'border-pp-gold',
};

const typeBgColors: Record<string, string> = {
  truth: 'card-truth-bg',
  dare: 'card-dare-bg',
  challenge: 'card-challenge-bg',
  group: 'card-group-bg',
};

const typeColorLabels: Record<string, string> = {
  truth: 'text-pp-purple',
  dare: 'text-pp-red',
  challenge: 'text-pp-orange',
  group: 'text-pp-gold',
};

export default function CardDisplay({ 
  card, 
  onClick, 
  large, 
  glowing = false,
  drawDelay = 0,
}: CardDisplayProps) {
  const animationClass = drawDelay !== undefined ? `pp-animate-card-draw pp-animate-card-draw-${Math.min(drawDelay + 1, 5)}` : '';
  
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(event) => {
        if (!onClick) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
      className={`rounded-2xl border-2 min-h-[240px] sm:min-h-[280px] lg:min-h-[320px] flex flex-col
        ${typeColors[card.card_type] || 'border-pp-surface'} 
        ${typeBgColors[card.card_type] || ''} 
        ${large ? 'p-6' : 'p-4'} 
        ${glowing ? 'card-hover-glow pp-animate-glow' : 'hover:shadow-lg'}
        ${onClick ? 'cursor-pointer hover:scale-[1.03] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pp-gold/70 focus-visible:ring-offset-2 focus-visible:ring-offset-pp-bg' : 'transition-all'}
        ${animationClass}
      `}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon 
            name={typeIcons[card.card_type] || 'card'} 
            size="sm" 
            className={typeColorLabels[card.card_type] || 'text-pp-surface'}
          />
          <span className={`text-sm font-bold ${large ? 'text-base' : ''}`}>
            {typeLabels[card.card_type] || card.card_type}
          </span>
        </div>
        <span className="text-xs text-pp-text-muted capitalize">{card.expansion}</span>
      </div>
      <p className={`text-pp-text leading-relaxed flex-1 ${large ? 'text-lg' : 'text-sm'}`}>
        {card.card_text}
      </p>
    </div>
  );
}
