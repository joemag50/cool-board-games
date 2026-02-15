import { useState, useCallback, useEffect } from 'react';
import type { Card } from '../../types';
import { createStandardDeck, shuffle } from '../../types';

// ── Types ──────────────────────────────────────────────

type Phase =
  | 'shuffling'    // Croupier shuffles the shoe
  | 'cutting'      // Player cuts the deck
  | 'betting'      // Player places bet
  | 'dealing'      // Cards dealt one by one
  | 'playing'      // Player's turn
  | 'dealerTurn'   // Dealer reveals & draws
  | 'gameOver';    // Hand result shown

type Result = 'win' | 'lose' | 'push' | 'blackjack' | null;

export interface BlackjackState {
  shoe: Card[];
  shoeSize: number;
  cutCardDepth: number;
  playerHand: Card[];
  dealerHand: Card[];
  phase: Phase;
  result: Result;
  chips: number;
  bet: number;
  message: string;
  dealStep: number;
  animatingCardId: string | null;
  flipCardId: string | null;
  handsPlayed: number;
}

// ── Constants ──────────────────────────────────────────

const NUM_DECKS = 6;
const INITIAL_CHIPS = 1000;
const SHUFFLE_DELAY = 2200;
const DEAL_DELAY = 550;
const DEALER_REVEAL_DELAY = 900;
const DEALER_DRAW_DELAY = 950;
const RESULT_DELAY = 800;
const NATURAL_CHECK_DELAY = 500;

const DEAL_SEQUENCE = [
  { target: 'player' as const, faceUp: true },
  { target: 'dealer' as const, faceUp: true },
  { target: 'player' as const, faceUp: true },
  { target: 'dealer' as const, faceUp: false },
];

// ── Value Calculations ─────────────────────────────────

function handValue(hand: Card[], onlyVisible = false): number {
  let value = 0;
  let aces = 0;
  for (const c of hand) {
    if (onlyVisible && !c.faceUp) continue;
    if (c.rank === 'A') { aces++; value += 11; }
    else if (['J', 'Q', 'K'].includes(c.rank)) value += 10;
    else value += parseInt(c.rank);
  }
  while (value > 21 && aces > 0) { value -= 10; aces--; }
  return value;
}

function isNatural(hand: Card[]): boolean {
  return hand.length === 2 && handValue(hand) === 21;
}

// ── Shoe ───────────────────────────────────────────────

function createShoe(): Card[] {
  const cards: Card[] = [];
  for (let i = 0; i < NUM_DECKS; i++) {
    cards.push(...createStandardDeck());
  }
  return shuffle(cards);
}

// ── Initial State ──────────────────────────────────────

function initialState(): BlackjackState {
  return {
    shoe: [],
    shoeSize: NUM_DECKS * 52,
    cutCardDepth: 0,
    playerHand: [],
    dealerHand: [],
    phase: 'shuffling',
    result: null,
    chips: INITIAL_CHIPS,
    bet: 0,
    message: 'El crupier baraja las cartas...',
    dealStep: 0,
    animatingCardId: null,
    flipCardId: null,
    handsPlayed: 0,
  };
}

// ── Hook ───────────────────────────────────────────────

export function useBlackjack() {
  const [state, setState] = useState<BlackjackState>(initialState);

  // ── Phase: Shuffling ──
  // Auto-creates the shoe after a visual delay, then moves to cutting
  useEffect(() => {
    if (state.phase !== 'shuffling') return;
    const timer = setTimeout(() => {
      const shoe = createShoe();
      setState(prev => ({
        ...prev,
        shoe,
        shoeSize: shoe.length,
        phase: 'cutting',
        message: 'Corta el mazo',
      }));
    }, SHUFFLE_DELAY);
    return () => clearTimeout(timer);
  }, [state.phase]);

  // ── Phase: Dealing ──
  // Deals cards one by one following DEAL_SEQUENCE, then checks naturals
  useEffect(() => {
    if (state.phase !== 'dealing') return;

    // All 4 cards dealt → check for naturals
    if (state.dealStep >= DEAL_SEQUENCE.length) {
      const timer = setTimeout(() => {
        setState(prev => {
          const pNat = isNatural(prev.playerHand);
          const dNat = isNatural(prev.dealerHand);

          if (pNat && dNat) {
            return {
              ...prev, phase: 'gameOver', result: 'push',
              dealerHand: prev.dealerHand.map(c => ({ ...c, faceUp: true })),
              flipCardId: prev.dealerHand.find(c => !c.faceUp)?.id ?? null,
              message: 'Ambos tienen Blackjack — Empate',
              animatingCardId: null,
            };
          }
          if (pNat) {
            return {
              ...prev, phase: 'gameOver', result: 'blackjack',
              dealerHand: prev.dealerHand.map(c => ({ ...c, faceUp: true })),
              flipCardId: prev.dealerHand.find(c => !c.faceUp)?.id ?? null,
              chips: prev.chips + Math.floor(prev.bet * 1.5),
              message: '¡Blackjack! Ganas 3:2',
              animatingCardId: null,
            };
          }
          if (dNat) {
            return {
              ...prev, phase: 'gameOver', result: 'lose',
              dealerHand: prev.dealerHand.map(c => ({ ...c, faceUp: true })),
              flipCardId: prev.dealerHand.find(c => !c.faceUp)?.id ?? null,
              chips: prev.chips - prev.bet,
              message: 'Crupier tiene Blackjack — Pierdes',
              animatingCardId: null,
            };
          }

          return {
            ...prev, phase: 'playing',
            message: '¿Pedir carta o plantarte?',
            animatingCardId: null,
          };
        });
      }, NATURAL_CHECK_DELAY);
      return () => clearTimeout(timer);
    }

    // Deal next card in sequence
    const step = DEAL_SEQUENCE[state.dealStep];
    const timer = setTimeout(() => {
      setState(prev => {
        if (prev.shoe.length === 0) return prev;
        const card = { ...prev.shoe[0], faceUp: step.faceUp };
        const newShoe = prev.shoe.slice(1);

        return {
          ...prev,
          shoe: newShoe,
          playerHand: step.target === 'player' ? [...prev.playerHand, card] : prev.playerHand,
          dealerHand: step.target === 'dealer' ? [...prev.dealerHand, card] : prev.dealerHand,
          dealStep: prev.dealStep + 1,
          animatingCardId: card.id,
          flipCardId: null,
          message: step.target === 'player' ? 'Carta para ti...' : 'Carta para el crupier...',
        };
      });
    }, DEAL_DELAY);
    return () => clearTimeout(timer);
  }, [state.phase, state.dealStep]);

  // ── Phase: Dealer Turn ──
  // Reveal → Draw until 17+ → Determine winner
  useEffect(() => {
    if (state.phase !== 'dealerTurn') return;

    // Step 1: Reveal hole card
    const hiddenCard = state.dealerHand.find(c => !c.faceUp);
    if (hiddenCard) {
      const timer = setTimeout(() => {
        setState(prev => {
          const revealed = prev.dealerHand.map(c => ({ ...c, faceUp: true }));
          const val = handValue(revealed);
          return {
            ...prev,
            dealerHand: revealed,
            flipCardId: hiddenCard.id,
            animatingCardId: null,
            message: `Crupier revela... ${val}`,
          };
        });
      }, DEALER_REVEAL_DELAY);
      return () => clearTimeout(timer);
    }

    // Step 2: Draw while < 17
    const dv = handValue(state.dealerHand);
    if (dv < 17) {
      const timer = setTimeout(() => {
        setState(prev => {
          if (prev.shoe.length === 0) return prev;
          const card = { ...prev.shoe[0], faceUp: true };
          const newShoe = prev.shoe.slice(1);
          const newHand = [...prev.dealerHand, card];
          const val = handValue(newHand);
          return {
            ...prev,
            shoe: newShoe,
            dealerHand: newHand,
            animatingCardId: card.id,
            flipCardId: null,
            message: val > 21
              ? `Crupier pide... ${val} — ¡Se pasó!`
              : val >= 17
                ? `Crupier tiene ${val}. Se planta.`
                : `Crupier pide carta... ${val}`,
          };
        });
      }, DEALER_DRAW_DELAY);
      return () => clearTimeout(timer);
    }

    // Step 3: Determine winner
    const playerVal = handValue(state.playerHand);
    const dealerVal = dv;
    const timer = setTimeout(() => {
      setState(prev => {
        if (dealerVal > 21) {
          return {
            ...prev, phase: 'gameOver', result: 'win',
            chips: prev.chips + prev.bet,
            message: `¡Crupier se pasó! Ganas`,
            animatingCardId: null, flipCardId: null,
          };
        }
        if (playerVal > dealerVal) {
          return {
            ...prev, phase: 'gameOver', result: 'win',
            chips: prev.chips + prev.bet,
            message: `${playerVal} vs ${dealerVal} — ¡Ganas!`,
            animatingCardId: null, flipCardId: null,
          };
        }
        if (playerVal < dealerVal) {
          return {
            ...prev, phase: 'gameOver', result: 'lose',
            chips: prev.chips - prev.bet,
            message: `${playerVal} vs ${dealerVal} — Pierdes`,
            animatingCardId: null, flipCardId: null,
          };
        }
        return {
          ...prev, phase: 'gameOver', result: 'push',
          message: `${playerVal} vs ${dealerVal} — Empate`,
          animatingCardId: null, flipCardId: null,
        };
      });
    }, RESULT_DELAY);
    return () => clearTimeout(timer);
  }, [state.phase, state.dealerHand, state.playerHand]);

  // ── Actions ──────────────────────────────────────────

  const cutShoe = useCallback((position: number) => {
    setState(prev => {
      if (prev.phase !== 'cutting') return prev;
      // Clamp cut between 20%-80%
      const clamped = Math.max(0.2, Math.min(0.8, position));
      const cutIdx = Math.floor(clamped * prev.shoe.length);

      // Standard casino cut: bottom goes to top
      const newShoe = [...prev.shoe.slice(cutIdx), ...prev.shoe.slice(0, cutIdx)];
      // Burn top card
      const burned = newShoe.slice(1);
      // Cut card depth: 60-90 cards from the bottom
      const cutCardDepth = 60 + Math.floor(Math.random() * 30);

      return {
        ...prev,
        shoe: burned,
        shoeSize: burned.length,
        cutCardDepth,
        phase: 'betting',
        message: 'Mazo cortado. Coloca tu apuesta.',
      };
    });
  }, []);

  const placeBet = useCallback((amount: number) => {
    setState(prev => {
      if (prev.phase !== 'betting' || amount > prev.chips) return prev;
      return {
        ...prev,
        bet: amount,
        phase: 'dealing',
        dealStep: 0,
        playerHand: [],
        dealerHand: [],
        result: null,
        animatingCardId: null,
        flipCardId: null,
        message: 'Repartiendo...',
      };
    });
  }, []);

  const hit = useCallback(() => {
    setState(prev => {
      if (prev.phase !== 'playing' || prev.shoe.length === 0) return prev;
      const card = { ...prev.shoe[0], faceUp: true };
      const newShoe = prev.shoe.slice(1);
      const newHand = [...prev.playerHand, card];
      const value = handValue(newHand);

      if (value > 21) {
        return {
          ...prev, shoe: newShoe, playerHand: newHand,
          dealerHand: prev.dealerHand.map(c => ({ ...c, faceUp: true })),
          flipCardId: prev.dealerHand.find(c => !c.faceUp)?.id ?? null,
          phase: 'gameOver', result: 'lose',
          chips: prev.chips - prev.bet,
          message: `¡Te pasaste con ${value}! Pierdes`,
          animatingCardId: card.id,
        };
      }
      if (value === 21) {
        return {
          ...prev, shoe: newShoe, playerHand: newHand,
          phase: 'dealerTurn',
          message: '¡21! El crupier juega...',
          animatingCardId: card.id, flipCardId: null,
        };
      }
      return {
        ...prev, shoe: newShoe, playerHand: newHand,
        message: '¿Pedir carta o plantarte?',
        animatingCardId: card.id, flipCardId: null,
      };
    });
  }, []);

  const stand = useCallback(() => {
    setState(prev => {
      if (prev.phase !== 'playing') return prev;
      return {
        ...prev, phase: 'dealerTurn',
        message: 'Te plantas. El crupier juega...',
        animatingCardId: null, flipCardId: null,
      };
    });
  }, []);

  const doubleDown = useCallback(() => {
    setState(prev => {
      if (prev.phase !== 'playing' || prev.playerHand.length !== 2 || prev.bet > prev.chips || prev.shoe.length === 0) return prev;
      const card = { ...prev.shoe[0], faceUp: true };
      const newShoe = prev.shoe.slice(1);
      const newHand = [...prev.playerHand, card];
      const value = handValue(newHand);
      const newBet = prev.bet * 2;

      if (value > 21) {
        return {
          ...prev, shoe: newShoe, playerHand: newHand, bet: newBet,
          dealerHand: prev.dealerHand.map(c => ({ ...c, faceUp: true })),
          flipCardId: prev.dealerHand.find(c => !c.faceUp)?.id ?? null,
          phase: 'gameOver', result: 'lose',
          chips: prev.chips - newBet,
          message: `Doblaste y te pasaste con ${value}!`,
          animatingCardId: card.id,
        };
      }

      return {
        ...prev, shoe: newShoe, playerHand: newHand, bet: newBet,
        phase: 'dealerTurn',
        message: 'Doblaste. El crupier juega...',
        animatingCardId: card.id, flipCardId: null,
      };
    });
  }, []);

  const newHand = useCallback(() => {
    setState(prev => {
      const needsReshuffle = prev.shoe.length <= prev.cutCardDepth;
      return {
        ...prev,
        playerHand: [], dealerHand: [],
        phase: needsReshuffle ? 'shuffling' : 'betting',
        result: null, bet: 0, dealStep: 0,
        animatingCardId: null, flipCardId: null,
        message: needsReshuffle ? 'El crupier baraja las cartas...' : 'Coloca tu apuesta',
        handsPlayed: prev.handsPlayed + 1,
        shoe: needsReshuffle ? [] : prev.shoe,
      };
    });
  }, []);

  const resetGame = useCallback(() => {
    setState(initialState());
  }, []);

  // ── Derived values ──
  return {
    ...state,
    playerValue: handValue(state.playerHand),
    dealerValue: state.phase === 'gameOver' || state.phase === 'dealerTurn'
      ? handValue(state.dealerHand)
      : handValue(state.dealerHand, true),
    shoeRemaining: state.shoe.length,
    shoeProgress: state.shoeSize > 0 ? state.shoe.length / state.shoeSize : 1,
    cutShoe,
    placeBet,
    hit,
    stand,
    doubleDown,
    newHand,
    resetGame,
  };
}
