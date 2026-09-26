// The app's flow: Welcome → trial night → the path, with Home always showing
// what comes next. Loads and saves progress and the current game, and turns
// finished games into results on the path.
import { useEffect, useState } from 'react'
import { characterOpponentId } from '../data/opponents'
import { rateGame } from '../logic/glicko2'
import {
  newGameRecord,
  nextPlayerColour,
  outcomeOf,
  upgradeGameRecord,
  type GameRecord,
} from '../logic/gameRecord'
import {
  beginTrial,
  completeLesson,
  NEW_PROGRESS,
  nextStep,
  recordGame,
  type PathGame,
  type Progress,
} from '../logic/path'
import { replay } from '../logic/game'
import { averageCentipawnLoss } from '../logic/review'
import { rivalTarget } from '../logic/rival'
import { scoutingReport } from '../logic/scouting'
import { strengthFromAccuracy } from '../logic/trialNight'
import {
  type ArchivedGame,
  archiveGame,
  getArchivedGame,
  headToHead,
  listArchivedGames,
  loadCurrentGame,
  loadProgress,
  loadScreen,
  requestPersistentStorage,
  resetProgress,
  saveCurrentGame,
  saveProgress,
  saveScreen,
} from '../storage/db'
import { GameScreen } from './GameScreen'
import { HomeScreen } from './HomeScreen'
import { LessonScreen } from './LessonScreen'
import { MistakesDeckScreen } from './MistakesDeckScreen'
import { PastGamesScreen } from './PastGamesScreen'
import { PuzzleSetScreen } from './PuzzleSetScreen'
import { ReviewScreen } from './ReviewScreen'
import { WelcomeScreen } from './WelcomeScreen'

const VIEWS = ['home', 'game', 'review', 'deck', 'history', 'lesson', 'puzzles'] as const
type View = (typeof VIEWS)[number]

/** Rated games: everything except friendlies (design: friendlies never change the rating). */
const isRated = (g: PathGame | undefined) => !!g && g.kind !== 'friendly' && g.kind !== 'trial'

export function AppFlow() {
  const [loaded, setLoaded] = useState(false)
  const [progress, setProgress] = useState<Progress>(NEW_PROGRESS)
  // The current (or most recently finished) game
  const [game, setGame] = useState<GameRecord | null>(null)
  const [view, setView] = useState<View>('home')
  const [pastGame, setPastGame] = useState<ArchivedGame | null>(null)
  const [lastChange, setLastChange] = useState<{ from: number; to: number } | null>(null)

  useEffect(() => {
    requestPersistentStorage()
    Promise.all([loadProgress(), loadCurrentGame(), loadScreen()])
      .then(([savedProgress, saved, screen]) => {
        if (savedProgress) setProgress(savedProgress)
        const upgraded = saved ? upgradeGameRecord(saved) : null
        const current = upgraded && isResumable(upgraded) ? upgraded : null
        setGame(current)
        const unfinished = current && !outcomeOf(current)
        const awaitingResult = current && outcomeOf(current) && current.path && !current.resultRecorded
        if (unfinished) setView('game')
        else if (awaitingResult) setView(screen === 'review' ? 'review' : 'game')
        else if (VIEWS.includes(screen as View) && screen !== 'game' && screen !== 'review') setView(screen as View)
        else setView('home')
      })
      .catch(() => setGame(null))
      .finally(() => setLoaded(true))
  }, [])

  // Save the game after every change; finished games also go into the archive.
  useEffect(() => {
    if (!game) return
    saveCurrentGame(game).catch((err) => console.error('Save failed', err))
    if (outcomeOf(game)) archiveGame(game).catch((err) => console.error('Archive failed', err))
  }, [game])

  useEffect(() => {
    if (loaded) saveScreen(view).catch((err) => console.error('Save failed', err))
  }, [view, loaded])

  if (!loaded) return <main className="game-screen loading">Setting up the board…</main>

  const updateProgress = (next: Progress) => {
    setProgress(next)
    saveProgress(next).catch((err) => console.error('Save failed', err))
  }

  const startPathGame = async (pathGame: PathGame) => {
    setLastChange(null)
    const opponentId = characterOpponentId(pathGame.opponent)
    // Head-to-head so far, for dialogue ("Third time lucky…").
    const h2h = await headToHead(opponentId).catch(() => ({ played: 0, wins: 0, losses: 0, theirStreak: 0 }))
    const record = newGameRecord(nextPlayerColour(game), opponentId, pathGame.stage, pathGame.rating)

    // Toby studies the player's games (rival level 1): the weakest opening, once there's evidence.
    const target = pathGame.opponent === 'toby' ? await playerWeakness().catch(() => null) : null
    // Scouting report before matches and the first (assisted) friendly against someone.
    const scouted = pathGame.kind !== 'trial' && (pathGame.kind !== 'friendly' || pathGame.stage === 'assisted')
    const scouting = scouted
      ? scoutingReport({
          character: pathGame.opponent,
          playerColour: record.playerColour,
          record: { wins: h2h.wins, losses: h2h.losses },
          target,
        })
      : undefined

    setGame({
      ...record,
      path: pathGame,
      scouting,
      rivalPrefer: target && target.colour === record.playerColour ? target.opening : undefined,
      talk: { rematch: h2h.played + 1, losingStreak: h2h.theirStreak, lines: 0, lastLineMove: null, startSaid: false, endSaid: false },
    })
    setView('game')
  }

  /** The finished game's result goes on the path once; draws are simply replayed. */
  const finishGame = async (finished: GameRecord) => {
    const outcome = outcomeOf(finished)
    if (!outcome || !finished.path) {
      setView('home')
      return
    }
    if (outcome.winner === null) {
      startPathGame(finished.path)
      return
    }
    if (!finished.resultRecorded) {
      const won = outcome.winner === finished.playerColour
      const archived = await getArchivedGame(finished.id).catch(() => null)
      const loss = archived?.evals ? averageCentipawnLoss(finished.moves, archived.evals, finished.playerColour) : null
      const accuracyStrength = loss === null ? null : strengthFromAccuracy(loss)
      const next = recordGame(progress, finished.path, won, accuracyStrength)
      if (isRated(finished.path) && progress.rating && next.rating) {
        setLastChange({ from: progress.rating.rating, to: next.rating.rating })
      }
      updateProgress(next)
      setGame({ ...finished, resultRecorded: true })
    }
    setView('home')
  }

  const next = nextStep(progress)

  if (next.kind === 'welcome' && view !== 'deck' && view !== 'history') {
    return (
      <WelcomeScreen
        onStart={(experience, rating) => {
          updateProgress(beginTrial(progress, experience, rating))
          setView('home')
        }}
      />
    )
  }

  if (view === 'deck') return <MistakesDeckScreen onBack={() => setView('home')} />

  if (view === 'puzzles' && next.kind === 'play' && next.targetedPuzzles) {
    return (
      <PuzzleSetScreen
        title={next.targetedPuzzles.title}
        openings={next.targetedPuzzles.openings}
        count={6}
        playerRating={progress.rating?.rating ?? progress.baseline}
        onDone={() => setView('home')}
      />
    )
  }

  if (view === 'lesson' && next.kind === 'lesson') {
    return (
      <LessonScreen
        chapterId={next.chapterId}
        playerRating={progress.rating?.rating ?? progress.baseline}
        onBack={() => setView('home')}
        onDone={() => {
          updateProgress(completeLesson(progress))
          setView('home')
        }}
      />
    )
  }

  if (view === 'history') {
    if (pastGame) {
      return (
        <ReviewScreen
          key={pastGame.id}
          game={upgradeGameRecord(pastGame)}
          fromHistory
          onContinue={() => {
            setPastGame(null)
            window.scrollTo({ top: 0 })
          }}
        />
      )
    }
    return <PastGamesScreen onOpen={setPastGame} onBack={() => setView('home')} />
  }

  if (game && view === 'review') {
    const outcome = outcomeOf(game)
    const preview =
      !game.resultRecorded && isRated(game.path) && progress.rating && outcome && outcome.winner !== null
        ? {
            from: progress.rating.rating,
            to: rateGame(progress.rating, game.path!.rating, outcome.winner === game.playerColour ? 1 : 0).rating,
          }
        : null
    return <ReviewScreen key={game.id} game={game} ratingChange={preview} onContinue={() => void finishGame(game)} />
  }

  if (game && view === 'game') {
    return (
      <GameScreen
        key={game.id}
        game={game}
        setGame={setGame}
        playerRating={progress.rating ? Math.round(progress.rating.rating) : undefined}
        onReview={() => setView('review')}
        onContinue={() => void finishGame(game)}
      />
    )
  }

  return (
    <HomeScreen
      progress={progress}
      next={next}
      lastChange={lastChange}
      onPlay={startPathGame}
      onStartLesson={() => setView('lesson')}
      onTargetedPuzzles={() => setView('puzzles')}
      onOpenDeck={() => setView('deck')}
      onOpenHistory={() => setView('history')}
      onSkipStep={() => {
        setLastChange(null)
        if (next.kind === 'lesson') updateProgress(completeLesson(progress))
        else if (next.kind === 'play') updateProgress(recordGame(progress, next.game, true, null))
      }}
      onReset={() => {
        resetProgress()
          .then(() => {
            setProgress(NEW_PROGRESS)
            setGame(null)
            setLastChange(null)
            setView('home')
          })
          .catch((err) => console.error('Reset failed', err))
      }}
    />
  )
}

/** The player's weakest opening from their archive, for Toby's targeting (null until 10 real games). */
async function playerWeakness() {
  const games = await listArchivedGames()
  const played = games.flatMap((g) => {
    try {
      const outcome = outcomeOf(g)
      if (!outcome || outcome.winner === null) return []
      return [
        {
          sans: replay(g.moves.slice(0, 16)).history(),
          playerColour: g.playerColour,
          won: outcome.winner === g.playerColour,
          rated: !!g.path && g.path.kind !== 'friendly' && g.path.kind !== 'trial',
        },
      ]
    } catch {
      return []
    }
  })
  return rivalTarget(played)
}

/** A saved game we can't replay (e.g. from an older version) is discarded. */
function isResumable(game: GameRecord): boolean {
  try {
    outcomeOf(game)
    return true
  } catch {
    return false
  }
}
