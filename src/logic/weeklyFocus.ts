// The weekly focus (Joseph, Sep 2026): Pemberton picks one habit a week from
// the player's real mistakes, says how last week's went, and checks it after
// every game. Pure: AppFlow feeds it the error kinds of analysed games.
import { FOCUSES, findFocus, type FocusId } from '../data/focuses'
import type { ErrorKind } from './explain'

export type WeekFocus = {
  /** Which week it belongs to ("1:c2": act and week id). */
  week: string
  id: FocusId
  /** Mistakes of this kind per game before the week started (null: too few games to say). */
  baseline: number | null
  /** When it was set; games after this count towards it. */
  setAt: number
  /** Pemberton on last week's focus, if there was one. */
  verdict: string | null
  /** How closely he watches your moves this week (logic/coachWatch.ts), and what he said about it. */
  watch?: number
  watchNote?: string | null
}

/** Games needed before a baseline means anything. */
const MIN_GAMES = 2
/** How many recent games the choice looks at. */
const SAMPLE = 6

export function focusCount(kinds: readonly ErrorKind[], id: FocusId): number {
  const wanted = findFocus(id).kinds
  return kinds.filter((k) => wanted.includes(k)).length
}

function rate(games: readonly (readonly ErrorKind[])[], id: FocusId): number {
  return games.length ? games.reduce((sum, g) => sum + focusCount(g, id), 0) / games.length : 0
}

/** "none", "under one", "about one", "about two"… a game. */
function perGame(r: number): string {
  if (r === 0) return 'none'
  if (r < 0.75) return 'under one'
  if (r < 1.5) return 'about one'
  return `about ${['two', 'three', 'four', 'five'][Math.min(Math.round(r), 5) - 2] ?? Math.round(r)}`
}

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1)

/**
 * This week's focus. `recent` is the error kinds of the player's analysed
 * games, newest first; `previous` is last week's focus with the games played
 * since it was set. A focus that has halved (or gone) is done with, and
 * Pemberton says so; otherwise the worst habit gets the week.
 */
export function chooseFocus(
  week: string,
  now: number,
  recent: readonly (readonly ErrorKind[])[],
  previous: { focus: WeekFocus; since: readonly (readonly ErrorKind[])[] } | null,
): WeekFocus {
  const sample = recent.slice(0, SAMPLE)
  const prev = previous && previous.since.length > 0 ? previous : null
  const prevRate = prev ? rate(prev.since, prev.focus.id) : null
  const improved =
    prev !== null && prevRate !== null && (prevRate === 0 || (prev.focus.baseline !== null && prevRate <= prev.focus.baseline / 2))

  const ranked = FOCUSES.map((f, order) => ({ id: f.id, r: rate(sample, f.id), order }))
    .filter((c) => !(improved && c.id === prev!.focus.id))
    .sort((a, b) => b.r - a.r || a.order - b.order)
  // Nothing to go on (a new player, or a clean run): the next habit in the list.
  const fallback = FOCUSES.find((f) => f.id !== previous?.focus.id)!.id
  const id = sample.length >= MIN_GAMES && ranked[0]?.r > 0 ? ranked[0].id : previous && !improved ? previous.focus.id : fallback

  return {
    week,
    id,
    baseline: sample.length >= MIN_GAMES ? rate(sample, id) : null,
    setAt: now,
    verdict: prev && prevRate !== null ? verdictOn(prev.focus, prevRate, prev.since.length, improved, id === prev.focus.id) : null,
  }
}

/** Pemberton on how last week's focus went. Dry, and only what the games showed. */
function verdictOn(focus: WeekFocus, r: number, games: number, improved: boolean, staying: boolean): string {
  const title = lower(findFocus(focus.id).title)
  if (improved) {
    return r === 0
      ? `Last week, ${title}: none in ${games === 1 ? 'your one game' : `${games} games`}. That’ll do. On to something else.`
      : `Last week, ${title}: ${perGame(r)} a game, down from ${perGame(focus.baseline ?? r)}. That’ll do. On to something else.`
  }
  return staying
    ? `Last week, ${title}: still ${perGame(r)} a game. We’ll stay on it. These things take longer than a week.`
    : `Last week, ${title}: ${perGame(r)} a game. Something else needs the attention more now.`
}

/** The move numbers, as words go: "move 12", "moves 8 and 12", "moves 8, 12 and 20". */
function moveList(plies: readonly number[]): string {
  const n = plies.map((p) => Math.floor(p / 2) + 1)
  if (n.length === 1) return `move ${n[0]}`
  return `moves ${n.slice(0, -1).join(', ')} and ${n.at(-1)}`
}

const COUNT = ['none', 'one', 'two', 'three', 'four', 'five']

/** After a game: how the week's focus went in it, with the moves where it slipped. */
export function focusCheck(focus: Pick<WeekFocus, 'id' | 'baseline'>, errors: readonly { ply: number; kind: ErrorKind }[]): string {
  const f = findFocus(focus.id)
  const slips = errors.filter((e) => f.kinds.includes(e.kind)).map((e) => e.ply)
  const job = `${f.title}, this week’s job:`
  if (slips.length === 0) {
    return focus.baseline !== null && focus.baseline >= 0.5
      ? `${job} none this game. You were averaging ${perGame(focus.baseline)}. That’s the habit working.`
      : `${job} none this game. Good.`
  }
  const count = COUNT[slips.length] ?? String(slips.length)
  if (focus.baseline !== null && slips.length < focus.baseline) {
    return `${job} ${count} this game, on ${moveList(slips)}. Down from ${perGame(focus.baseline)} a game. Getting there.`
  }
  return `${job} ${count} this game, on ${moveList(slips)}. ${f.habit}`
}

/** Clean games in a row before a habit counts as shaken. */
export const SHAKEN_AFTER = 5

/**
 * Habits you've got on top of (Joseph, Sep 2026: progress that a lost game
 * can't take away): each focus area you used to slip on, with how many games
 * in a row you've gone without it. `games` is error kinds per game, newest first.
 */
export function shakenHabits(games: readonly (readonly ErrorKind[])[]): { id: FocusId; title: string; clean: number }[] {
  return FOCUSES.flatMap((f) => {
    const last = games.findIndex((g) => focusCount(g, f.id) > 0)
    // Never slipped on it (nothing shaken), or not clean for long enough yet.
    if (last === -1 || last < SHAKEN_AFTER) return []
    return [{ id: f.id, title: f.title, clean: last }]
  }).sort((a, b) => b.clean - a.clean)
}
