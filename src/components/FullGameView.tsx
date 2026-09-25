// The optional full-game view at the end of the review: step through every
// move, with the evaluation graph and a tappable move list (the list is also
// the text version of the graph).
import { useMemo, useState } from 'react'
import { formatCp, winChance } from '../logic/evaluation'
import { replay, type Colour } from '../logic/game'
import { RATING_GLYPHS, RATING_LABELS } from '../logic/moveRating'
import type { PositionEval, ReviewedMove } from '../logic/review'
import { Board } from './Board'
import { EvalGraph } from './EvalGraph'
import './FullGameView.css'
import './ratings.css'

type Props = {
  moves: readonly string[]
  evals: readonly PositionEval[]
  reviewed: readonly ReviewedMove[]
  playerColour: Colour
  onBack: () => void
}

const isError = (m: ReviewedMove) => ['inaccuracy', 'mistake', 'blunder'].includes(m.rating)

export function FullGameView({ moves, evals, reviewed, playerColour, onBack }: Props) {
  // Position index: 0 = start, i = after the i-th move.
  const [index, setIndex] = useState(0)
  const last = moves.length
  const fen = useMemo(() => replay(moves.slice(0, index)).fen(), [moves, index])
  const move = index > 0 ? reviewed[index - 1] : null
  const forPlayer = (cp: number) => (playerColour === 'w' ? cp : -cp)

  const points = useMemo(
    () => evals.map((e) => winChance({ type: 'cp', value: forPlayer(e.cp) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- forPlayer depends only on playerColour
    [evals, playerColour],
  )
  const markers = reviewed
    .filter((m) => m.mover === playerColour && isError(m))
    .map((m) => ({ index: m.ply + 1, rating: m.rating }))

  const step = (to: number) => setIndex(Math.max(0, Math.min(last, to)))

  return (
    <main className="full-game">
      <header>
        <button type="button" className="back" onClick={onBack}>
          ‹ Back
        </button>
        <h1>Full game</h1>
      </header>

      <Board
        fen={fen}
        orientation={playerColour === 'w' ? 'white' : 'black'}
        movableColour={null}
        lastMove={move ? { from: move.uci.slice(0, 2), to: move.uci.slice(2, 4) } : null}
        onMove={() => {}}
      />

      <p className="full-game-info">
        {move ? (
          <>
            <strong>
              {moveNumber(move)} {move.san}
              {RATING_GLYPHS[move.rating]}
            </strong>
            {move.mover === playerColour && (
              <span className={`info-pill rating-${move.rating}`}>{RATING_LABELS[move.rating]}</span>
            )}
          </>
        ) : (
          <strong>Starting position</strong>
        )}
        <span className="info-eval">{formatCp(forPlayer(evals[index].cp))} for you</span>
      </p>

      <div className="full-game-controls">
        <button type="button" aria-label="Start" onClick={() => step(0)} disabled={index === 0}>
          ⏮
        </button>
        <button type="button" aria-label="Previous move" onClick={() => step(index - 1)} disabled={index === 0}>
          ◀
        </button>
        <button type="button" aria-label="Next move" onClick={() => step(index + 1)} disabled={index === last}>
          ▶
        </button>
        <button type="button" aria-label="End" onClick={() => step(last)} disabled={index === last}>
          ⏭
        </button>
      </div>

      <EvalGraph points={points} markers={markers} current={index} onSelect={step} />

      <ol className="move-list">
        {reviewed.map((m) => {
          const mine = m.mover === playerColour
          return (
            <li key={m.ply}>
              <button
                type="button"
                className={[index === m.ply + 1 ? 'current' : '', mine && isError(m) ? `rating-${m.rating} flagged` : '']
                  .join(' ')
                  .trim()}
                onClick={() => step(m.ply + 1)}
              >
                {m.mover === 'w' && <span className="num">{Math.floor(m.ply / 2) + 1}.</span>}
                {m.san}
                {mine ? RATING_GLYPHS[m.rating] : ''}
              </button>
            </li>
          )
        })}
      </ol>
    </main>
  )
}

function moveNumber(m: ReviewedMove): string {
  const n = Math.floor(m.ply / 2) + 1
  return m.mover === 'w' ? `${n}.` : `${n}…`
}
