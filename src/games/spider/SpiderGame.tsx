import { PlayingCard } from '../../components/PlayingCard';
import { useSpider } from './useSpider';

const FACE_DOWN_OFFSET = 6;
const FACE_UP_OFFSET = 22;

export function SpiderGame() {
  const game = useSpider();

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-felt-dark via-felt to-felt-dark flex flex-col items-center px-2 py-4">
      {/* Top bar */}
      <div className="w-full max-w-6xl flex justify-between items-center mb-4 px-2">
        <div className="flex items-center gap-4">
          <button
            onClick={game.dealFromStock}
            disabled={game.stock.length === 0}
            className={`
              px-4 py-2 rounded-lg font-medium text-sm transition-all
              ${game.stock.length > 0
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }
            `}
          >
            Repartir ({game.stockDeals})
          </button>
          <button
            onClick={game.newGame}
            className="px-4 py-2 rounded-lg font-medium text-sm bg-slate-700 hover:bg-slate-600 text-white transition-all"
          >
            Nuevo juego
          </button>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-slate-300">Movimientos: <strong className="text-white">{game.moves}</strong></span>
          <span className="text-slate-300">Completadas: <strong className="text-amber-400">{game.completed}/8</strong></span>
        </div>
      </div>

      {/* Game won overlay */}
      {game.gameWon && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-2xl p-8 text-center shadow-2xl">
            <h2 className="text-4xl font-bold text-amber-400 mb-2">Ganaste!</h2>
            <p className="text-slate-300 mb-4">Completaste el juego en {game.moves} movimientos</p>
            <button
              onClick={game.newGame}
              className="px-8 py-3 bg-gradient-to-b from-green-500 to-green-700 text-white font-bold rounded-xl shadow-lg"
            >
              Jugar de nuevo
            </button>
          </div>
        </div>
      )}

      {/* Columns */}
      <div className="w-full max-w-6xl flex gap-1 overflow-x-auto pb-4">
        {game.columns.map((column, colIdx) => {
          const totalHeight = column.length === 0
            ? 67
            : 67 + column.slice(0, -1).reduce((sum, card) =>
                sum + (card.faceUp ? FACE_UP_OFFSET : FACE_DOWN_OFFSET), 0);

          return (
            <div
              key={colIdx}
              className="flex-1 min-w-[52px]"
              onClick={() => column.length === 0 && game.clickEmptyColumn(colIdx)}
            >
              <div
                className="relative mx-auto"
                style={{
                  height: totalHeight,
                  maxWidth: 52,
                }}
              >
                {column.length === 0 ? (
                  <div className="w-[48px] h-[67px] rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center">
                    <span className="text-white/20 text-2xl">+</span>
                  </div>
                ) : (
                  column.map((card, cardIdx) => {
                    let top = 0;
                    for (let i = 0; i < cardIdx; i++) {
                      top += column[i].faceUp ? FACE_UP_OFFSET : FACE_DOWN_OFFSET;
                    }

                    const isSelected = game.selected !== null
                      && game.selected.col === colIdx
                      && cardIdx >= game.selected.cardIndex;

                    return (
                      <div
                        key={card.id}
                        className="absolute left-0"
                        style={{ top, zIndex: cardIdx }}
                      >
                        <PlayingCard
                          card={card}
                          size="sm"
                          selected={isSelected}
                          onClick={() => card.faceUp && game.selectCard(colIdx, cardIdx)}
                        />
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
