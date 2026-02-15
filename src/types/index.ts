export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  suit: Suit;
  rank: Rank;
  faceUp: boolean;
  id: string;
}

export interface GameModule {
  id: string;
  name: string;
  description: string;
  icon: string;
  gradient: string;
  component: React.ComponentType;
}

// ── Constants ──────────────────────────────────────────

export const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
export const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export const SUIT_SYMBOLS: Record<Suit, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};

// ── Helpers ────────────────────────────────────────────

let _cardId = 0;

export function createStandardDeck(faceUp = false): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank, faceUp, id: `card-${_cardId++}` });
    }
  }
  return deck;
}

export function createSpiderDeck(): Card[] {
  // 8 complete sets of spades = 104 cards
  const deck: Card[] = [];
  for (let i = 0; i < 8; i++) {
    for (const rank of RANKS) {
      deck.push({ suit: 'spades', rank, faceUp: false, id: `card-${_cardId++}` });
    }
  }
  return deck;
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function rankIndex(rank: Rank): number {
  return RANKS.indexOf(rank);
}
