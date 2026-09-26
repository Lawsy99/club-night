// React hook: the rating of the player's most recent move, worked out in the
// background after it's played. Shown in every stage (Joseph's decision,
// Sep 2026), so it never delays the move itself.
import { Chess } from 'chess.js'
import { useEffect, useMemo, useState } from 'react'
import { flipScore, toCentipawns, winChance } from '../logic/evaluation'
import { applyUci, getOutcome, replay, type Colour } from '../logic/game'
import { rateMove, type MoveRating } from '../logic/moveRating'
import { analysePosition } from './analysis'

export type RatedMove = {
  san: string
  rating: MoveRating
  /** The move played (UCI) and the position before it, to show a better move. */
  played: string
  fenBefore: string
  /** The engine's choice in that position, if it differed from the move played. */
  betterMove: string | null
  betterSan: string | null
  /** The player's winning chances (0–1) after the move, when analysed. */
  winAfter: number | null
  /** For the coach's comments: the opponent's best reply, and the scores (player's view, centipawns). */
  reply: string | null
  cpBefore: number | null
  cpAfter: number | null
}

export function useMoveRating(moves: readonly string[], playerColour: Colour): RatedMove | null {
  // The player's latest move: moves alternate, White first.
  const index = useMemo(() => {
    for (let i = moves.length - 1; i >= 0; i--) {
      if ((i % 2 === 0 ? 'w' : 'b') === playerColour) return i
    }
    return -1
  }, [moves, playerColour])
  const key = index === -1 ? null : moves.slice(0, index + 1).join(' ')

  const [result, setResult] = useState<{ key: string; rated: RatedMove } | null>(null)

  useEffect(() => {
    if (key === null) return
    let cancelled = false
    const before = replay(moves.slice(0, index))
    const after = replay(moves.slice(0, index + 1))
    const played = moves[index]
    const san = after.history().at(-1) ?? played

    const fenBefore = before.fen()
    const finish = (
      rating: MoveRating | null,
      betterMove: string | null = null,
      winAfter: number | null = null,
      extra: { reply: string | null; cpBefore: number | null; cpAfter: number | null } = {
        reply: null,
        cpBefore: null,
        cpAfter: null,
      },
    ) => {
      if (cancelled || !rating) return
      const betterSan = betterMove ? (applyUci(new Chess(fenBefore), betterMove)?.san ?? null) : null
      setResult({ key, rated: { san, rating, played, fenBefore, betterMove, betterSan, winAfter, ...extra } })
    }

    const outcome = getOutcome(after)
    if (outcome) {
      // Nothing to analyse after the game ends: delivering mate is best;
      // other endings (e.g. stalemate) aren't rated.
      finish(outcome.reason === 'checkmate' ? 'best' : null, null, outcome.reason === 'checkmate' ? 1 : null)
    } else {
      Promise.all([analysePosition(fenBefore), analysePosition(after.fen())])
        .then(([b, a]) => {
          if (!b || !a) return finish(null)
          const mine = flipScore(a.score) // back to the player's point of view
          const rating = rateMove({ bestBefore: b.score, after: mine, playedBestMove: b.bestMove === played })
          finish(rating, b.bestMove && b.bestMove !== played ? b.bestMove : null, winChance(mine), {
            reply: a.bestMove,
            cpBefore: toCentipawns(b.score),
            cpAfter: toCentipawns(mine),
          })
        })
        .catch(() => finish(null))
    }
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- key captures moves and index
  }, [key])

  return result && result.key === key ? result.rated : null
}
