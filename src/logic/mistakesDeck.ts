// The mistakes deck: the player's real errors from reviews, brought back on
// a spaced-repetition schedule (FSRS, via ts-fsrs, the method Anki uses).
// Pure functions; saving lives in src/storage.
import { createEmptyCard, fsrs, Rating, type Card } from 'ts-fsrs'
import type { Moment } from './moment'
import type { MoveRating } from './moveRating'

export type MistakeCard = Moment & {
  /** gameId:ply, so the same mistake is never added twice. */
  id: string
  gameId: string
  ply: number
  /** How it was graded in the game (only mistakes and blunders make cards). */
  rating: MoveRating
  /** e.g. "3. Ng5??", for the card's heading. */
  moveLabel: string
  createdAt: number
  schedule: Card
  retired: boolean
}

/**
 * Keeping the deck small enough to stay useful (Joseph, Sep 2026: "will get
 * too filled up otherwise"). The design's "at most 3 per game" is tightened.
 */
export const MAX_CARDS_PER_GAME = 2
/** Active (not retired) cards; beyond this the oldest retire. */
export const MAX_ACTIVE_CARDS = 30
/** Cards shown in one sitting; the rest wait for next time. */
export const MAX_CARDS_PER_SESSION = 10

/**
 * Chess positions aren't vocabulary: minute-by-minute relearning steps make no
 * sense, so cards are scheduled in days. A missed card is shown once more at
 * the end of the same session instead (see the deck screen).
 */
const scheduler = fsrs({ enable_short_term: false, enable_fuzz: true })

/** Once a card's next review is this far away, it's learned: retire it. */
const RETIRE_AFTER_DAYS = 30

/** Only real errors become cards; small inaccuracies are skipped. */
export function qualifiesForDeck(rating: MoveRating): boolean {
  return rating === 'mistake' || rating === 'blunder'
}

export function newCard(
  moment: Moment,
  info: { gameId: string; ply: number; rating: MoveRating; moveLabel: string },
  now = new Date(),
): MistakeCard {
  return {
    ...moment,
    ...info,
    id: `${info.gameId}:${info.ply}`,
    createdAt: now.getTime(),
    schedule: createEmptyCard(now),
    retired: false,
  }
}

export type Answer = 'first-try' | 'second-try' | 'revealed'

const GRADES: Record<Answer, Rating.Good | Rating.Hard | Rating.Again> = {
  'first-try': Rating.Good,
  'second-try': Rating.Hard,
  revealed: Rating.Again,
}

/** The card after an answer, with its next review date worked out. */
export function answerCard(card: MistakeCard, answer: Answer, now = new Date()): MistakeCard {
  const { card: schedule } = scheduler.next(card.schedule, now, GRADES[answer])
  return { ...card, schedule, retired: schedule.scheduled_days >= RETIRE_AFTER_DAYS }
}

export function isDue(card: MistakeCard, now = new Date()): boolean {
  return !card.retired && new Date(card.schedule.due).getTime() <= now.getTime()
}

/** Due cards, oldest-due first. */
export function dueCards(cards: readonly MistakeCard[], now = new Date()): MistakeCard[] {
  return cards
    .filter((c) => isDue(c, now))
    .sort((a, b) => new Date(a.schedule.due).getTime() - new Date(b.schedule.due).getTime())
}

/**
 * Works out what adding new cards does to the deck: new positions are added
 * (a position already in the deck isn't added twice), and if that takes the
 * deck over its size limit, the oldest active cards retire to make room.
 */
export function planAdditions(
  existing: readonly MistakeCard[],
  incoming: readonly MistakeCard[],
  cap = MAX_ACTIVE_CARDS,
): { add: MistakeCard[]; retire: MistakeCard[] } {
  const known = new Set(existing.map((c) => c.id))
  const positions = new Set(existing.filter((c) => !c.retired).map((c) => c.fenBefore))
  const add: MistakeCard[] = []
  for (const card of incoming) {
    if (known.has(card.id) || positions.has(card.fenBefore)) continue
    add.push(card)
    positions.add(card.fenBefore)
  }
  const active = existing.filter((c) => !c.retired).sort((a, b) => a.createdAt - b.createdAt)
  const overflow = Math.max(0, active.length + add.length - cap)
  const retire = active.slice(0, overflow).map((c) => ({ ...c, retired: true }))
  return { add, retire }
}

export function retireCard(card: MistakeCard): MistakeCard {
  return { ...card, retired: true }
}

/** When the next card becomes due, if any are waiting. */
export function nextDue(cards: readonly MistakeCard[]): Date | null {
  const upcoming = cards.filter((c) => !c.retired).map((c) => new Date(c.schedule.due).getTime())
  return upcoming.length ? new Date(Math.min(...upcoming)) : null
}
