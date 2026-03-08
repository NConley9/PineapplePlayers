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

const typeConfig: Record<string, {
  label: string;
  color: string;
  bg: string;
  headerBg: string;
  glow: string;
  emoji: string;
}> = {
  truth: {
    label: 'TRUTH',
    color: '#A78BFA',
    bg: 'linear-gradient(155deg, rgba(167,139,250,0.12) 0%, rgba(16,32,64,0.8) 50%)',
    headerBg: 'linear-gradient(135deg, rgba(167,139,250,0.35), rgba(118,87,220,0.25))',
    glow: 'rgba(167,139,250,0.55)',
    emoji: '🔮',
  },
  dare: {
    label: 'DARE',
    color: '#FF4D6D',
    bg: 'linear-gradient(155deg, rgba(255,77,109,0.12) 0%, rgba(16,32,64,0.8) 50%)',
    headerBg: 'linear-gradient(135deg, rgba(255,77,109,0.35), rgba(194,36,74,0.25))',
    glow: 'rgba(255,77,109,0.55)',
    emoji: '🔥',
  },
  challenge: {
    label: 'CHALLENGE',
    color: '#FF8C42',
    bg: 'linear-gradient(155deg, rgba(255,140,66,0.12) 0%, rgba(16,32,64,0.8) 50%)',
    headerBg: 'linear-gradient(135deg, rgba(255,140,66,0.35), rgba(201,96,32,0.25))',
    glow: 'rgba(255,140,66,0.55)',
    emoji: '⚡',
  },
  group: {
    label: 'GROUP',
    color: '#FFD60A',
    bg: 'linear-gradient(155deg, rgba(255,214,10,0.12) 0%, rgba(16,32,64,0.8) 50%)',
    headerBg: 'linear-gradient(135deg, rgba(255,214,10,0.35), rgba(201,167,0,0.25))',
    glow: 'rgba(255,214,10,0.55)',
    emoji: '🎉',
  },
};

const fallback = {
  label: 'CARD',
  color: '#00DDB4',
  bg: 'linear-gradient(155deg, rgba(0,221,180,0.12) 0%, rgba(16,32,64,0.8) 50%)',
  headerBg: 'linear-gradient(135deg, rgba(0,221,180,0.35), rgba(0,168,136,0.25))',
  glow: 'rgba(0,221,180,0.55)',
  emoji: '🃏',
};

export default function CardDisplay({
  card,
  onClick,
  large,
  glowing = false,
  drawDelay = 0,
}: CardDisplayProps) {
  const cfg = typeConfig[card.card_type] ?? fallback;
  const animClass = `pp-animate-card-draw pp-animate-card-draw-${Math.min(drawDelay + 1, 5)}`;

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (!onClick) return;
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); }
      }}
      className={`
        relative rounded-3xl border-2 overflow-hidden flex flex-col
        ${large ? 'min-h-[340px] sm:min-h-[380px]' : 'min-h-[260px] sm:min-h-[300px]'}
        ${onClick ? 'cursor-pointer transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pp-gold/70' : 'transition-all'}
        ${animClass}
      `}
      style={{
        borderColor: cfg.color,
        background: cfg.bg,
        boxShadow: glowing
          ? `0 0 48px ${cfg.glow}, 0 16px 40px rgba(3,10,24,0.6)`
          : `0 8px 32px rgba(3,10,24,0.5)`,
      }}
    >
      {/* Decorative dot pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(${cfg.color}22 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
          opacity: 0.6,
        }}
      />

      {/* Header band */}
      <div
        className="relative flex items-center justify-between px-4 py-3"
        style={{ background: cfg.headerBg, borderBottom: `1px solid ${cfg.color}40` }}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg leading-none">{cfg.emoji}</span>
          <span
            className="font-black tracking-widest text-xs"
            style={{
              fontFamily: 'var(--font-pp-display)',
              color: cfg.color,
              fontSize: '0.6rem',
            }}
          >
            {cfg.label}
          </span>
        </div>
        <span
          className="text-xs font-bold uppercase tracking-wider opacity-60"
          style={{ color: cfg.color, fontFamily: 'var(--font-pp-body)', fontSize: '0.6rem' }}
        >
          {card.expansion}
        </span>
      </div>

      {/* Card text */}
      <div className={`relative flex-1 flex items-center justify-center ${large ? 'p-6' : 'p-4 sm:p-5'}`}>
        <p
          className="text-center leading-relaxed font-semibold"
          style={{
            color: '#D8F0FF',
            fontSize: large ? '1.15rem' : '0.9rem',
            fontFamily: 'var(--font-pp-body)',
            textShadow: `0 0 24px ${cfg.color}40`,
          }}
        >
          {card.card_text}
        </p>
      </div>

      {/* Footer accent line */}
      <div
        className="h-1 w-full opacity-50"
        style={{ background: `linear-gradient(90deg, transparent, ${cfg.color}, transparent)` }}
      />
    </div>
  );
}
