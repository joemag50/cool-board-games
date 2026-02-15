import { useState } from 'react';
import { GAMES } from './games/registry';

function App() {
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  const currentGame = GAMES.find(g => g.id === currentGameId);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-800 px-4 py-3 flex items-center gap-4 sticky top-0 z-40">
        {currentGame ? (
          <>
            <button
              onClick={() => setCurrentGameId(null)}
              className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Volver
            </button>
            <div className="h-4 w-px bg-slate-700" />
            <h1 className="text-white font-semibold">
              <span className="mr-2">{currentGame.icon}</span>
              {currentGame.name}
            </h1>
          </>
        ) : (
          <h1 className="text-white font-bold text-xl tracking-tight">
            <span className="mr-2">🎰</span>Cool Board Games
          </h1>
        )}
      </header>

      {/* Content */}
      {currentGame ? (
        <currentGame.component />
      ) : (
        <Lobby onSelectGame={setCurrentGameId} />
      )}
    </div>
  );
}

function Lobby({ onSelectGame }: { onSelectGame: (id: string) => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-white mb-3">Elige un juego</h2>
        <p className="text-slate-400 text-lg">Selecciona uno de los juegos disponibles para comenzar</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl w-full">
        {GAMES.map(game => (
          <button
            key={game.id}
            onClick={() => onSelectGame(game.id)}
            className={`
              group relative overflow-hidden rounded-2xl p-6
              bg-gradient-to-br ${game.gradient}
              shadow-xl hover:shadow-2xl
              transform hover:scale-[1.03] transition-all duration-300
              text-left
            `}
          >
            {/* Background glow */}
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors" />

            <span className="text-5xl block mb-4">{game.icon}</span>
            <h3 className="text-white text-xl font-bold mb-1">{game.name}</h3>
            <p className="text-white/70 text-sm leading-relaxed">{game.description}</p>

            <div className="mt-4 flex items-center gap-1 text-white/50 text-sm group-hover:text-white/80 transition-colors">
              <span>Jugar</span>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        ))}
      </div>

      <p className="text-slate-600 text-sm mt-12">Mas juegos proximamente...</p>
    </div>
  );
}

export default App;
