// Builds Coach Pemberton's scouting report for a game (2–4 bubbles).
import { OPENING_NAMES, SCOUTING } from '../data/scouting'
import type { Colour } from './game'
import type { Weakness } from './rival'

export type ScoutingInput = {
  character: string
  playerColour: Colour
  record: { wins: number; losses: number }
  /** Toby only: the weakness he's targeting, if any. */
  target: Weakness | null
}

export function scoutingReport({ character, playerColour, record, target }: ScoutingInput): string[] {
  const notes = SCOUTING[character]
  if (!notes) return []
  const bubbles = [playerColour === 'b' ? notes.asWhite : notes.asBlack, notes.style]
  const played = record.wins + record.losses
  bubbles.push(
    played === 0
      ? `First time you've played ${notes.pronoun}.`
      : `Your record against ${notes.pronoun}: ${record.wins} won, ${record.losses} lost.`,
  )
  if (target) {
    const colour = target.colour === 'w' ? 'White' : 'Black'
    bubbles.push(`He's noticed you struggle with ${OPENING_NAMES[target.opening] ?? target.opening} as ${colour}. Have a plan ready.`)
  }
  return bubbles
}
