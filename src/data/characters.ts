// The Act 1 cast as opponents (design document: "Strength offsets", "Styles",
// "Draw offers, accepting and resigning"; Character Tone Guide for who they
// are). Vera, Felix and Derek join with Acts 2–3.

export type Style = 'aggressive' | 'solid' | 'simplifying' | 'grinding' | 'theoretical' | 'adaptive'

export type Character = {
  id: string
  name: string
  /** Scaling characters follow the act baseline; fixed ones are set once and stay. */
  strength: 'fixed' | 'scaling'
  /** Act 1 offset from the baseline, in rating points. */
  offset: number
  style: Style
  /** Thinking speed: 1 = normal, below 1 quicker (Oscar), above 1 slower (Priya). */
  thinkSpeed: number
  /** How they resign when hopelessly lost. */
  resigns: 'normal' | 'quickly' | 'never' | 'plays-to-mate'
  /** When they offer a draw themselves. */
  offersDraw: 'rarely' | 'move-12-when-level' | 'when-worse'
  /** Whether they'll accept the player's offer when clearly worse (Vera and Derek never do). */
  acceptsDraws: boolean
}

export const CHARACTERS: Character[] = [
  {
    id: 'marjorie',
    name: 'Marjorie',
    strength: 'fixed',
    offset: -150,
    style: 'solid',
    thinkSpeed: 1,
    resigns: 'plays-to-mate',
    offersDraw: 'rarely',
    acceptsDraws: true,
  },
  {
    id: 'dex',
    name: 'Dex',
    strength: 'scaling',
    offset: -100,
    style: 'aggressive',
    // "I play bullet."
    thinkSpeed: 0.5,
    resigns: 'normal',
    offersDraw: 'rarely',
    acceptsDraws: true,
  },
  {
    id: 'oscar',
    name: 'Oscar',
    strength: 'scaling',
    offset: -150,
    style: 'aggressive',
    // Barely pauses: often moves within a couple of seconds.
    thinkSpeed: 0.35,
    resigns: 'quickly',
    offersDraw: 'rarely',
    acceptsDraws: true,
  },
  {
    id: 'clive',
    name: 'Clive',
    strength: 'fixed',
    offset: -50,
    style: 'simplifying',
    thinkSpeed: 0.9,
    resigns: 'normal',
    offersDraw: 'move-12-when-level',
    acceptsDraws: true,
  },
  {
    id: 'priya',
    name: 'Priya',
    strength: 'scaling',
    offset: 0,
    style: 'theoretical',
    thinkSpeed: 1.4,
    resigns: 'normal',
    offersDraw: 'rarely',
    acceptsDraws: true,
  },
  {
    id: 'graham',
    name: 'Graham',
    strength: 'fixed',
    offset: 50,
    style: 'solid',
    // Checks everything twice, and writes it down.
    thinkSpeed: 1.2,
    resigns: 'normal',
    offersDraw: 'rarely',
    acceptsDraws: true,
  },
  {
    id: 'toby',
    name: 'Toby',
    strength: 'scaling',
    offset: 50,
    style: 'adaptive',
    // Relaxed and slightly quicker than you'd like: he makes it look easy.
    thinkSpeed: 0.8,
    resigns: 'normal',
    offersDraw: 'when-worse',
    acceptsDraws: true,
  },
]

/** Nobody goes below 200 (design document). */
export const MIN_RATING = 200

export function characterRating(character: Character, baseline: number): number {
  return Math.max(MIN_RATING, Math.round((baseline + character.offset) / 5) * 5)
}

export function findCharacter(id: string): Character | undefined {
  return CHARACTERS.find((c) => c.id === id)
}
