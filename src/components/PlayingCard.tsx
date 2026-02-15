import type { Card } from '../types';
import { SUIT_SYMBOLS } from '../types';

interface PlayingCardProps {
  card: Card;
  onClick?: () => void;
  selected?: boolean;
  className?: string;
  style?: React.CSSProperties;
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = {
  sm: { width: 48, height: 67 },
  md: { width: 64, height: 90 },
  lg: { width: 88, height: 123 },
};

export function PlayingCard({
  card,
  onClick,
  selected = false,
  className = '',
  style,
  size = 'md',
}: PlayingCardProps) {
  const dim = SIZES[size];
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  const symbol = SUIT_SYMBOLS[card.suit];

  const baseStyle: React.CSSProperties = {
    width: dim.width,
    height: dim.height,
    ...style,
  };

  if (!card.faceUp) {
    return (
      <div
        onClick={onClick}
        style={baseStyle}
        className={`
          rounded-lg border-2 border-blue-700 cursor-pointer select-none
          bg-gradient-to-br from-blue-800 via-blue-900 to-slate-900
          flex items-center justify-center shadow-md
          hover:brightness-110 transition-all
          ${selected ? 'ring-2 ring-yellow-400' : ''}
          ${className}
        `}
      >
        <span className="text-blue-400 opacity-60" style={{ fontSize: dim.width * 0.4 }}>
          ✦
        </span>
      </div>
    );
  }

  const fontSize = {
    sm: { rank: 10, centerSuit: 18 },
    md: { rank: 13, centerSuit: 26 },
    lg: { rank: 16, centerSuit: 34 },
  }[size];

  return (
    <div
      onClick={onClick}
      style={baseStyle}
      className={`
        rounded-lg border cursor-pointer select-none
        bg-white flex flex-col justify-between overflow-hidden
        shadow-md hover:shadow-lg transition-all
        ${selected ? 'ring-2 ring-yellow-400 -translate-y-1' : ''}
        ${isRed ? 'border-red-200' : 'border-slate-300'}
        ${className}
      `}
    >
      {/* Top-left corner */}
      <div
        className={`font-bold leading-none px-1 pt-0.5 ${isRed ? 'text-red-600' : 'text-slate-800'}`}
        style={{ fontSize: fontSize.rank }}
      >
        <div>{card.rank}</div>
        <div style={{ marginTop: -2 }}>{symbol}</div>
      </div>

      {/* Center suit */}
      <div
        className={`text-center ${isRed ? 'text-red-500' : 'text-slate-700'}`}
        style={{ fontSize: fontSize.centerSuit, lineHeight: 1, marginTop: size === 'sm' ? -8 : -4 }}
      >
        {symbol}
      </div>

      {/* Bottom-right corner (rotated) */}
      <div
        className={`font-bold leading-none px-1 pb-0.5 self-end rotate-180 ${isRed ? 'text-red-600' : 'text-slate-800'}`}
        style={{ fontSize: fontSize.rank }}
      >
        <div>{card.rank}</div>
        <div style={{ marginTop: -2 }}>{symbol}</div>
      </div>
    </div>
  );
}
