// Loads the puzzle set (public/puzzles/puzzles.json, built by
// scripts/buildPuzzles.mjs) once, the first time a puzzle is needed.
import { parsePuzzle, type Puzzle, type PuzzleRow } from '../logic/puzzles'

let bank: Promise<Puzzle[]> | null = null

export function loadPuzzleBank(): Promise<Puzzle[]> {
  bank ??= fetch(`${import.meta.env.BASE_URL}puzzles/puzzles.json`)
    .then((r) => {
      if (!r.ok) throw new Error(`Couldn't load puzzles (${r.status})`)
      return r.json() as Promise<PuzzleRow[]>
    })
    .then((rows) => rows.map(parsePuzzle))
    .catch((err) => {
      bank = null // allow a retry
      throw err
    })
  return bank
}
