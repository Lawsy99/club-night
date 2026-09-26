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
import { DemoBoard } from '../components/DemoBoard'
import { SCOUTING_DEMOS } from '../data/scoutingDemos'
import { buildDemo } from '../logic/demo'
import { PlayerStrip } from '../components/PlayerStrip'
import { Portrait } from '../components/Portrait'
import { playMoveSound } from '../components/moveSound'
import { APPEARANCES } from '../data/appearances'
import { moodFor } from '../logic/mood'
import { matchMoment } from '../logic/matchReaction'
import type { Expression } from '../logic/dialogue'
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
import { drawRule } from '../logic/path'
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
import {
  chatterAllowed,
  isBigMoment,
  LONG_THINK_CHANCE,
  LONG_THINK_MS,
  matchLineAllowed,
  mostImportant,
  ROUTINE_REMARK_CHANCE,
  TENSION_MOVES,
} from '../logic/dialogue'
import { detectOpening } from '../logic/openings'
import { triggersFor } from '../logic/gameTriggers'
import { useDialogue } from './useDialogue'
import { Chess } from 'chess.js'
import { RATING_GLYPHS, RATING_LABELS } from '../logic/moveRating'
import { repertoireHint, sanInWords } from '../logic/repertoire'
import type { Chatter } from '../logic/settings'
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
  /** The player's name, for their name bar and for lines that use it. */
  playerName?: string
  /** How much the characters say (Settings). */
  chatter?: Chatter
}

/** A move the player has dropped but not yet confirmed (blunder check). */
type PendingMove = { uci: string; fenAfter: string; warning: string | null }

/** How long the finished game stays on screen before the review opens. */
const REVIEW_DELAY_MS = 3500

/** Arrow colour for "the move you played" when showing a better one. */
const PLAYED_ARROW_COLOUR = 'rgba(208, 59, 59, 0.75)'

export function GameScreen({
  game,
  setGame,
  onReview,
  onContinue,
  playerRating,
  playerName,
  chatter = 'full',
}: Props) {
  const stage = HELP_STAGES[game.stage]
  const isExhibition = game.path?.kind === 'exhibition'
  const opponent = resolveOpponent(game.levelId, game.opponentRating, isExhibition)
  // Nothing said during the game on trial night (design: "Trial night"), or
  // when the player has turned chatter down in Settings.
  const quietGame = game.path?.kind === 'trial' || isExhibition || chatter !== 'full'
  const [engineError, setEngineError] = useState<string | null>(null)
  // Looking back through the moves: how many moves in (null = the live position).
  const [viewPly, setViewPly] = useState<number | null>(null)
  const viewing = viewPly !== null && viewPly < game.moves.length
  // Bumped to try the opponent's move again after something failed (never stuck "thinking").
  const [moveAttempt, setMoveAttempt] = useState(0)
  const failedAttempts = useRef(0)
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
  // The scouting report, before the first move of matches and first friendlies;
  // nobody moves until it's been read.
  const showScouting = !!game.scouting?.length && !game.scoutingSeen && !outcome
  const opponentToMove = !outcome && !playersTurn && !showScouting
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

  // Dialogue: before the game, a little during friendlies, and after.
  // The coached game is talkative like a friendly (Pemberton explaining as he goes).
  const gameType = game.path?.kind === 'friendly' || game.path?.kind === 'coaching' ? 'friendly' : 'match'
  const talk = game.talk ?? { rematch: 1, losingStreak: 0, lines: 0, lastLineMove: null, startSaid: false, endSaid: false }
  const dialogue = useDialogue({
    character: opponent.character?.id,
    gameType,
    act: 1,
    rematch: talk.rematch,
    losingStreak: talk.losingStreak,
    playerName,
    storyOnly: chatter === 'off',
  })
  // The opponent's face: the expression of whatever they've just said, else
  // how the game is going for them (or went, once it's over).
  const moods = opponent.character ? APPEARANCES[opponent.character.id]?.moods : undefined
  const gameMood = outcome
    ? outcome.winner === null
      ? 'neutral'
      : outcome.winner === opponentColour
        ? (moods?.winning ?? 'pleased')
        : (moods?.losing ?? 'annoyed')
    : moodFor(moods, game.opponentEvals?.at(-1) ?? null)
  // Competitive games show no move ratings (Joseph, Sep 2026). A great move
  // or a blunder shows only in the opponent: their face for a few seconds,
  // and now and then a stage direction.
  const competitive = stage.id === 'real'
  const [reaction, setReaction] = useState<Expression | null>(null)
  const previousWin = useRef<number | null>(null)
  const ratedKey = ratedMove ? `${ratedMove.fenBefore} ${ratedMove.played}` : null
  useEffect(() => {
    if (!ratedMove || !competitive || outcome) return
    const moment = matchMoment(ratedMove.rating, ratedMove.winAfter, previousWin.current)
    previousWin.current = ratedMove.winAfter
    if (!moment) return
    const face = moment === 'great' ? 'surprised' : (moods?.winning ?? 'pleased')
    const show = window.setTimeout(() => setReaction(face), 0)
    const hide = window.setTimeout(() => setReaction(null), 3500)
    const lineState = { linesSoFar: talk.lines, moveNumber: chess.moveNumber(), lastLineMove: talk.lastLineMove }
    if (chatter === 'full' && matchLineAllowed(lineState) && Math.random() < 0.3) {
      if (dialogue.speak(moment === 'great' ? 'match_great' : 'match_blunder', false, storyFlags)) {
        setGame((g) => (g ? { ...g, talk: { ...talk, lines: talk.lines + 1, lastLineMove: lineState.moveNumber } } : g))
      }
    }
    return () => {
      window.clearTimeout(show)
      window.clearTimeout(hide)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per rated move
  }, [ratedKey])
  const opponentFace =
    dialogue.line && dialogue.line.face === opponent.character?.id ? dialogue.line.expression : (reaction ?? gameMood)
  // Where this game sits in the story, so chapter lines ("kind:match chapter:c3") can be picked.
  const storyFlags = [
    ...(game.path ? [`kind:${game.path.kind}`] : []),
    ...(game.path?.chapter ? [`chapter:${game.path.chapter}`] : []),
    ...(game.talk?.notice ? [`notice:${game.talk.notice}`] : []),
  ]
  // The long-think stage direction: whether one is showing.
  const thinkLineShown = useRef(false)
  const ratedRef = useRef(ratedMove?.rating ?? null)
  ratedRef.current = ratedMove?.rating ?? null

  useEffect(() => {
    if (talk.startSaid || game.moves.length > 0 || !opponent.character) return
    // A moment's pause, so the dialogue history has loaded (no repeats).
    const t = window.setTimeout(() => {
      dialogue.speak(isExhibition ? 'exhibition_start' : 'game_start', true, storyFlags)
      setGame((g) => (g ? { ...g, talk: { ...talk, startSaid: true } } : g))
    }, 400)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, at the start
  }, [])

  useEffect(() => {
    if (!outcome || talk.endSaid || !opponent.character) return
    const theyWon = outcome.winner === opponentColour
    if (outcome.winner !== null) {
      dialogue.speak(theyWon ? (isExhibition ? 'exhibition_win' : 'game_win') : 'game_loss', true, storyFlags)
    }
    setGame((g) => (g ? { ...g, talk: { ...talk, endSaid: true } } : g))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, when the game ends
  }, [!!outcome])

  // Every decided game goes on to the review (Joseph, Sep 2026: you're meant
  // to review each one; the review has its own Skip). A moment first, to see
  // the final position and what they say; looking back through the moves
  // holds it. Draws are replayed instead, and Toby's trial-night game is its
  // own ending. (Draws that count or don't count go to the review too; only
  // knockout draws are replayed straight away.)
  const drawReplays = !!outcome && outcome.winner === null && (!game.path || drawRule(game.path.kind) === 'replay')
  const reviewNext = !!outcome && !isExhibition && !drawReplays
  useEffect(() => {
    if (!reviewNext || viewPly !== null) return
    const t = window.setTimeout(onReview, REVIEW_DELAY_MS)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onReview is stable in effect
  }, [reviewNext, viewPly])

  // A click for every move, the player's and the opponent's (not on resume).
  const movesHeard = useRef(game.moves.length)
  useEffect(() => {
    if (game.moves.length > movesHeard.current && last) playMoveSound(!!last.captured)
    movesHeard.current = game.moves.length
  }, [game.moves.length, last])

  const commitMove = (uci: string) => {
    // Playing on declines any offer on the table, as over the board.
    setBubble(null)
    dialogue.dismiss()
    setGame((g) => (g ? withMove(g, uci) : g))
  }

  // When it's the opponent's turn (including straight after resuming): it
  // weighs up the position (resigning if hopeless), moves, and may offer a draw.
  useEffect(() => {
    if (!opponentToMove) return
    let cancelled = false // set if the game changes before the engine replies
    let retry: number | undefined
    ;(async () => {
      const view = await analysePosition(fen).catch(() => null)
      const cp = view ? toCentipawns(view.score) : 0 // the opponent's own point of view
      if (cancelled) return
      if (shouldResign(opponent.character, [...(game.opponentEvals ?? []), cp])) {
        setGame((g) => (g ? withResignation(g, opponentColour) : g))
        return
      }
      const { move, maiaMs: ms } = await chooseOpponentMove(fen, game.moves, opponent, game.rivalPrefer)
      if (cancelled || !move) return
      if (failedAttempts.current > 0) {
        failedAttempts.current = 0
        setEngineError(null)
      }
      if (ms !== undefined) setMaiaMs(ms)
      const offer = shouldOfferDraw(opponent.character, {
        evalCp: cp,
        moveNumber: chess.moveNumber(),
        piecesLeft: piecesLeft(fen),
        lastOfferMove: game.opponentLastOfferMove,
      })
      // Lines straight after the opponent's move: friendly chatter (reactions,
      // or now and then their plan), or in matches a rare silent moment.
      const moveNumber = chess.moveNumber()
      const after = new Chess(fen)
      const botMove = after.move({ from: move.slice(0, 2), to: move.slice(2, 4), promotion: move[4] })
      const flags = boardFlags([...sans, botMove.san], piecesLeft(after.fen()), opponentColour)
      const lineState = { linesSoFar: talk.lines, moveNumber, lastLineMove: talk.lastLineMove }
      let spoke = false
      const thoughtAloud = thinkLineShown.current
      if (quietGame || thoughtAloud) {
        // Nothing said during trial-night games, or straight after a thinking line.
      } else if (!offer && gameType === 'friendly' && chatterAllowed({ gameType, ...lineState })) {
        let trigger = mostImportant(triggersFor({ botMove, playerRating: ratedRef.current, botEvalCp: cp }))
        // Everyday things (a check, a swap, castling) happen every game; only
        // now and then are they worth a remark (Joseph, Sep 2026: far fewer lines).
        if (trigger && !isBigMoment(trigger) && Math.random() > ROUTINE_REMARK_CHANCE) trigger = null
        // Nothing dramatic? Occasionally they say what they're planning instead.
        if (!trigger && moveNumber >= 6 && moveNumber <= 25 && Math.random() < 0.15) trigger = 'plan_hint'
        spoke = trigger ? dialogue.speak(trigger, false, flags) : false
      } else if (!offer && gameType === 'match' && matchLineAllowed(lineState)) {
        if (TENSION_MOVES.includes(moveNumber) && Math.abs(cp) <= 100) spoke = dialogue.speak('tension', false, flags)
      }
      const talkAfter = spoke ? { ...talk, lines: talk.lines + 1, lastLineMove: moveNumber } : talk
      setGame((g) => {
        if (!g) return g
        let next = withMove(withOpponentEval(g, cp), move)
        if (offer) next = { ...next, opponentLastOfferMove: moveNumber }
        if (spoke) next = { ...next, talk: talkAfter }
        return next
      })
      if (offer) setBubble({ kind: 'offer' })
      // They've moved: the thinking stage direction goes (unless a new line replaced it).
      if (thinkLineShown.current && !spoke) dialogue.dismiss()
      thinkLineShown.current = false

      // Did that move hand the player a big chance? Sometimes the opponent gives it away.
      if (!spoke && !offer && !quietGame && !thoughtAloud) {
        analysePosition(after.fen())
          .then((a) => {
            if (!a || cancelled) return
            const playerCp = toCentipawns(a.score) // the player is to move
            const swing = playerCp + cp // how much the player gained (cp was the opponent's view)
            const allowed =
              gameType === 'friendly' ? chatterAllowed({ gameType, ...lineState }) : matchLineAllowed(lineState)
            if (swing >= 200 && allowed && Math.random() < 0.5 && dialogue.speak('opportunity', false, flags)) {
              setGame((g) => (g ? { ...g, talk: { ...talkAfter, lines: talkAfter.lines + 1, lastLineMove: moveNumber } } : g))
            }
          })
          .catch(() => undefined)
      }
    })().catch((err: Error) => {
      // Usually a dropped connection or an engine the phone paused. Say so
      // plainly and try again shortly (the engines restart themselves).
      if (cancelled) return
      console.warn('Opponent move failed; retrying.', err)
      failedAttempts.current += 1
      setEngineError(
        failedAttempts.current < 3
          ? `${opponent.name} lost their train of thought. One moment…`
          : "Still can't get a move. Check your connection; the app keeps trying.",
      )
      retry = window.setTimeout(() => setMoveAttempt((n) => n + 1), failedAttempts.current < 3 ? 2000 : 6000)
    })
    return () => {
      cancelled = true
      window.clearTimeout(retry)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on the position and opponent
  }, [opponentToMove, fen, opponent.id, opponent.rating, moveAttempt])

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

  // A long think gets a small stage direction ("Priya closes her eyes."), so
  // slow thinkers read as thinking, not as the app running slowly. Not on
  // their first move (the opening line is still showing), and not too often.
  // Revised Sep 2026 (Joseph: the same glasses-adjusting over and over): it
  // shares the game's small line budget, so it's rare and never piles up.
  useEffect(() => {
    if (!opponentToMove || downloading || engineError || !opponent.character || game.moves.length < 2) return
    if (chatter !== 'full' || quietGame) return // the thinking dots still show
    const lineState = { linesSoFar: talk.lines, moveNumber: chess.moveNumber(), lastLineMove: talk.lastLineMove }
    if (!(gameType === 'friendly' ? chatterAllowed({ gameType, ...lineState }) : matchLineAllowed(lineState))) return
    const t = window.setTimeout(() => {
      if (Math.random() < LONG_THINK_CHANCE && dialogue.speak('long_think', true)) {
        thinkLineShown.current = true
        setGame((g) => {
          if (!g) return g
          const now = g.talk ?? talk
          return { ...g, talk: { ...now, lines: now.lines + 1, lastLineMove: lineState.moveNumber } }
        })
      }
    }, LONG_THINK_MS)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per opponent turn
  }, [opponentToMove, fen, downloading, engineError])
  const status = viewing
    ? `Looking back: ${viewPly === 0 ? 'the start' : `after move ${Math.ceil(viewPly! / 2)}`}`
    : engineError && opponentToMove
    ? engineError
    : outcome
      ? `${describeOutcome(outcome)} ${resultForPlayer(outcome, game)}`
      : showScouting
        ? 'Scouting report first.'
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

  // Full-help games only (the game with Pemberton): the next move of the
  // opening the player usually plays, while the game is still following it.
  // Practice games tell you how a move rated, never what to play (Sep 2026).
  const helpOn = stage.id === 'assisted' && playersTurn && !pending && !peeking && !viewing
  const ownLine = helpOn ? repertoireHint(sans, game.playerColour, game.repertoire) : null
  const bookNote = ownLine ? { label: `Your ${ownLine.opening.replace(/^the /, '')}`, san: ownLine.san } : null

  const pendingLast = pending ?{ from: pending.uci.slice(0, 2), to: pending.uci.slice(2, 4) } : null

  // (The plan pause was removed, Sep 2026: its plans didn't respond to the
  // actual position. Plans now come from the characters' plan hints, which
  // follow the opening on the board.)
  // Looking back through the moves: an earlier position, shown but not playable.
  const viewed = viewing ? replay(game.moves.slice(0, viewPly!)) : null
  const viewedLast = viewed?.history({ verbose: true }).at(-1)
  const boardFen = viewed ? viewed.fen() : peeking ? ratedMove.fenBefore : pending ? pending.fenAfter : fen

  // The scouting report plays out on the board before the game (YouTube-teacher style).
  if (showScouting && opponent.character) {
    const written = SCOUTING_DEMOS[opponent.character.id]?.[game.playerColour] ?? []
    const steps = [
      ...buildDemo(written),
      // Last: their style, your record and (for Toby) his target, with no moves.
      { caption: (game.scouting ?? []).slice(1).join(' '), moves: [] },
    ]
    return (
      <main className="game-screen">
        <header className="game-header">
          {game.path && (
            <p className="game-title">
              {game.path.label} <span>· {game.path.location}</span>
            </p>
          )}
          <p className="stage-label">Scouting report · {opponent.name}</p>
        </header>
        <DemoBoard
          steps={steps}
          orientation={game.playerColour === 'w' ? 'white' : 'black'}
          finishLabel="Let's play"
          onFinish={() => setGame((g) => (g ? { ...g, scoutingSeen: true } : g))}
        />
      </main>
    )
  }

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
        portrait={opponent.character ? <Portrait who={opponent.character.id} size={36} expression={opponentFace} /> : undefined}
        name={opponent.name}
        // Trial night shows names only (ratings would differ from the ladder later).
        rating={opponent.unrated || game.path?.kind === 'trial' ? undefined : opponent.rating}
        fen={fen}
        side={opponentColour}
        thinking={opponentToMove && !downloading}
      />

      {dialogue.line && !bubble && (
        <button type="button" className="talk-bubble" onClick={dialogue.dismiss} key={dialogue.line.key}>
          {/* Someone else speaking (e.g. Neil): their small face beside the words. */}
          {dialogue.line.face !== opponent.character?.id && (
            <Portrait who={dialogue.line.face} size={28} expression={dialogue.line.expression} />
          )}
          <span className="talk-words">
            {dialogue.line.speaker && <span className="talk-speaker">{dialogue.line.speaker}</span>}
            <span>{dialogue.line.text.startsWith('(') ? dialogue.line.text : `“${dialogue.line.text}”`}</span>
          </span>
        </button>
      )}

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
            movableColour={outcome || pending || peeking || showScouting || viewing ? null : game.playerColour}
            lastMove={
              viewing
                ? viewedLast
                  ? { from: viewedLast.from, to: viewedLast.to }
                  : null
                : peeking
                  ? null
                  : (pendingLast ?? (last ? { from: last.from, to: last.to } : null))
            }
            onMove={handlePlayerMove}
            hintSquare={!viewing && hintStep === 1 && hintMove ? hintMove.slice(0, 2) : null}
            arrows={viewing ? [] : arrows}
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

      <PlayerStrip name={playerName ?? 'You'} rating={playerRating} fen={fen} side={game.playerColour} />

      <div className="move-row">
        <MoveStrip sans={viewing ? sans.slice(0, viewPly!) : sans} />
        {/* Look back through the moves (any game; the board is locked while looking). */}
        <div className="look-back" aria-label="Look through the moves">
          <button
            type="button"
            aria-label="Previous move"
            disabled={game.moves.length === 0 || viewPly === 0}
            onClick={() => setViewPly((v) => Math.max(0, (v ?? game.moves.length) - 1))}
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next move"
            disabled={!viewing}
            onClick={() => setViewPly((v) => (v === null || v + 1 >= game.moves.length ? null : v + 1))}
          >
            ›
          </button>
        </div>
      </div>
      {viewing && (
        <button type="button" className="back-to-game" onClick={() => setViewPly(null)}>
          Back to the game
        </button>
      )}

      {bookNote && (
        <p className="book-note">
          {bookNote.label}: next, <strong>{sanInWords(bookNote.san)}</strong>
        </p>
      )}

      {ratedMove && !competitive && !viewing && (
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
          reviewNext ? (
            <button type="button" className="primary" onClick={onReview}>
              On to the review
            </button>
          ) : (
            <>
              <button type="button" className="primary" onClick={onReview}>
                Review game
              </button>
              <button type="button" onClick={onContinue}>
                {drawReplays ? 'Replay' : 'Continue'}
              </button>
            </>
          )
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

/**
 * Dialogue flags describing the board: which opening, which phase of the
 * game, and which colour the speaking character has ("me:w" / "me:b"), so a
 * plan line is only said by the side it belongs to.
 */
function boardFlags(sans: readonly string[], pieces: number, characterColour: 'w' | 'b'): string[] {
  const opening = detectOpening(sans)
  const phase = sans.length < 20 ? 'opening' : pieces <= 6 ? 'endgame' : 'middlegame'
  return [...(opening ? [`opening:${opening}`] : []), `phase:${phase}`, `me:${characterColour}`]
}

function downloadLabel(status: MaiaStatus): string {
  if (status.state !== 'downloading' || !status.total) return 'Getting your opponent ready…'
  const mb = (n: number) => Math.round(n / 1_000_000)
  return `First time only: downloading your opponent (${mb(status.loaded)} of ${mb(status.total)} MB)…`
}

function resultForPlayer(outcome: GameOutcome, game: GameRecord): string {
  if (outcome.winner === null) {
    const rule = game.path ? drawRule(game.path.kind) : 'replay'
    return rule === 'counts' ? '' : rule === 'void' ? "A draw doesn't count in the best of three." : rule === 'replay' ? 'Draws are replayed.' : ''
  }
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
