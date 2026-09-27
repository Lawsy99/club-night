// Making lessons personal (Joseph, Sep 2026): why each puzzle's answer
// works, and an example of the week's theme from the player's own games.
import { Chess } from 'chess.js'
import { explainBestMove, explainMistake } from './explain'
import { applyUci, type Colour } from './game'
import { findTactic, followLine, type Tactic } from './lineFacts'
import { withLeadUp } from './mistakeCards'
import type { Moment } from './moment'
import { startPosition, type Puzzle } from './puzzles'
import type { PositionEval } from './review'

const MATE_THEMES = ['mateIn1', 'mateIn2', 'mateIn3', 'backRankMate', 'smotheredMate']

/** Why the puzzle's first move works, in Pemberton's plain words: the whole solution is the line. */
export function puzzleExplanation(p: Puzzle): string {
  const fen = startPosition(p)
  const key = p.moves[1]
  if (!key) return ''
  const mate = p.themes.some((t) => MATE_THEMES.includes(t) || t === 'mate')
  return explainBestMove(fen, key, mate ? 99999 : 500, undefined, p.moves.slice(1))
}

/** Which lesson theme each proven tactic shows. */
const THEME_OF_TACTIC: Record<Tactic['kind'], string> = {
  fork: 'fork',
  undefended: 'hangingPiece',
  pin: 'pin',
  skewer: 'skewer',
  discovered: 'discoveredAttack',
  defender: 'capturingDefender',
}

/**
 * Does the best move in this position show the theme? Only if the engine's
 * line proves it (a fork whose target falls, a mate that happens).
 */
export function showsTheme(fen: string, best: string, cp: number, themes: readonly string[], line?: readonly string[]): boolean {
  const out = followLine(fen, line?.[0] === best ? line : [best], 12)
  if (themes.some((t) => MATE_THEMES.includes(t)) && (out.mates || cp >= 9000)) return true
  const found = findTactic(out)
  return !!found && found.index === 0 && themes.includes(THEME_OF_TACTIC[found.tactic.kind])
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
        if ((missed || g.moves[ply] === best) && showsTheme(fen, best, cpBefore, themes, g.evals[ply].pv)) {
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
              ...(g.evals[ply].pv ? { bestLine: g.evals[ply].pv } : {}),
              explanation: explainMistake({
                fenBefore: fen,
                played,
                bestMove: best,
                reply: g.evals[ply + 1].bestMove,
                cpBefore,
                cpAfter,
                replyLine: g.evals[ply + 1].pv,
                bestLine: g.evals[ply].pv,
              }),
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
