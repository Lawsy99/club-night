// TEMPORARY (Phase 1–3): loads the saved game, and moves between the test
// setup screen, the game and its review. Replaced by the path engine in Phase 4.
import { useEffect, useState } from 'react'
import { DEFAULT_TEST_LEVEL_ID } from '../data/testOpponents'
import {
  newGameRecord,
  nextPlayerColour,
  outcomeOf,
  upgradeGameRecord,
  type GameRecord,
} from '../logic/gameRecord'
import {
  type ArchivedGame,
  archiveGame,
  loadCurrentGame,
  loadScreen,
  requestPersistentStorage,
  saveCurrentGame,
  saveScreen,
} from '../storage/db'
import { GameScreen } from './GameScreen'
import { MistakesDeckScreen } from './MistakesDeckScreen'
import { PastGamesScreen } from './PastGamesScreen'
import { ReviewScreen } from './ReviewScreen'
import { TestSetupScreen } from './TestSetupScreen'

const VIEWS = ['game', 'review', 'setup', 'deck', 'history'] as const
type View = (typeof VIEWS)[number]

export function TestFlow() {
  const [loaded, setLoaded] = useState(false)
  // The current (or most recently finished) game
  const [game, setGame] = useState<GameRecord | null>(null)
  const [view, setView] = useState<View>('game')
  // A past game opened from the list (not saved: reopening returns to the list)
  const [pastGame, setPastGame] = useState<ArchivedGame | null>(null)

  useEffect(() => {
    requestPersistentStorage()
    Promise.all([loadCurrentGame(), loadScreen()])
      .then(([saved, screen]) => {
        const upgraded = saved ? upgradeGameRecord(saved) : null
        const resumable = upgraded && isResumable(upgraded) ? upgraded : null
        setGame(resumable)
        // A game in progress always reopens on the board; after a game,
        // reopen wherever the player was (review, setup or deck).
        const finished = resumable ? outcomeOf(resumable) !== null : true
        if (finished && VIEWS.includes(screen as View)) setView(screen as View)
      })
      .catch(() => setGame(null))
      .finally(() => setLoaded(true))
  }, [])

  // Save after every change, so closing the app loses nothing; finished
  // games also go into the archive for reviews (and, later, stats).
  useEffect(() => {
    if (!game) return
    saveCurrentGame(game).catch((err) => console.error('Save failed', err))
    if (outcomeOf(game)) archiveGame(game).catch((err) => console.error('Archive failed', err))
  }, [game])

  // Remember which screen is open, too.
  useEffect(() => {
    if (loaded) saveScreen(view).catch((err) => console.error('Save failed', err))
  }, [view, loaded])

  if (!loaded) return <main className="game-screen loading">Setting up the board…</main>

  const startGame = (next: GameRecord) => {
    setGame(next)
    setView('game')
  }

  /** After a game (reviewed or not): draws replay straight away, otherwise pick the next. */
  const afterGame = (finished: GameRecord) => {
    if (outcomeOf(finished)?.winner === null) {
      startGame(newGameRecord(nextPlayerColour(finished), finished.levelId, finished.stage))
    } else {
      setView('setup')
    }
  }

  if (view === 'deck') return <MistakesDeckScreen onBack={() => setView('setup')} />

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
    return <PastGamesScreen onOpen={setPastGame} onBack={() => setView('setup')} />
  }

  if (!game || view === 'setup') {
    return (
      <TestSetupScreen
        playerColour={nextPlayerColour(game)}
        initialLevelId={game?.levelId ?? DEFAULT_TEST_LEVEL_ID}
        onStart={(stage, levelId) => startGame(newGameRecord(nextPlayerColour(game), levelId, stage))}
        onOpenDeck={() => setView('deck')}
        onOpenHistory={() => setView('history')}
      />
    )
  }

  if (view === 'review') {
    return <ReviewScreen key={game.id} game={game} onContinue={() => afterGame(game)} />
  }

  return (
    <GameScreen
      key={game.id}
      game={game}
      setGame={setGame}
      onReview={() => setView('review')}
      onRematch={() => startGame(newGameRecord(nextPlayerColour(game), game.levelId, game.stage))}
      onChangeOpponent={() => setView('setup')}
    />
  )
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
