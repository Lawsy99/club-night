// TEMPORARY (Phase 1–3): loads the saved game, and moves between the test
// setup screen and the game. Replaced by the path engine in Phase 4.
import { useEffect, useState } from 'react'
import { DEFAULT_TEST_LEVEL_ID } from '../data/testOpponents'
import {
  newGameRecord,
  nextPlayerColour,
  outcomeOf,
  upgradeGameRecord,
  type GameRecord,
} from '../logic/gameRecord'
import { loadCurrentGame, requestPersistentStorage, saveCurrentGame } from '../storage/db'
import { GameScreen } from './GameScreen'
import { TestSetupScreen } from './TestSetupScreen'

export function TestFlow() {
  const [loaded, setLoaded] = useState(false)
  // The current (or most recently finished) game
  const [game, setGame] = useState<GameRecord | null>(null)
  const [choosing, setChoosing] = useState(false)

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

  // Save after every change, so closing the app loses nothing.
  useEffect(() => {
    if (game) saveCurrentGame(game).catch((err) => console.error('Save failed', err))
  }, [game])

  if (!loaded) return <main className="game-screen loading">Setting up the board…</main>

  if (!game || choosing) {
    return (
      <TestSetupScreen
        playerColour={nextPlayerColour(game)}
        initialLevelId={game?.levelId ?? DEFAULT_TEST_LEVEL_ID}
        onStart={(stage, levelId) => {
          setGame(newGameRecord(nextPlayerColour(game), levelId, stage))
          setChoosing(false)
        }}
      />
    )
  }

  return (
    <GameScreen
      key={game.id}
      game={game}
      setGame={setGame}
      onNewGame={() => setChoosing(true)}
      onReplay={() => setGame(newGameRecord(nextPlayerColour(game), game.levelId, game.stage))}
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
