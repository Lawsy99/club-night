// The game screen: opponent and player bars around the board, status, and
// whatever help the stage allows. The opponent is a club character or a
// practice level.
import { useEffect, useMemo, useRef, useState } from 'react'
import { BUILD_LABEL } from '../buildInfo'
import { Board, type BoardArrow } from '../components/Board'
import { BlunderWarning } from '../components/BlunderWarning'
import { EvalBar } from '../components/EvalBar'
import { HINT_ARROW_COLOUR, lineArrows } from '../components/lineArrows'
import { MoveStrip } from '../components/MoveStrip'
import { PlanPause } from '../components/PlanPause'
import { PlayerStrip } from '../components/PlayerStrip'
import { HELP_STAGES } from '../data/helpStages'
import { resolveOpponent } from '../data/opponents'
import { analysePosition } from '../engine/analysis'
import { getMaia, type MaiaStatus } from '../engine/maia/maia'
import { chooseOpponentMove } from '../engine/opponent'
import { useAnalysis } from '../engine/useAnalysis'
import { useMoveRating } from '../engine/useMoveRating'
import { useWakeLock } from './useWakeLock'
import { assessMove, describeBlunder } from '../logic/blunder'
import { flipScore, formatScore, scoreFor, toCentipawns } from '../logic/evaluation'
import { describeOutcome, getOutcome, replay, type GameOutcome } from '../logic/game'
import {
  canTakeBack,
  outcomeOf,
  takebacksLeft,
  withDrawAgreed,
  withMove,
  withOpponentEval,
  withResignation,
  withTakeback,
  type GameRecord,
} from '../logic/gameRecord'
import { acceptsDraw, piecesLeft, shouldOfferDraw, shouldResign } from '../logic/opponentDecisions'
import { planFor, shouldPausePlan } from '../logic/planPause'
import { RATING_GLYPHS, RATING_LABELS } from '../logic/moveRating'
import '../components/ratings.css'
import './GameScreen.css'

type Props = {
  game: GameRecord
  setGame: React.Dispatch<React.SetStateAction<GameRecord | null>>
  /** Games end with a review, which the player may skip. */
  onReview: () => void
  /** Skip the review and carry on (a draw: replay straight away). */
  onContinue: () => void
  /** The player's rating, shown in their name bar (none during trial night). */
  playerRating?: number
}

/** A move the player has dropped but not yet confirmed (blunder check). */
type PendingMove = { uci: string; fenAfter: string; warning: string | null }

/** Arrow colour for "the move you played" when showing a better one. */
const PLAYED_ARROW_COLOUR = 'rgba(208, 59, 59, 0.75)'

export function GameScreen({ game, setGame, onReview, onContinue, playerRating }: Props) {
  const stage = HELP_STAGES[game.stage]
  const opponent = resolveOpponent(game.levelId, game.opponentRating)
  const [engineError, setEngineError] = useState<string | null>(null)
  const [pending, setPending] = useState<PendingMove | null>(null)
  const [hint, setHint] = useState<{ fen: string; step: 1 | 2 } | null>(null)
  const [showBestLine, setShowBestLine] = useState(false)
  const [peekKey, setPeekKey] = useState<string | null>(null)
  const [maiaStatus, setMaiaStatus] = useState<MaiaStatus>({ state: 'idle' })
  const [maiaMs, setMaiaMs] = useState<number | null>(null)
  // The opponent's speech bubble: a draw offer, or their answer to the player's.
  const [bubble, setBubble] = useState<{ kind: 'offer' | 'declined' | 'thinking' } | null>(null)
  const [playerOfferMove, setPlayerOfferMove] = useState<number | null>(null)
  const checkToken = useRef(0)

  // Everything on screen is derived from the saved game.
  const chess = useMemo(() => replay(game.moves), [game.moves])
  const fen = chess.fen()
  const sans = useMemo(() => chess.history(), [chess])
  const outcome = outcomeOf(game)
  const last = chess.history({ verbose: true }).at(-1)
  const playersTurn = !outcome && chess.turn() === game.playerColour
  const opponentToMove = !outcome && !playersTurn
  const opponentColour = game.playerColour === 'w' ? 'b' : 'w'

  // Engine analysis of the current position. On the player's turn it always
  // runs quietly in the background, so their move can be rated straight
  // away; on the opponent's turn only the evaluation bar needs it.
  const wantsAnalysis = !outcome && (playersTurn || stage.evalBar)
  const analysis = useAnalysis(fen, wantsAnalysis)
  const ratedMove = useMoveRating(game.moves, game.playerColour)
  useWakeLock(!outcome)

  // Maia (800+) is a one-off download: show its progress while it arrives.
  useEffect(() => {
    if (opponent.engine !== 'maia') return
    const maia = getMaia()
    setMaiaStatus(maia.status)
    maia.load()
    return maia.onStatus(setMaiaStatus)
  }, [opponent.engine])

  const commitMove = (uci: string) => {
    // Playing on declines any offer on the table, as over the board.
    setBubble(null)
    setGame((g) => (g ? withMove(g, uci) : g))
  }

  // When it's the opponent's turn (including straight after resuming): it
  // weighs up the position (resigning if hopeless), moves, and may offer a draw.
  useEffect(() => {
    if (!opponentToMove) return
    let cancelled = false // set if the game changes before the engine replies
    ;(async () => {
      const view = await analysePosition(fen).catch(() => null)
      const cp = view ? toCentipawns(view.score) : 0 // the opponent's own point of view
      if (cancelled) return
      if (shouldResign(opponent.character, [...(game.opponentEvals ?? []), cp])) {
        setGame((g) => (g ? withResignation(g, opponentColour) : g))
        return
      }
      const { move, maiaMs: ms } = await chooseOpponentMove(fen, game.moves, opponent)
      if (cancelled || !move) return
      if (ms !== undefined) setMaiaMs(ms)
      const offer = shouldOfferDraw(opponent.character, {
        evalCp: cp,
        moveNumber: chess.moveNumber(),
        piecesLeft: piecesLeft(fen),
        lastOfferMove: game.opponentLastOfferMove,
      })
      setGame((g) => {
        if (!g) return g
        const next = withMove(withOpponentEval(g, cp), move)
        return offer ? { ...next, opponentLastOfferMove: chess.moveNumber() } : next
      })
      if (offer) setBubble({ kind: 'offer' })
    })().catch((err: Error) => setEngineError(err.message))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on the position and opponent
  }, [opponentToMove, fen, opponent.id, opponent.rating])

  // A refusal fades after a few seconds.
  useEffect(() => {
    if (bubble?.kind !== 'declined') return
    const timer = window.setTimeout(() => setBubble(null), 3500)
    return () => window.clearTimeout(timer)
  }, [bubble])

  /** The player offers a draw: the opponent accepts only if clearly worse. */
  async function offerDraw() {
    setBubble({ kind: 'thinking' })
    const view = await analysePosition(fen).catch(() => null)
    // Analysis is from the side to move; turn it into the opponent's view.
    const sideCp = view ? toCentipawns(view.score) : 0
    const opponentCp = chess.turn() === opponentColour ? sideCp : -sideCp
    if (acceptsDraw(opponent.character, opponentCp)) {
      setBubble(null)
      setGame((g) => (g ? withDrawAgreed(g) : g))
    } else {
      setBubble({ kind: 'declined' })
      setPlayerOfferMove(chess.moveNumber())
    }
  }

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

  // Assisted: after a weaker move, the player can look back at what was better.
  const canPeek =
    stage.id === 'assisted' &&
    ratedMove !== null &&
    ratedMove.betterMove !== null &&
    ['inaccuracy', 'mistake', 'blunder'].includes(ratedMove.rating)
  const peeking = canPeek && peekKey === ratedMove.fenBefore && !pending

  const bestLineShown = showBestLine && stage.bestLine && !outcome && !pending && !peeking
  const bestLine =
    bestLineShown && analysis.current
      ? lineArrows(analysis.current.pv, analysis.current.sideToMove, game.playerColour)
      : null
  const arrows: BoardArrow[] = peeking
    ? [
        { from: ratedMove.played.slice(0, 2), to: ratedMove.played.slice(2, 4), colour: PLAYED_ARROW_COLOUR },
        { from: ratedMove.betterMove!.slice(0, 2), to: ratedMove.betterMove!.slice(2, 4), colour: HINT_ARROW_COLOUR },
      ]
    : [
        ...(bestLine?.arrows ?? []),
        ...(hintStep === 2 && hintMove
          ? [{ from: hintMove.slice(0, 2), to: hintMove.slice(2, 4), colour: HINT_ARROW_COLOUR }]
          : []),
      ]

  const downloading = maiaStatus.state === 'downloading' && opponentToMove
  const status = engineError
    ? engineError
    : outcome
      ? `${describeOutcome(outcome)} ${resultForPlayer(outcome, game)}`
      : peeking
        ? `Before ${ratedMove.san}: ${ratedMove.betterSan} (blue) was better.`
        : pending && !pending.warning
          ? 'Checking your move…'
          : downloading
            ? downloadLabel(maiaStatus)
            : opponentToMove
              ? `${opponent.name} is thinking…`
              : `Your move${chess.inCheck() ? ' · check' : ''}`

  const stageLabel =
    stage.takebacks > 0 && Number.isFinite(stage.takebacks)
      ? `${stage.label} · ${takebacksLeft(game)} takeback${takebacksLeft(game) === 1 ? '' : 's'} left`
      : `${stage.label} · ${stage.summary}`

  const pendingLast = pending ? { from: pending.uci.slice(0, 2), to: pending.uci.slice(2, 4) } : null

  // The plan pause: once per assisted game, around move 10, if we have plans for this opening.
  const planSet =
    !pending &&
    shouldPausePlan({
      stage: game.stage,
      alreadyDone: !!game.planPauseDone,
      moveNumber: chess.moveNumber(),
      playersTurn,
    })
      ? planFor(sans, game.playerColour)
      : null
  const boardFen = peeking ? ratedMove.fenBefore : pending ? pending.fenAfter : fen

  return (
    <main className="game-screen">
      <header className="game-header">
        {game.path && (
          <p className="game-title">
            {game.path.label} <span>· {game.path.location}</span>
          </p>
        )}
        <p className="stage-label">{stageLabel}</p>
        <p className={outcome ? 'game-status game-over' : 'game-status'}>{status}</p>
      </header>

      <PlayerStrip
        name={opponent.name}
        rating={opponent.rating}
        fen={fen}
        side={opponentColour}
        thinking={opponentToMove && !downloading}
      />

      {bubble && !outcome && (
        <div className="speech-bubble" role="status">
          {bubble.kind === 'offer' ? (
            <>
              <span className="speech">“Draw?”</span>
              <button
                type="button"
                onClick={() => {
                  setBubble(null)
                  setGame((g) => (g ? withDrawAgreed(g) : g))
                }}
              >
                Accept
              </button>
              <button type="button" onClick={() => setBubble(null)}>
                Decline
              </button>
            </>
          ) : bubble.kind === 'thinking' ? (
            <span className="speech">…</span>
          ) : (
            <span className="speech">“I'll play on.”</span>
          )}
        </div>
      )}

      <div className="board-row">
        {stage.evalBar && <EvalBar analysis={analysis.latest} playerColour={game.playerColour} />}
        <div className="board-cell">
          <Board
            fen={boardFen}
            orientation={game.playerColour === 'w' ? 'white' : 'black'}
            movableColour={outcome || pending || peeking || planSet ? null : game.playerColour}
            lastMove={peeking ? null : (pendingLast ?? (last ? { from: last.from, to: last.to } : null))}
            onMove={handlePlayerMove}
            hintSquare={hintStep === 1 && hintMove ? hintMove.slice(0, 2) : null}
            arrows={arrows}
            badges={bestLine?.badges}
          />
          {planSet && (
            <PlanPause plans={planSet} onDone={() => setGame((g) => (g ? { ...g, planPauseDone: true } : g))} />
          )}
          {pending?.warning && (
            <BlunderWarning
              message={pending.warning}
              onPlayAnyway={() => resolveWarning(true)}
              onTakeBack={() => resolveWarning(false)}
            />
          )}
        </div>
      </div>

      <PlayerStrip name="You" rating={playerRating} fen={fen} side={game.playerColour} />

      <MoveStrip sans={sans} />

      {ratedMove && (
        <div className="move-info">
          <span className={`move-rating rating-${ratedMove.rating}`}>
            {ratedMove.san}
            {RATING_GLYPHS[ratedMove.rating]} · {RATING_LABELS[ratedMove.rating]}
          </span>
          {canPeek && (
            <button
              type="button"
              className="peek-button"
              onClick={() => setPeekKey(peeking ? null : ratedMove.fenBefore)}
            >
              {peeking ? 'Back to the game' : 'See better move'}
            </button>
          )}
        </div>
      )}

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
              disabled={!hintMove || hintStep === 2 || pending !== null || peeking}
              onClick={() => setHint({ fen, step: hintStep === 0 ? 1 : 2 })}
            >
              {hintStep === 0 ? 'Hint' : 'Show move'}
            </button>
          )}
          {stage.takebacks > 0 && (
            <button
              type="button"
              disabled={!canTakeBack(game) || pending !== null}
              onClick={() => {
                setPeekKey(null)
                setGame((g) => (g ? withTakeback(g) : g))
              }}
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
            <button type="button" onClick={onContinue}>
              {outcome.winner === null ? 'Replay' : 'Continue'}
            </button>
          </>
        ) : (
          <>
            <ResignButton onResign={() => setGame((g) => (g ? withResignation(g, g.playerColour) : g))} />
            <button
              type="button"
              disabled={
                pending !== null ||
                bubble !== null ||
                // After a refusal, wait five moves before asking again.
                (playerOfferMove !== null && chess.moveNumber() - playerOfferMove < 5)
              }
              onClick={offerDraw}
            >
              Offer draw
            </button>
          </>
        )}
      </div>

      <p className="build-stamp">
        Version: {BUILD_LABEL}
        {maiaMs !== null && ` · opponent model ${maiaMs} ms`}
      </p>
    </main>
  )
}

function downloadLabel(status: MaiaStatus): string {
  if (status.state !== 'downloading' || !status.total) return 'Getting your opponent ready…'
  const mb = (n: number) => Math.round(n / 1_000_000)
  return `First time only: downloading your opponent (${mb(status.loaded)} of ${mb(status.total)} MB)…`
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
