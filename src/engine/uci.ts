// Parsing Stockfish's text output (the "UCI" protocol). Pure functions, so
// they can be tested without running the engine.

/** An engine score, from the point of view of the side to move. */
export type Score = { type: 'cp'; value: number } | { type: 'mate'; value: number }

export type PvLine = {
  /** 1 = best line, 2 = second best, … */
  rank: number
  depth: number
  score: Score
  /** Moves in UCI form, starting with the move to play now. */
  pv: string[]
}

/**
 * Reads an "info … score … pv …" line. Returns null for info lines without
 * a scored principal variation (e.g. "info string …" or currmove updates).
 */
export function parseInfoLine(line: string): PvLine | null {
  if (!line.startsWith('info ') || !line.includes(' pv ')) return null
  const words = line.split(' ')
  // "upperbound"/"lowerbound" lines are provisional mid-search guesses, often
  // with a cut-short line; only exact results are worth keeping.
  if (words.includes('upperbound') || words.includes('lowerbound')) return null
  const get = (key: string) => {
    const i = words.indexOf(key)
    return i === -1 ? undefined : words[i + 1]
  }

  const scoreIndex = words.indexOf('score')
  if (scoreIndex === -1) return null
  const scoreType = words[scoreIndex + 1]
  const scoreValue = Number(words[scoreIndex + 2])
  if ((scoreType !== 'cp' && scoreType !== 'mate') || Number.isNaN(scoreValue)) return null

  return {
    rank: Number(get('multipv') ?? 1),
    depth: Number(get('depth') ?? 0),
    score: { type: scoreType, value: scoreValue },
    pv: words.slice(words.indexOf('pv') + 1),
  }
}

/** Reads "bestmove e2e4 ponder e7e5". Returns the move, or null if none. */
export function parseBestMove(line: string): string | null | undefined {
  if (!line.startsWith('bestmove')) return undefined
  const move = line.split(' ')[1]
  // Stockfish says "bestmove (none)" when there are no legal moves.
  return move && move !== '(none)' ? move : null
}
