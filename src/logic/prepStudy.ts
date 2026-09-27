// Builds "Prep: {name}" from the player's own games (see data/prepStudy.ts):
// their most-played openings and how they score in them, the habit that
// keeps costing them, and the part of the game where they're weakest. Every
// line rests on their archive; where there isn't enough, it says so in
// Pemberton's voice rather than guessing.
import { STUDY_HABITS, STUDY_PHASES, STUDY_TEXT } from '../data/prepStudy'
import { OPENING_NAMES } from '../data/scouting'
import type { ErrorKind } from './explain'
import type { Colour } from './game'
import { detectOpening } from './openings'
import { accuracyByPhase, type Phase, type StatsGame } from './stats'

export type StudyChapter = { heading: string; lines: string[] }

/** Games in one opening before it counts as theirs. */
const MIN_OPENING_GAMES = 3
/** The last this-many analysed games are read for habits. */
const HABIT_WINDOW = 10
/** A habit has to turn up in at least this many games to be named. */
const MIN_HABIT_GAMES = 2
/** The weakest phase has to trail the best by this much (accuracy points) to be named. */
const PHASE_GAP = 5

export function prepStudy(games: readonly StatsGame[], kindsByGame: readonly (readonly ErrorKind[])[]): StudyChapter[] {
  return [
    { heading: STUDY_TEXT.openings, lines: openingLines(games) },
    { heading: STUDY_TEXT.habits, lines: habitLines(kindsByGame) },
    { heading: STUDY_TEXT.phases, lines: [phaseLine(games)] },
    { heading: STUDY_TEXT.night, lines: [STUDY_TEXT.onTheNight] },
  ]
}

function openingLines(games: readonly StatsGame[]): string[] {
  const lines: string[] = []
  for (const colour of ['w', 'b'] as Colour[]) {
    const tally = new Map<string, { played: number; points: number }>()
    for (const g of games) {
      if (g.playerColour !== colour) continue
      const opening = detectOpening(g.sans)
      if (!opening) continue
      const t = tally.get(opening) ?? { played: 0, points: 0 }
      t.played++
      t.points += g.result === 'win' ? 1 : g.result === 'draw' ? 0.5 : 0
      tally.set(opening, t)
    }
    const top = [...tally.entries()].sort((a, b) => b[1].played - a[1].played)[0]
    if (!top || top[1].played < MIN_OPENING_GAMES) continue
    const [opening, { played, points }] = top
    const pct = Math.round((points / played) * 100)
    const name = OPENING_NAMES[opening] ?? opening
    const side = colour === 'w' ? 'White' : 'Black'
    lines.push(pct < 50 ? STUDY_TEXT.weakOpening(side, name, played, pct) : STUDY_TEXT.strongOpening(side, name, played, pct))
  }
  return lines.length ? lines : [STUDY_TEXT.noOpenings]
}

function habitLines(kindsByGame: readonly (readonly ErrorKind[])[]): string[] {
  const recent = kindsByGame.slice(0, HABIT_WINDOW)
  if (recent.length < 3) return [STUDY_TEXT.noReviews]
  // How many games each kind turns up in (not how often: one bad game shouldn't decide it).
  const inGames = new Map<ErrorKind, number>()
  for (const kinds of recent) for (const k of new Set(kinds)) inGames.set(k, (inGames.get(k) ?? 0) + 1)
  const ranked = [...inGames.entries()]
    .filter(([, n]) => n >= MIN_HABIT_GAMES)
    // "The position slipped" is the vaguest note: only if nothing concrete stands out.
    .sort((a, b) => b[1] - a[1] || Number(a[0] === 'positional') - Number(b[0] === 'positional'))
  const concrete = ranked.find(([k]) => k !== 'positional') ?? ranked[0]
  if (!concrete) return [STUDY_TEXT.noHabit]
  const [kind, games] = concrete
  return [STUDY_HABITS[kind], STUDY_TEXT.habitSeen(games, recent.length)]
}

function phaseLine(games: readonly StatsGame[]): string {
  const phases = accuracyByPhase(games)
  const measured = (Object.entries(phases) as [Phase, number | null][]).filter((e): e is [Phase, number] => e[1] !== null)
  if (measured.length < 2) return STUDY_TEXT.noPhases
  const sorted = [...measured].sort((a, b) => a[1] - b[1])
  const [weakest, best] = [sorted[0], sorted[sorted.length - 1]]
  return best[1] - weakest[1] >= PHASE_GAP ? STUDY_PHASES[weakest[0]] : STUDY_TEXT.steady
}
