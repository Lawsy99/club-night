// Pemberton's traps (data/coachScenarios.ts): choosing one for tonight,
// the move he plays while the game follows it, and how it went.
import { COACH_SCENARIOS, type CoachScenario } from '../data/coachScenarios'
import type { Colour } from './game'
import { parseLine } from './openingBook'

/** Every coached game in a week where chapter % EVERY === OFFSET (about one in three). */
const EVERY = 3
const OFFSET = 2

export function scenarioWeek(chapter: number): boolean {
  return chapter % EVERY === OFFSET
}

/** A trap that suits the player's rating and tonight's colours, not used before (if possible). */
export function pickScenario(rating: number, coachColour: Colour, used: readonly string[]): CoachScenario | null {
  const fits = COACH_SCENARIOS.filter((s) => s.coachColour === coachColour && rating >= s.minRating && rating <= s.maxRating)
  return fits.find((s) => !used.includes(s.id)) ?? fits[0] ?? null
}

export function findScenario(id: string): CoachScenario | undefined {
  return COACH_SCENARIOS.find((s) => s.id === id)
}

const cache = new Map<string, { setup: string[]; lines: string[][] }>()

function linesOf(s: CoachScenario) {
  let parsed = cache.get(s.id)
  if (!parsed) {
    const setup = parseLine(s.setup)
    parsed = { setup, lines: [setup, ...(s.punish ?? []).map(parseLine)] }
    cache.set(s.id, parsed)
  }
  return parsed
}

/** Pemberton's next move if the game is still following one of the scenario's lines. */
export function scenarioMove(s: CoachScenario, movesSoFar: readonly string[]): string | null {
  for (const line of linesOf(s).lines) {
    if (line.length > movesSoFar.length && movesSoFar.every((m, i) => line[i] === m)) return line[movesSoFar.length]
  }
  return null
}

export type ScenarioState = 'following' | 'avoided' | 'judge' | 'waiting'

/**
 * Where the game is with the scenario: still following it; left before the
 * trap was set (avoided); or far enough past it to judge.
 */
export function scenarioState(s: CoachScenario, moves: readonly string[]): ScenarioState {
  const { setup, lines } = linesOf(s)
  // How far the game followed any of the lines.
  let followed = 0
  for (const line of lines) {
    let n = 0
    while (n < moves.length && n < line.length && moves[n] === line[n]) n++
    followed = Math.max(followed, n)
  }
  const onALine = lines.some((line) => moves.length <= line.length && moves.every((m, i) => line[i] === m))
  if (onALine && moves.length < Math.max(...lines.map((l) => l.length))) return 'following'
  if (followed < setup.length) return 'avoided'
  return moves.length >= followed + s.judgeAfter ? 'judge' : 'waiting'
}

/** How it went, from the player's score (centipawns) once it's time to judge. */
export function scenarioVerdict(playerCp: number): 'escaped' | 'fell' {
  return playerCp >= -150 ? 'escaped' : 'fell'
}
