// Puzzles from the Lichess puzzle database (public domain), and the rules for
// solving them. In Lichess's format the first move is the opponent's; the
// player then finds every other move, with the opponent's replies in between.
import { Chess } from 'chess.js'
import { applyUci } from './game'
import { rateGame, type PlayerRating } from './glicko2'

export type Puzzle = {
  id: string
  fen: string
  /** Moves in UCI: [opponent's setup move, player, reply, player, …]. */
  moves: string[]
  rating: number
  themes: string[]
  /** Opening family (e.g. "london"), or "" if none. */
  opening: string
}

/** The compact rows written by scripts/buildPuzzles.mjs. */
export type PuzzleRow = [string, string, string, number, string, string]

export function parsePuzzle([id, fen, moves, rating, themes, opening]: PuzzleRow): Puzzle {
  return { id, fen, moves: moves.split(' '), rating, themes: themes ? themes.split(' ') : [], opening }
}

export type PuzzleFilter = {
  themes?: string[]
  openings?: string[]
  /** Require both a matching opening AND a matching theme (falls back to the opening alone if too few). */
  both?: boolean
  /** Aim for puzzles near this rating. */
  rating: number
  count: number
  /** Puzzles already seen, to avoid repeats. */
  exclude?: ReadonlySet<string>
}

/**
 * Picks puzzles matching a theme or opening, as close to the target rating
 * as possible (the window widens until there are enough).
 */
export function pickPuzzles(all: readonly Puzzle[], f: PuzzleFilter, random: () => number = Math.random): Puzzle[] {
  const themeOk = (p: Puzzle) => f.themes?.some((t) => p.themes.includes(t)) ?? false
  const openingOk = (p: Puzzle) => f.openings?.includes(p.opening) ?? false
  const unseen = all.filter((p) => !f.exclude?.has(p.id))
  let matches = f.both
    ? unseen.filter((p) => themeOk(p) && openingOk(p))
    : unseen.filter((p) => (!f.themes && !f.openings) || themeOk(p) || openingOk(p))
  if (f.both && matches.length < f.count) matches = unseen.filter(openingOk)
  for (const window of [100, 200, 350, 600, 3000]) {
    const near = matches.filter((p) => Math.abs(p.rating - f.rating) <= window)
    if (near.length >= f.count) return shuffle(near, random).slice(0, f.count)
  }
  return shuffle(matches, random).slice(0, f.count)
}

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Whose turn it is to solve: the side that did NOT make the setup move. */
export function solverColour(p: Puzzle): 'w' | 'b' {
  return new Chess(p.fen).turn() === 'w' ? 'b' : 'w'
}

/** The position the player first sees (after the opponent's setup move). */
export function startPosition(p: Puzzle): string {
  const chess = new Chess(p.fen)
  applyUci(chess, p.moves[0])
  return chess.fen()
}

/**
 * Checks the player's move at `step` (an index into `moves`, always odd).
 * Any move that mates is also accepted, as on Lichess, since some puzzles
 * have more than one mate.
 */
export function isCorrect(p: Puzzle, fenBefore: string, step: number, uci: string): boolean {
  if (uci === p.moves[step]) return true
  const chess = new Chess(fenBefore)
  return applyUci(chess, uci) !== null && chess.isCheckmate()
}

/** The puzzle rating after an attempt: solved cleanly counts as a win. */
export function ratePuzzle(player: PlayerRating, puzzleRating: number, solvedCleanly: boolean): PlayerRating {
  return rateGame(player, puzzleRating, solvedCleanly ? 1 : 0, 80)
}
