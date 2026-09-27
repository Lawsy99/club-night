// Builds Coach Pemberton's scouting report for a game (2–5 bubbles).
// Sep 2026: it also remembers your last game against them, from the archive:
// the result, and where it turned (Joseph: reports built from your history).
import { OPENING_NAMES, SCOUTING } from '../data/scouting'
import type { Colour } from './game'
import type { PositionEval } from './review'
import type { Weakness } from './rival'

/** Your last finished game against this opponent, if any. */
export type LastMeeting = {
  moves: readonly string[]
  playerColour: Colour
  /** true you won, false you lost, null drawn. */
  won: boolean | null
  evals?: readonly PositionEval[]
}

export type ScoutingInput = {
  character: string
  playerColour: Colour
  record: { wins: number; losses: number }
  /** Toby only: the weakness he's targeting, if any. */
  target: Weakness | null
  last?: LastMeeting | null
}

export function scoutingReport({ character, playerColour, record, target, last }: ScoutingInput): string[] {
  const notes = SCOUTING[character]
  if (!notes) return []
  const bubbles = [playerColour === 'b' ? notes.asWhite : notes.asBlack, notes.style]
  const played = record.wins + record.losses
  bubbles.push(
    played === 0
      ? `First time you've played ${notes.pronoun}.`
      : `Your record against ${notes.pronoun}: ${record.wins} won, ${record.losses} lost.`,
  )
  const memory = last ? lastMeetingNote(last, notes.pronoun) : null
  if (memory) bubbles.push(memory)
  if (target) {
    const colour = target.colour === 'w' ? 'White' : 'Black'
    bubbles.push(`He's noticed you struggle with ${OPENING_NAMES[target.opening] ?? target.opening} as ${colour}. Have a plan ready.`)
  }
  return bubbles
}

/**
 * One line about last time: a win you let slip, a loss you fought back from,
 * or simply how long it lasted. Only from the moves and the engine's scores.
 */
export function lastMeetingNote(last: LastMeeting, pronoun: 'him' | 'her'): string | null {
  const moveCount = Math.ceil(last.moves.length / 2)
  if (moveCount < 5) return null
  const they = pronoun === 'her' ? 'she' : 'he'
  if (last.evals && last.evals.length === last.moves.length + 1) {
    const forYou = (cp: number) => (last.playerColour === 'w' ? cp : -cp)
    // After each of your moves: when were you clearly winning, or clearly losing?
    let winningAt: number | null = null
    let losingAt: number | null = null
    for (let ply = 0; ply < last.moves.length; ply++) {
      const mine = (ply % 2 === 0) === (last.playerColour === 'w')
      if (!mine) continue
      const cp = forYou(last.evals[ply + 1].cp)
      if (winningAt === null && cp >= 300) winningAt = Math.floor(ply / 2) + 1
      if (losingAt === null && cp <= -300) losingAt = Math.floor(ply / 2) + 1
    }
    if (last.won === false && winningAt !== null) {
      return `Last time you were winning by move ${winningAt}, and ${they} still beat you. Finish the job this time.`
    }
    if (last.won === true && losingAt !== null) return `Last time you were losing by move ${losingAt} and came back. Don’t count on that twice.`
    if (last.won === false && losingAt !== null) return `Last time it went wrong by move ${losingAt}. Be careful early on.`
  }
  if (last.won === true) return `You beat ${pronoun} last time, in ${moveCount} moves. ${cap(they)}’ll remember.`
  if (last.won === false) return `${cap(they)} beat you last time, in ${moveCount} moves.`
  return `Last time was a draw, over ${moveCount} moves.`
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
