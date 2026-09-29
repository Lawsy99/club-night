// Archived games in the shape the stats (and Pemberton's study of you) need.
// Unfinished or unreadable games are skipped.
import type { ArchivedGame } from '../storage/db'
import { gameErrorKinds } from './coachNotes'
import type { ErrorKind } from './explain'
import { replay } from './game'
import { outcomeOf, upgradeGameRecord } from './gameRecord'
import { reviewMoves } from './review'
import type { StatsGame } from './stats'

const CHARACTER_PREFIX = 'char:'

export function toStatsGame(saved: ArchivedGame): StatsGame[] {
  try {
    const g = upgradeGameRecord(saved)
    const outcome = outcomeOf(g)
    if (!outcome) return []
    const result = outcome.winner === null ? 'draw' : outcome.winner === g.playerColour ? 'win' : 'loss'
    const analysed = saved.evals && saved.evals.length === g.moves.length + 1
    return [
      {
        finishedAt: saved.finishedAt,
        character: g.levelId.startsWith(CHARACTER_PREFIX) ? g.levelId.slice(CHARACTER_PREFIX.length) : null,
        playerColour: g.playerColour,
        result,
        sans: replay(g.moves.slice(0, 20)).history(),
        reviewed: analysed ? reviewMoves(g.moves, saved.evals!) : undefined,
      },
    ]
  } catch {
    return []
  }
}

/** The kinds of error in each analysed game, newest first. */
export function errorKindsByGame(archived: readonly ArchivedGame[]): ErrorKind[][] {
  return [...archived]
    .sort((a, b) => b.finishedAt - a.finishedAt)
    .flatMap((saved) => {
      try {
        if (!saved.evals || saved.evals.length !== saved.moves.length + 1 || saved.moves.length < 16) return []
        return [gameErrorKinds(saved.moves, saved.evals, saved.playerColour)]
      } catch {
        return []
      }
    })
}

/** Your blunders in each analysed game, newest first (for how closely Pemberton watches). */
export function blundersByGame(archived: readonly ArchivedGame[]): number[] {
  return [...archived]
    .sort((a, b) => b.finishedAt - a.finishedAt)
    .flatMap((saved) => {
      try {
        if (!saved.evals || saved.evals.length !== saved.moves.length + 1 || saved.moves.length < 16) return []
        return [reviewMoves(saved.moves, saved.evals).filter((m) => m.mover === saved.playerColour && m.rating === 'blunder').length]
      } catch {
        return []
      }
    })
}
