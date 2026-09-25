// Everything is saved on the device in IndexedDB (the browser's built-in
// database). No accounts, no servers.
import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { GameRecord } from '../logic/gameRecord'
import type { MistakeCard } from '../logic/mistakesDeck'
import type { PositionEval } from '../logic/review'

/** A finished game in the archive, with its review analysis once done. */
export type ArchivedGame = GameRecord & {
  finishedAt: number
  /** One engine evaluation per position (moves.length + 1), once analysed. */
  evals?: PositionEval[]
}

interface ClubNightDB extends DBSchema {
  /** Small named values: the game in progress, and which screen was open. */
  state: {
    key: 'currentGame' | 'screen'
    value: GameRecord | string
  }
  /** Every finished game. */
  games: {
    key: string
    value: ArchivedGame
    indexes: { finishedAt: number }
  }
  /** The mistakes deck. */
  cards: {
    key: string
    value: MistakeCard
  }
}

let dbPromise: Promise<IDBPDatabase<ClubNightDB>> | null = null

function db() {
  dbPromise ??= openDB<ClubNightDB>('club-night', 3, {
    upgrade(database, oldVersion) {
      // Each block adds what that version introduced, so older saves upgrade in place.
      if (oldVersion < 1) database.createObjectStore('state')
      if (oldVersion < 2) {
        database.createObjectStore('games', { keyPath: 'id' }).createIndex('finishedAt', 'finishedAt')
      }
      if (oldVersion < 3) database.createObjectStore('cards', { keyPath: 'id' })
    },
    // If another copy of the app (e.g. an old tab) is holding the database
    // open on an older version, let go so the upgrade isn't stuck.
    blocking() {
      dbPromise?.then((d) => d.close())
      dbPromise = null
    },
  })
  return dbPromise
}

export async function loadCurrentGame(): Promise<GameRecord | null> {
  return ((await (await db()).get('state', 'currentGame')) as GameRecord | undefined) ?? null
}

export async function saveCurrentGame(game: GameRecord): Promise<void> {
  await (await db()).put('state', game, 'currentGame')
}

/** Which screen was open, so a closed app reopens in the same place. */
export async function loadScreen(): Promise<string | null> {
  return ((await (await db()).get('state', 'screen')) as string | undefined) ?? null
}

export async function saveScreen(screen: string): Promise<void> {
  await (await db()).put('state', screen, 'screen')
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

/** Adds cards to the deck, leaving any that already exist (and their schedule) alone. */
export async function addCardsIfNew(cards: MistakeCard[]): Promise<void> {
  const tx = (await db()).transaction('cards', 'readwrite')
  for (const card of cards) {
    if (!(await tx.store.getKey(card.id))) await tx.store.put(card)
  }
  await tx.done
}

export async function loadCards(): Promise<MistakeCard[]> {
  return (await db()).getAll('cards')
}

export async function saveCard(card: MistakeCard): Promise<void> {
  await (await db()).put('cards', card)
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
