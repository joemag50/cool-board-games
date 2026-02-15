interface DiceProps {
  value: number;
  held?: boolean;
  rolling?: boolean;
  onClick?: () => void;
  size?: number;
}

// Dot positions for each dice face (on a 3x3 grid)
const DOT_POSITIONS: Record<number, [number, number][]> = {
  1: [[1, 1]],
  2: [[0, 2], [2, 0]],
  3: [[0, 2], [1, 1], [2, 0]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 1], [0, 2], [2, 0], [2, 1], [2, 2]],
};

export function Dice({ value, held = false, rolling = false, onClick, size = 64 }: DiceProps) {
  const dots = DOT_POSITIONS[value] || [];
  const dotSize = size * 0.18;
  const padding = size * 0.18;
  const cellSize = (size - padding * 2) / 2;

  return (
    <div
      onClick={onClick}
      className={`
        relative rounded-xl cursor-pointer select-none
        transition-all duration-200
        ${held
          ? 'bg-gradient-to-br from-amber-400 to-amber-500 shadow-lg shadow-amber-500/30 ring-2 ring-amber-300'
          : 'bg-gradient-to-br from-white to-slate-100 shadow-md hover:shadow-lg'
        }
        ${rolling ? 'animate-roll' : ''}
      `}
      style={{ width: size, height: size }}
    >
      {dots.map(([col, row], i) => (
        <div
          key={i}
          className={`absolute rounded-full ${held ? 'bg-amber-900' : 'bg-slate-800'}`}
          style={{
            width: dotSize,
            height: dotSize,
            left: padding + col * cellSize - dotSize / 2,
            top: padding + row * cellSize - dotSize / 2,
          }}
        />
      ))}
    </div>
  );
}
