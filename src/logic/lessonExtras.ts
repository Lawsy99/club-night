// Making lessons personal (Joseph, Sep 2026): why each puzzle's answer
// works, and an example of the week's theme from the player's own games.
import { Chess } from 'chess.js'
import { explainBestMove, explainMistake } from './explain'
import { applyUci, type Colour } from './game'
import { withLeadUp } from './mistakeCards'
import type { Moment } from './moment'
import { moveIdeas } from './moveIdeas'
import { startPosition, type Puzzle } from './puzzles'
import type { PositionEval } from './review'

const MATE_THEMES = ['mateIn1', 'mateIn2', 'mateIn3', 'backRankMate', 'smotheredMate']
const PIECE_NAMES: Record<string, string> = { n: 'knight', b: 'bishop', r: 'rook', q: 'queen' }

/** Why the puzzle's first move works, in Pemberton's plain words. */
export function puzzleExplanation(p: Puzzle): string {
  const fen = startPosition(p)
  const key = p.moves[1]
  if (!key) return ''
  const mate = p.themes.some((t) => MATE_THEMES.includes(t) || t === 'mate')
  const first = explainBestMove(fen, key, mate ? 99999 : 500)
  // A longer solution: say how it finishes (mate, or what's won at the end).
  if (p.moves.length > 3) {
    const chess = new Chess(fen)
    for (const m of p.moves.slice(1, -1)) applyUci(chess, m)
    const last = applyUci(chess, p.moves.at(-1)!)
    if (last && chess.isCheckmate()) return `${first} ${last.san} finishes it.`
    if (last?.captured && ['n', 'b', 'r', 'q'].includes(last.captured) && !first.includes('wins')) {
      return `${first} Then ${last.san} wins their ${PIECE_NAMES[last.captured]}.`
    }
  }
  return first
}

/** Does the best move in this position show the theme? (Only themes the board checks can see.) */
export function showsTheme(fen: string, best: string, cp: number, themes: readonly string[]): boolean {
  const said = explainBestMove(fen, best, cp)
  if (themes.includes('fork') && said.includes('is a fork')) return true
  if (themes.includes('hangingPiece') && said.includes('outright')) return true
  if (themes.some((t) => MATE_THEMES.includes(t)) && /checkmate/.test(said)) return true
  if (themes.includes('pin') && moveIdeas(fen, best, cp).some((i) => i.startsWith('pins'))) return true
  if (themes.includes('skewer') && said.includes('is a skewer')) return true
  if (themes.includes('discoveredAttack') && said.includes('discovered attack')) return true
  return false
}

export type OwnGame = {
  id: string
  moves: readonly string[]
  evals?: readonly PositionEval[]
  playerColour: Colour
  opponentName: string
  finishedAt: number
}

export type OwnExample = { moment: Moment; opponentName: string; finishedAt: number; missed: boolean }

/**
 * A position from your own games where the best move was an example of the
 * theme, newest first, preferring ones you missed (those teach the most).
 */
export function findOwnExample(games: readonly OwnGame[], themes: readonly string[]): OwnExample | null {
  let found: OwnExample | null = null
  for (const g of games) {
    if (!g.evals || g.evals.length !== g.moves.length + 1) continue
    const forPlayer = (cp: number) => (g.playerColour === 'w' ? cp : -cp)
    const chess = new Chess()
    for (let ply = 0; ply < g.moves.length; ply++) {
      const mover: Colour = ply % 2 === 0 ? 'w' : 'b'
      const fen = chess.fen()
      const best = g.evals[ply].bestMove
      if (mover === g.playerColour && best) {
        const cpBefore = forPlayer(g.evals[ply].cp)
        const cpAfter = forPlayer(g.evals[ply + 1].cp)
        const missed = g.moves[ply] !== best && cpBefore - cpAfter >= 100
        if ((missed || g.moves[ply] === best) && showsTheme(fen, best, cpBefore, themes)) {
          const played = g.moves[ply]
          const playedSan = new Chess(fen).move({ from: played.slice(0, 2), to: played.slice(2, 4), promotion: played[4] })?.san ?? played
          const moment = withLeadUp<Moment>(
            {
              fenBefore: fen,
              playerColour: g.playerColour,
              played,
              playedSan,
              bestMove: best,
              bestCp: cpBefore,
              explanation: explainMistake({ fenBefore: fen, played, bestMove: best, reply: g.evals[ply + 1].bestMove, cpBefore, cpAfter }),
              kind: missed ? 'missed' : 'mistake',
            },
            g.moves,
            ply,
          )
          const example = { moment, opponentName: g.opponentName, finishedAt: g.finishedAt, missed }
          if (missed) return example
          found ??= example
        }
      }
      applyUci(chess, g.moves[ply])
    }
  }
  return found
}
