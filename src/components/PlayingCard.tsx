import type { Card } from '../types';
import { SUIT_SYMBOLS } from '../types';

export type CardBackDesign = 'classic' | 'crimson' | 'emerald' | 'royal' | 'midnight' | 'sunset';

export const CARD_BACK_DESIGNS: { id: CardBackDesign; name: string; colors: [string, string, string]; border: string; pattern: string }[] = [
  { id: 'classic',  name: 'Clásico',   colors: ['#1e3a5f', '#1a3050', '#0f1b2d'], border: '#2563eb', pattern: '✦' },
  { id: 'crimson',  name: 'Carmesí',   colors: ['#7f1d1d', '#991b1b', '#450a0a'], border: '#dc2626', pattern: '♦' },
  { id: 'emerald',  name: 'Esmeralda', colors: ['#064e3b', '#065f46', '#022c22'], border: '#059669', pattern: '♣' },
  { id: 'royal',    name: 'Real',      colors: ['#4c1d95', '#5b21b6', '#2e1065'], border: '#7c3aed', pattern: '♛' },
  { id: 'midnight', name: 'Medianoche',colors: ['#1e293b', '#0f172a', '#020617'], border: '#475569', pattern: '★' },
  { id: 'sunset',   name: 'Atardecer', colors: ['#9a3412', '#c2410c', '#7c2d12'], border: '#ea580c', pattern: '✿' },
];

interface PlayingCardProps {
  card: Card;
  onClick?: () => void;
  selected?: boolean;
  className?: string;
  style?: React.CSSProperties;
  size?: 'sm' | 'md' | 'lg' | 'spider';
  backDesign?: CardBackDesign;
}

const SIZES = {
  sm: { width: 48, height: 67 },
  md: { width: 64, height: 90 },
  spider: { width: 74, height: 104 },
  lg: { width: 88, height: 123 },
};

export function PlayingCard({
  card,
  onClick,
  selected = false,
  className = '',
  style,
  size = 'md',
  backDesign = 'classic',
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
    const design = CARD_BACK_DESIGNS.find(d => d.id === backDesign) ?? CARD_BACK_DESIGNS[0];
    const patternSize = Math.max(8, dim.width * 0.14);

    return (
      <div
        onClick={onClick}
        style={{
          ...baseStyle,
          borderColor: design.border,
          background: `linear-gradient(135deg, ${design.colors[0]}, ${design.colors[1]}, ${design.colors[2]})`,
        }}
        className={`
          rounded-lg border-2 cursor-pointer select-none
          flex items-center justify-center shadow-md
          hover:brightness-110 transition-all relative overflow-hidden
          ${selected ? 'ring-2 ring-yellow-400' : ''}
          ${className}
        `}
      >
        {/* Pattern grid */}
        <div className="absolute inset-1 rounded opacity-20 overflow-hidden flex flex-wrap items-center justify-center gap-0"
          style={{ fontSize: patternSize, lineHeight: 1, color: design.border }}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i} className="inline-block" style={{ width: patternSize + 2, textAlign: 'center' }}>
              {design.pattern}
            </span>
          ))}
        </div>
        {/* Center emblem */}
        <div
          className="relative z-10 rounded-full flex items-center justify-center"
          style={{
            width: dim.width * 0.45,
            height: dim.width * 0.45,
            background: `radial-gradient(circle, ${design.colors[0]}cc, ${design.colors[2]}ee)`,
            border: `1.5px solid ${design.border}88`,
          }}
        >
          <span style={{ fontSize: dim.width * 0.28, color: design.border, opacity: 0.8 }}>
            {design.pattern}
          </span>
        </div>
      </div>
    );
  }

  const fontSize = {
    sm: { rank: 10, centerSuit: 18 },
    md: { rank: 13, centerSuit: 26 },
    spider: { rank: 14, centerSuit: 30 },
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
