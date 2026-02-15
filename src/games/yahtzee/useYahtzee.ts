import { useState, useCallback } from 'react';

export const CATEGORIES = [
  'Unos', 'Doses', 'Treses', 'Cuatros', 'Cincos', 'Seises',
  'Tercia', 'Póker', 'Full House',
  'Escalera corta', 'Escalera larga', 'Yahtzee', 'Chance',
] as const;

export interface YahtzeeState {
  dice: number[];
  held: boolean[];
  rollsLeft: number;
  scores: (number | null)[];
  rolling: boolean;
  gameOver: boolean;
}

function rollDie(): number {
  return Math.floor(Math.random() * 6) + 1;
}

function hasConsecutive(counts: number[], length: number): boolean {
  let consecutive = 0;
  for (let i = 0; i < 6; i++) {
    if (counts[i] > 0) {
      consecutive++;
      if (consecutive >= length) return true;
    } else {
      consecutive = 0;
    }
  }
  return false;
}

export function calculateScore(dice: number[], category: number): number {
  const counts = [0, 0, 0, 0, 0, 0];
  let sum = 0;
  for (const d of dice) {
    counts[d - 1]++;
    sum += d;
  }

  switch (category) {
    case 0: return counts[0] * 1;
    case 1: return counts[1] * 2;
    case 2: return counts[2] * 3;
    case 3: return counts[3] * 4;
    case 4: return counts[4] * 5;
    case 5: return counts[5] * 6;
    case 6: return counts.some(c => c >= 3) ? sum : 0;
    case 7: return counts.some(c => c >= 4) ? sum : 0;
    case 8: return (counts.includes(3) && counts.includes(2)) ? 25 : 0;
    case 9: return hasConsecutive(counts, 4) ? 30 : 0;
    case 10: return hasConsecutive(counts, 5) ? 40 : 0;
    case 11: return counts.some(c => c === 5) ? 50 : 0;
    case 12: return sum;
    default: return 0;
  }
}

function initialState(): YahtzeeState {
  return {
    dice: [1, 1, 1, 1, 1],
    held: [false, false, false, false, false],
    rollsLeft: 3,
    scores: Array(13).fill(null),
    rolling: false,
    gameOver: false,
  };
}

export function useYahtzee() {
  const [state, setState] = useState<YahtzeeState>(initialState);

  const roll = useCallback(() => {
    setState(prev => {
      if (prev.rollsLeft <= 0 || prev.rolling) return prev;

      const newDice = prev.dice.map((d, i) => prev.held[i] ? d : rollDie());

      return {
        ...prev,
        dice: newDice,
        rollsLeft: prev.rollsLeft - 1,
        rolling: true,
      };
    });

    // End rolling animation
    setTimeout(() => {
      setState(prev => ({ ...prev, rolling: false }));
    }, 500);
  }, []);

  const toggleHold = useCallback((index: number) => {
    setState(prev => {
      // Can only hold after first roll
      if (prev.rollsLeft >= 3) return prev;
      const newHeld = [...prev.held];
      newHeld[index] = !newHeld[index];
      return { ...prev, held: newHeld };
    });
  }, []);

  const scoreCategory = useCallback((category: number) => {
    setState(prev => {
      if (prev.scores[category] !== null) return prev;
      if (prev.rollsLeft >= 3) return prev; // Must roll at least once

      const score = calculateScore(prev.dice, category);
      const newScores = [...prev.scores];
      newScores[category] = score;

      const gameOver = newScores.every(s => s !== null);

      return {
        ...prev,
        scores: newScores,
        held: [false, false, false, false, false],
        rollsLeft: 3,
        gameOver,
      };
    });
  }, []);

  const newGame = useCallback(() => {
    setState(initialState());
  }, []);

  // Calculate totals
  const upperTotal = state.scores.slice(0, 6).reduce((a, b) => (a ?? 0) + (b ?? 0), 0) ?? 0;
  const upperBonus = (upperTotal as number) >= 63 ? 35 : 0;
  const lowerTotal = state.scores.slice(6).reduce((a, b) => (a ?? 0) + (b ?? 0), 0) ?? 0;
  const grandTotal = (upperTotal as number) + upperBonus + (lowerTotal as number);
  const turnsPlayed = state.scores.filter(s => s !== null).length;

  return {
    ...state,
    roll,
    toggleHold,
    scoreCategory,
    newGame,
    upperTotal: upperTotal as number,
    upperBonus,
    lowerTotal: lowerTotal as number,
    grandTotal,
    turnsPlayed,
  };
}
