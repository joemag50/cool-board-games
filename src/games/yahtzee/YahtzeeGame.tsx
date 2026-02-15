import { Dice } from '../../components/Dice';
import { useYahtzee, CATEGORIES, calculateScore } from './useYahtzee';

export function YahtzeeGame() {
  const game = useYahtzee();
  const canScore = game.rollsLeft < 3;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 flex flex-col items-center px-4 py-6">
      {/* Game over overlay */}
      {game.gameOver && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-2xl p-8 text-center shadow-2xl">
            <h2 className="text-4xl font-bold text-amber-400 mb-2">Juego terminado!</h2>
            <p className="text-5xl font-bold text-white my-4">{game.grandTotal}</p>
            <p className="text-slate-300 mb-4">puntos totales</p>
            <button
              onClick={game.newGame}
              className="px-8 py-3 bg-gradient-to-b from-green-500 to-green-700 text-white font-bold rounded-xl shadow-lg"
            >
              Jugar de nuevo
            </button>
          </div>
        </div>
      )}

      {/* Dice area */}
      <div className="flex gap-3 mb-4">
        {game.dice.map((value, i) => (
          <Dice
            key={i}
            value={value}
            held={game.held[i]}
            rolling={game.rolling}
            onClick={() => game.toggleHold(i)}
            size={56}
          />
        ))}
      </div>

      {/* Roll button & info */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={game.roll}
          disabled={game.rollsLeft <= 0 || game.rolling || game.gameOver}
          className={`
            px-8 py-3 rounded-xl font-bold text-lg transition-all
            ${game.rollsLeft > 0 && !game.rolling && !game.gameOver
              ? 'bg-gradient-to-b from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 text-white shadow-lg hover:scale-105'
              : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }
          `}
        >
          {game.rollsLeft === 3 ? 'Lanzar dados' : `Relanzar (${game.rollsLeft})`}
        </button>
        <span className="text-slate-400 text-sm">
          Turno {game.turnsPlayed + 1}/13
        </span>
      </div>

      {canScore && (
        <p className="text-slate-400 text-sm mb-3 -mt-2">
          Toca un dado para mantenerlo. Elige una categoria para anotar.
        </p>
      )}

      {/* Scorecard */}
      <div className="w-full max-w-md bg-slate-800/60 rounded-2xl overflow-hidden shadow-xl border border-slate-700/50">
        {/* Upper section */}
        <div className="px-4 py-2 bg-slate-700/50 text-slate-300 text-xs font-semibold uppercase tracking-wider">
          Seccion superior
        </div>
        {CATEGORIES.slice(0, 6).map((cat, i) => {
          const scored = game.scores[i] !== null;
          const potential = canScore && !scored ? calculateScore(game.dice, i) : null;

          return (
            <button
              key={i}
              onClick={() => canScore && !scored && game.scoreCategory(i)}
              disabled={scored || !canScore}
              className={`
                w-full flex justify-between items-center px-4 py-2.5 border-b border-slate-700/30
                transition-colors text-left
                ${scored ? 'cursor-default' : canScore ? 'hover:bg-slate-700/40 cursor-pointer' : 'cursor-default'}
              `}
            >
              <span className={scored ? 'text-slate-400' : 'text-white'}>{cat}</span>
              {scored ? (
                <span className="text-amber-400 font-bold">{game.scores[i]}</span>
              ) : potential !== null ? (
                <span className="text-green-400/70 font-medium">{potential}</span>
              ) : (
                <span className="text-slate-600">—</span>
              )}
            </button>
          );
        })}
        {/* Upper totals */}
        <div className="flex justify-between items-center px-4 py-2 bg-slate-700/30 text-sm">
          <span className="text-slate-400">Subtotal</span>
          <span className="text-white font-medium">{game.upperTotal}/63</span>
        </div>
        <div className="flex justify-between items-center px-4 py-2 bg-slate-700/30 border-b border-slate-600/50 text-sm">
          <span className="text-slate-400">Bono (+35 si {'>'}= 63)</span>
          <span className={`font-bold ${game.upperBonus > 0 ? 'text-green-400' : 'text-slate-500'}`}>
            {game.upperBonus}
          </span>
        </div>

        {/* Lower section */}
        <div className="px-4 py-2 bg-slate-700/50 text-slate-300 text-xs font-semibold uppercase tracking-wider">
          Seccion inferior
        </div>
        {CATEGORIES.slice(6).map((cat, offset) => {
          const i = offset + 6;
          const scored = game.scores[i] !== null;
          const potential = canScore && !scored ? calculateScore(game.dice, i) : null;

          return (
            <button
              key={i}
              onClick={() => canScore && !scored && game.scoreCategory(i)}
              disabled={scored || !canScore}
              className={`
                w-full flex justify-between items-center px-4 py-2.5 border-b border-slate-700/30
                transition-colors text-left
                ${scored ? 'cursor-default' : canScore ? 'hover:bg-slate-700/40 cursor-pointer' : 'cursor-default'}
              `}
            >
              <span className={scored ? 'text-slate-400' : 'text-white'}>{cat}</span>
              {scored ? (
                <span className="text-amber-400 font-bold">{game.scores[i]}</span>
              ) : potential !== null ? (
                <span className="text-green-400/70 font-medium">{potential}</span>
              ) : (
                <span className="text-slate-600">—</span>
              )}
            </button>
          );
        })}

        {/* Grand total */}
        <div className="flex justify-between items-center px-4 py-3 bg-gradient-to-r from-amber-900/40 to-amber-800/40">
          <span className="text-amber-200 font-semibold">TOTAL</span>
          <span className="text-amber-400 font-bold text-xl">{game.grandTotal}</span>
        </div>
      </div>
    </div>
  );
}
