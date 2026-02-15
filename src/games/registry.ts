import type { GameModule } from '../types';
import { BlackjackGame } from './blackjack';
import { SpiderGame } from './spider';
import { YahtzeeGame } from './yahtzee';

export const GAMES: GameModule[] = [
  {
    id: 'blackjack',
    name: 'Blackjack',
    description: 'Vence al dealer llegando a 21 sin pasarte',
    icon: '🃏',
    gradient: 'from-emerald-600 to-emerald-900',
    component: BlackjackGame,
  },
  {
    id: 'spider',
    name: 'Spider Solitario',
    description: 'Ordena las cartas de K a A en secuencias completas',
    icon: '🕷️',
    gradient: 'from-violet-600 to-violet-900',
    component: SpiderGame,
  },
  {
    id: 'yahtzee',
    name: 'Yahtzee',
    description: 'Lanza los dados y busca las mejores combinaciones',
    icon: '🎲',
    gradient: 'from-rose-600 to-rose-900',
    component: YahtzeeGame,
  },
];
