import { useState, useCallback, useRef } from 'react';
import type { Card } from '../../types';
import { RANKS, rankIndex, createSpiderDeck, shuffle } from '../../types';

export interface SpiderState {
  columns: Card[][];
  stock: Card[];
  completed: number;
  selected: { col: number; cardIndex: number } | null;
  moves: number;
  gameWon: boolean;
  dealing: boolean;
  dealingCards: Set<string>;
  initialDeal: boolean;
  initialDealCards: Set<string>;
}

function initGame(): SpiderState {
  const deck = shuffle(createSpiderDeck());
  const columns: Card[][] = Array.from({ length: 10 }, () => []);
  const initialDealCards = new Set<string>();

  let idx = 0;
  for (let col = 0; col < 10; col++) {
    const count = col < 4 ? 6 : 5;
    for (let i = 0; i < count; i++) {
      const card = { ...deck[idx] };
      card.faceUp = i === count - 1;
      columns[col].push(card);
      initialDealCards.add(card.id);
      idx++;
    }
  }

  const stock = deck.slice(idx);

  return {
    columns,
    stock,
    completed: 0,
    selected: null,
    moves: 0,
    gameWon: false,
    dealing: false,
    dealingCards: new Set<string>(),
    initialDeal: true,
    initialDealCards,
  };
}

// Check if cards from startIndex to end form a valid descending sequence
function isValidSequence(column: Card[], startIndex: number): boolean {
  for (let i = startIndex; i < column.length - 1; i++) {
    if (!column[i].faceUp) return false;
    const currentRank = rankIndex(column[i].rank);
    const nextRank = rankIndex(column[i + 1].rank);
    if (currentRank - nextRank !== 1) return false;
  }
  return column[startIndex].faceUp;
}

// Check if there's a complete K-to-A sequence at the bottom of the column
function checkCompleteSequence(column: Card[]): number | null {
  if (column.length < 13) return null;

  const startIdx = column.length - 13;
  // Must start with K and end with A
  if (column[startIdx].rank !== 'K') return null;
  if (column[column.length - 1].rank !== 'A') return null;

  // Check descending order, all face up
  for (let i = startIdx; i < column.length; i++) {
    if (!column[i].faceUp) return null;
    if (column[i].rank !== RANKS[12 - (i - startIdx)]) return null;
  }
  return startIdx;
}

export function useSpider() {
  const [state, setState] = useState<SpiderState>(initGame);

  const selectCard = useCallback((col: number, cardIndex: number) => {
    setState(prev => {
      if (prev.gameWon) return prev;

      const column = prev.columns[col];
      const card = column[cardIndex];

      // Can't select face-down cards
      if (!card.faceUp) return prev;

      // Check if cards from this index form a valid sequence
      if (!isValidSequence(column, cardIndex)) return prev;

      // If already selected and clicking same card, deselect
      if (prev.selected?.col === col && prev.selected?.cardIndex === cardIndex) {
        return { ...prev, selected: null };
      }

      // If we have a selection and clicking a different column, try to move
      if (prev.selected !== null) {
        const srcCol = prev.selected.col;
        const srcIdx = prev.selected.cardIndex;

        if (srcCol === col) {
          // Selecting a different card in the same column
          return { ...prev, selected: { col, cardIndex } };
        }

        return tryMove(prev, srcCol, srcIdx, col);
      }

      return { ...prev, selected: { col, cardIndex } };
    });
  }, []);

  const clickEmptyColumn = useCallback((col: number) => {
    setState(prev => {
      if (prev.gameWon || !prev.selected) return prev;
      if (prev.columns[col].length > 0) return prev;
      return tryMove(prev, prev.selected.col, prev.selected.cardIndex, col);
    });
  }, []);

  const dealTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const initialTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const dealFromStock = useCallback(() => {
    setState(prev => {
      if (prev.stock.length === 0) return prev;

      if (prev.columns.some(col => col.length === 0)) {
        return { ...prev, selected: null };
      }

      const dealingCards = new Set<string>();
      const newColumns = prev.columns.map((col, i) => {
        const card = { ...prev.stock[i], faceUp: true };
        dealingCards.add(card.id);
        return [...col, card];
      });

      const newStock = prev.stock.slice(10);
      let newState: SpiderState = {
        ...prev,
        columns: newColumns,
        stock: newStock,
        selected: null,
        dealing: true,
        dealingCards,
      };

      newState = checkAndRemoveCompleted(newState);

      return newState;
    });

    if (dealTimerRef.current) clearTimeout(dealTimerRef.current);
    dealTimerRef.current = setTimeout(() => {
      setState(prev => ({ ...prev, dealing: false, dealingCards: new Set() }));
    }, 800);
  }, []);

  const newGame = useCallback(() => {
    const fresh = initGame();
    setState(fresh);

    if (initialTimerRef.current) clearTimeout(initialTimerRef.current);
    initialTimerRef.current = setTimeout(() => {
      setState(prev => ({ ...prev, initialDeal: false, initialDealCards: new Set() }));
    }, 2000);
  }, []);

  const canDrag = useCallback((col: number, cardIndex: number): boolean => {
    const column = state.columns[col];
    if (!column[cardIndex] || !column[cardIndex].faceUp) return false;
    return isValidSequence(column, cardIndex);
  }, [state.columns]);

  const canDrop = useCallback((srcCol: number, srcIdx: number, destCol: number): boolean => {
    const destColumn = state.columns[destCol];
    const srcCard = state.columns[srcCol][srcIdx];
    if (!srcCard) return false;
    if (destColumn.length === 0) return true;
    const destTop = destColumn[destColumn.length - 1];
    return rankIndex(destTop.rank) - rankIndex(srcCard.rank) === 1;
  }, [state.columns]);

  const moveCards = useCallback((srcCol: number, srcIdx: number, destCol: number) => {
    setState(prev => {
      if (prev.gameWon) return prev;
      if (srcCol === destCol) return prev;
      return tryMove(prev, srcCol, srcIdx, destCol);
    });
  }, []);

  return {
    ...state,
    selectCard,
    clickEmptyColumn,
    dealFromStock,
    newGame,
    canDrag,
    canDrop,
    moveCards,
    stockDeals: Math.floor(state.stock.length / 10),
  };
}

function tryMove(prev: SpiderState, srcCol: number, srcIdx: number, destCol: number): SpiderState {
  const srcColumn = prev.columns[srcCol];
  const destColumn = prev.columns[destCol];
  const movingCards = srcColumn.slice(srcIdx);

  // Check if move is valid
  if (destColumn.length > 0) {
    const destTop = destColumn[destColumn.length - 1];
    const srcTop = movingCards[0];
    // Destination top card must be one rank higher
    if (rankIndex(destTop.rank) - rankIndex(srcTop.rank) !== 1) {
      return { ...prev, selected: null };
    }
  }

  // Perform the move
  const newSrcColumn = srcColumn.slice(0, srcIdx);
  // Flip the new top card if it's face down
  if (newSrcColumn.length > 0 && !newSrcColumn[newSrcColumn.length - 1].faceUp) {
    newSrcColumn[newSrcColumn.length - 1] = {
      ...newSrcColumn[newSrcColumn.length - 1],
      faceUp: true,
    };
  }

  const newDestColumn = [...destColumn, ...movingCards];

  const newColumns = prev.columns.map((col, i) => {
    if (i === srcCol) return newSrcColumn;
    if (i === destCol) return newDestColumn;
    return col;
  });

  let newState: SpiderState = {
    ...prev,
    columns: newColumns,
    selected: null,
    moves: prev.moves + 1,
  };

  // Check for completed sequences
  newState = checkAndRemoveCompleted(newState);

  return newState;
}

function checkAndRemoveCompleted(state: SpiderState): SpiderState {
  let changed = true;
  let newState = { ...state };

  while (changed) {
    changed = false;
    for (let col = 0; col < 10; col++) {
      const seqStart = checkCompleteSequence(newState.columns[col]);
      if (seqStart !== null) {
        const newColumn = newState.columns[col].slice(0, seqStart);
        if (newColumn.length > 0 && !newColumn[newColumn.length - 1].faceUp) {
          newColumn[newColumn.length - 1] = {
            ...newColumn[newColumn.length - 1],
            faceUp: true,
          };
        }
        const newColumns = newState.columns.map((c, i) => i === col ? newColumn : c);
        const newCompleted = newState.completed + 1;
        newState = {
          ...newState,
          columns: newColumns,
          completed: newCompleted,
          gameWon: newCompleted === 8,
        };
        changed = true;
      }
    }
  }

  return newState;
}
