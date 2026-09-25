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
import { archiveGame, loadCurrentGame, requestPersistentStorage, saveCurrentGame } from '../storage/db'
import { GameScreen } from './GameScreen'
import { MistakesDeckScreen } from './MistakesDeckScreen'
import { ReviewScreen } from './ReviewScreen'
import { TestSetupScreen } from './TestSetupScreen'

type View = 'game' | 'review' | 'setup' | 'deck'

export function TestFlow() {
  const [loaded, setLoaded] = useState(false)
  // The current (or most recently finished) game
  const [game, setGame] = useState<GameRecord | null>(null)
  const [view, setView] = useState<View>('game')

  useEffect(() => {
    requestPersistentStorage()
    loadCurrentGame()
      .then((saved) => {
        const upgraded = saved ? upgradeGameRecord(saved) : null
        setGame(upgraded && isResumable(upgraded) ? upgraded : null)
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

  if (!loaded) return <main className="game-screen loading">Setting up the board…</main>

  const startGame = (next: GameRecord) => {
    setGame(next)
    setView('game')
  }

  if (view === 'deck') return <MistakesDeckScreen onBack={() => setView('setup')} />

  if (!game || view === 'setup') {
    return (
      <TestSetupScreen
        playerColour={nextPlayerColour(game)}
        initialLevelId={game?.levelId ?? DEFAULT_TEST_LEVEL_ID}
        onStart={(stage, levelId) => startGame(newGameRecord(nextPlayerColour(game), levelId, stage))}
        onOpenDeck={() => setView('deck')}
      />
    )
  }

  if (view === 'review') {
    return (
      <ReviewScreen
        key={game.id}
        game={game}
        onContinue={() => {
          // Draws are replayed straight away with the same settings.
          if (outcomeOf(game)?.winner === null) {
            startGame(newGameRecord(nextPlayerColour(game), game.levelId, game.stage))
          } else {
            setView('setup')
          }
        }}
      />
    )
  }

  return <GameScreen key={game.id} game={game} setGame={setGame} onReview={() => setView('review')} />
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
