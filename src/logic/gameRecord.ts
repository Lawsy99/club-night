// A game as it is saved to the device: everything needed to resume it
// exactly. Pure functions only; saving itself lives in src/storage.
import { applyUci, getOutcome, replay, type Colour, type GameOutcome } from './game'

export type GameRecord = {
  id: string
  /** Moves so far, in UCI form. The position is rebuilt from these. */
  moves: string[]
  playerColour: Colour
  /** Test opponent strength (Phase 1 only; characters replace it in Phase 3). */
  levelId: string
  startedAt: number
  /** Set when the game ends in a way the board can't show (resignation). */
  resignedBy?: Colour
}

export function newGameRecord(playerColour: Colour, levelId: string): GameRecord {
  return {
    id: crypto.randomUUID(),
    moves: [],
    playerColour,
    levelId,
    startedAt: Date.now(),
  }
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
