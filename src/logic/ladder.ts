// The club ladder (Joseph, Sep 2026): everyone at the club by rating, with
// the player among them. Fixed members (and the background members) stay
// put, so the player climbs past them for good. The main cast who scale sit
// a set distance from the player, chosen by the story, so they're overtaken
// only at story moments (and Toby never is). Ratings are the ones they play at.
import { CHARACTERS, PRACTICE_REGULARS } from '../data/characters'
import { MEMBERS } from '../data/members'
import { opponentRating, type Progress } from './path'

export const YOU = 'you'

export type Rung = { id: string; name: string; rating: number }

/** Everyone, highest first. On a tie the player sits below: you have to get past, not level. */
export function clubLadder(p: Progress, playerName = 'You'): Rung[] | null {
  if (!p.rating) return null
  const cast = CHARACTERS.map((c) => ({ id: c.id, name: c.name, rating: opponentRating(p, c.id) }))
  const background = MEMBERS.map((m) => ({ id: m.id, name: m.name, rating: opponentRating(p, m.id) }))
  // Practice-night regulars who aren't background members (Terry) are club
  // members too, so they're on the ladder from the start.
  const regulars = PRACTICE_REGULARS.filter((c) => !MEMBERS.some((m) => m.id === c.id)).map((c) => ({
    id: c.id,
    name: c.name,
    rating: opponentRating(p, c.id),
  }))
  const you = { id: YOU, name: playerName, rating: Math.round(p.rating.rating) }
  return [...cast, ...background, ...regulars, you].sort((a, b) => b.rating - a.rating || (a.id === YOU ? 1 : b.id === YOU ? -1 : 0))
}

/** The player's place (1 = top), the next person up, and how far away they are. */
export function nextRung(ladder: readonly Rung[]): { place: number; above: Rung | null; gap: number; below: Rung | null } {
  const i = ladder.findIndex((r) => r.id === YOU)
  const above = i > 0 ? ladder[i - 1] : null
  return {
    place: i + 1,
    above,
    gap: above ? above.rating - ladder[i].rating + 1 : 0,
    below: ladder[i + 1] ?? null,
  }
}

export type LadderNews = { kind: 'passed' | 'passed-by'; id: string; name: string }

/** One line per change since the last game: "You moved above Priya on the club ladder." */
export function describeNews(n: LadderNews): string {
  return n.kind === 'passed' ? `You moved above ${n.name} on the club ladder.` : `${n.name} has moved above you on the club ladder.`
}

/** Who the player moved above, and who moved above the player, between two ladders. */
export function ladderChanges(before: readonly Rung[] | null, after: readonly Rung[] | null): LadderNews[] {
  if (!before || !after) return []
  const aboveYou = (ladder: readonly Rung[]) => {
    const i = ladder.findIndex((r) => r.id === YOU)
    return new Set(ladder.slice(0, i).map((r) => r.id))
  }
  const was = aboveYou(before)
  const now = aboveYou(after)
  const name = (id: string) => after.find((r) => r.id === id)?.name ?? id
  return [
    ...[...was].filter((id) => !now.has(id)).map((id) => ({ kind: 'passed' as const, id, name: name(id) })),
    ...[...now].filter((id) => !was.has(id)).map((id) => ({ kind: 'passed-by' as const, id, name: name(id) })),
  ]
}
