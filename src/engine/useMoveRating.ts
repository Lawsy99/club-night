// React hook: the rating of the player's most recent move, worked out in the
// background after it's played. Shown in every stage (Joseph's decision,
// Sep 2026), so it never delays the move itself.
import { useEffect, useMemo, useState } from 'react'
import { flipScore } from '../logic/evaluation'
import { getOutcome, replay, type Colour } from '../logic/game'
import { rateMove, type MoveRating } from '../logic/moveRating'
import { analysePosition } from './analysis'

export type RatedMove = { san: string; rating: MoveRating }

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

    const finish = (rating: MoveRating | null) => {
      if (!cancelled && rating) setResult({ key, rated: { san, rating } })
    }

    const outcome = getOutcome(after)
    if (outcome) {
      // Nothing to analyse after the game ends: delivering mate is best;
      // other endings (e.g. stalemate) aren't rated.
      finish(outcome.reason === 'checkmate' ? 'best' : null)
    } else {
      Promise.all([analysePosition(before.fen()), analysePosition(after.fen())])
        .then(([b, a]) => {
          if (!b || !a) return finish(null)
          finish(
            rateMove({
              bestBefore: b.score,
              after: flipScore(a.score), // back to the player's point of view
              playedBestMove: b.bestMove === played,
            }),
          )
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
