// When to pause for a plan, and which plans to offer.
import { OPENING_PATTERNS, PLANS, type PlanSet } from '../data/plans'
import type { Colour } from './game'

/** The pause comes once the opening is over, usually around move 10. */
export const PLAN_PAUSE_MOVE = 10

/** The opening family from the moves so far (ordinary notation), or null. */
export function detectOpening(sans: readonly string[]): string | null {
  for (const [key, pattern] of OPENING_PATTERNS) {
    if (pattern.length <= sans.length && pattern.every((m, i) => m === '*' || m === sans[i])) return key
  }
  return null
}

/** The plans to offer the player now, or null if we have none for this opening. */
export function planFor(sans: readonly string[], playerColour: Colour): PlanSet | null {
  const opening = detectOpening(sans)
  if (!opening) return null
  return PLANS[opening]?.[playerColour] ?? null
}

/** Pause now? Once per assisted game, on the player's turn from move 10. */
export function shouldPausePlan(options: {
  stage: string
  alreadyDone: boolean
  moveNumber: number
  playersTurn: boolean
}): boolean {
  return options.stage === 'assisted' && !options.alreadyDone && options.playersTurn && options.moveNumber >= PLAN_PAUSE_MOVE
}
