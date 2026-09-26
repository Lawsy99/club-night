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
 * Coaching night opens with three warm-ups from the player's own errors
 * (Joseph, Sep 2026: this replaces a separate deck, so they actually get
 * done). Each is shown once, then gone for good.
 */
export const WARMUP_CARDS = 3
/**
 * The last few games' errors are held back: the player has only just seen
 * them in the review (Joseph, Sep 2026: older mistakes, not the same ones
 * straight after reviewing). They come round in later weeks instead.
 */
export const RECENT_GAMES_HELD_BACK = 3

/**
 * The warm-ups for tonight: older errors first, one per game so the three
 * aren't all from the same bad evening. If there aren't enough older ones,
 * recent ones make up the numbers.
 */
export function warmupCards(cards: readonly MistakeCard[]): MistakeCard[] {
  const open = cards.filter((c) => !c.retired).sort((a, b) => a.createdAt - b.createdAt) // oldest first
  const gamesNewestFirst = [...new Set([...open].reverse().map((c) => c.gameId))]
  const recent = new Set(gamesNewestFirst.slice(0, RECENT_GAMES_HELD_BACK))
  const older = open.filter((c) => !recent.has(c.gameId))
  const picked: MistakeCard[] = []
  const take = (c: MistakeCard) => {
    if (picked.length < WARMUP_CARDS && !picked.includes(c)) picked.push(c)
  }
  // 1. One per game, oldest games first.
  for (const c of older) if (!picked.some((p) => p.gameId === c.gameId)) take(c)
  // 2. More from those older games.
  for (const c of older) take(c)
  // 3. Only then the recent games, oldest of those first.
  for (const c of open) take(c)
  return picked
}

/**
 * Chess positions aren't vocabulary: minute-by-minute relearning steps make no
 * sense, so cards are scheduled in days. A missed card is shown once more at
 * the end of the same session instead (see the deck screen).
 */
const scheduler = fsrs({ enable_short_term: false, enable_fuzz: true })

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

/**
 * The card after an answer. Every warm-up is seen once only, right or wrong
 * (Joseph, Sep 2026: bringing it back would turn it into a memory test).
 */
export function answerCard(card: MistakeCard, answer: Answer, now = new Date()): MistakeCard {
  const { card: schedule } = scheduler.next(card.schedule, now, GRADES[answer])
  return { ...card, schedule, retired: true }
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
