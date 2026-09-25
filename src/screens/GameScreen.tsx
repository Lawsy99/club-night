// The game screen: board, status, and whatever help the stage allows.
// Opponent is plain Stockfish for Phase 1; characters arrive in Phase 3.
import { useEffect, useMemo, useRef, useState } from 'react'
import { BUILD_LABEL } from '../buildInfo'
import { Board, type BoardArrow } from '../components/Board'
import { BlunderWarning } from '../components/BlunderWarning'
import { EvalBar } from '../components/EvalBar'
import { HINT_ARROW_COLOUR, lineArrows } from '../components/lineArrows'
import { HELP_STAGES } from '../data/helpStages'
import { TEST_OPPONENT_LEVELS } from '../data/testOpponents'
import { analysePosition } from '../engine/analysis'
import { chooseTestOpponentMove } from '../engine/testOpponent'
import { useAnalysis } from '../engine/useAnalysis'
import { useMoveRating } from '../engine/useMoveRating'
import { assessMove, describeBlunder } from '../logic/blunder'
import { flipScore, formatScore, scoreFor } from '../logic/evaluation'
import { describeOutcome, getOutcome, replay, type GameOutcome } from '../logic/game'
import { RATING_GLYPHS, RATING_LABELS } from '../logic/moveRating'
import {
  canTakeBack,
  outcomeOf,
  takebacksLeft,
  withMove,
  withResignation,
  withTakeback,
  type GameRecord,
} from '../logic/gameRecord'
import '../components/ratings.css'
import './GameScreen.css'

type Props = {
  game: GameRecord
  setGame: React.Dispatch<React.SetStateAction<GameRecord | null>>
  /** Games end with a review, which the player may skip. */
  onReview: () => void
  onSkipReview: () => void
}

/** A move the player has dropped but not yet confirmed (blunder check). */
type PendingMove = { uci: string; fenAfter: string; warning: string | null }

export function GameScreen({ game, setGame, onReview, onSkipReview }: Props) {
  const stage = HELP_STAGES[game.stage]
  const level = TEST_OPPONENT_LEVELS.find((l) => l.id === game.levelId) ?? TEST_OPPONENT_LEVELS[0]
  const [engineError, setEngineError] = useState<string | null>(null)
  const [pending, setPending] = useState<PendingMove | null>(null)
  const [hint, setHint] = useState<{ fen: string; step: 1 | 2 } | null>(null)
  const [showBestLine, setShowBestLine] = useState(false)
  const checkToken = useRef(0)

  // Everything on screen is derived from the saved game.
  const chess = useMemo(() => replay(game.moves), [game.moves])
  const fen = chess.fen()
  const outcome = outcomeOf(game)
  const last = chess.history({ verbose: true }).at(-1)
  const playersTurn = !outcome && chess.turn() === game.playerColour
  const opponentToMove = !outcome && !playersTurn

  // Engine analysis of the current position. On the player's turn it always
  // runs quietly in the background, so their move can be rated straight
  // away; on the opponent's turn only the evaluation bar needs it.
  const wantsAnalysis = !outcome && (playersTurn || stage.evalBar)
  const analysis = useAnalysis(fen, wantsAnalysis)
  const ratedMove = useMoveRating(game.moves, game.playerColour)

  const commitMove = (uci: string) => setGame((g) => (g ? withMove(g, uci) : g))

  // When it's the opponent's turn (including straight after resuming),
  // ask the engine, in the background, for a move.
  useEffect(() => {
    if (!opponentToMove) return
    let cancelled = false // set if the game changes before the engine replies
    chooseTestOpponentMove(fen, level)
      .then((move) => {
        if (!cancelled && move) commitMove(move)
      })
      .catch((err: Error) => setEngineError(err.message))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- commitMove only uses setGame
  }, [opponentToMove, fen, level])

  /** The player dropped a piece: check it for a blunder if the stage says so. */
  function handlePlayerMove(uci: string) {
    const rule = stage.blunderWarning
    const chessAfter = replay([...game.moves, uci])
    // No warning in Real, or when the move ends the game.
    if (!rule || getOutcome(chessAfter)) {
      commitMove(uci)
      return
    }
    const token = ++checkToken.current
    const fenAfter = chessAfter.fen()
    setPending({ uci, fenAfter, warning: null })

    const finish = (warning: string | null) => {
      if (token !== checkToken.current) return // superseded
      if (warning) {
        setPending({ uci, fenAfter, warning })
      } else {
        setPending(null)
        commitMove(uci)
      }
    }
    Promise.all([analysePosition(fen), analysePosition(fenAfter)])
      .then(([before, after]) => {
        if (!before || !after) return finish(null)
        // Both scores from the player's point of view.
        const kind = assessMove({ bestBefore: before.score, after: flipScore(after.score) }, rule)
        finish(kind ? describeBlunder(kind, fenAfter, after.bestMove) : null)
      })
      // If the engine fails, never block the player's move.
      .catch(() => finish(null))
  }

  function resolveWarning(playIt: boolean) {
    if (pending && playIt) commitMove(pending.uci)
    // Taking it back here is free: it doesn't use up a takeback.
    setPending(null)
    setHint(null)
  }

  // A hint belongs to one position, and disappears once a move is made.
  const hintStep = hint?.fen === fen && !pending ? hint.step : 0
  const hintMove = playersTurn ? analysis.current?.bestMove ?? null : null

  const bestLineShown = showBestLine && stage.bestLine && !outcome && !pending
  const bestLine =
    bestLineShown && analysis.current
      ? lineArrows(analysis.current.pv, analysis.current.sideToMove, game.playerColour)
      : null
  const arrows: BoardArrow[] = [
    ...(bestLine?.arrows ?? []),
    ...(hintStep === 2 && hintMove
      ? [{ from: hintMove.slice(0, 2), to: hintMove.slice(2, 4), colour: HINT_ARROW_COLOUR }]
      : []),
  ]

  const status = engineError
    ? engineError
    : outcome
      ? `${describeOutcome(outcome)} ${resultForPlayer(outcome, game)}`
      : pending && !pending.warning
        ? 'Checking your move…'
        : opponentToMove
          ? 'Thinking…'
          : `Your move${chess.inCheck() ? ' · check' : ''}`

  const stageLabel =
    stage.takebacks > 0 && Number.isFinite(stage.takebacks)
      ? `${stage.label} · ${takebacksLeft(game)} takeback${takebacksLeft(game) === 1 ? '' : 's'} left`
      : `${stage.label} · ${stage.summary}`

  const pendingLast = pending ? { from: pending.uci.slice(0, 2), to: pending.uci.slice(2, 4) } : null

  return (
    <main className="game-screen">
      <header className="game-header">
        <h1>Test game vs Stockfish · {level.label}</h1>
        <p className="stage-label">
          {stageLabel} · you play {game.playerColour === 'w' ? 'White' : 'Black'}
        </p>
      </header>

      <p className={outcome ? 'game-status game-over' : 'game-status'}>{status}</p>

      <div className="board-row">
        {stage.evalBar && <EvalBar analysis={analysis.latest} playerColour={game.playerColour} />}
        <div className="board-cell">
          <Board
            fen={pending ? pending.fenAfter : fen}
            orientation={game.playerColour === 'w' ? 'white' : 'black'}
            movableColour={outcome || pending ? null : game.playerColour}
            lastMove={pendingLast ?? (last ? { from: last.from, to: last.to } : null)}
            onMove={handlePlayerMove}
            hintSquare={hintStep === 1 && hintMove ? hintMove.slice(0, 2) : null}
            arrows={arrows}
            badges={bestLine?.badges}
          />
          {pending?.warning && (
            <BlunderWarning
              message={pending.warning}
              onPlayAnyway={() => resolveWarning(true)}
              onTakeBack={() => resolveWarning(false)}
            />
          )}
        </div>
      </div>

      <div className="move-info">
        <span className="last-move">
          {last ? `Last move: ${last.san}` : 'Tap a piece, then a square. Or drag.'}
        </span>
        {ratedMove && (
          <span className={`move-rating rating-${ratedMove.rating}`}>
            {ratedMove.san}
            {RATING_GLYPHS[ratedMove.rating]} · {RATING_LABELS[ratedMove.rating]}
          </span>
        )}
      </div>

      {bestLineShown && (
        <p className="best-line">
          {analysis.current ? (
            <>
              Best line · {formatScore(scoreFor(game.playerColour, analysis.current.sideToMove, analysis.current.score))} for you
              <span className="best-line-key">
                <i className="key-yours" /> you <i className="key-theirs" /> them
              </span>
            </>
          ) : (
            'Working out the best line…'
          )}
        </p>
      )}

      {!outcome && (stage.hints || stage.takebacks > 0 || stage.bestLine) && (
        <div className="game-actions help-actions">
          {stage.hints && (
            <button
              type="button"
              disabled={!hintMove || hintStep === 2 || pending !== null}
              onClick={() => setHint({ fen, step: hintStep === 0 ? 1 : 2 })}
            >
              {hintStep === 0 ? 'Hint' : 'Show move'}
            </button>
          )}
          {stage.takebacks > 0 && (
            <button
              type="button"
              disabled={!canTakeBack(game) || pending !== null}
              onClick={() => setGame((g) => (g ? withTakeback(g) : g))}
            >
              Take back
            </button>
          )}
          {stage.bestLine && (
            <button
              type="button"
              className={showBestLine ? 'active' : undefined}
              onClick={() => setShowBestLine((s) => !s)}
            >
              Best line
            </button>
          )}
        </div>
      )}

      <div className="game-actions">
        {outcome ? (
          <>
            <button type="button" className="primary" onClick={onReview}>
              Review game
            </button>
            <button type="button" onClick={onSkipReview}>
              Skip review
            </button>
          </>
        ) : (
          <ResignButton onResign={() => setGame((g) => (g ? withResignation(g, g.playerColour) : g))} />
        )}
      </div>

      <p className="build-stamp">Version: {BUILD_LABEL}</p>
    </main>
  )
}

function resultForPlayer(outcome: GameOutcome, game: GameRecord): string {
  if (outcome.winner === null) return 'Draws are replayed.'
  return outcome.winner === game.playerColour ? 'You won.' : 'You lost.'
}

/** Two taps to resign, so a stray tap can't end the game. */
function ResignButton({ onResign }: { onResign: () => void }) {
  const [armed, setArmed] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  function handleClick() {
    if (armed) {
      window.clearTimeout(timer.current)
      onResign()
      return
    }
    setArmed(true)
    // Quietly disarm if the second tap doesn't come.
    timer.current = window.setTimeout(() => setArmed(false), 3000)
  }

  return (
    <button type="button" className={armed ? 'danger' : undefined} onClick={handleClick}>
      {armed ? 'Tap again to resign' : 'Resign'}
    </button>
  )
}
