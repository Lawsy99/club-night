// Everything is saved on the device in IndexedDB (the browser's built-in
// database). No accounts, no servers.
import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { GameRecord } from '../logic/gameRecord'

interface ClubNightDB extends DBSchema {
  /** Small named values, e.g. the game in progress. */
  state: {
    key: 'currentGame'
    value: GameRecord
  }
}

let dbPromise: Promise<IDBPDatabase<ClubNightDB>> | null = null

function db() {
  dbPromise ??= openDB<ClubNightDB>('club-night', 1, {
    upgrade(database) {
      database.createObjectStore('state')
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
