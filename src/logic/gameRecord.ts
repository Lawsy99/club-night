// A game as it is saved to the device: everything needed to resume it
// exactly. Pure functions only; saving itself lives in src/storage.
import { HELP_STAGES, type HelpStageId } from '../data/helpStages'
import { applyUci, getOutcome, replay, type Colour, type GameOutcome } from './game'

export type GameRecord = {
  id: string
  /** Moves so far, in UCI form. The position is rebuilt from these. */
  moves: string[]
  playerColour: Colour
  /** Who the opponent is: a practice level id, or "char:<id>" for a character. */
  levelId: string
  /** The opponent's rating when the game began (fixed for the whole game). */
  opponentRating?: number
  stage: HelpStageId
  takebacksUsed: number
  startedAt: number
  /** Set when the game ends in a way the board can't show (resignation). */
  resignedBy?: Colour
}

export function newGameRecord(
  playerColour: Colour,
  levelId: string,
  stage: HelpStageId,
  opponentRating?: number,
): GameRecord {
  return {
    id: crypto.randomUUID(),
    moves: [],
    playerColour,
    levelId,
    opponentRating,
    stage,
    takebacksUsed: 0,
    startedAt: Date.now(),
  }
}

/** Fills in fields added after a game was saved by an older version. */
export function upgradeGameRecord(saved: GameRecord): GameRecord {
  return { ...saved, stage: saved.stage ?? 'real', takebacksUsed: saved.takebacksUsed ?? 0 }
}

/** The game with one more move, or the same game if the move is illegal or it's over. */
export function withMove(game: GameRecord, uci: string): GameRecord {
  if (outcomeOf(game)) return game
  const chess = replay(game.moves)
  if (!applyUci(chess, uci)) return game
  return { ...game, moves: [...game.moves, uci] }
}

export function withResignation(game: GameRecord, by: Colour): GameRecord {
  if (outcomeOf(game)) return game
  return { ...game, resignedBy: by }
}

/** Whose move number `index` was (moves alternate, White first). */
function moverOf(index: number): Colour {
  return index % 2 === 0 ? 'w' : 'b'
}

export function takebacksLeft(game: GameRecord): number {
  return Math.max(0, HELP_STAGES[game.stage].takebacks - game.takebacksUsed)
}

export function canTakeBack(game: GameRecord): boolean {
  return (
    !outcomeOf(game) &&
    takebacksLeft(game) > 0 &&
    game.moves.some((_, i) => moverOf(i) === game.playerColour)
  )
}

/**
 * Undoes the player's last move, and the opponent's reply if there was one,
 * so it's the player's turn again. Uses up one takeback.
 */
export function withTakeback(game: GameRecord): GameRecord {
  if (!canTakeBack(game)) return game
  const moves = [...game.moves]
  // Pop moves until we've removed one of the player's.
  while (moves.length > 0) {
    const removedBy = moverOf(moves.length - 1)
    moves.pop()
    if (removedBy === game.playerColour) break
  }
  return { ...game, moves, takebacksUsed: game.takebacksUsed + 1 }
}

/** How the game ended (on the board or by resignation), or null if still going. */
export function outcomeOf(game: GameRecord): GameOutcome | null {
  if (game.resignedBy) {
    return { winner: opposite(game.resignedBy), reason: 'resignation' }
  }
  return getOutcome(replay(game.moves))
}

/**
 * Colours alternate from game to game across the whole app, and a replayed
 * draw counts as a new game, so it swaps too.
 */
export function nextPlayerColour(previous: GameRecord | null): Colour {
  return previous ? opposite(previous.playerColour) : 'w'
}

export function opposite(colour: Colour): Colour {
  return colour === 'w' ? 'b' : 'w'
}
