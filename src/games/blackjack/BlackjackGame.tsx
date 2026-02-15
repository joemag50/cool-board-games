import { useState, useRef } from 'react';
import { PlayingCard } from '../../components/PlayingCard';
import { useBlackjack } from './useBlackjack';

const BET_OPTIONS = [10, 25, 50, 100, 250];

// ── Shoe Indicator (top bar) ─────────────────────────

function ShoeIndicator({ remaining, total, cutDepth }: {
  remaining: number;
  total: number;
  cutDepth: number;
}) {
  const fillPct = total > 0 ? (remaining / total) * 100 : 100;
  const cutPct = total > 0 ? (cutDepth / total) * 100 : 0;

  return (
    <div className="flex items-center gap-2">
      <div className="w-6 h-14 bg-slate-800 rounded border border-slate-600 relative overflow-hidden">
        {/* Fill level */}
        <div
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-700 to-blue-500 transition-all duration-700"
          style={{ height: `${fillPct}%` }}
        />
        {/* Cut card marker */}
        <div
          className="absolute left-0 right-0 h-0.5 bg-yellow-400/70"
          style={{ bottom: `${cutPct}%` }}
        />
      </div>
      <div className="text-xs text-slate-400 leading-tight">
        <div className="text-slate-300 font-medium">{remaining}</div>
        <div>cartas</div>
      </div>
    </div>
  );
}

// ── Shuffle Animation ────────────────────────────────

function ShuffleAnimation() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16">
      <div className="relative w-32 h-40 flex items-center justify-center">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className={`absolute w-[72px] h-[100px] rounded-lg border-2 border-blue-600
              bg-gradient-to-br from-blue-700 via-blue-800 to-blue-950
              shadow-lg animate-shuffle-${i}`}
            style={{
              zIndex: i,
              top: `${(3 - i) * 4}px`,
            }}
          >
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-blue-400/50 text-2xl">✦</span>
            </div>
          </div>
        ))}
      </div>
      <div className="text-center">
        <p className="text-white text-xl font-semibold animate-pulse">
          El crupier baraja las cartas...
        </p>
        <p className="text-slate-400 text-sm mt-1">6 barajas · 312 cartas</p>
      </div>
    </div>
  );
}

// ── Cut UI ───────────────────────────────────────────

function CutUI({ shoeSize, onCut }: {
  shoeSize: number;
  onCut: (position: number) => void;
}) {
  const [hoverPos, setHoverPos] = useState<number | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const getPosition = (e: React.MouseEvent) => {
    if (!barRef.current) return 0.5;
    const rect = barRef.current.getBoundingClientRect();
    return Math.max(0.2, Math.min(0.8, (e.clientY - rect.top) / rect.height));
  };

  return (
    <div className="flex flex-col items-center justify-center gap-5 py-12">
      <p className="text-white text-xl font-semibold">Corta el mazo</p>
      <p className="text-slate-400 text-sm">Haz clic donde quieras cortar</p>

      <div
        ref={barRef}
        className="w-24 h-72 rounded-xl relative cursor-crosshair
          bg-gradient-to-b from-blue-700 via-blue-800 to-blue-950
          border-2 border-blue-500/50 shadow-2xl shadow-blue-900/40
          overflow-hidden"
        onClick={e => onCut(getPosition(e))}
        onMouseMove={e => setHoverPos(getPosition(e))}
        onMouseLeave={() => setHoverPos(null)}
      >
        {/* Card edge texture */}
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-full h-px bg-blue-400/10"
            style={{ top: `${((i + 1) / 31) * 100}%` }}
          />
        ))}

        {/* Cut line indicator */}
        {hoverPos !== null && (
          <div
            className="absolute left-0 right-0 flex items-center pointer-events-none transition-all duration-75"
            style={{ top: `${hoverPos * 100}%` }}
          >
            <div className="w-full h-[3px] bg-yellow-400 shadow-lg shadow-yellow-400/60" />
            <div className="absolute -left-3 -top-2 w-2 h-5 bg-yellow-400 rounded-l-sm" />
            <div className="absolute -right-3 -top-2 w-2 h-5 bg-yellow-400 rounded-r-sm" />
          </div>
        )}

        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-blue-400/30 text-4xl">✦</span>
        </div>
      </div>

      <p className="text-slate-500 text-xs">{shoeSize} cartas en el sabot</p>
    </div>
  );
}

// ── Croupier Message Bubble ──────────────────────────

function CroupierMessage({ message, result }: {
  message: string;
  result: 'win' | 'lose' | 'push' | 'blackjack' | null;
}) {
  const colorClass =
    result === 'win' || result === 'blackjack'
      ? 'border-green-500/30 bg-green-950/50 text-green-200'
      : result === 'lose'
        ? 'border-red-500/30 bg-red-950/50 text-red-200'
        : result === 'push'
          ? 'border-amber-500/30 bg-amber-950/50 text-amber-200'
          : 'border-white/10 bg-black/40 text-white/90';

  return (
    <div className={`rounded-2xl px-6 py-3 border backdrop-blur-sm ${colorClass}
      ${result === 'blackjack' ? 'animate-glow' : ''}`}>
      <p className="text-center text-lg font-medium italic">
        &ldquo;{message}&rdquo;
      </p>
    </div>
  );
}

// ── Main Game Component ──────────────────────────────

export function BlackjackGame() {
  const game = useBlackjack();

  // During shuffling or cutting, show special UIs
  if (game.phase === 'shuffling') {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-felt-dark via-felt to-felt-dark flex flex-col items-center px-4">
        <TopBar chips={game.chips} bet={0} shoe={null} />
        <ShuffleAnimation />
      </div>
    );
  }

  if (game.phase === 'cutting') {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-felt-dark via-felt to-felt-dark flex flex-col items-center px-4">
        <TopBar chips={game.chips} bet={0} shoe={null} />
        <CutUI shoeSize={game.shoe.length} onCut={game.cutShoe} />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-felt-dark via-felt to-felt-dark flex flex-col items-center px-4 py-4">
      {/* Top bar */}
      <TopBar
        chips={game.chips}
        bet={game.bet}
        shoe={{ remaining: game.shoeRemaining, total: game.shoeSize, cutDepth: game.cutCardDepth }}
      />

      {/* Croupier message */}
      <div className="my-4">
        <CroupierMessage message={game.message} result={game.result} />
      </div>

      {/* ── Dealer area ── */}
      <div className="mb-1 text-slate-300 text-xs font-medium tracking-widest uppercase">
        Crupier {(game.phase !== 'betting' && game.dealerHand.length > 0) && `· ${game.dealerValue}`}
      </div>
      <div className="flex gap-3 mb-6 min-h-[123px] items-end justify-center">
        {game.dealerHand.map(card => (
          <PlayingCard
            key={card.id}
            card={card}
            size="lg"
            className={
              card.id === game.animatingCardId
                ? 'animate-deal-from-shoe'
                : card.id === game.flipCardId
                  ? 'animate-card-flip'
                  : ''
            }
          />
        ))}
        {game.dealerHand.length === 0 && game.phase !== 'betting' && (
          <div className="w-[88px] h-[123px] rounded-lg border-2 border-dashed border-white/10" />
        )}
      </div>

      {/* ── Table divider ── */}
      <div className="w-full max-w-lg mx-auto mb-6">
        <div className="h-px bg-gradient-to-r from-transparent via-amber-600/40 to-transparent" />
      </div>

      {/* ── Player area ── */}
      <div className="flex gap-3 mb-1 min-h-[123px] items-start justify-center">
        {game.playerHand.map(card => (
          <PlayingCard
            key={card.id}
            card={card}
            size="lg"
            className={
              card.id === game.animatingCardId
                ? 'animate-deal-from-shoe'
                : ''
            }
          />
        ))}
        {game.playerHand.length === 0 && game.phase !== 'betting' && (
          <div className="w-[88px] h-[123px] rounded-lg border-2 border-dashed border-white/10" />
        )}
      </div>
      <div className="mb-6 text-white text-xs font-medium tracking-widest uppercase">
        Tu mano {game.playerHand.length > 0 && `· ${game.playerValue}`}
      </div>

      {/* ── Action area ── */}
      <div className="min-h-[72px] flex items-center justify-center">
        {game.phase === 'betting' && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-slate-300 text-sm">Elige tu apuesta:</p>
            <div className="flex gap-3 flex-wrap justify-center">
              {BET_OPTIONS.map(amount => (
                <button
                  key={amount}
                  onClick={() => game.placeBet(amount)}
                  disabled={amount > game.chips}
                  className={`
                    w-16 h-16 rounded-full font-bold text-lg transition-all duration-200
                    ${amount > game.chips
                      ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-b from-amber-400 to-amber-600 text-amber-950 hover:from-amber-300 hover:to-amber-500 hover:scale-110 shadow-lg shadow-amber-900/30 active:scale-95'
                    }
                  `}
                >
                  {amount}
                </button>
              ))}
            </div>
            {game.chips <= 0 && (
              <button
                onClick={game.resetGame}
                className="mt-2 px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-medium transition-colors"
              >
                Reiniciar juego
              </button>
            )}
          </div>
        )}

        {game.phase === 'dealing' && (
          <div className="text-slate-300 text-lg animate-pulse">Repartiendo...</div>
        )}

        {game.phase === 'playing' && (
          <div className="flex gap-3 flex-wrap justify-center">
            <button
              onClick={game.hit}
              className="px-8 py-3 bg-gradient-to-b from-green-500 to-green-700 hover:from-green-400 hover:to-green-600 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95"
            >
              Pedir
            </button>
            <button
              onClick={game.stand}
              className="px-8 py-3 bg-gradient-to-b from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95"
            >
              Plantarse
            </button>
            {game.playerHand.length === 2 && game.bet <= game.chips && (
              <button
                onClick={game.doubleDown}
                className="px-8 py-3 bg-gradient-to-b from-purple-500 to-purple-700 hover:from-purple-400 hover:to-purple-600 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95"
              >
                Doblar
              </button>
            )}
          </div>
        )}

        {game.phase === 'dealerTurn' && (
          <div className="text-slate-300 text-lg animate-pulse">El crupier juega...</div>
        )}

        {game.phase === 'gameOver' && (
          <button
            onClick={game.newHand}
            className="px-8 py-3 bg-gradient-to-b from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95"
          >
            Nueva mano
          </button>
        )}
      </div>
    </div>
  );
}

// ── Top Bar ──────────────────────────────────────────

function TopBar({ chips, bet, shoe }: {
  chips: number;
  bet: number;
  shoe: { remaining: number; total: number; cutDepth: number } | null;
}) {
  return (
    <div className="w-full max-w-2xl flex justify-between items-center pt-2">
      <div className="bg-black/30 rounded-full px-4 py-1.5 text-amber-400 font-bold text-lg">
        💰 {chips}
      </div>
      {bet > 0 && (
        <div className="bg-black/30 rounded-full px-4 py-1.5 text-white font-medium">
          Apuesta: {bet}
        </div>
      )}
      {shoe && (
        <ShoeIndicator
          remaining={shoe.remaining}
          total={shoe.total}
          cutDepth={shoe.cutDepth}
        />
      )}
    </div>
  );
}
