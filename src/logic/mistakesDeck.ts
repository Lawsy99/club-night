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

/** At most this many cards from one game (design: "at most 3 cards per game"). */
export const MAX_CARDS_PER_GAME = 3

/**
 * Chess positions aren't vocabulary: minute-by-minute relearning steps make no
 * sense, so cards are scheduled in days. A missed card is shown once more at
 * the end of the same session instead (see the deck screen).
 */
const scheduler = fsrs({ enable_short_term: false, enable_fuzz: true })

/** Once a card's next review is this far away, it's learned: retire it. */
const RETIRE_AFTER_DAYS = 60

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

/** When the next card becomes due, if any are waiting. */
export function nextDue(cards: readonly MistakeCard[]): Date | null {
  const upcoming = cards.filter((c) => !c.retired).map((c) => new Date(c.schedule.due).getTime())
  return upcoming.length ? new Date(Math.min(...upcoming)) : null
}
