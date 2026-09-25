// Everything is saved on the device in IndexedDB (the browser's built-in
// database). No accounts, no servers.
import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { GameRecord } from '../logic/gameRecord'
import type { PositionEval } from '../logic/review'

/** A finished game in the archive, with its review analysis once done. */
export type ArchivedGame = GameRecord & {
  finishedAt: number
  /** One engine evaluation per position (moves.length + 1), once analysed. */
  evals?: PositionEval[]
}

interface ClubNightDB extends DBSchema {
  /** Small named values, e.g. the game in progress. */
  state: {
    key: 'currentGame'
    value: GameRecord
  }
  /** Every finished game. */
  games: {
    key: string
    value: ArchivedGame
    indexes: { finishedAt: number }
  }
}

let dbPromise: Promise<IDBPDatabase<ClubNightDB>> | null = null

function db() {
  dbPromise ??= openDB<ClubNightDB>('club-night', 2, {
    upgrade(database, oldVersion) {
      // Each block adds what that version introduced, so older saves upgrade in place.
      if (oldVersion < 1) database.createObjectStore('state')
      if (oldVersion < 2) {
        database.createObjectStore('games', { keyPath: 'id' }).createIndex('finishedAt', 'finishedAt')
      }
    },
  })
  return dbPromise
}

export async function loadCurrentGame(): Promise<GameRecord | null> {
  return (await (await db()).get('state', 'currentGame')) ?? null
}

export async function saveCurrentGame(game: GameRecord): Promise<void> {
  await (await db()).put('state', game, 'currentGame')
}

/** Adds a finished game to the archive (keeping any analysis already saved). */
export async function archiveGame(game: GameRecord): Promise<void> {
  const database = await db()
  const existing = await database.get('games', game.id)
  await database.put('games', { ...existing, ...game, finishedAt: existing?.finishedAt ?? Date.now() })
}

export async function getArchivedGame(id: string): Promise<ArchivedGame | null> {
  return (await (await db()).get('games', id)) ?? null
}

export async function saveGameAnalysis(id: string, evals: PositionEval[]): Promise<void> {
  const database = await db()
  const existing = await database.get('games', id)
  if (existing) await database.put('games', { ...existing, evals })
}

/**
 * Asks the browser not to clear our data when the device is short of space.
 * (Home-screen apps on iPhone are already protected from Safari's clean-up;
 * this is a belt-and-braces request, and it's fine if the browser says no.)
 */
export async function requestPersistentStorage(): Promise<void> {
  try {
    await navigator.storage?.persist?.()
  } catch {
    // Not supported: nothing to do.
  }
}
