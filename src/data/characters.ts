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
  /**
   * Scaling characters sit a set distance from the PLAYER's current rating
   * (Joseph, Sep 2026: a fixed story path, however fast the player improves).
   * One number per point in the story: index = chapters finished (0 to 7,
   * 7 being the cup). The story changes the distance only at its own moments,
   * e.g. Priya drops below you once you've beaten her. Fixed characters
   * don't use this: they're set once and the player climbs past them.
   */
  storyOffsets?: number[]
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
    // Below you, dropping further once you've beaten him, then creeping back
    // up: he "improves faster than anyone" (tone guide).
    storyOffsets: [-75, -75, -90, -85, -80, -70, -60, -55],
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
    // A junior, well below you at first and closing the gap all season.
    storyOffsets: [-110, -110, -110, -120, -110, -100, -95, -90],
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
    // Just above you until you beat her (chapter 5), then just below.
    storyOffsets: [20, 20, 20, 20, 20, -20, -20, -20],
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
    // Always ahead of you, however fast you improve (the rival).
    storyOffsets: [50, 50, 50, 50, 50, 50, 50, 50],
  },
]

/** Nobody goes below 200 (design document). */
export const MIN_RATING = 200

export function characterRating(character: Character, baseline: number): number {
  return Math.max(MIN_RATING, Math.round((baseline + character.offset) / 5) * 5)
}

/** A scaling character's distance from the player at this point in the story. */
export function storyOffset(character: Character, chaptersDone: number): number {
  const offsets = character.storyOffsets
  if (!offsets?.length) return character.offset
  return offsets[Math.max(0, Math.min(chaptersDone, offsets.length - 1))]
}

/**
 * Background members who turn up on practice night (Joseph, Sep 2026: side
 * characters bulk out the practice games). Not part of the story; their
 * ratings are fixed after trial night (data/members.ts). Ray plays once
 * junior night's finished; Malcolm (league nights only) never comes.
 */
export const PRACTICE_REGULARS: Character[] = [
  {
    id: 'ray',
    name: 'Ray',
    strength: 'fixed',
    offset: 190,
    style: 'solid',
    thinkSpeed: 1,
    resigns: 'normal',
    offersDraw: 'rarely',
    acceptsDraws: true,
  },
  {
    id: 'sheila',
    name: 'Sheila',
    strength: 'fixed',
    offset: -240,
    style: 'solid',
    thinkSpeed: 0.9,
    resigns: 'normal',
    offersDraw: 'rarely',
    acceptsDraws: true,
  },
  {
    id: 'bill',
    name: 'Bill',
    strength: 'fixed',
    offset: -330,
    style: 'simplifying',
    thinkSpeed: 1.3,
    resigns: 'plays-to-mate',
    offersDraw: 'rarely',
    acceptsDraws: true,
  },
]

/**
 * Coach Pemberton as an opponent: Tuesday's coached game. He plays at
 * exactly the player's level (a good coach pitches it), and never offers or
 * takes draws: it's a lesson.
 */
export const COACH: Character = {
  id: 'pemberton',
  name: 'Coach Pemberton',
  strength: 'scaling',
  offset: 0,
  style: 'adaptive',
  thinkSpeed: 1,
  resigns: 'normal',
  offersDraw: 'rarely',
  acceptsDraws: false,
  storyOffsets: [0],
}

export function findCharacter(id: string): Character | undefined {
  return CHARACTERS.find((c) => c.id === id) ?? PRACTICE_REGULARS.find((c) => c.id === id) ?? (id === COACH.id ? COACH : undefined)
}
